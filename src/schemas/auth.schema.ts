import { z } from 'zod';

/**
 * Password must be at least 8 characters and contain:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
const passwordSchema = z
  .string()
  .min(8, 'Lozinka mora imati najmanje 8 karaktera')
  .regex(/[A-Z]/, 'Lozinka mora sadržati bar jedno veliko slovo')
  .regex(/[a-z]/, 'Lozinka mora sadržati bar jedno malo slovo')
  .regex(/[0-9]/, 'Lozinka mora sadržati bar jednu cifru');

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Ime mora imati najmanje 3 karaktera')
    .max(100, 'Ime može imati najviše 100 karaktera'),
  email: z.string().email('Nevažeća email adresa').max(255),
  password: passwordSchema,
  accountType: z.enum(['fan', 'star']),
});

export const loginSchema = z.object({
  email: z.string().email('Nevažeća email adresa'),
  password: z.string().min(1, 'Lozinka je obavezna'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
