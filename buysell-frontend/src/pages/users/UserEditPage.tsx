import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { UserForm } from "../../features/users/UserForm";
import { ApiClientError } from "../../shared/api/apiClient";
import type { UserUpdatePayload } from "../../shared/api/types";
import { userApi } from "../../shared/api/userApi";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { Spinner } from "../../shared/ui/Spinner";

export function UserEditPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = Number(params.userId);

  const userQuery = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => userApi.getById(userId),
    enabled: Number.isFinite(userId),
  });

  const updateUser = useMutation({
    mutationFn: (payload: UserUpdatePayload) => userApi.update(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
      navigate("/users");
    },
  });

  if (!Number.isFinite(userId)) {
    return <Navigate to="/users" replace />;
  }

  const error =
    updateUser.error instanceof ApiClientError
      ? updateUser.error.message
      : updateUser.error
        ? "Не удалось обновить пользователя"
        : undefined;

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к пользователям
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Редактирование пользователя</h1>
        <p className="mt-2 text-sm text-muted">
          Обновите отображаемое имя и телефон пользователя.
        </p>
      </div>

      {userQuery.isLoading ? <Spinner label="Загружаем пользователя" /> : null}
      {userQuery.isError ? (
        <Alert variant="error">{userQuery.error.message}</Alert>
      ) : null}

      {userQuery.data ? (
        <div className="rounded-md border border-line bg-white p-5">
          <UserForm
            user={userQuery.data}
            onSubmit={async (payload) => {
              await updateUser.mutateAsync(payload);
            }}
            isSubmitting={updateUser.isPending}
            error={error}
          />
        </div>
      ) : null}
    </section>
  );
}
