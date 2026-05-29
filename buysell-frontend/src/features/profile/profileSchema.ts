import { z } from "zod";

const avatarSchema = z
  .any()
  .optional()
  .refine((value) => {
    if (!value || !(value instanceof FileList) || value.length === 0) {
      return true;
    }

    const file = value.item(0);
    return Boolean(file && file.size <= 10 * 1024 * 1024);
  }, "Аватар должен быть не больше 10MB");

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Минимум 2 символа")
    .max(50, "Максимум 50 символов"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^$|^\+?[78][-(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}$/, {
      message: "Некорректный формат номера телефона",
    }),
  avatar: avatarSchema,
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
