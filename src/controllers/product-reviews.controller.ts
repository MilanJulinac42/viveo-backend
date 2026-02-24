import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error } from '../utils/apiResponse.js';

/**
 * Get reviews for a specific merch product.
 * Finds reviews via merch_orders that reference the product.
 * GET /api/reviews/product/:productId
 */
export async function getProductReviews(req: Request, res: Response) {
  const { productId } = req.params;

  // Find merch orders for this product, then join reviews
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('merch_orders')
    .select('id')
    .eq('product_id', productId);

  if (ordersError) {
    error(res, 'Greška pri učitavanju recenzija', 'DB_ERROR', 500);
    return;
  }

  const orderIds = (orders || []).map((o) => o.id);

  if (orderIds.length === 0) {
    success(res, []);
    return;
  }

  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, text, created_at, profiles!author_id(full_name, avatar_url)')
    .in('merch_order_id', orderIds)
    .eq('review_type', 'merch')
    .order('created_at', { ascending: false });

  if (reviewsError) {
    error(res, 'Greška pri učitavanju recenzija', 'DB_ERROR', 500);
    return;
  }

  const mapped = (reviews || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    authorName: (r.profiles as unknown as Record<string, unknown>)?.full_name || 'Anonimno',
    authorAvatar: (r.profiles as unknown as Record<string, unknown>)?.avatar_url || '',
    createdAt: r.created_at,
  }));

  success(res, mapped);
}

/**
 * Get reviews for a specific digital product.
 * Finds reviews via digital_orders that reference the product.
 * GET /api/reviews/digital-product/:productId
 */
export async function getDigitalProductReviews(req: Request, res: Response) {
  const { productId } = req.params;

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('digital_orders')
    .select('id')
    .eq('digital_product_id', productId);

  if (ordersError) {
    error(res, 'Greška pri učitavanju recenzija', 'DB_ERROR', 500);
    return;
  }

  const orderIds = (orders || []).map((o) => o.id);

  if (orderIds.length === 0) {
    success(res, []);
    return;
  }

  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, text, created_at, profiles!author_id(full_name, avatar_url)')
    .in('digital_order_id', orderIds)
    .eq('review_type', 'digital')
    .order('created_at', { ascending: false });

  if (reviewsError) {
    error(res, 'Greška pri učitavanju recenzija', 'DB_ERROR', 500);
    return;
  }

  const mapped = (reviews || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    authorName: (r.profiles as unknown as Record<string, unknown>)?.full_name || 'Anonimno',
    authorAvatar: (r.profiles as unknown as Record<string, unknown>)?.avatar_url || '',
    createdAt: r.created_at,
  }));

  success(res, mapped);
}
