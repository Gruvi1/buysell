import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-zinc-100",
          className
        )}
        {...props}
      />
    )
);

Input.displayName = "Input";
