import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Сообщение не может быть пустым")
    .max(1000, "Сообщение не должно превышать 1000 символов"),
});

export type MessageFormValues = z.infer<typeof messageSchema>;
