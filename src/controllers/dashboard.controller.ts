import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { UpdateRequestStatusInput, UpdateProfileInput, UpdateAvailabilityInput } from '../schemas/dashboard.schema.js';

async function getCelebrityForUser(userId: string) {
  const { data } = await supabaseAdmin
    .from('celebrities')
    .select('id')
    .eq('profile_id', userId)
    .single();
  return data;
}

export async function getRequests(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);

  if (!celebrity) {
    notFound(res, 'Profil zvezde');
    return;
  }

  const statusFilter = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('orders')
    .select('*, profiles!buyer_id(full_name, avatar_url), video_types!inner(title, occasion)')
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    error(res, 'Greška pri učitavanju zahteva', 'DB_ERROR', 500);
    return;
  }

  const requests = (data || []).map((o) => ({
    id: o.id,
    buyerName: (o.profiles as Record<string, unknown>)?.full_name || o.buyer_name,
    buyerAvatar: (o.profiles as Record<string, unknown>)?.avatar_url || '',
    videoType: (o.video_types as Record<string, unknown>).title,
    occasion: (o.video_types as Record<string, unknown>).occasion,
    instructions: o.instructions,
    recipientName: o.recipient_name,
    price: o.price,
    status: o.status,
    createdAt: o.created_at,
    deadline: o.deadline,
  }));

  success(res, requests);
}

export async function updateRequestStatus(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.params;
  const { status: newStatus } = req.body as UpdateRequestStatusInput;

  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) {
    notFound(res, 'Profil zvezde');
    return;
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('status, celebrity_id')
    .eq('id', id)
    .single();

  if (!order || order.celebrity_id !== celebrity.id) {
    notFound(res, 'Zahtev');
    return;
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['approved', 'rejected'],
    approved: ['completed'],
  };

  if (!validTransitions[order.status]?.includes(newStatus)) {
    error(res, `Nije moguć prelaz iz "${order.status}" u "${newStatus}"`, 'INVALID_TRANSITION');
    return;
  }

  const { error: dbError } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id);

  if (dbError) {
    error(res, 'Greška pri ažuriranju statusa', 'DB_ERROR', 500);
    return;
  }

  success(res, { id, status: newStatus });
}

export async function getEarnings(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);

  if (!celebrity) {
    notFound(res, 'Profil zvezde');
    return;
  }

  const { data: completedOrders } = await supabaseAdmin
    .from('orders')
    .select('price, created_at, video_types!inner(title)')
    .eq('celebrity_id', celebrity.id)
    .eq('status', 'completed');

  const { data: pendingOrders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('celebrity_id', celebrity.id)
    .eq('status', 'pending');

  const { data: celeb } = await supabaseAdmin
    .from('celebrities')
    .select('rating')
    .eq('id', celebrity.id)
    .single();

  const orders = completedOrders || [];
  const totalEarnings = orders.reduce((sum, o) => sum + o.price, 0);

  const dayNames = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
  const weeklyMap = new Map<string, number>();
  dayNames.forEach((d) => weeklyMap.set(d, 0));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, number>();

  const typeMap = new Map<string, { amount: number; count: number }>();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  for (const o of orders) {
    const date = new Date(o.created_at);

    if (date >= weekAgo) {
      const day = dayNames[date.getDay()];
      weeklyMap.set(day, (weeklyMap.get(day) || 0) + o.price);
    }

    if (date >= sixMonthsAgo) {
      const month = monthNames[date.getMonth()];
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + o.price);
    }

    const typeName = (o.video_types as unknown as Record<string, unknown>).title as string;
    const existing = typeMap.get(typeName) || { amount: 0, count: 0 };
    typeMap.set(typeName, { amount: existing.amount + o.price, count: existing.count + 1 });
  }

  success(res, {
    totalEarnings,
    completedRequests: orders.length,
    pendingRequests: pendingOrders?.length || 0,
    averageRating: Number(celeb?.rating) || 0,
    weeklyEarnings: dayNames.map((day) => ({ day, amount: weeklyMap.get(day) || 0 })),
    monthlyEarnings: [...monthlyMap.entries()].map(([month, amount]) => ({ month, amount })),
    earningsByType: [...typeMap.entries()].map(([type, data]) => ({ type, ...data })),
  });
}

export async function getAvailability(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);

  if (!celebrity) {
    notFound(res, 'Profil zvezde');
    return;
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('availability_slots')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('day_of_week');

  if (dbError) {
    error(res, 'Greška pri učitavanju dostupnosti', 'DB_ERROR', 500);
    return;
  }

  const slots = (data || []).map((s) => ({
    id: s.id,
    dayOfWeek: s.day_of_week,
    available: s.available,
    maxRequests: s.max_requests,
  }));

  success(res, slots);
}

export async function updateAvailability(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);

  if (!celebrity) {
    notFound(res, 'Profil zvezde');
    return;
  }

  const slots = req.body as UpdateAvailabilityInput;

  for (const slot of slots) {
    await supabaseAdmin
      .from('availability_slots')
      .upsert(
        {
          celebrity_id: celebrity.id,
          day_of_week: slot.dayOfWeek,
          available: slot.available,
          max_requests: slot.maxRequests,
        },
        { onConflict: 'celebrity_id,day_of_week' }
      );
  }

  success(res, { message: 'Dostupnost ažurirana' });
}

export async function updateProfile(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);

  if (!celebrity) {
    notFound(res, 'Profil zvezde');
    return;
  }

  const input = req.body as UpdateProfileInput;

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.bio !== undefined) updateData.bio = input.bio;
  if (input.extendedBio !== undefined) updateData.extended_bio = input.extendedBio;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.responseTime !== undefined) updateData.response_time = input.responseTime;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.acceptingRequests !== undefined) updateData.accepting_requests = input.acceptingRequests;

  const { error: dbError } = await supabaseAdmin
    .from('celebrities')
    .update(updateData)
    .eq('id', celebrity.id);

  if (dbError) {
    error(res, 'Greška pri ažuriranju profila', 'DB_ERROR', 500);
    return;
  }

  success(res, { message: 'Profil ažuriran' });
}
