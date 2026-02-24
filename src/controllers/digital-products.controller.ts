import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound } from '../utils/apiResponse.js';

function previewUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/digital-product-previews/${path}`;
}

/* ── List all active digital products (public) ── */
export async function listDigitalProducts(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const celebrity = (req.query.celebrity as string) || '';

  let query = supabaseAdmin
    .from('digital_products')
    .select(
      `id, name, slug, description, price, featured, file_type, file_size,
       download_count, preview_image_path, created_at,
       celebrity_id,
       celebrities!inner(name, slug, image),
       digital_product_categories(name, slug)`,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .neq('file_path', '');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  if (category) {
    query = query.eq('digital_product_categories.slug', category);
  }
  if (celebrity) {
    query = query.eq('celebrities.slug', celebrity);
  }

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  const products = (data || []).map((p: Record<string, unknown>) => {
    const celeb = p.celebrities as Record<string, unknown>;
    const cat = p.digital_product_categories as Record<string, unknown> | null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      featured: p.featured,
      fileType: p.file_type,
      fileSize: p.file_size,
      downloadCount: p.download_count,
      previewImageUrl: p.preview_image_path ? previewUrl(p.preview_image_path as string) : null,
      celebrityName: celeb?.name || '',
      celebritySlug: celeb?.slug || '',
      celebrityImage: celeb?.image || '',
      categoryName: cat?.name || null,
      categorySlug: cat?.slug || null,
      createdAt: p.created_at,
    };
  });

  success(res, products, {
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

/* ── Get single digital product by slug (public) ── */
export async function getDigitalProductBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const { data: p, error: dbError } = await supabaseAdmin
    .from('digital_products')
    .select(
      `*,
       celebrities!inner(id, name, slug, image, price, rating, review_count),
       digital_product_categories(id, name, slug)`
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .neq('file_path', '')
    .single();

  if (dbError || !p) {
    return notFound(res, 'Digitalni proizvod');
  }

  const celeb = p.celebrities as Record<string, unknown>;
  const cat = p.digital_product_categories as Record<string, unknown> | null;

  success(res, {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    featured: p.featured,
    fileType: p.file_type,
    fileSize: p.file_size,
    downloadCount: p.download_count,
    previewImageUrl: p.preview_image_path ? previewUrl(p.preview_image_path as string) : null,
    celebrityId: celeb?.id || '',
    celebrityName: celeb?.name || '',
    celebritySlug: celeb?.slug || '',
    celebrityImage: celeb?.image || '',
    categoryId: cat?.id || null,
    categoryName: cat?.name || null,
    categorySlug: cat?.slug || null,
    createdAt: p.created_at,
  });
}

/* ── List digital product categories (public) ── */
export async function listDigitalProductCategories(_req: Request, res: Response) {
  const { data, error: dbError } = await supabaseAdmin
    .from('digital_product_categories')
    .select('*')
    .order('name');

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  const categories = (data || []).map((c: Record<string, unknown>) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    createdAt: c.created_at,
  }));

  success(res, categories);
}
