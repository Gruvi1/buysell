import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Package, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { chatApi } from "../../shared/api/chatApi";
import { formatDate } from "../../shared/lib/utils";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";

export function ChatsPage() {
  const dialogsQuery = useQuery({
    queryKey: queryKeys.dialogs,
    queryFn: chatApi.listDialogs,
    refetchInterval: 10_000,
  });

  const dialogs = dialogsQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Сообщения</p>
          <h1 className="mt-1 text-3xl font-semibold">Чаты</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Диалоги покупателей и продавцов по конкретным товарам.
          </p>
        </div>
      </div>

      {dialogsQuery.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : null}

      {dialogsQuery.isError ? (
        <Alert variant="error" title="Не удалось загрузить чаты">
          {dialogsQuery.error.message}
        </Alert>
      ) : null}

      {dialogsQuery.data && dialogs.length === 0 ? (
        <EmptyState
          title="Пока нет чатов"
          description="Откройте товар и напишите продавцу. Если вы продавец, новые сообщения по вашим товарам появятся здесь."
          action={
            <Link
              to="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              <Package className="h-4 w-4" />
              Перейти к товарам
            </Link>
          }
        />
      ) : null}

      {dialogs.length ? (
        <div className="grid gap-3">
          {dialogs.map((dialog) => (
            <Link
              key={dialog.id}
              to={`/chats/${dialog.id}`}
              className="group rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-soft"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-accent">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold">
                        {dialog.productTitle || `Товар #${dialog.productId}`}
                      </h2>
                      {dialog.unreadCount > 0 ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                          {dialog.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-4 w-4" />
                        Покупатель: {dialog.buyerName || "не указан"}
                      </span>
                      <span>Продавец: {dialog.sellerName || "не указан"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted sm:text-right">
                  <p>{formatDate(dialog.updatedAt)}</p>
                  <p className="mt-1 font-medium text-accent opacity-0 transition group-hover:opacity-100">
                    Открыть чат
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
