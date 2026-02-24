import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { SubmitReviewInput } from '../schemas/review.schema.js';
import { sendNewReviewNotification } from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * Submit a review for a video order, merch order, or digital order.
 * POST /api/reviews
 */
export async function submitReview(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { orderId, rating, text, reviewType } = req.body as SubmitReviewInput;

  if (reviewType === 'merch') {
    return handleMerchReview(res, user, orderId, rating, text);
  } else if (reviewType === 'digital') {
    return handleDigitalReview(res, user, orderId, rating, text);
  }

  // Default: video review (existing logic)
  return handleVideoReview(res, user, orderId, rating, text);
}

/** Handle video order review (existing logic) */
async function handleVideoReview(
  res: Response, user: { id: string }, orderId: string, rating: number, text: string
) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_id, celebrity_id, status')
    .eq('id', orderId)
    .single();

  if (!order) { notFound(res, 'Porudžbina'); return; }
  if (order.buyer_id !== user.id) {
    error(res, 'Možete ostaviti recenziju samo za svoje porudžbine', 'FORBIDDEN', 403); return;
  }
  if (order.status !== 'completed') {
    error(res, 'Recenziju možete ostaviti samo za završene porudžbine', 'ORDER_NOT_COMPLETED'); return;
  }

  const { data: existing } = await supabaseAdmin
    .from('reviews').select('id').eq('order_id', orderId).single();

  if (existing) {
    error(res, 'Već ste ostavili recenziju za ovu porudžbinu', 'REVIEW_EXISTS'); return;
  }

  const { data: review, error: dbError } = await supabaseAdmin
    .from('reviews')
    .insert({
      order_id: orderId,
      author_id: user.id,
      celebrity_id: order.celebrity_id,
      rating,
      text,
      review_type: 'video',
    })
    .select()
    .single();

  if (dbError) { error(res, 'Greška pri kreiranju recenzije', 'DB_ERROR', 500); return; }

  notifyStar(order.celebrity_id, rating, text, 'video');

  success(res, {
    id: review.id, rating: review.rating, text: review.text, createdAt: review.created_at,
  }, undefined, 201);
}

/** Handle merch order review */
async function handleMerchReview(
  res: Response, user: { id: string }, orderId: string, rating: number, text: string
) {
  const { data: order } = await supabaseAdmin
    .from('merch_orders')
    .select('id, buyer_id, celebrity_id, status')
    .eq('id', orderId)
    .single();

  if (!order) { notFound(res, 'Merch porudžbina'); return; }
  if (order.buyer_id !== user.id) {
    error(res, 'Možete ostaviti recenziju samo za svoje porudžbine', 'FORBIDDEN', 403); return;
  }
  if (order.status !== 'delivered') {
    error(res, 'Recenziju možete ostaviti samo za isporučene porudžbine', 'ORDER_NOT_DELIVERED'); return;
  }

  const { data: existing } = await supabaseAdmin
    .from('reviews').select('id').eq('merch_order_id', orderId).single();

  if (existing) {
    error(res, 'Već ste ostavili recenziju za ovu porudžbinu', 'REVIEW_EXISTS'); return;
  }

  const { data: review, error: dbError } = await supabaseAdmin
    .from('reviews')
    .insert({
      author_id: user.id,
      celebrity_id: order.celebrity_id,
      rating,
      text,
      review_type: 'merch',
      merch_order_id: orderId,
    })
    .select()
    .single();

  if (dbError) { error(res, 'Greška pri kreiranju recenzije', 'DB_ERROR', 500); return; }

  notifyStar(order.celebrity_id, rating, text, 'merch');

  success(res, {
    id: review.id, rating: review.rating, text: review.text, createdAt: review.created_at,
  }, undefined, 201);
}

/** Handle digital order review */
async function handleDigitalReview(
  res: Response, user: { id: string }, orderId: string, rating: number, text: string
) {
  const { data: order } = await supabaseAdmin
    .from('digital_orders')
    .select('id, buyer_id, celebrity_id, status')
    .eq('id', orderId)
    .single();

  if (!order) { notFound(res, 'Digitalna porudžbina'); return; }
  if (order.buyer_id !== user.id) {
    error(res, 'Možete ostaviti recenziju samo za svoje porudžbine', 'FORBIDDEN', 403); return;
  }
  if (order.status !== 'completed') {
    error(res, 'Recenziju možete ostaviti samo za završene porudžbine', 'ORDER_NOT_COMPLETED'); return;
  }

  const { data: existing } = await supabaseAdmin
    .from('reviews').select('id').eq('digital_order_id', orderId).single();

  if (existing) {
    error(res, 'Već ste ostavili recenziju za ovu porudžbinu', 'REVIEW_EXISTS'); return;
  }

  const { data: review, error: dbError } = await supabaseAdmin
    .from('reviews')
    .insert({
      author_id: user.id,
      celebrity_id: order.celebrity_id,
      rating,
      text,
      review_type: 'digital',
      digital_order_id: orderId,
    })
    .select()
    .single();

  if (dbError) { error(res, 'Greška pri kreiranju recenzije', 'DB_ERROR', 500); return; }

  notifyStar(order.celebrity_id, rating, text, 'digital');

  success(res, {
    id: review.id, rating: review.rating, text: review.text, createdAt: review.created_at,
  }, undefined, 201);
}

/** Fire-and-forget: notify the star about a new review */
async function notifyStar(celebrityId: string, rating: number, reviewText: string, reviewType: string) {
  try {
    const { data: celeb } = await supabaseAdmin
      .from('celebrities')
      .select('name, profile_id')
      .eq('id', celebrityId)
      .single();

    if (!celeb) return;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', celeb.profile_id)
      .single();

    if (!profile?.email) return;

    const typeLabel = reviewType === 'merch' ? 'merch proizvod' : reviewType === 'digital' ? 'digitalni proizvod' : 'video';

    sendNewReviewNotification(profile.email, {
      starName: celeb.name,
      rating,
      reviewText,
      reviewType: typeLabel,
    });
  } catch (err) {
    logger.error('Failed to send review notification', { celebrityId, error: err });
  }
}
