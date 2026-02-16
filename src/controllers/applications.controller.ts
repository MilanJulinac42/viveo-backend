import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error } from '../utils/apiResponse.js';
import type { SubmitApplicationInput } from '../schemas/application.schema.js';
import type { AuthenticatedRequest } from '../types/index.js';

export async function submitApplication(req: Request, res: Response) {
  const input = req.body as SubmitApplicationInput;

  const user = (req as AuthenticatedRequest).user;
  const submittedBy = user?.id || null;

  const { data, error: dbError } = await supabaseAdmin
    .from('applications')
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      category: input.category,
      social_media: input.socialMedia,
      followers: input.followers,
      bio: input.bio,
      motivation: input.motivation,
      submitted_by: submittedBy,
    })
    .select('id')
    .single();

  if (dbError) {
    error(res, 'Greška pri slanju prijave', 'DB_ERROR', 500);
    return;
  }

  success(res, {
    id: data.id,
    message: 'Prijava je uspešno poslata. Bićete kontaktirani uskoro.',
  }, undefined, 201);
}
