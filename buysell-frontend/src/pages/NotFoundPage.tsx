import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl rounded-md border border-line bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <p className="mt-3 text-sm text-muted">
        Проверьте адрес или вернитесь к списку товаров.
      </p>
      <Link
        to="/products"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-teal-800"
      >
        К товарам
      </Link>
    </section>
  );
}
