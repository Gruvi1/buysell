import type { PropsWithChildren } from "react";

import { cn } from "../lib/utils";

type AlertProps = PropsWithChildren<{
  variant?: "error" | "success" | "info";
  title?: string;
}>;

const styles = {
  error: "border-red-200 bg-red-50 text-red-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-line bg-white text-ink",
};

export function Alert({ variant = "info", title, children }: AlertProps) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm shadow-sm", styles[variant])}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
