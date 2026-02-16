import { z } from 'zod';

export const submitReviewSchema = z.object({
  orderId: z.string().uuid('Nevažeći order ID'),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1, 'Tekst recenzije je obavezan'),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
