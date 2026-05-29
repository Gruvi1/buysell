import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ProductForm } from "../../features/products/ProductForm";
import { ApiClientError } from "../../shared/api/apiClient";
import { productApi } from "../../shared/api/productApi";
import type { ProductCreatePayload } from "../../shared/api/types";

export function ProductCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createProduct = useMutation({
    mutationFn: (payload: ProductCreatePayload) => productApi.create(payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate(`/products/${product.id}`);
    },
  });

  const error =
    createProduct.error instanceof ApiClientError
      ? createProduct.error.message
      : createProduct.error
        ? "Не удалось создать товар"
        : undefined;

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к товарам
      </Link>
      <div>
        <p className="text-sm font-medium text-accent">Продажа</p>
        <h1 className="mt-1 text-3xl font-semibold">Новый товар</h1>
        <p className="mt-2 text-sm text-muted">
          Добавьте описание, цену, город и до пяти фотографий.
        </p>
      </div>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <ProductForm
          onSubmit={async (payload) => {
            await createProduct.mutateAsync(payload);
          }}
          isSubmitting={createProduct.isPending}
          error={error}
        />
      </div>
    </section>
  );
}
