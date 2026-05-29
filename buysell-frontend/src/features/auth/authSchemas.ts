import { z } from "zod";

export const phonePattern = /^\+?[78][-(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}$/;

export const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
  displayName: z
    .string()
    .trim()
    .refine((value) => value === "" || (value.length >= 2 && value.length <= 50), {
      message: "Имя должно быть от 2 до 50 символов",
    }),
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => value === "" || phonePattern.test(value), {
      message: "Формат: +79991234567",
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export function toRegisterPayload(values: RegisterFormValues) {
  return {
    email: values.email,
    password: values.password,
    displayName: values.displayName || undefined,
    phoneNumber: values.phoneNumber || undefined,
  };
}
