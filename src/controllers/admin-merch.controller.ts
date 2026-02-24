import type { Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import { generateSlug } from '../utils/slug.js';
import type { AuthenticatedRequest } from '../types/index.js';

function imageUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

/* ══════════════════════ Products ══════════════════════ */

export async function getProducts(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const celebrity = (req.query.celebrity as string) || '';

  let query = supabaseAdmin
    .from('products')
    .select(
      `id, name, slug, price, is_active, featured, created_at,
       celebrities!inner(name, slug),
       product_categories(name),
       product_images(image_path, sort_order),
       product_variants(id, stock)`,
      { count: 'exact' }
    );

  if (search) query = query.ilike('name', `%${search}%`);
  if (category) query = query.eq('product_category_id', category);
  if (celebrity) query = query.eq('celebrity_id', celebrity);

  const from = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data, count, error: dbError } = await query;
  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  const products = await Promise.all(
    (data || []).map(async (p: Record<string, unknown>) => {
      const celeb = p.celebrities as Record<string, unknown>;
      const cat = p.product_categories as Record<string, unknown> | null;
      const images = (p.product_images as Record<string, unknown>[]) || [];
      const variants = (p.product_variants as Record<string, unknown>[]) || [];
      const sortedImages = [...images].sort((a, b) => (a.sort_order as number) - (b.sort_order as number));

      const { count: totalOrders } = await supabaseAdmin
        .from('merch_orders')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', p.id as string);

      const { data: revenueData } = await supabaseAdmin
        .from('merch_orders')
        .select('total_price')
        .eq('product_id', p.id as string)
        .in('status', ['confirmed', 'shipped', 'delivered']);

      const totalRevenue = (revenueData || []).reduce(
        (sum: number, o: { total_price: number }) => sum + o.total_price, 0
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
        variantCount: variants.length,
        totalOrders: totalOrders || 0,
        totalRevenue,
        mainImage: sortedImages.length > 0 ? imageUrl(sortedImages[0].image_path as string) : null,
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

export async function getProductById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { data: p, error: dbError } = await supabaseAdmin
    .from('products')
    .select(
      `*,
       celebrities(id, name, slug),
       product_categories(id, name),
       product_images(id, image_path, sort_order),
       product_variants(id, name, sku, price_override, stock, sort_order)`
    )
    .eq('id', id)
    .single();

  if (dbError || !p) return notFound(res, 'Proizvod');

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

  // Recent merch orders
  const { data: recentOrdersData } = await supabaseAdmin
    .from('merch_orders')
    .select('id, buyer_name, buyer_email, quantity, total_price, status, created_at')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentOrders = (recentOrdersData || []).map((o: Record<string, unknown>) => ({
    id: o.id,
    buyerName: o.buyer_name,
    buyerEmail: o.buyer_email,
    quantity: o.quantity,
    totalPrice: o.total_price,
    status: o.status,
    createdAt: o.created_at,
  }));

  // Totals
  const { count: totalOrders } = await supabaseAdmin
    .from('merch_orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', id);

  const { data: revenueData } = await supabaseAdmin
    .from('merch_orders')
    .select('total_price')
    .eq('product_id', id)
    .in('status', ['confirmed', 'shipped', 'delivered']);

  const totalRevenue = (revenueData || []).reduce(
    (sum: number, o: { total_price: number }) => sum + o.total_price, 0
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
    images,
    variants,
    recentOrders,
    totalOrders: totalOrders || 0,
    totalRevenue,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  });
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const { isActive, featured } = req.body;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (isActive !== undefined) updateData.is_active = isActive;
  if (featured !== undefined) updateData.featured = featured;

  const { error: dbError } = await supabaseAdmin
    .from('products')
    .update(updateData)
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  return getProductById(req, res);
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { error: dbError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, { message: 'Proizvod obrisan' });
}

/* ══════════════════════ Merch Orders ══════════════════════ */

export async function getMerchOrders(req: AuthenticatedRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || '';

  let query = supabaseAdmin
    .from('merch_orders')
    .select(
      `id, buyer_name, buyer_email, quantity, total_price, status, created_at,
       products!inner(name),
       product_variants(name),
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
    const product = o.products as Record<string, unknown>;
    const variant = o.product_variants as Record<string, unknown> | null;
    const celeb = o.celebrities as Record<string, unknown>;

    return {
      id: o.id,
      buyerName: o.buyer_name,
      buyerEmail: o.buyer_email,
      celebrityName: celeb?.name || 'N/A',
      celebritySlug: celeb?.slug || '',
      productName: product?.name || 'N/A',
      variantName: variant?.name || null,
      quantity: o.quantity,
      totalPrice: o.total_price,
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

export async function getMerchOrderById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { data: o, error: dbError } = await supabaseAdmin
    .from('merch_orders')
    .select(
      `*,
       products!inner(id, name, slug),
       product_variants(name),
       celebrities!inner(id, name, slug)`
    )
    .eq('id', id)
    .single();

  if (dbError || !o) return notFound(res, 'Merch narudžbina');

  const product = o.products as Record<string, unknown>;
  const variant = o.product_variants as Record<string, unknown> | null;
  const celeb = o.celebrities as Record<string, unknown>;

  success(res, {
    id: o.id,
    buyerId: o.buyer_id,
    celebrityId: celeb?.id || '',
    celebrityName: celeb?.name || 'N/A',
    celebritySlug: celeb?.slug || '',
    productId: product?.id || '',
    productName: product?.name || 'N/A',
    productSlug: product?.slug || '',
    variantName: variant?.name || null,
    quantity: o.quantity,
    unitPrice: o.unit_price,
    totalPrice: o.total_price,
    status: o.status,
    buyerName: o.buyer_name,
    buyerEmail: o.buyer_email,
    buyerPhone: o.buyer_phone,
    shippingName: o.shipping_name,
    shippingAddress: o.shipping_address,
    shippingCity: o.shipping_city,
    shippingPostal: o.shipping_postal,
    shippingNote: o.shipping_note,
    trackingNumber: o.tracking_number,
    confirmedAt: o.confirmed_at,
    shippedAt: o.shipped_at,
    deliveredAt: o.delivered_at,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  });
}

export async function updateMerchOrderStatus(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const { status: newStatus } = req.body;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    return error(res, 'Nevalidan status', 'INVALID_STATUS', 400);
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'confirmed') updateData.confirmed_at = new Date().toISOString();
  if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString();
  if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();

  const { error: dbError } = await supabaseAdmin
    .from('merch_orders')
    .update(updateData)
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  return getMerchOrderById(req, res);
}

/* ══════════════════════ Product Categories ══════════════════════ */

export async function getProductCategories(_req: AuthenticatedRequest, res: Response) {
  const { data, error: dbError } = await supabaseAdmin
    .from('product_categories')
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

export async function createProductCategory(req: AuthenticatedRequest, res: Response) {
  const { name, icon } = req.body;

  if (!name || !icon) {
    return error(res, 'Ime i ikona su obavezni', 'VALIDATION_ERROR', 400);
  }

  const slug = generateSlug(name);

  const { data, error: dbError } = await supabaseAdmin
    .from('product_categories')
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

export async function updateProductCategory(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;
  const { name, icon } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = generateSlug(name);
  }
  if (icon !== undefined) updateData.icon = icon;

  const { data, error: dbError } = await supabaseAdmin
    .from('product_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError || !data) return notFound(res, 'Kategorija proizvoda');

  success(res, {
    id: data.id,
    name: data.name,
    slug: data.slug,
    icon: data.icon,
    createdAt: data.created_at,
  });
}

export async function deleteProductCategory(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id;

  const { count } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('product_category_id', id);

  if (count && count > 0) {
    return error(
      res,
      `Ne možete obrisati kategoriju sa ${count} proizvoda`,
      'CATEGORY_HAS_PRODUCTS',
      400
    );
  }

  const { error: dbError } = await supabaseAdmin
    .from('product_categories')
    .delete()
    .eq('id', id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, { message: 'Kategorija proizvoda obrisana' });
}
