import { z } from 'zod';

export const createMerchOrderSchema = z.object({
  productId: z.string().uuid('Nevažeći ID proizvoda'),
  productVariantId: z.string().uuid('Nevažeći ID varijante').optional().nullable(),
  quantity: z.number().int().min(1, 'Minimalna količina je 1').max(10, 'Maksimalna količina je 10'),
  buyerName: z.string().min(1, 'Ime kupca je obavezno'),
  buyerEmail: z.string().email('Nevažeća email adresa'),
  buyerPhone: z.string().optional().default(''),
  shippingName: z.string().min(1, 'Ime primaoca je obavezno'),
  shippingAddress: z.string().min(1, 'Adresa je obavezna'),
  shippingCity: z.string().min(1, 'Grad je obavezan'),
  shippingPostal: z.string().min(1, 'Poštanski broj je obavezan'),
  shippingNote: z.string().optional().default(''),
});

export const updateMerchOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional(),
});

export type CreateMerchOrderInput = z.infer<typeof createMerchOrderSchema>;
export type UpdateMerchOrderStatusInput = z.infer<typeof updateMerchOrderStatusSchema>;
