import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { AddFavoriteInput, RemoveFavoriteInput } from '../schemas/favorite.schema.js';

/**
 * Add item to favorites.
 * POST /api/favorites
 */
export async function addFavorite(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { itemType, itemId } = req.body as AddFavoriteInput;

  const { error: dbError } = await supabaseAdmin
    .from('favorites')
    .upsert(
      {
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
      },
      { onConflict: 'user_id,item_type,item_id' }
    );

  if (dbError) {
    error(res, 'Greška pri dodavanju u omiljene', 'DB_ERROR', 500);
    return;
  }

  success(res, { message: 'Dodato u omiljene' }, undefined, 201);
}

/**
 * Remove item from favorites.
 * DELETE /api/favorites
 */
export async function removeFavorite(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { itemType, itemId } = req.body as RemoveFavoriteInput;

  const { error: dbError } = await supabaseAdmin
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (dbError) {
    error(res, 'Greška pri uklanjanju iz omiljenih', 'DB_ERROR', 500);
    return;
  }

  success(res, { message: 'Uklonjeno iz omiljenih' });
}

/**
 * List all favorites for the authenticated user.
 * GET /api/favorites?type=celebrity|product|digital_product
 */
export async function listFavorites(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const typeFilter = req.query.type as string | undefined;

  let query = supabaseAdmin
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (typeFilter) {
    query = query.eq('item_type', typeFilter);
  }

  const { data: favorites, error: dbError } = await query;

  if (dbError) {
    error(res, 'Greška pri učitavanju omiljenih', 'DB_ERROR', 500);
    return;
  }

  if (!favorites || favorites.length === 0) {
    success(res, { celebrities: [], products: [], digitalProducts: [] });
    return;
  }

  // Group IDs by type
  const celebrityIds = favorites.filter((f) => f.item_type === 'celebrity').map((f) => f.item_id);
  const productIds = favorites.filter((f) => f.item_type === 'product').map((f) => f.item_id);
  const digitalIds = favorites.filter((f) => f.item_type === 'digital_product').map((f) => f.item_id);

  // Fetch details in parallel
  const [celebritiesResult, productsResult, digitalResult] = await Promise.all([
    celebrityIds.length > 0
      ? supabaseAdmin
          .from('celebrities')
          .select('id, name, slug, image, category:categories!inner(name), rating, verified, price')
          .in('id', celebrityIds)
      : Promise.resolve({ data: [] }),
    productIds.length > 0
      ? supabaseAdmin
          .from('products')
          .select('id, name, slug, price, is_active, celebrities!inner(name, slug), product_images(image_url)')
          .in('id', productIds)
      : Promise.resolve({ data: [] }),
    digitalIds.length > 0
      ? supabaseAdmin
          .from('digital_products')
          .select('id, name, slug, price, file_type, preview_image_path, is_active, celebrities!inner(name, slug)')
          .in('id', digitalIds)
      : Promise.resolve({ data: [] }),
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

  // Map products
  const products = (productsResult.data || []).map((p) => {
    const celeb = p.celebrities as unknown as Record<string, unknown>;
    const images = p.product_images as unknown as Array<Record<string, unknown>>;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      isActive: p.is_active,
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
      isActive: d.is_active,
      celebrityName: celeb?.name || '',
      celebritySlug: celeb?.slug || '',
    };
  });

  success(res, { celebrities, products, digitalProducts });
}

/**
 * Check if a single item is favorited.
 * GET /api/favorites/check?itemType=celebrity&itemId=...
 */
export async function checkFavorite(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const itemType = req.query.itemType as string;
  const itemId = req.query.itemId as string;

  if (!itemType || !itemId) {
    error(res, 'itemType i itemId su obavezni', 'VALIDATION_ERROR');
    return;
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (dbError) {
    error(res, 'Greška', 'DB_ERROR', 500);
    return;
  }

  success(res, { isFavorite: !!data });
}
