import { zodResolver } from "@hookform/resolvers/zod";
import { SendHorizonal } from "lucide-react";
import { useForm } from "react-hook-form";

import { messageSchema, type MessageFormValues } from "./messageSchema";
import { Button } from "../../shared/ui/Button";
import { Textarea } from "../../shared/ui/Textarea";

type MessageComposerProps = {
  onSubmit: (content: string) => Promise<void> | void;
  disabled?: boolean;
};

export function MessageComposer({ onSubmit, disabled }: MessageComposerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  const isDisabled = disabled || isSubmitting;

  return (
    <form
      className="rounded-2xl border border-line bg-white p-3 shadow-sm"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values.content.trim());
        reset();
      })}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Textarea
            rows={2}
            placeholder="Напишите сообщение"
            className="min-h-16 resize-none border-0 bg-zinc-50 focus:ring-accent/20"
            disabled={isDisabled}
            {...register("content")}
          />
          {errors.content?.message ? (
            <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
          ) : null}
        </div>
        <Button type="submit" disabled={isDisabled} className="sm:h-16 sm:px-5">
          <SendHorizonal className="h-4 w-4" />
          {isDisabled ? "Отправляем" : "Отправить"}
        </Button>
      </div>
    </form>
  );
}
