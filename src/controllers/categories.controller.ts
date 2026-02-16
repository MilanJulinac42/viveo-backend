import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error } from '../utils/apiResponse.js';

export async function listCategories(_req: Request, res: Response) {
  const { data, error: dbError } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name');

  if (dbError) {
    error(res, 'Greška pri učitavanju kategorija', 'DB_ERROR', 500);
    return;
  }

  const categories = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    celebrityCount: c.celebrity_count,
  }));

  success(res, categories);
}
