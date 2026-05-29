import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  productEditSchema,
  type ProductEditFormValues,
} from "./productEditSchema";
import type { Product, ProductUpdatePayload } from "../../shared/api/types";
import { cityOptions } from "../../shared/config/cities";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";
import { Select } from "../../shared/ui/Select";
import { Textarea } from "../../shared/ui/Textarea";

type ProductEditFormProps = {
  product: Product;
  onSubmit: (payload: ProductUpdatePayload) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string;
};

function resolveCityId(product: Product) {
  const match = cityOptions.find((city) => city.name === product.cityName);
  return match?.id ?? cityOptions[0]?.id ?? 1;
}

function pickFiles(value: unknown) {
  const fileList = value as FileList | undefined;
  return fileList ? Array.from(fileList) : [];
}

export function ProductEditForm({
  product,
  onSubmit,
  isSubmitting = false,
  error,
}: ProductEditFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      title: product.title,
      description: product.description ?? "",
      price: product.price,
      cityId: resolveCityId(product),
      images: undefined,
    },
  });

  useEffect(() => {
    reset({
      title: product.title,
      description: product.description ?? "",
      price: product.price,
      cityId: resolveCityId(product),
      images: undefined,
    });
  }, [product, reset]);

  const disabled = isSubmitting || formSubmitting;

  const submit = handleSubmit(async (values) => {
    const images = pickFiles(values.images);
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      cityId: Number(values.cityId),
      images: images.length ? images : undefined,
      mainImageIndex: 0,
    });
  });

  return (
    <form className="space-y-6" onSubmit={submit}>
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField label="Название" error={errors.title?.message}>
          <Input {...register("title")} />
        </FormField>
        <FormField label="Цена" error={errors.price?.message}>
          <Input type="number" min={1} step={1} {...register("price")} />
        </FormField>
      </div>

      <FormField label="Описание" error={errors.description?.message}>
        <Textarea {...register("description")} />
      </FormField>

      <FormField label="Город" error={errors.cityId?.message}>
        <Select {...register("cityId")}>
          {cityOptions.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Заменить фотографии"
        error={errors.images?.message?.toString()}
        hint={`Можно оставить пустым. Сейчас у товара файлов: ${product.imageIds?.length ?? 0}`}
      >
        <Input type="file" accept="image/*" multiple {...register("images")} />
      </FormField>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={disabled}>
          <Save className="h-4 w-4" />
          {disabled ? "Сохраняем" : "Сохранить изменения"}
        </Button>
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          <ImagePlus className="h-4 w-4" />
          Новые фото полностью заменят старые
        </span>
      </div>
    </form>
  );
}
