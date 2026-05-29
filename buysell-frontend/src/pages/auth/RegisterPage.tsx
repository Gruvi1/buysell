import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import {
  registerSchema,
  toRegisterPayload,
  type RegisterFormValues,
} from "../../features/auth/authSchemas";
import { useRegister } from "../../features/auth/useAuth";
import { ApiClientError } from "../../shared/api/apiClient";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";

export function RegisterPage() {
  const registerUser = useRegister();
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", displayName: "", phoneNumber: "" },
  });

  const error =
    registerUser.error instanceof ApiClientError
      ? registerUser.error.message
      : registerUser.error
        ? "Не удалось зарегистрироваться"
        : null;

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-medium text-accent">BuySell</p>
        <h1 className="mt-1 text-3xl font-semibold">Регистрация</h1>
        <p className="mt-2 text-sm text-muted">
          Укажите контакты, чтобы покупатели могли связаться с вами.
        </p>
      </div>

      <form
        className="space-y-5 rounded-3xl border border-line bg-white p-5 shadow-sm"
        onSubmit={handleSubmit(async (values) => {
          const user = await registerUser.mutateAsync(toRegisterPayload(values));
          setSuccess(`Пользователь ${user.email} зарегистрирован`);
          reset();
        })}
      >
        {success ? <Alert variant="success">{success}</Alert> : null}
        {error ? <Alert variant="error">{error}</Alert> : null}

        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <FormField label="Пароль" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </FormField>
        <FormField label="Имя" error={errors.displayName?.message}>
          <Input {...register("displayName")} />
        </FormField>
        <FormField label="Телефон" error={errors.phoneNumber?.message}>
          <Input placeholder="+79991234567" {...register("phoneNumber")} />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || registerUser.isPending}
        >
          <UserPlus className="h-4 w-4" />
          {isSubmitting || registerUser.isPending ? "Создаем" : "Создать аккаунт"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link to="/login" className="font-medium text-accent">
          Войти
        </Link>
      </p>
    </section>
  );
}
