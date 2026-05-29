import { apiClient } from "./apiClient";
import type {
  PageResponse,
  Product,
  ProductCreatePayload,
  ProductFilters,
  ProductUpdatePayload,
} from "./types";
import { getImageUrl } from "../lib/utils";

function toProductFormData(payload: ProductCreatePayload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("price", String(payload.price));
  formData.append("cityId", String(payload.cityId));
  formData.append("mainImageIndex", String(payload.mainImageIndex ?? 0));

  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  payload.images.forEach((image) => formData.append("images", image));

  return formData;
}

function toProductUpdateBody(payload: ProductUpdatePayload) {
  const hasImages = Boolean(payload.images?.length);
  if (!hasImages) {
    return {
      title: payload.title,
      description: payload.description,
      price: payload.price,
      cityId: payload.cityId,
    };
  }

  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("price", String(payload.price));
  formData.append("cityId", String(payload.cityId));
  formData.append("mainImageIndex", String(payload.mainImageIndex ?? 0));

  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  payload.images?.forEach((image) => formData.append("images", image));

  return formData;
}

function normalizeProduct(product: Product): Product {
  const imageIds = product.imageIds ?? [];
  const imagePaths =
    product.imagePaths?.length || !imageIds.length
      ? product.imagePaths
      : imageIds.flatMap((imageId) => {
          const url = getImageUrl(imageId);
          return url ? [url] : [];
        });

  return {
    ...product,
    imageIds,
    imagePaths,
  };
}

function normalizePage(page: PageResponse<Product>): PageResponse<Product> {
  return {
    ...page,
    content: page.content.map(normalizeProduct),
  };
}

export const productApi = {
  async list(filters: ProductFilters = {}) {
    const params = {
      ...filters,
      size: filters.size ?? 20,
    };

    const { data } = await apiClient.get<PageResponse<Product>>("/v1/product", {
      params,
    });
    return normalizePage(data);
  },

  async getById(id: number) {
    const { data } = await apiClient.get<Product>(`/v1/product/${id}`);
    return normalizeProduct(data);
  },

  async create(payload: ProductCreatePayload) {
    const { data } = await apiClient.post<Product>(
      "/v1/product",
      toProductFormData(payload)
    );
    return normalizeProduct(data);
  },

  async update(id: number, payload: ProductUpdatePayload) {
    const { data } = await apiClient.put<Product>(
      `/v1/product/${id}`,
      toProductUpdateBody(payload)
    );
    return normalizeProduct(data);
  },

  async remove(id: number) {
    await apiClient.delete(`/v1/product/${id}`);
  },
};
