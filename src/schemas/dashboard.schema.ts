import { z } from 'zod';

export const updateRequestStatusSchema = z.object({
  status: z.enum(['approved', 'completed', 'rejected']),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  extendedBio: z.string().optional(),
  price: z.number().int().min(500).optional(),
  responseTime: z.number().int().min(1).optional(),
  tags: z.array(z.string()).optional(),
  acceptingRequests: z.boolean().optional(),
});

export const updateAvailabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    available: z.boolean(),
    maxRequests: z.number().int().min(0).max(20),
  })
);

export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
