import { z } from 'zod';

export const addFavoriteSchema = z.object({
  itemType: z.enum(['celebrity', 'product', 'digital_product'], {
    required_error: 'Tip stavke je obavezan',
    invalid_type_error: 'Nevažeći tip stavke',
  }),
  itemId: z.string().uuid('Nevažeći ID stavke'),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;

export const removeFavoriteSchema = z.object({
  itemType: z.enum(['celebrity', 'product', 'digital_product']),
  itemId: z.string().uuid('Nevažeći ID stavke'),
});

export type RemoveFavoriteInput = z.infer<typeof removeFavoriteSchema>;
