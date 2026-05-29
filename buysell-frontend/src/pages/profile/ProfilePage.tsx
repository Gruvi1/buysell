import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Camera, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import { useAuthStatus } from "../../features/auth/useAuth";
import { ProfileForm } from "../../features/profile/ProfileForm";
import { ApiClientError } from "../../shared/api/apiClient";
import { userApi } from "../../shared/api/userApi";
import type { UserUpdatePayload } from "../../shared/api/types";
import { formatDate, resolveApiAssetUrl } from "../../shared/lib/utils";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toastContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: auth } = useAuthStatus();

  const userQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: userApi.me,
  });

  const updateProfile = useMutation({
    mutationFn: (payload: UserUpdatePayload) => userApi.updateMe(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      showToast({
        variant: "success",
        title: "Профиль сохранен",
        description: "Данные пользователя обновлены.",
      });
    },
    onError: (error) => {
      showToast({
        variant: "error",
        title: "Не удалось сохранить профиль",
        description: getErrorMessage(error, "Проверьте данные формы"),
      });
    },
  });

  const user = userQuery.data ?? null;
  const avatarSrc = resolveApiAssetUrl(user?.imagePath);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="stripe-hero overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-premium sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm font-semibold text-white/80">Аккаунт BuySell</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Профиль продавца
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Настройте имя, телефон и аватар. Эти данные помогают покупателям быстрее понять, с кем они общаются.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-premium">
          <div className="profile-cover h-28" />
          <div className="-mt-14 p-6">
            <div className="relative h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-soft">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.displayName || "Аватар пользователя"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-teal-50 text-accent">
                  <UserRound className="h-11 w-11" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 rounded-full bg-ink p-2 text-white shadow-sm">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-semibold">
              {user?.displayName || auth?.username || "Пользователь"}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                {user?.email || auth?.username || "email не найден"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                {user?.phoneNumber || "Телефон не указан"}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                {formatDate(user?.createdAt)}
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-zinc-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Профиль активен
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Аватар и контакты используются в карточках продавца и диалогах.
              </p>
            </div>
          </div>
        </aside>

        <div className="rounded-[2rem] border border-white bg-white p-6 shadow-premium">
          {userQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : null}

          {userQuery.isError ? (
            <Alert variant="error" title="Не удалось загрузить профиль">
              {userQuery.error.message}
            </Alert>
          ) : null}

          {!userQuery.isLoading ? (
            <ProfileForm
              user={user}
              email={auth?.username}
              isSubmitting={updateProfile.isPending}
              error={
                updateProfile.error
                  ? getErrorMessage(updateProfile.error, "Не удалось сохранить профиль")
                  : undefined
              }
              onSubmit={async (payload) => {
                await updateProfile.mutateAsync(payload);
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
