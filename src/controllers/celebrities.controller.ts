import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import type { CelebrityQuery } from '../schemas/query.schema.js';

function mapCelebrity(c: Record<string, unknown>) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    category: (c.categories as Record<string, unknown>)?.slug || c.category_id,
    price: c.price,
    rating: Number(c.rating),
    reviewCount: c.review_count,
    verified: c.verified,
    bio: c.bio,
    responseTime: c.response_time,
    extendedBio: c.extended_bio,
    tags: c.tags,
    videoTypes: Array.isArray(c.video_types)
      ? (c.video_types as Record<string, unknown>[]).map((vt) => ({
          id: vt.id,
          title: vt.title,
          occasion: vt.occasion,
          emoji: vt.emoji,
          accentFrom: vt.accent_from,
          accentTo: vt.accent_to,
          message: vt.message,
        }))
      : [],
  };
}

export async function listCelebrities(req: Request, res: Response) {
  try {
    const { search, category, sort, page, pageSize } = ((req as unknown as Record<string, unknown>).validatedQuery || req.query) as unknown as CelebrityQuery;
    const { offset, limit, page: safePage, pageSize: safePageSize } = parsePagination(page, pageSize);

    let query = supabaseAdmin
      .from('celebrities')
      .select('*, categories(slug, name), video_types(*)', { count: 'exact' })
      .eq('accepting_requests', true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('categories.slug', category);
    }

    switch (sort) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'popularity':
      default:
        query = query.order('review_count', { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error: dbError } = await query;

    if (dbError) {
      console.error('Celebrities DB error:', dbError);
      error(res, 'Greška pri učitavanju zvezda', 'DB_ERROR', 500);
      return;
    }

    const celebrities = (data || []).map(mapCelebrity);
    const meta = buildPaginationMeta(count || 0, safePage, safePageSize);

    success(res, celebrities, meta);
  } catch (err) {
    console.error('Celebrities error:', err);
    error(res, 'Greška pri učitavanju zvezda', 'SERVER_ERROR', 500);
  }
}

export async function getCelebrityBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const { data, error: dbError } = await supabaseAdmin
    .from('celebrities')
    .select('*, categories!inner(slug, name), video_types(*)')
    .eq('slug', slug)
    .single();

  if (dbError || !data) {
    notFound(res, 'Zvezda');
    return;
  }

  success(res, mapCelebrity(data));
}

export async function getCelebrityReviews(req: Request, res: Response) {
  const { slug } = req.params;

  const { data: celebrity } = await supabaseAdmin
    .from('celebrities')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!celebrity) {
    notFound(res, 'Zvezda');
    return;
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('reviews')
    .select('*, profiles!author_id(full_name, avatar_url)')
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false });

  if (dbError) {
    error(res, 'Greška pri učitavanju recenzija', 'DB_ERROR', 500);
    return;
  }

  const reviews = (data || []).map((r) => ({
    id: r.id,
    author: (r.profiles as Record<string, unknown>)?.full_name || 'Anonimni korisnik',
    avatar: (r.profiles as Record<string, unknown>)?.avatar_url || '',
    rating: r.rating,
    text: r.text,
    celebrityName: '',
    date: r.created_at,
  }));

  success(res, reviews);
}
