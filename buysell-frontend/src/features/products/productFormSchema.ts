import { z } from "zod";

const maxFileSize = 10 * 1024 * 1024;

const fileListSchema = z
  .any()
  .refine((value) => value instanceof FileList && value.length > 0, {
    message: "Загрузите хотя бы одно изображение",
  })
  .refine((value) => !(value instanceof FileList) || value.length <= 5, {
    message: "Максимум 5 изображений",
  })
  .refine(
    (value) =>
      !(value instanceof FileList) ||
      Array.from(value).every((file) => file.size <= maxFileSize),
    { message: "Каждый файл должен быть не больше 10MB" }
  );

export const productFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа")
    .max(100, "Максимум 100 символов"),
  description: z.string().trim().max(1000, "Максимум 1000 символов"),
  price: z.coerce.number().positive("Цена должна быть больше 0"),
  cityId: z.coerce.number().int().positive("Выберите город"),
  images: fileListSchema,
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
