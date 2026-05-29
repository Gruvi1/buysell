import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Package } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { MessageComposer } from "../../features/chat/MessageComposer";
import { ApiClientError } from "../../shared/api/apiClient";
import { chatApi } from "../../shared/api/chatApi";
import { userApi } from "../../shared/api/userApi";
import { formatDate } from "../../shared/lib/utils";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toastContext";
import { cn } from "../../shared/lib/utils";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function ChatPage() {
  const params = useParams();
  const dialogId = Number(params.dialogId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const endRef = useRef<HTMLDivElement | null>(null);

  const currentUserQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: userApi.me,
  });

  const dialogsQuery = useQuery({
    queryKey: queryKeys.dialogs,
    queryFn: chatApi.listDialogs,
    enabled: Number.isFinite(dialogId),
    refetchInterval: 10_000,
  });

  const messagesQuery = useQuery({
    queryKey: queryKeys.dialogMessages(dialogId),
    queryFn: () => chatApi.listMessages(dialogId),
    enabled: Number.isFinite(dialogId),
    refetchInterval: 3_000,
  });

  const dialog = useMemo(
    () => dialogsQuery.data?.find((item) => item.id === dialogId),
    [dialogId, dialogsQuery.data]
  );

  const sendMessage = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(dialogId, { content }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dialogMessages(dialogId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dialogs }),
      ]);
    },
    onError: (error) => {
      showToast({
        variant: "error",
        title: "Не удалось отправить сообщение",
        description: getErrorMessage(error, "Попробуйте еще раз"),
      });
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesQuery.data?.length]);

  if (!Number.isFinite(dialogId)) {
    return <Navigate to="/chats" replace />;
  }

  const messages = messagesQuery.data ?? [];

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/chats"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Все чаты
        </Link>
        {dialog ? (
          <Link
            to={`/products/${dialog.productId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-zinc-50"
          >
            <Package className="h-4 w-4" />
            Товар
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <header className="border-b border-line bg-white/95 px-5 py-4">
          {dialogsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-accent">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">
                  {dialog?.productTitle || `Диалог #${dialogId}`}
                </h1>
                <p className="mt-1 truncate text-sm text-muted">
                  {dialog
                    ? `Покупатель: ${dialog.buyerName || "не указан"} · Продавец: ${
                        dialog.sellerName || "не указан"
                      }`
                    : "Диалог загружен без карточки из списка"}
                </p>
              </div>
            </div>
          )}
        </header>

        <div className="flex min-h-[58vh] flex-col bg-gradient-to-b from-zinc-50 to-white">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            {messagesQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="ml-auto h-16 w-2/3" />
                <Skeleton className="h-16 w-1/2" />
              </div>
            ) : null}

            {messagesQuery.isError ? (
              <Alert variant="error" title="Не удалось загрузить сообщения">
                {messagesQuery.error.message}
              </Alert>
            ) : null}

            {messagesQuery.data && messages.length === 0 ? (
              <EmptyState
                title="Пока нет сообщений"
                description="Напишите первое сообщение по этому товару."
              />
            ) : null}

            {messages.map((message) => {
              const isMine =
                typeof currentUserQuery.data?.id === "number" &&
                message.senderId === currentUserQuery.data.id;

              return (
                <div
                  key={message.id}
                  className={cn("flex", isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[86%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[70%]",
                      isMine
                        ? "rounded-br-lg bg-accent text-white"
                        : "rounded-bl-lg border border-line bg-white text-ink"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          isMine ? "text-white/85" : "text-muted"
                        )}
                      >
                        {message.senderName || "Пользователь"}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          isMine ? "text-white/70" : "text-muted"
                        )}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line bg-white/90 p-3 sm:p-4">
            <MessageComposer
              disabled={sendMessage.isPending}
              onSubmit={async (content) => {
                await sendMessage.mutateAsync(content);
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
