import { Eye, MapPin, Tag, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import type { Product } from "../../shared/api/types";
import { formatDate, formatPrice } from "../../shared/lib/utils";
import { AuthImage } from "../../shared/ui/AuthImage";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageId = product.imageIds?.[0];
  const imageSrc = product.imagePaths?.[0];
  const handleImageError = useCallback(() => setImageFailed(true), []);

  return (
    <article className="group grid overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-premium transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        {imageSrc && !imageFailed ? (
          <AuthImage
            imageId={imageId}
            src={imageSrc}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0_52%,#ccfbf1)] px-4 text-center text-sm text-muted">
            Нет изображения
          </div>
        )}
        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-accent shadow-sm">
          {formatPrice(product.price)}
        </div>
        {product.isOwner ?? product.owner ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/90 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
            <Tag className="h-3.5 w-3.5" />
            Ваш товар
          </span>
        ) : null}
      </div>
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-base font-semibold">{product.title}</h2>
          </div>
          <p className="line-clamp-3 text-sm text-muted">
            {product.description || "Описание не указано"}
          </p>
        </div>

        <div className="mt-auto space-y-2 text-xs text-muted">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {product.cityName || "Город не указан"}
          </p>
          <p className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {product.sellerName || "Продавец не указан"}
          </p>
          <p>{formatDate(product.createdAt)}</p>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium transition hover:border-accent/40 hover:bg-teal-50 hover:text-accent"
        >
          <Eye className="h-4 w-4" />
          Открыть
        </Link>
      </div>
    </article>
  );
}
