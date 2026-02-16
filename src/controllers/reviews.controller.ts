import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { SubmitReviewInput } from '../schemas/review.schema.js';

export async function submitReview(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { orderId, rating, text } = req.body as SubmitReviewInput;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_id, celebrity_id, status')
    .eq('id', orderId)
    .single();

  if (!order) {
    notFound(res, 'Porudžbina');
    return;
  }

  if (order.buyer_id !== user.id) {
    error(res, 'Možete ostaviti recenziju samo za svoje porudžbine', 'FORBIDDEN', 403);
    return;
  }

  if (order.status !== 'completed') {
    error(res, 'Recenziju možete ostaviti samo za završene porudžbine', 'ORDER_NOT_COMPLETED');
    return;
  }

  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (existingReview) {
    error(res, 'Već ste ostavili recenziju za ovu porudžbinu', 'REVIEW_EXISTS');
    return;
  }

  const { data: review, error: dbError } = await supabaseAdmin
    .from('reviews')
    .insert({
      order_id: orderId,
      author_id: user.id,
      celebrity_id: order.celebrity_id,
      rating,
      text,
    })
    .select()
    .single();

  if (dbError) {
    error(res, 'Greška pri kreiranju recenzije', 'DB_ERROR', 500);
    return;
  }

  success(res, {
    id: review.id,
    rating: review.rating,
    text: review.text,
    createdAt: review.created_at,
  }, undefined, 201);
}
