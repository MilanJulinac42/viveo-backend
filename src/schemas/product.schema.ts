import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Naziv proizvoda je obavezan').max(200),
  description: z.string().optional().default(''),
  price: z.number().int().min(100, 'Minimalna cena je 100 RSD'),
  productCategoryId: z.string().uuid('Nevažeći ID kategorije').optional().nullable(),
  variants: z.array(z.object({
    name: z.string().min(1, 'Naziv varijante je obavezan'),
    priceOverride: z.number().int().min(100).optional().nullable(),
    stock: z.number().int().min(0, 'Stanje ne može biti negativno'),
    sortOrder: z.number().int().optional().default(0),
  })).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().int().min(100).optional(),
  productCategoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const createVariantSchema = z.object({
  name: z.string().min(1, 'Naziv varijante je obavezan'),
  priceOverride: z.number().int().min(100).optional().nullable(),
  stock: z.number().int().min(0, 'Stanje ne može biti negativno'),
  sortOrder: z.number().int().optional().default(0),
});

export const updateVariantSchema = z.object({
  name: z.string().min(1).optional(),
  priceOverride: z.number().int().min(100).optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
