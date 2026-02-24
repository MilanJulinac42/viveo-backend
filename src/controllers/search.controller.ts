import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error } from '../utils/apiResponse.js';

/**
 * Global search across celebrities, merch products, and digital products.
 * GET /api/search?q=term
 */
export async function globalSearch(req: Request, res: Response) {
  const q = (req.query.q as string || '').trim();

  if (!q || q.length < 2) {
    success(res, { celebrities: [], products: [], digitalProducts: [] });
    return;
  }

  const searchTerm = `%${q}%`;

  try {
    // Run all three queries in parallel
    const [celebritiesResult, productsResult, digitalResult] = await Promise.all([
      // Search celebrities by name or bio
      supabaseAdmin
        .from('celebrities')
        .select('id, name, slug, image, category:categories!inner(name), rating, verified, price')
        .or(`name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .eq('is_active', true)
        .limit(5),

      // Search merch products by name
      supabaseAdmin
        .from('products')
        .select('id, name, slug, price, celebrities!inner(name, slug), product_images(image_url)')
        .ilike('name', searchTerm)
        .eq('is_active', true)
        .limit(5),

      // Search digital products by name
      supabaseAdmin
        .from('digital_products')
        .select('id, name, slug, price, file_type, preview_image_path, celebrities!inner(name, slug)')
        .ilike('name', searchTerm)
        .eq('is_active', true)
        .limit(5),
    ]);

    // Map celebrities
    const celebrities = (celebritiesResult.data || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image || '',
      category: (c.category as unknown as Record<string, unknown>)?.name || '',
      rating: c.rating,
      verified: c.verified,
      price: c.price,
    }));

    // Map merch products
    const products = (productsResult.data || []).map((p) => {
      const celeb = p.celebrities as unknown as Record<string, unknown>;
      const images = p.product_images as unknown as Array<Record<string, unknown>>;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        celebrityName: celeb?.name || '',
        celebritySlug: celeb?.slug || '',
        imageUrl: images?.[0]?.image_url || null,
      };
    });

    // Map digital products
    const digitalProducts = (digitalResult.data || []).map((d) => {
      const celeb = d.celebrities as unknown as Record<string, unknown>;
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        price: d.price,
        fileType: d.file_type,
        previewImageUrl: d.preview_image_path || null,
        celebrityName: celeb?.name || '',
        celebritySlug: celeb?.slug || '',
      };
    });

    success(res, { celebrities, products, digitalProducts });
  } catch (err) {
    error(res, 'Greška pri pretrazi', 'SEARCH_ERROR', 500);
  }
}
