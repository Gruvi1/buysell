import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserTable } from "../../entities/user/UserTable";
import { userApi } from "../../shared/api/userApi";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Spinner } from "../../shared/ui/Spinner";

export function UsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: userApi.list,
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => userApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Управляйте аккаунтами, контактами и доступностью пользователей.
        </p>
      </div>

      {usersQuery.isLoading ? <Spinner label="Загружаем пользователей" /> : null}

      {usersQuery.isError ? (
        <Alert variant="error" title="Не удалось загрузить пользователей">
          {usersQuery.error.message}
        </Alert>
      ) : null}

      {deleteUser.isError ? (
        <Alert variant="error">Не удалось удалить пользователя</Alert>
      ) : null}

      {usersQuery.data?.length === 0 ? (
        <EmptyState title="Пользователей нет" />
      ) : null}

      {usersQuery.data?.length ? (
        <UserTable
          users={usersQuery.data}
          onDelete={(id) => deleteUser.mutate(id)}
          deletingId={deleteUser.variables}
        />
      ) : null}
    </section>
  );
}
