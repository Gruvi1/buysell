import { z } from "zod";

const maxFileSize = 10 * 1024 * 1024;

const optionalImagesSchema = z
  .any()
  .optional()
  .refine(
    (value) => !(value instanceof FileList) || value.length <= 5,
    "Максимум 5 изображений"
  )
  .refine(
    (value) =>
      !(value instanceof FileList) ||
      Array.from(value).every((file) => file.size <= maxFileSize),
    "Каждый файл должен быть не больше 10MB"
  );

export const productEditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа")
    .max(100, "Максимум 100 символов"),
  description: z.string().trim().max(1000, "Максимум 1000 символов"),
  price: z.coerce.number().positive("Цена должна быть больше 0"),
  cityId: z.coerce.number().int().positive("Выберите город"),
  images: optionalImagesSchema,
});

export type ProductEditFormValues = z.infer<typeof productEditSchema>;
