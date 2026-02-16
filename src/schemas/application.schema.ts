import { z } from 'zod';

export const submitApplicationSchema = z.object({
  fullName: z.string().min(1, 'Ime je obavezno'),
  email: z.string().email('Nevažeća email adresa'),
  phone: z.string().min(1, 'Telefon je obavezan'),
  category: z.string().min(1, 'Kategorija je obavezna'),
  socialMedia: z.string().min(1, 'Link ka društvenoj mreži je obavezan'),
  followers: z.string().min(1, 'Broj pratilaca je obavezan'),
  bio: z.string().min(50, 'Biografija mora imati najmanje 50 karaktera'),
  motivation: z.string().min(30, 'Motivacija mora imati najmanje 30 karaktera'),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
