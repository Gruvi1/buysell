import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  toUserPayload,
  userFormSchema,
  type UserFormValues,
} from "./userFormSchema";
import type { User, UserUpdatePayload } from "../../shared/api/types";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";

type UserFormProps = {
  user?: User;
  onSubmit: (payload: UserUpdatePayload) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string;
};

export function UserForm({
  user,
  onSubmit,
  isSubmitting = false,
  error,
}: UserFormProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName ?? "",
        phoneNumber: user.phoneNumber ?? "",
      });
    }
  }, [reset, user]);

  const disabled = isSubmitting || formSubmitting;

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((values) => onSubmit(toUserPayload(values)))}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}

      <FormField label="Отображаемое имя" error={errors.displayName?.message}>
        <Input {...register("displayName")} />
      </FormField>
      <FormField label="Телефон" error={errors.phoneNumber?.message}>
        <Input placeholder="+79991234567" {...register("phoneNumber")} />
      </FormField>

      <Button type="submit" disabled={disabled}>
        <Save className="h-4 w-4" />
        {disabled ? "Сохраняем" : "Сохранить"}
      </Button>
    </form>
  );
}
