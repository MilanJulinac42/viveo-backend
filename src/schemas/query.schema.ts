import { z } from 'zod';

export const celebrityQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['popularity', 'price-asc', 'price-desc', 'rating']).optional().default('popularity'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(12),
});

export const reviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(10),
});

export type CelebrityQuery = z.infer<typeof celebrityQuerySchema>;
export type ReviewsQuery = z.infer<typeof reviewsQuerySchema>;
