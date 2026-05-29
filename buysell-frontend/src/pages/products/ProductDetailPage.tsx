import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, MessageCircle, Pencil, Trash2, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { ApiClientError } from "../../shared/api/apiClient";
import { chatApi } from "../../shared/api/chatApi";
import { productApi } from "../../shared/api/productApi";
import { formatDate, formatPrice } from "../../shared/lib/utils";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { AuthImage } from "../../shared/ui/AuthImage";
import { Button } from "../../shared/ui/Button";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toastContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function ProductDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const productId = Number(params.productId);
  const [imageFailed, setImageFailed] = useState(false);
  const handleImageError = useCallback(() => setImageFailed(true), []);

  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productApi.getById(productId),
    enabled: Number.isFinite(productId),
  });

  const deleteProduct = useMutation({
    mutationFn: () => productApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showToast({
        variant: "success",
        title: "Товар удален",
        description: "Объявление больше не отображается в списке.",
      });
      navigate("/products");
    },
    onError: (error) => {
      showToast({
        variant: "error",
        title: "Не удалось удалить товар",
        description: getErrorMessage(error, "Попробуйте еще раз"),
      });
    },
  });

  const openDialog = useMutation({
    mutationFn: () => chatApi.getOrCreateDialog(productId),
    onSuccess: (dialog) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogs });
      navigate(`/chats/${dialog.id}`);
    },
    onError: (error) => {
      showToast({
        variant: "error",
        title: "Не удалось открыть чат",
        description: getErrorMessage(error, "Проверьте авторизацию и попробуйте еще раз"),
      });
    },
  });

  if (!Number.isFinite(productId)) {
    return <Navigate to="/products" replace />;
  }

  if (productQuery.isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Skeleton className="aspect-[4/3]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-36" />
          </div>
        </div>
      </section>
    );
  }

  if (productQuery.isError) {
    return (
      <Alert variant="error" title="Не удалось загрузить товар">
        {productQuery.error.message}
      </Alert>
    );
  }

  const product = productQuery.data;
  if (!product) {
    return null;
  }

  const isOwner = Boolean(product.isOwner ?? product.owner);
  const imageId = product.imageIds?.[0];
  const imageSrc = product.imagePaths?.[0];

  return (
    <section className="space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к товарам
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
          <div className="aspect-[4/3] bg-zinc-100">
            {imageSrc && !imageFailed ? (
              <AuthImage
                imageId={imageId}
                src={imageSrc}
                alt={product.title}
                className="h-full w-full object-cover"
                loading="eager"
                onError={handleImageError}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-200 px-6 text-center text-sm text-muted">
                Нет изображения
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <p className="text-sm text-muted">{formatDate(product.createdAt)}</p>
            <h1 className="mt-2 text-3xl font-semibold">{product.title}</h1>
            <p className="mt-4 text-2xl font-semibold text-accent">
              {formatPrice(product.price)}
            </p>

            <div className="mt-5 grid gap-3 text-sm text-muted">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {product.cityName || "Город не указан"}
              </p>
              <p className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {product.sellerName || "Продавец не указан"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Описание</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
              {product.description || "Описание не указано"}
            </p>
          </div>

          {deleteProduct.isError ? (
            <Alert variant="error">Не удалось удалить товар</Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Link
                  to={`/products/${product.id}/edit`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </Link>
                <Button
                  variant="danger"
                  onClick={() => deleteProduct.mutate()}
                  disabled={deleteProduct.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteProduct.isPending ? "Удаляем" : "Удалить товар"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => openDialog.mutate()}
                disabled={openDialog.isPending}
              >
                <MessageCircle className="h-4 w-4" />
                {openDialog.isPending ? "Открываем чат" : "Написать продавцу"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
