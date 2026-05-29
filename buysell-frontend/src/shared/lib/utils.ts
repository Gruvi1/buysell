import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { API_BASE_URL } from "../config/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getImageUrl(imageId?: number | null) {
  if (!imageId) {
    return null;
  }

  return `${API_BASE_URL}/v1/image/${imageId}`;
}

export function resolveApiAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (/^(https?:|blob:|data:)/.test(path)) {
    return path;
  }

  if (path.startsWith("/api/")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
}
