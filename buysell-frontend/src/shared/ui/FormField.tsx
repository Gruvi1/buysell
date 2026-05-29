import type { PropsWithChildren, ReactNode } from "react";

type FormFieldProps = PropsWithChildren<{
  label: string;
  error?: string;
  hint?: ReactNode;
}>;

export function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
