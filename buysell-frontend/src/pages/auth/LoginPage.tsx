import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import {
  loginSchema,
  type LoginFormValues,
} from "../../features/auth/authSchemas";
import { useAuthStatus, useLogin } from "../../features/auth/useAuth";
import { ApiClientError } from "../../shared/api/apiClient";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";
import { Spinner } from "../../shared/ui/Spinner";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname || "/products";
  const { data: auth, isLoading: authLoading } = useAuthStatus();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (authLoading) {
    return <Spinner label="Проверяем сессию" />;
  }

  if (auth?.authenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const error =
    login.error instanceof ApiClientError
      ? login.error.message
      : login.error
        ? "Не удалось войти"
        : null;

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-medium text-accent">BuySell</p>
        <h1 className="mt-1 text-3xl font-semibold">Вход</h1>
        <p className="mt-2 text-sm text-muted">
          Войдите, чтобы просматривать объявления и управлять своими товарами.
        </p>
      </div>

      <form
        className="space-y-5 rounded-3xl border border-line bg-white p-5 shadow-sm"
        onSubmit={handleSubmit(async (values) => {
          await login.mutateAsync(values);
          navigate(redirectTo, { replace: true });
        })}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}

        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <FormField label="Пароль" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting || login.isPending}>
          <LogIn className="h-4 w-4" />
          {isSubmitting || login.isPending ? "Входим" : "Войти"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link to="/register" className="font-medium text-accent">
          Зарегистрироваться
        </Link>
      </p>
    </section>
  );
}
