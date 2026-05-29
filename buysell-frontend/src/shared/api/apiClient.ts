import axios, { AxiosError } from "axios";
import type { AxiosRequestHeaders } from "axios";

import { API_BASE_URL } from "../config/env";
import { getAccessToken } from "./authToken";
import type { ApiErrorPayload, ValidationErrorPayload } from "./types";

export class ApiClientError extends Error {
  status?: number;
  fieldErrors?: ValidationErrorPayload;

  constructor(message: string, status?: number, fieldErrors?: ValidationErrorPayload) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    const headers = (config.headers ?? {}) as AxiosRequestHeaders;
    headers.Authorization = `Bearer ${token}`;
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(toApiClientError(error))
);

function toApiClientError(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return new ApiClientError(data, status);
  }

  if (isApiErrorPayload(data)) {
    return new ApiClientError(data.message, data.status);
  }

  if (isValidationErrorPayload(data)) {
    return new ApiClientError(
      Object.values(data).join(". "),
      status,
      data
    );
  }

  return new ApiClientError(
    error.message || "Не удалось выполнить запрос к API",
    status
  );
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as ApiErrorPayload).message === "string"
  );
}

function isValidationErrorPayload(value: unknown): value is ValidationErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((item) => typeof item === "string")
  );
}
