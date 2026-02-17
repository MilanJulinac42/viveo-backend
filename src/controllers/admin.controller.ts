import type { Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';

/* ──────────────────── Dashboard Stats ──────────────────── */

export async function getStats(_req: AuthenticatedRequest, res: Response) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    usersResult,
    celebsResult,
    ordersResult,
    revenueResult,
    pendingAppsResult,
    recentOrdersResult,
    recentAppsResult,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('celebrities').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth),
    supabaseAdmin
      .from('orders')
      .select('price')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth),
    supabaseAdmin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabaseAdmin
      .from('orders')
      .select(`
        id, buyer_name, buyer_email, price, status, created_at,
        celebrities(name, slug),
        video_types(title)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('applications')
      .select('id, full_name, email, category, followers, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  // Daily orders for last 7 days
  const dailyOrders: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

    const { count } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', dayStart)
      .lt('created_at', dayEnd);

    dailyOrders.push({
      date: dayStart.split('T')[0],
      count: count || 0,
    });
  }

  const monthlyRevenue = (revenueResult.data || []).reduce(
    (sum: number, o: { price: number }) => sum + o.price,
    0
  );

  const recentOrders = (recentOrdersResult.data || []).map((o: Record<string, unknown>) => {
    const celeb = o.celebrities as Record<string, unknown> | null;
    const vtype = o.video_types as Record<string, unknown> | null;
    return {
      id: o.id,
      buyerName: o.buyer_name,
      buyerEmail: o.buyer_email,
      celebrityName: celeb?.name || 'N/A',
      celebritySlug: celeb?.slug || '',
      videoType: vtype?.title || 'N/A',
      price: o.price,
      status: o.status,
      createdAt: o.created_at,
    };
  });

  const recentApplications = (recentAppsResult.data || []).map(
    (a: Record<string, unknown>) => ({
      id: a.id,
      fullName: a.full_name,
      email: a.email,
      category: a.category,
      followers: a.followers,
      status: a.status,
      createdAt: a.created_at,
    })
  );

  success(res, {
    totalUsers: usersResult.count || 0,
    totalCelebrities: celebsResult.count || 0,
    totalOrders: ordersResult.count || 0,
    monthlyRevenue,
    pendingApplications: pendingAppsResult.count || 0,
    recentOrders,
    recentApplications,
    dailyOrders,
  });
}

/* ──────────────────── Users ──────────────────── */

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const role = (req.query.role as string) || '';

  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, email:id, avatar_url, role, created_at', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.ilike('full_name', `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  // Fetch emails from auth.users via admin API
  const users = await Promise.all(
    (data || []).map(async (profile: Record<string, unknown>) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id as string);
      return {
        id: profile.id,
        fullName: profile.full_name,
        email: authUser?.user?.email || '',
        role: profile.role,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
      };
    })
  );

  success(res, users, {
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function getUserById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;

  const { data: profile, error: dbError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError || !profile) {
    return notFound(res, 'Korisnik');
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

  // Count orders and total spent
  const { count: ordersCount } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', id);

  const { data: spentData } = await supabaseAdmin
    .from('orders')
    .select('price')
    .eq('buyer_id', id)
    .eq('status', 'completed');

  const totalSpent = (spentData || []).reduce(
    (sum: number, o: { price: number }) => sum + o.price,
    0
  );

  // Check if user is a celebrity
  const { data: celebrity } = await supabaseAdmin
    .from('celebrities')
    .select('id, name, slug, verified')
    .eq('profile_id', id)
    .single();

  success(res, {
    id: profile.id,
    fullName: profile.full_name,
    email: authUser?.user?.email || '',
    role: profile.role,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    ordersCount: ordersCount || 0,
    totalSpent,
    celebrity: celebrity || null,
  });
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;
  const { role } = req.body;

  if (role && !['fan', 'star', 'admin'].includes(role)) {
    return error(res, 'Nevalidna uloga', 'INVALID_ROLE', 400);
  }

  const updateData: Record<string, unknown> = {};
  if (role) updateData.role = role;

  const { data, error: dbError } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError || !data) {
    return notFound(res, 'Korisnik');
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

  success(res, {
    id: data.id,
    fullName: data.full_name,
    email: authUser?.user?.email || '',
    role: data.role,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    ordersCount: 0,
    totalSpent: 0,
    celebrity: null,
  });
}

/* ──────────────────── Celebrities ──────────────────── */

export async function getCelebrities(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';

  let query = supabaseAdmin
    .from('celebrities')
    .select(
      `id, name, slug, image, price, rating, review_count, verified, accepting_requests, created_at,
       categories(id, name)`,
      { count: 'exact' }
    );

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (category) {
    query = query.eq('category_id', category);
  }

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  // Get order counts and earnings for each celebrity
  const celebrities = await Promise.all(
    (data || []).map(async (c: Record<string, unknown>) => {
      const cat = c.categories as Record<string, unknown> | null;
      const { count: totalOrders } = await supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('celebrity_id', c.id as string);

      const { data: earningsData } = await supabaseAdmin
        .from('orders')
        .select('price')
        .eq('celebrity_id', c.id as string)
        .eq('status', 'completed');

      const totalEarnings = (earningsData || []).reduce(
        (sum: number, o: { price: number }) => sum + o.price,
        0
      );

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
        categoryName: cat?.name || 'N/A',
        categoryId: cat?.id || '',
        price: c.price,
        rating: c.rating,
        reviewCount: c.review_count,
        verified: c.verified,
        acceptingRequests: c.accepting_requests,
        totalOrders: totalOrders || 0,
        totalEarnings,
        createdAt: c.created_at,
      };
    })
  );

  success(res, celebrities, {
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function getCelebrityById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;

  const { data: c, error: dbError } = await supabaseAdmin
    .from('celebrities')
    .select(`
      *,
      categories(id, name),
      video_types(id, title, occasion, emoji, accent_from, accent_to, message)
    `)
    .eq('id', id)
    .single();

  if (dbError || !c) {
    return notFound(res, 'Zvezda');
  }

  const cat = c.categories as Record<string, unknown> | null;

  // Orders and earnings
  const { count: totalOrders } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('celebrity_id', id);

  const { data: earningsData } = await supabaseAdmin
    .from('orders')
    .select('price')
    .eq('celebrity_id', id)
    .eq('status', 'completed');

  const totalEarnings = (earningsData || []).reduce(
    (sum: number, o: { price: number }) => sum + o.price,
    0
  );

  // Recent orders
  const { data: recentOrdersData } = await supabaseAdmin
    .from('orders')
    .select(`
      id, buyer_name, buyer_email, price, status, created_at,
      video_types(title)
    `)
    .eq('celebrity_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentOrders = (recentOrdersData || []).map((o: Record<string, unknown>) => {
    const vtype = o.video_types as Record<string, unknown> | null;
    return {
      id: o.id,
      buyerName: o.buyer_name,
      buyerEmail: o.buyer_email,
      celebrityName: c.name,
      celebritySlug: c.slug,
      videoType: vtype?.title || 'N/A',
      price: o.price,
      status: o.status,
      createdAt: o.created_at,
    };
  });

  const videoTypes = ((c.video_types as Record<string, unknown>[]) || []).map(
    (vt) => ({
      id: vt.id,
      title: vt.title,
      occasion: vt.occasion,
      emoji: vt.emoji,
      accentFrom: vt.accent_from,
      accentTo: vt.accent_to,
      message: vt.message,
    })
  );

  success(res, {
    id: c.id,
    profileId: c.profile_id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    categoryName: cat?.name || 'N/A',
    categoryId: cat?.id || '',
    price: c.price,
    rating: c.rating,
    reviewCount: c.review_count,
    verified: c.verified,
    acceptingRequests: c.accepting_requests,
    bio: c.bio || '',
    extendedBio: c.extended_bio || '',
    responseTime: c.response_time,
    tags: c.tags || [],
    totalOrders: totalOrders || 0,
    totalEarnings,
    videoTypes,
    recentOrders,
    createdAt: c.created_at,
  });
}

export async function updateCelebrity(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;
  const { name, bio, extendedBio, price, categoryId, verified, acceptingRequests, responseTime, tags } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (extendedBio !== undefined) updateData.extended_bio = extendedBio;
  if (price !== undefined) updateData.price = price;
  if (categoryId !== undefined) updateData.category_id = categoryId;
  if (verified !== undefined) updateData.verified = verified;
  if (acceptingRequests !== undefined) updateData.accepting_requests = acceptingRequests;
  if (responseTime !== undefined) updateData.response_time = responseTime;
  if (tags !== undefined) updateData.tags = tags;

  const { error: dbError } = await supabaseAdmin
    .from('celebrities')
    .update(updateData)
    .eq('id', id);

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  // Return updated celebrity (reuse getCelebrityById logic)
  return getCelebrityById(req, res);
}

export async function deleteCelebrity(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;

  const { error: dbError } = await supabaseAdmin
    .from('celebrities')
    .delete()
    .eq('id', id);

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  success(res, { message: 'Zvezda obrisana' });
}

/* ──────────────────── Orders ──────────────────── */

export async function getOrders(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || '';

  let query = supabaseAdmin
    .from('orders')
    .select(
      `id, buyer_name, buyer_email, price, status, created_at,
       celebrities(name, slug),
       video_types(title)`,
      { count: 'exact' }
    );

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('buyer_name', `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  const orders = (data || []).map((o: Record<string, unknown>) => {
    const celeb = o.celebrities as Record<string, unknown> | null;
    const vtype = o.video_types as Record<string, unknown> | null;
    return {
      id: o.id,
      buyerName: o.buyer_name,
      buyerEmail: o.buyer_email,
      celebrityName: celeb?.name || 'N/A',
      celebritySlug: celeb?.slug || '',
      videoType: vtype?.title || 'N/A',
      price: o.price,
      status: o.status,
      createdAt: o.created_at,
    };
  });

  success(res, orders, {
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;

  const { data: o, error: dbError } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      celebrities(id, name, slug),
      video_types(title)
    `)
    .eq('id', id)
    .single();

  if (dbError || !o) {
    return notFound(res, 'Narudžbina');
  }

  const celeb = o.celebrities as Record<string, unknown> | null;
  const vtype = o.video_types as Record<string, unknown> | null;

  success(res, {
    id: o.id,
    buyerId: o.buyer_id,
    celebrityId: celeb?.id || '',
    buyerName: o.buyer_name,
    buyerEmail: o.buyer_email,
    celebrityName: celeb?.name || 'N/A',
    celebritySlug: celeb?.slug || '',
    videoType: vtype?.title || 'N/A',
    recipientName: o.recipient_name,
    instructions: o.instructions,
    price: o.price,
    status: o.status,
    videoUrl: o.video_url,
    deadline: o.deadline,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  });
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;
  const { status: newStatus } = req.body;

  const validStatuses = ['pending', 'approved', 'completed', 'rejected'];
  if (!validStatuses.includes(newStatus)) {
    return error(res, 'Nevalidan status', 'INVALID_STATUS', 400);
  }

  const { error: dbError } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  return getOrderById(req, res);
}

/* ──────────────────── Applications ──────────────────── */

export async function getApplications(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = (req.query.status as string) || '';

  let query = supabaseAdmin
    .from('applications')
    .select('id, full_name, email, category, followers, status, created_at', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  const applications = (data || []).map((a: Record<string, unknown>) => ({
    id: a.id,
    fullName: a.full_name,
    email: a.email,
    category: a.category,
    followers: a.followers,
    status: a.status,
    createdAt: a.created_at,
  }));

  success(res, applications, {
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function getApplicationById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;

  const { data: a, error: dbError } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError || !a) {
    return notFound(res, 'Prijava');
  }

  success(res, {
    id: a.id,
    fullName: a.full_name,
    email: a.email,
    phone: a.phone,
    category: a.category,
    socialMedia: a.social_media,
    followers: a.followers,
    bio: a.bio,
    motivation: a.motivation,
    status: a.status,
    submittedBy: a.submitted_by,
    createdAt: a.created_at,
    reviewedAt: a.reviewed_at,
  });
}

export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;
  const { status: newStatus } = req.body;

  if (!['approved', 'rejected'].includes(newStatus)) {
    return error(res, 'Nevalidan status', 'INVALID_STATUS', 400);
  }

  const { error: dbError } = await supabaseAdmin
    .from('applications')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  return getApplicationById(req, res);
}

/* ──────────────────── Categories ──────────────────── */

export async function getCategories(_req: AuthenticatedRequest, res: Response) {
  const { data, error: dbError } = await supabaseAdmin
    .from('categories')
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
    celebrityCount: c.celebrity_count,
    createdAt: c.created_at,
  }));

  success(res, categories);
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  const { name, icon } = req.body;

  if (!name || !icon) {
    return error(res, 'Ime i ikona su obavezni', 'VALIDATION_ERROR', 400);
  }

  const slug = name
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[šŠ]/g, 's')
    .replace(/[žŽ]/g, 'z')
    .replace(/[đĐ]/g, 'dj')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const { data, error: dbError } = await supabaseAdmin
    .from('categories')
    .insert({ name, slug, icon, celebrity_count: 0 })
    .select()
    .single();

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  success(
    res,
    {
      id: data.id,
      name: data.name,
      slug: data.slug,
      icon: data.icon,
      celebrityCount: data.celebrity_count,
      createdAt: data.created_at,
    },
    undefined,
    201
  );
}

export async function updateCategoryById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;
  const { name, icon } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = name
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[šŠ]/g, 's')
      .replace(/[žŽ]/g, 'z')
      .replace(/[đĐ]/g, 'dj')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  if (icon !== undefined) updateData.icon = icon;

  const { data, error: dbError } = await supabaseAdmin
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError || !data) {
    return notFound(res, 'Kategorija');
  }

  success(res, {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    celebrityCount: data.celebrity_count,
    createdAt: data.created_at,
  });
}

export async function deleteCategoryById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string;

  // Check if category has celebrities
  const { count } = await supabaseAdmin
    .from('celebrities')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (count && count > 0) {
    return error(
      res,
      `Ne možete obrisati kategoriju sa ${count} zvezda`,
      'CATEGORY_HAS_CELEBRITIES',
      400
    );
  }

  const { error: dbError } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);

  if (dbError) {
    return error(res, dbError.message, 'DB_ERROR', 500);
  }

  success(res, { message: 'Kategorija obrisana' });
}
