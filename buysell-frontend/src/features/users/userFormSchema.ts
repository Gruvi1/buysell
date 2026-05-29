import { z } from "zod";

import { phonePattern } from "../auth/authSchemas";

export const userFormSchema = z.object({
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

export type UserFormValues = z.infer<typeof userFormSchema>;

export function toUserPayload(values: UserFormValues) {
  return {
    displayName: values.displayName || undefined,
    phoneNumber: values.phoneNumber || undefined,
  };
}
