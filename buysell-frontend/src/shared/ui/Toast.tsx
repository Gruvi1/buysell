import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";

import { cn } from "../lib/utils";
import { ToastContext, type ToastInput, type ToastVariant } from "./toastContext";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

const styles = {
  success: "border-emerald-100 bg-white text-emerald-950",
  error: "border-red-100 bg-white text-red-950",
  info: "border-line bg-white text-ink",
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current, { ...toast, id }].slice(-4));
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {items.map((item) => {
          const Icon = icons[item.variant];
          return (
            <div
              key={item.id}
              className={cn(
                "flex gap-3 rounded-2xl border p-4 shadow-soft",
                styles[item.variant]
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-muted transition hover:bg-zinc-100 hover:text-ink"
                onClick={() => dismiss(item.id)}
                aria-label="Закрыть уведомление"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
