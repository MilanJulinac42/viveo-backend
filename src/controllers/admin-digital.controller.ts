import type { Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import { generateSlug } from '../utils/slug.js';
import type { AuthenticatedRequest } from '../types/index.js';
import crypto from 'crypto';

function previewUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/digital-product-previews/${path}`;
}

/* ══════════════════════ Digital Products ══════════════════════ */

export async function getDigitalProducts(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const celebrity = (req.query.celebrity as string) || '';

  let query = supabaseAdmin
    .from('digital_products')
    .select(
      `id, name, slug, price, is_active, featured, file_type, file_size,
       download_count, preview_image_path, created_at,
       celebrities!inner(name, slug),
       digital_product_categories(name)`,
      { count: 'exact' }
    );

  if (search) query = query.ilike('name', `%${search}%`);
  if (category) query = query.eq('digital_product_category_id', category);
  if (celebrity) query = query.eq('celebrity_id', celebrity);

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;
  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  const products = await Promise.all(
    (data || []).map(async (p: Record<string, unknown>) => {
      const celeb = p.celebrities as Record<string, unknown>;
      const cat = p.digital_product_categories as Record<string, unknown> | null;

      const { count: totalOrders } = await supabaseAdmin
        .from('digital_orders')
        .select('id', { count: 'exact', head: true })
        .eq('digital_product_id', p.id as string);

      const { data: revenueData } = await supabaseAdmin
        .from('digital_orders')
        .select('price')
        .eq('digital_product_id', p.id as string)
        .in('status', ['confirmed', 'completed']);

      const totalRevenue = (revenueData || []).reduce(
        (sum: number, o: { price: number }) => sum + o.price, 0
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        celebrityName: celeb?.name || 'N/A',
        celebritySlug: celeb?.slug || '',
        categoryName: cat?.name || 'N/A',
        price: p.price,
        isActive: p.is_active,
        featured: p.featured,
        fileType: p.file_type,
        fileSize: p.file_size,
        downloadCount: p.download_count,
        totalOrders: totalOrders || 0,
        totalRevenue,
        previewImageUrl: p.preview_image_path ? previewUrl(p.preview_image_path as string) : null,
        createdAt: p.created_at,
      };
    })
  );

  success(res, products, {
    page,
    pageSize,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function getDigitalProductById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { data: p, error: dbError } = await supabaseAdmin
    .from('digital_products')
    .select(
      `*,
       celebrities(id, name, slug),
       digital_product_categories(id, name)`
    )
    .eq('id', id)
    .single();

  if (dbError || !p) return notFound(res, 'Digitalni proizvod');

  const celeb = p.celebrities as Record<string, unknown>;
  const cat = p.digital_product_categories as Record<string, unknown> | null;

  // Recent digital orders
  const { data: recentOrdersData } = await supabaseAdmin
    .from('digital_orders')
    .select('id, buyer_name, buyer_email, price, status, download_count, created_at')
    .eq('digital_product_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentOrders = (recentOrdersData || []).map((o: Record<string, unknown>) => ({
    id: o.id,
    buyerName: o.buyer_name,
    buyerEmail: o.buyer_email,
    price: o.price,
    status: o.status,
    downloadCount: o.download_count,
    createdAt: o.created_at,
  }));

  // Totals
  const { count: totalOrders } = await supabaseAdmin
    .from('digital_orders')
    .select('id', { count: 'exact', head: true })
    .eq('digital_product_id', id);

  const { data: revenueData } = await supabaseAdmin
    .from('digital_orders')
    .select('price')
    .eq('digital_product_id', id)
    .in('status', ['confirmed', 'completed']);

  const totalRevenue = (revenueData || []).reduce(
    (sum: number, o: { price: number }) => sum + o.price, 0
  );

  success(res, {
    id: p.id,
    celebrityId: celeb?.id || '',
    celebrityName: celeb?.name || 'N/A',
    celebritySlug: celeb?.slug || '',
    categoryId: cat?.id || null,
    categoryName: cat?.name || 'N/A',
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    isActive: p.is_active,
    featured: p.featured,
    fileType: p.file_type,
    fileSize: p.file_size,
    fileName: p.file_name,
    downloadCount: p.download_count,
    previewImageUrl: p.preview_image_path ? previewUrl(p.preview_image_path as string) : null,
    recentOrders,
    totalOrders: totalOrders || 0,
    totalRevenue,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  });
}

export async function updateDigitalProduct(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const { isActive, featured } = req.body;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (isActive !== undefined) updateData.is_active = isActive;
  if (featured !== undefined) updateData.featured = featured;

  const { error: dbError } = await supabaseAdmin
    .from('digital_products')
    .update(updateData)
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  return getDigitalProductById(req, res);
}

export async function deleteDigitalProduct(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  // Get file paths before deletion
  const { data: product } = await supabaseAdmin
    .from('digital_products')
    .select('file_path, preview_image_path')
    .eq('id', id)
    .single();

  if (product) {
    if (product.file_path) {
      await supabaseAdmin.storage.from('digital-products').remove([product.file_path]);
    }
    if (product.preview_image_path) {
      await supabaseAdmin.storage.from('digital-product-previews').remove([product.preview_image_path]);
    }
  }

  const { error: dbError } = await supabaseAdmin
    .from('digital_products')
    .delete()
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, { message: 'Digitalni proizvod obrisan' });
}

/* ══════════════════════ Digital Orders ══════════════════════ */

export async function getDigitalOrders(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || '';

  let query = supabaseAdmin
    .from('digital_orders')
    .select(
      `id, buyer_name, buyer_email, price, status, created_at,
       digital_products!inner(name, file_type),
       celebrities!inner(name, slug)`,
      { count: 'exact' }
    );

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('buyer_name', `%${search}%`);

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;
  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  const orders = (data || []).map((o: Record<string, unknown>) => {
    const product = o.digital_products as Record<string, unknown>;
    const celeb = o.celebrities as Record<string, unknown>;

    return {
      id: o.id,
      buyerName: o.buyer_name,
      buyerEmail: o.buyer_email,
      celebrityName: celeb?.name || 'N/A',
      celebritySlug: celeb?.slug || '',
      productName: product?.name || 'N/A',
      fileType: product?.file_type || '',
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

export async function getDigitalOrderById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { data: o, error: dbError } = await supabaseAdmin
    .from('digital_orders')
    .select(
      `*,
       digital_products!inner(id, name, slug, file_type),
       celebrities!inner(id, name, slug)`
    )
    .eq('id', id)
    .single();

  if (dbError || !o) return notFound(res, 'Digitalna narudžbina');

  const product = o.digital_products as Record<string, unknown>;
  const celeb = o.celebrities as Record<string, unknown>;

  success(res, {
    id: o.id,
    buyerId: o.buyer_id,
    celebrityId: celeb?.id || '',
    celebrityName: celeb?.name || 'N/A',
    celebritySlug: celeb?.slug || '',
    digitalProductId: product?.id || '',
    productName: product?.name || 'N/A',
    productSlug: product?.slug || '',
    fileType: product?.file_type || '',
    price: o.price,
    status: o.status,
    buyerName: o.buyer_name,
    buyerEmail: o.buyer_email,
    buyerPhone: o.buyer_phone,
    downloadToken: o.download_token,
    downloadTokenExpiresAt: o.download_token_expires_at,
    downloadCount: o.download_count,
    confirmedAt: o.confirmed_at,
    completedAt: o.completed_at,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  });
}

export async function updateDigitalOrderStatus(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const { status: newStatus } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    return error(res, 'Nevalidan status', 'INVALID_STATUS', 400);
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'confirmed') updateData.confirmed_at = new Date().toISOString();
  if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString();
    updateData.download_token = crypto.randomUUID();
    updateData.download_token_expires_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const { error: dbError } = await supabaseAdmin
    .from('digital_orders')
    .update(updateData)
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  return getDigitalOrderById(req, res);
}

/* ══════════════════════ Digital Product Categories ══════════════════════ */

export async function getDigitalProductCategories(_req: AuthenticatedRequest, res: Response) {
  const { data, error: dbError } = await supabaseAdmin
    .from('digital_product_categories')
    .select('*')
    .order('name');

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  const categories = (data || []).map((c: Record<string, unknown>) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    createdAt: c.created_at,
  }));

  success(res, categories);
}

export async function createDigitalProductCategory(req: AuthenticatedRequest, res: Response) {
  const { name, icon } = req.body;

  if (!name || !icon) {
    return error(res, 'Ime i ikona su obavezni', 'VALIDATION_ERROR', 400);
  }

  const slug = generateSlug(name);

  const { data, error: dbError } = await supabaseAdmin
    .from('digital_product_categories')
    .insert({ name, slug, icon })
    .select()
    .single();

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    createdAt: data.created_at,
  }, undefined, 201);
}

export async function updateDigitalProductCategory(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const { name, icon } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = generateSlug(name);
  }
  if (icon !== undefined) updateData.icon = icon;

  const { data, error: dbError } = await supabaseAdmin
    .from('digital_product_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError || !data) return notFound(res, 'Kategorija digitalnih proizvoda');

  success(res, {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    createdAt: data.created_at,
  });
}

export async function deleteDigitalProductCategory(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { count } = await supabaseAdmin
    .from('digital_products')
    .select('id', { count: 'exact', head: true })
    .eq('digital_product_category_id', id);

  if (count && count > 0) {
    return error(
      res,
      `Ne možete obrisati kategoriju sa ${count} proizvoda`,
      'CATEGORY_HAS_PRODUCTS',
      400
    );
  }

  const { error: dbError } = await supabaseAdmin
    .from('digital_product_categories')
    .delete()
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, { message: 'Kategorija digitalnih proizvoda obrisana' });
}
