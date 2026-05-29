import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Save } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  productFormSchema,
  type ProductFormValues,
} from "./productFormSchema";
import type { ProductCreatePayload } from "../../shared/api/types";
import { cityOptions } from "../../shared/config/cities";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";
import { Select } from "../../shared/ui/Select";
import { Textarea } from "../../shared/ui/Textarea";

type ProductFormProps = {
  onSubmit: (payload: ProductCreatePayload) => Promise<void> | void;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string;
};

const defaultValues: ProductFormValues = {
  title: "",
  description: "",
  price: 1,
  cityId: 1,
  images: undefined,
};

function pickFiles(value: unknown) {
  const fileList = value as FileList | undefined;
  return fileList ? Array.from(fileList) : [];
}

export function ProductForm({
  onSubmit,
  submitLabel = "Сохранить товар",
  isSubmitting = false,
  error,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const disabled = isSubmitting || formSubmitting;

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      price: Number(values.price),
      cityId: Number(values.cityId),
      mainImageIndex: 0,
      images: pickFiles(values.images),
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField label="Название" error={errors.title?.message}>
          <Input placeholder="Например, велосипед" {...register("title")} />
        </FormField>
        <FormField label="Цена" error={errors.price?.message}>
          <Input type="number" min={1} step={1} {...register("price")} />
        </FormField>
      </div>

      <FormField label="Описание" error={errors.description?.message}>
        <Textarea placeholder="Коротко опишите состояние и детали" {...register("description")} />
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

      <div className="grid gap-5">
        <FormField
          label="Фотографии"
          error={errors.images?.message?.toString()}
          hint="От 1 до 5 изображений, каждое до 10MB"
        >
          <Input type="file" accept="image/*" multiple {...register("images")} />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={disabled}>
          <Save className="h-4 w-4" />
          {disabled ? "Сохраняем" : submitLabel}
        </Button>
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          <ImagePlus className="h-4 w-4" />
          Backend требует хотя бы одно изображение
        </span>
      </div>
    </form>
  );
}
