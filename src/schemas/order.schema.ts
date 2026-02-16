import { z } from 'zod';

export const createOrderSchema = z.object({
  celebritySlug: z.string().min(1, 'Celebrity slug je obavezan'),
  videoTypeId: z.string().uuid('Nevažeći video type ID'),
  recipientName: z.string().min(1, 'Ime primaoca je obavezno'),
  buyerName: z.string().min(1, 'Ime naručioca je obavezno'),
  buyerEmail: z.string().email('Nevažeća email adresa'),
  instructions: z.string().min(1, 'Uputstva su obavezna'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
