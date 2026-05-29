import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "../lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-zinc-100",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
