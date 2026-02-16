import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(3, 'Ime mora imati najmanje 3 karaktera'),
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
  accountType: z.enum(['fan', 'star']),
});

export const loginSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(1, 'Lozinka je obavezna'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
