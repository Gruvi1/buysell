import { useEffect, useState } from "react";

import { apiClient } from "../api/apiClient";

type AuthImageProps = {
  imageId?: number | null;
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
};

export function AuthImage({
  imageId,
  src,
  alt,
  className,
  loading = "lazy",
  onError,
}: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const directSrc = imageId ? null : src;

  useEffect(() => {
    if (!imageId) {
      setObjectUrl(null);
      return undefined;
    }

    let isActive = true;
    let createdUrl: string | null = null;

    apiClient
      .get<Blob>(`/v1/image/${imageId}`, { responseType: "blob" })
      .then((response) => {
        if (!isActive) return;
        createdUrl = URL.createObjectURL(response.data);
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (isActive) onError?.();
      });

    return () => {
      isActive = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [imageId, onError]);

  const resolvedSrc = objectUrl ?? directSrc;

  if (!resolvedSrc) {
    return null;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={onError}
    />
  );
}
