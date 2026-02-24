import { z } from 'zod';

export const createDigitalProductSchema = z.object({
  name: z.string().min(1, 'Naziv proizvoda je obavezan').max(200),
  description: z.string().optional().default(''),
  price: z.number().int().min(100, 'Minimalna cena je 100 RSD'),
  digitalProductCategoryId: z.string().uuid('Nevažeći ID kategorije').optional().nullable(),
});

export const updateDigitalProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().int().min(100).optional(),
  digitalProductCategoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export type CreateDigitalProductInput = z.infer<typeof createDigitalProductSchema>;
export type UpdateDigitalProductInput = z.infer<typeof updateDigitalProductSchema>;
