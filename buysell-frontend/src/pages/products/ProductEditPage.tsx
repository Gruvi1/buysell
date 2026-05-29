import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { ProductEditForm } from "../../features/product-edit/ProductEditForm";
import { ApiClientError } from "../../shared/api/apiClient";
import { productApi } from "../../shared/api/productApi";
import type { ProductUpdatePayload } from "../../shared/api/types";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toastContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function ProductEditPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const productId = Number(params.productId);

  const productQuery = useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => productApi.getById(productId),
    enabled: Number.isFinite(productId),
  });

  const updateProduct = useMutation({
    mutationFn: (payload: ProductUpdatePayload) =>
      productApi.update(productId, payload),
    onSuccess: async (product) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.product(product.id) }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      showToast({
        variant: "success",
        title: "Товар обновлен",
        description: "Изменения сохранены.",
      });
      navigate(`/products/${product.id}`);
    },
    onError: (error) => {
      showToast({
        variant: "error",
        title: "Не удалось сохранить товар",
        description: getErrorMessage(error, "Проверьте форму и попробуйте еще раз"),
      });
    },
  });

  if (!Number.isFinite(productId)) {
    return <Navigate to="/products" replace />;
  }

  if (productQuery.isLoading) {
    return (
      <section className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-96" />
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

  if (!isOwner) {
    return <Navigate to={`/products/${product.id}`} replace />;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link
        to={`/products/${product.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к товару
      </Link>

      <div>
        <p className="text-sm font-medium text-accent">Мой товар</p>
        <h1 className="mt-1 text-3xl font-semibold">
          Редактирование товара
        </h1>
        <p className="mt-2 text-sm text-muted">
          Обновите название, описание, цену, город или замените фотографии.
        </p>
      </div>

      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <ProductEditForm
          product={product}
          isSubmitting={updateProduct.isPending}
          error={
            updateProduct.error
              ? getErrorMessage(updateProduct.error, "Не удалось сохранить товар")
              : undefined
          }
          onSubmit={async (payload) => {
            await updateProduct.mutateAsync(payload);
          }}
        />
      </div>
    </section>
  );
}
