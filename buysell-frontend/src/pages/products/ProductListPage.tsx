import { useQuery } from "@tanstack/react-query";
import { PackageCheck, Plus, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ProductCard } from "../../entities/product/ProductCard";
import { useAuthStatus } from "../../features/auth/useAuth";
import { productApi } from "../../shared/api/productApi";
import { cityOptions } from "../../shared/config/cities";
import { queryKeys } from "../../shared/lib/queryKeys";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Input } from "../../shared/ui/Input";
import { Select } from "../../shared/ui/Select";
import { Skeleton } from "../../shared/ui/Skeleton";

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const title = searchParams.get("title") || "";
  const cityId = searchParams.get("cityId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const mine = searchParams.get("mine") === "1";
  const page = Number(searchParams.get("page") || 0);
  const [search, setSearch] = useState(title);
  const [city, setCity] = useState(cityId);
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const { data: auth } = useAuthStatus();

  const filters = {
    title: title || undefined,
    cityId: cityId ? Number(cityId) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 0,
    size: 20,
  };

  const productsQuery = useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => productApi.list(filters),
  });
  const products = productsQuery.data?.content ?? [];
  const showOnlyMine = mine && Boolean(auth?.authenticated);
  const visibleProducts = showOnlyMine
    ? products.filter((product) => Boolean(product.isOwner ?? product.owner))
    : products;

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set("title", search.trim());
    if (city.trim()) next.set("cityId", city.trim());
    if (min.trim()) next.set("minPrice", min.trim());
    if (max.trim()) next.set("maxPrice", max.trim());
    if (showOnlyMine) next.set("mine", "1");
    setSearchParams(next);
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 0) {
      next.set("page", String(nextPage));
    } else {
      next.delete("page");
    }
    setSearchParams(next);
  };

  const toggleMine = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (mine) {
      next.delete("mine");
    } else {
      next.set("mine", "1");
    }
    setSearchParams(next);
  };

  return (
    <section className="space-y-6">
      <div className="stripe-hero overflow-hidden rounded-[2rem] border border-white/70 text-white shadow-premium">
        <div className="relative z-10 grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
          <div>
            <p className="text-sm font-semibold text-teal-100">Каталог BuySell</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">
              Товары рядом, продавцы на связи
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Фильтруйте объявления, открывайте карточки и переходите в чат с продавцом по конкретному товару.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {auth?.authenticated ? (
                <Button
                  variant={showOnlyMine ? "primary" : "secondary"}
                  onClick={toggleMine}
                  className={showOnlyMine ? "" : "border-white/15 bg-white/10 text-white hover:bg-white/15"}
                >
                  <PackageCheck className="h-4 w-4" />
                  {showOnlyMine ? "Все товары" : "Мои товары"}
                </Button>
              ) : null}
              <Link
                to="/products/new"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                Новый товар
              </Link>
            </div>
          </div>
          <div className="grid content-end gap-3 rounded-3xl border border-white/15 bg-white/[0.12] p-5 text-sm text-white/75 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <span>В выдаче</span>
              <strong className="text-lg text-white">
                {productsQuery.data?.totalElements ?? visibleProducts.length}
              </strong>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4">
              <span>{showOnlyMine ? "Мои товары" : "Текущий фильтр"}</span>
              <strong className="text-lg text-white">{visibleProducts.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={submitSearch}
        className="premium-glass grid gap-3 rounded-3xl p-3 lg:grid-cols-[minmax(180px,1fr)_140px_140px_140px_auto]"
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
        />
        <Select
          value={city}
          onChange={(event) => setCity(event.target.value)}
          aria-label="Город"
        >
          <option value="">Все города</option>
          {cityOptions.map((cityOption) => (
            <option key={cityOption.id} value={cityOption.id}>
              {cityOption.name}
            </option>
          ))}
        </Select>
        <Input
          value={min}
          onChange={(event) => setMin(event.target.value)}
          type="number"
          min={0}
          placeholder="Цена от"
          aria-label="Минимальная цена"
        />
        <Input
          value={max}
          onChange={(event) => setMax(event.target.value)}
          type="number"
          min={0}
          placeholder="Цена до"
          aria-label="Максимальная цена"
        />
        <Button type="submit" className="shrink-0">
          <Search className="h-4 w-4" />
          Найти
        </Button>
      </form>

      {productsQuery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
            >
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {productsQuery.isError ? (
        <Alert variant="error" title="Не удалось загрузить товары">
          {productsQuery.error.message}
        </Alert>
      ) : null}

      {productsQuery.data && visibleProducts.length === 0 ? (
        <EmptyState
          title={showOnlyMine ? "У вас пока нет товаров" : "Товаров не найдено"}
          description={showOnlyMine ? "Создайте первое объявление, и оно появится здесь." : "Создайте первое объявление или измените строку поиска."}
          action={
            <Link
              to="/products/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Создать товар
            </Link>
          }
        />
      ) : null}

      {visibleProducts.length ? (
        <>
          <div className="flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Найдено:{" "}
              {showOnlyMine
                ? visibleProducts.length
                : productsQuery.data?.totalElements ?? visibleProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={productsQuery.data?.first}
                onClick={() => setPage((productsQuery.data?.number ?? 0) - 1)}
              >
                Назад
              </Button>
              <span>
                Страница {(productsQuery.data?.number ?? 0) + 1} из{" "}
                {productsQuery.data?.totalPages ?? 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={productsQuery.data?.last}
                onClick={() => setPage((productsQuery.data?.number ?? 0) + 1)}
              >
                Вперед
              </Button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
