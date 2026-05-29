import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { profileSchema, type ProfileFormValues } from "./profileSchema";
import type { User, UserUpdatePayload } from "../../shared/api/types";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";

type ProfileFormProps = {
  user?: User | null;
  email?: string | null;
  disabledReason?: string;
  isSubmitting?: boolean;
  error?: string;
  onSubmit: (payload: UserUpdatePayload) => Promise<void> | void;
};

function pickAvatar(value: unknown) {
  const fileList = value as FileList | undefined;
  return fileList?.item(0) ?? null;
}

export function ProfileForm({
  user,
  email,
  disabledReason,
  isSubmitting,
  error,
  onSubmit,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      avatar: undefined,
    },
  });

  useEffect(() => {
    reset({
      displayName: user?.displayName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      avatar: undefined,
    });
  }, [reset, user]);

  const disabled = Boolean(disabledReason) || Boolean(isSubmitting) || formSubmitting;

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          displayName: values.displayName.trim(),
          phoneNumber: values.phoneNumber.trim() || undefined,
          avatar: pickAvatar(values.avatar),
        });
      })}
    >
      {disabledReason ? <Alert variant="info">{disabledReason}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <FormField label="Email">
        <Input value={email ?? user?.email ?? ""} disabled readOnly />
      </FormField>

      <FormField label="Имя" error={errors.displayName?.message}>
        <Input disabled={disabled} {...register("displayName")} />
      </FormField>

      <FormField label="Телефон" error={errors.phoneNumber?.message}>
        <Input
          placeholder="+79991234567"
          disabled={disabled}
          {...register("phoneNumber")}
        />
      </FormField>

      <FormField
        label="Аватар"
        error={errors.avatar?.message?.toString()}
        hint="Backend принимает multipart avatar в PUT /api/users/{id}, когда известен id пользователя"
      >
        <Input
          type="file"
          accept="image/*"
          disabled={disabled}
          {...register("avatar")}
        />
      </FormField>

      <Button type="submit" disabled={disabled}>
        {disabledReason ? <Camera className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {disabledReason
          ? "Редактирование недоступно"
          : isSubmitting || formSubmitting
            ? "Сохраняем"
            : "Сохранить профиль"}
      </Button>
    </form>
  );
}
