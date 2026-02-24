import { z } from 'zod';

export const createDigitalOrderSchema = z.object({
  digitalProductId: z.string().uuid('Nevažeći ID digitalnog proizvoda'),
  buyerName: z.string().min(1, 'Ime kupca je obavezno'),
  buyerEmail: z.string().email('Nevažeća email adresa'),
  buyerPhone: z.string().optional().default(''),
});

export const updateDigitalOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
});

export type CreateDigitalOrderInput = z.infer<typeof createDigitalOrderSchema>;
export type UpdateDigitalOrderStatusInput = z.infer<typeof updateDigitalOrderStatusSchema>;
