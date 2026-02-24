import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound } from '../utils/apiResponse.js';

function imageUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

/* ── List all active products (public) ── */
export async function listProducts(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 12, 50);
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const celebrity = (req.query.celebrity as string) || '';

  let query = supabaseAdmin
    .from('products')
    .select(
      `id, name, slug, description, price, featured, created_at,
       celebrity_id,
       celebrities!inner(name, slug, image),
       product_categories(name, slug),
       product_images(id, image_path, sort_order),
       product_variants(id, name, price_override, stock, sort_order)`,
      { count: 'exact' }
    )
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  if (category) {
    query = query.eq('product_categories.slug', category);
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
    const cat = p.product_categories as Record<string, unknown> | null;
    const images = (p.product_images as Record<string, unknown>[]) || [];
    const variants = (p.product_variants as Record<string, unknown>[]) || [];

    const sortedImages = [...images].sort(
      (a, b) => (a.sort_order as number) - (b.sort_order as number)
    );

    const totalStock = variants.reduce((sum, v) => sum + (v.stock as number), 0);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      featured: p.featured,
      celebrityName: celeb?.name || '',
      celebritySlug: celeb?.slug || '',
      celebrityImage: celeb?.image || '',
      categoryName: cat?.name || '',
      categorySlug: cat?.slug || '',
      mainImage: sortedImages.length > 0 ? imageUrl(sortedImages[0].image_path as string) : null,
      variantCount: variants.length,
      totalStock,
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

/* ── Get single product by slug (public) ── */
export async function getProductBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const { data: p, error: dbError } = await supabaseAdmin
    .from('products')
    .select(
      `*,
       celebrities!inner(id, name, slug, image, price, rating, review_count),
       product_categories(id, name, slug),
       product_images(id, image_path, sort_order),
       product_variants(id, name, sku, price_override, stock, sort_order)`
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (dbError || !p) {
    return notFound(res, 'Proizvod');
  }

  const celeb = p.celebrities as Record<string, unknown>;
  const cat = p.product_categories as Record<string, unknown> | null;
  const images = ((p.product_images as Record<string, unknown>[]) || [])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((img) => ({
      id: img.id,
      imageUrl: imageUrl(img.image_path as string),
      sortOrder: img.sort_order,
    }));

  const variants = ((p.product_variants as Record<string, unknown>[]) || [])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      priceOverride: v.price_override,
      stock: v.stock,
      sortOrder: v.sort_order,
    }));

  success(res, {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    featured: p.featured,
    celebrityId: celeb?.id || '',
    celebrityName: celeb?.name || '',
    celebritySlug: celeb?.slug || '',
    celebrityImage: celeb?.image || '',
    categoryId: cat?.id || null,
    categoryName: cat?.name || '',
    categorySlug: cat?.slug || '',
    images,
    variants,
    createdAt: p.created_at,
  });
}

/* ── List products for a specific celebrity (public) ── */
export async function getCelebrityProducts(req: Request, res: Response) {
  const { slug } = req.params;

  const { data: celeb } = await supabaseAdmin
    .from('celebrities')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!celeb) {
    return notFound(res, 'Zvezda');
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('products')
    .select(
      `id, name, slug, description, price, featured, created_at,
       product_categories(name, slug),
       product_images(id, image_path, sort_order),
       product_variants(id, name, price_override, stock, sort_order)`
    )
    .eq('celebrity_id', celeb.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  const products = (data || []).map((p: Record<string, unknown>) => {
    const cat = p.product_categories as Record<string, unknown> | null;
    const images = (p.product_images as Record<string, unknown>[]) || [];
    const variants = (p.product_variants as Record<string, unknown>[]) || [];
    const sortedImages = [...images].sort(
      (a, b) => (a.sort_order as number) - (b.sort_order as number)
    );
    const totalStock = variants.reduce((sum, v) => sum + (v.stock as number), 0);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      featured: p.featured,
      categoryName: cat?.name || '',
      categorySlug: cat?.slug || '',
      mainImage: sortedImages.length > 0 ? imageUrl(sortedImages[0].image_path as string) : null,
      variantCount: variants.length,
      totalStock,
      createdAt: p.created_at,
    };
  });

  success(res, products);
}

/* ── List product categories (public) ── */
export async function listProductCategories(_req: Request, res: Response) {
  const { data, error: dbError } = await supabaseAdmin
    .from('product_categories')
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
