import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound, forbidden } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { CreateOrderInput } from '../schemas/order.schema.js';
import { sendNewRequestNotification } from '../services/emailService.js';

export async function createOrder(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { celebritySlug, videoTypeId, recipientName, buyerName, buyerEmail, instructions } =
    req.body as CreateOrderInput;

  const { data: celebrity } = await supabaseAdmin
    .from('celebrities')
    .select('id, name, profile_id, price, response_time, accepting_requests')
    .eq('slug', celebritySlug)
    .single();

  if (!celebrity) {
    notFound(res, 'Zvezda');
    return;
  }

  if (!celebrity.accepting_requests) {
    error(res, 'Ova zvezda trenutno ne prima zahteve', 'NOT_ACCEPTING');
    return;
  }

  const { data: videoType } = await supabaseAdmin
    .from('video_types')
    .select('id, title')
    .eq('id', videoTypeId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!videoType) {
    error(res, 'Nevažeći tip videa za ovu zvezdu', 'INVALID_VIDEO_TYPE');
    return;
  }

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + celebrity.response_time);

  const { data: order, error: dbError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: user.id,
      celebrity_id: celebrity.id,
      video_type_id: videoTypeId,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      recipient_name: recipientName,
      instructions,
      price: celebrity.price,
      deadline: deadline.toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    error(res, 'Greška pri kreiranju porudžbine', 'DB_ERROR', 500);
    return;
  }

  // Fire-and-forget: notify star about new order
  const { data: starProfile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', celebrity.profile_id)
    .single();

  if (starProfile?.email) {
    sendNewRequestNotification(starProfile.email, {
      starName: celebrity.name,
      buyerName,
      videoType: videoType.title,
      recipientName,
      instructions: instructions || '',
      price: celebrity.price,
      deadline: new Date(order.deadline).toLocaleDateString('sr-RS', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  success(res, {
    id: order.id,
    price: order.price,
    status: order.status,
    deadline: order.deadline,
    createdAt: order.created_at,
  }, undefined, 201);
}

export async function listOrders(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;

  const { data, error: dbError } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      celebrities!inner(name, slug, image),
      video_types!inner(title, occasion)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (dbError) {
    error(res, 'Greška pri učitavanju porudžbina', 'DB_ERROR', 500);
    return;
  }

  const orders = (data || []).map((o) => ({
    id: o.id,
    celebrityName: (o.celebrities as Record<string, unknown>).name,
    celebritySlug: (o.celebrities as Record<string, unknown>).slug,
    celebrityImage: (o.celebrities as Record<string, unknown>).image,
    videoType: (o.video_types as Record<string, unknown>).title,
    occasion: (o.video_types as Record<string, unknown>).occasion,
    instructions: o.instructions,
    recipientName: o.recipient_name,
    price: o.price,
    status: o.status,
    createdAt: o.created_at,
    deadline: o.deadline,
    videoUrl: o.video_url,
  }));

  success(res, orders);
}

export async function getOrderById(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      celebrities!inner(name, slug, image),
      video_types!inner(title, occasion)
    `)
    .eq('id', id)
    .single();

  if (!order) {
    notFound(res, 'Porudžbina');
    return;
  }

  if (order.buyer_id !== user.id) {
    forbidden(res);
    return;
  }

  success(res, {
    id: order.id,
    celebrityName: (order.celebrities as Record<string, unknown>).name,
    celebritySlug: (order.celebrities as Record<string, unknown>).slug,
    celebrityImage: (order.celebrities as Record<string, unknown>).image,
    videoType: (order.video_types as Record<string, unknown>).title,
    occasion: (order.video_types as Record<string, unknown>).occasion,
    instructions: order.instructions,
    recipientName: order.recipient_name,
    price: order.price,
    status: order.status,
    createdAt: order.created_at,
    deadline: order.deadline,
    videoUrl: order.video_url,
  });
}

export async function getVideoSignedUrl(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('buyer_id, status, video_url')
    .eq('id', id)
    .single();

  if (!order) {
    notFound(res, 'Porudžbina');
    return;
  }

  if (order.buyer_id !== user.id) {
    forbidden(res);
    return;
  }

  if (order.status !== 'completed' || !order.video_url) {
    error(res, 'Video još nije dostupan', 'VIDEO_NOT_READY');
    return;
  }

  const { data: signedUrlData, error: storageError } = await supabaseAdmin.storage
    .from('videos')
    .createSignedUrl(order.video_url, 3600); // 1 hour expiry

  if (storageError || !signedUrlData) {
    error(res, 'Greška pri generisanju linka za video', 'STORAGE_ERROR', 500);
    return;
  }

  success(res, { signedUrl: signedUrlData.signedUrl });
}
