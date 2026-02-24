import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput } from '../schemas/product.schema.js';
import type { UpdateMerchOrderStatusInput } from '../schemas/merch-order.schema.js';
import { generateSlug } from '../utils/slug.js';
import { sendMerchOrderConfirmed, sendMerchOrderShipped } from '../services/emailService.js';
import logger from '../config/logger.js';

function imageUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

async function getCelebrityForUser(userId: string) {
  const { data } = await supabaseAdmin
    .from('celebrities')
    .select('id')
    .eq('profile_id', userId)
    .single();
  return data;
}

/* ══════════════════════ Products CRUD ══════════════════════ */

export async function getProducts(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { data, error: dbError } = await supabaseAdmin
    .from('products')
    .select(
      `*, product_categories(name, slug),
       product_images(id, image_path, sort_order),
       product_variants(id, name, price_override, stock, sort_order)`
    )
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false });

  if (dbError) return error(res, 'Greška pri učitavanju proizvoda', 'DB_ERROR', 500);

  const products = (data || []).map((p: Record<string, unknown>) => {
    const cat = p.product_categories as Record<string, unknown> | null;
    const images = (p.product_images as Record<string, unknown>[]) || [];
    const variants = (p.product_variants as Record<string, unknown>[]) || [];
    const sortedImages = [...images].sort((a, b) => (a.sort_order as number) - (b.sort_order as number));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      isActive: p.is_active,
      featured: p.featured,
      categoryName: cat?.name || '',
      mainImage: sortedImages.length > 0 ? imageUrl(sortedImages[0].image_path as string) : null,
      variantCount: variants.length,
      totalStock: variants.reduce((sum, v) => sum + (v.stock as number), 0),
      createdAt: p.created_at,
    };
  });

  success(res, products);
}

export async function createProduct(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const input = req.body as CreateProductInput;
  const slug = generateSlug(input.name);

  // Check slug uniqueness for this celebrity
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('celebrity_id', celebrity.id)
    .eq('slug', slug)
    .single();

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const { data: product, error: dbError } = await supabaseAdmin
    .from('products')
    .insert({
      celebrity_id: celebrity.id,
      product_category_id: input.productCategoryId || null,
      name: input.name,
      slug: finalSlug,
      description: input.description || '',
      price: input.price,
    })
    .select()
    .single();

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  // Insert variants if provided
  if (input.variants && input.variants.length > 0) {
    const variantRows = input.variants.map((v) => ({
      product_id: product.id,
      name: v.name,
      price_override: v.priceOverride ?? null,
      stock: v.stock,
      sort_order: v.sortOrder ?? 0,
    }));

    await supabaseAdmin.from('product_variants').insert(variantRows);
  }

  success(res, {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    createdAt: product.created_at,
  }, undefined, 201);
}

export async function getProductById(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { data: p, error: dbError } = await supabaseAdmin
    .from('products')
    .select(
      `*, product_categories(id, name, slug),
       product_images(id, image_path, sort_order),
       product_variants(id, name, sku, price_override, stock, sort_order)`
    )
    .eq('id', req.params.id)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (dbError || !p) return notFound(res, 'Proizvod');

  const cat = p.product_categories as Record<string, unknown> | null;
  const images = ((p.product_images as Record<string, unknown>[]) || [])
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((img) => ({
      id: img.id,
      imageUrl: imageUrl(img.image_path as string),
      imagePath: img.image_path,
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

  success(res, {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    isActive: p.is_active,
    featured: p.featured,
    categoryId: cat?.id || null,
    categoryName: cat?.name || '',
    images,
    variants,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  });
}

export async function updateProduct(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const input = req.body as UpdateProductInput;
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.productCategoryId !== undefined) updateData.product_category_id = input.productCategoryId;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;
  if (input.featured !== undefined) updateData.featured = input.featured;

  const { error: dbError } = await supabaseAdmin
    .from('products')
    .update(updateData)
    .eq('id', req.params.id)
    .eq('celebrity_id', celebrity.id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  return getProductById(req, res);
}

export async function deleteProduct(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { error: dbError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', req.params.id)
    .eq('celebrity_id', celebrity.id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, { message: 'Proizvod obrisan' });
}

/* ══════════════════════ Product Images ══════════════════════ */

export async function uploadProductImages(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const productId = req.params.id;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Proizvod');

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return error(res, 'Potrebno je uploadovati bar jednu sliku', 'NO_FILE', 400);
  }

  // Get current max sort_order
  const { data: existingImages } = await supabaseAdmin
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1);

  let sortOrder = (existingImages && existingImages.length > 0) ? (existingImages[0].sort_order + 1) : 0;

  const uploaded: { id: string; imageUrl: string; sortOrder: number }[] = [];

  for (const file of files) {
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extMap[file.mimetype] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${celebrity.id}/${productId}/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Product image upload failed', { productId, error: uploadError.message });
      continue;
    }

    const { data: imgRow } = await supabaseAdmin
      .from('product_images')
      .insert({
        product_id: productId,
        image_path: storagePath,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (imgRow) {
      uploaded.push({
        id: imgRow.id,
        imageUrl: imageUrl(storagePath),
        sortOrder,
      });
    }
    sortOrder++;
  }

  success(res, uploaded, undefined, 201);
}

export async function deleteProductImage(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { id: productId, imageId } = req.params;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Proizvod');

  // Get image path for storage deletion
  const { data: img } = await supabaseAdmin
    .from('product_images')
    .select('image_path')
    .eq('id', imageId)
    .eq('product_id', productId)
    .single();

  if (!img) return notFound(res, 'Slika');

  // Delete from storage
  await supabaseAdmin.storage.from('product-images').remove([img.image_path]);

  // Delete from DB
  await supabaseAdmin.from('product_images').delete().eq('id', imageId);

  success(res, { message: 'Slika obrisana' });
}

/* ══════════════════════ Product Variants ══════════════════════ */

export async function addVariant(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const productId = req.params.id;
  const input = req.body as CreateVariantInput;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Proizvod');

  const { data: variant, error: dbError } = await supabaseAdmin
    .from('product_variants')
    .insert({
      product_id: productId,
      name: input.name,
      price_override: input.priceOverride ?? null,
      stock: input.stock,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, {
    id: variant.id,
    name: variant.name,
    priceOverride: variant.price_override,
    stock: variant.stock,
    sortOrder: variant.sort_order,
  }, undefined, 201);
}

export async function updateVariant(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { id: productId, vid } = req.params;
  const input = req.body as UpdateVariantInput;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Proizvod');

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.priceOverride !== undefined) updateData.price_override = input.priceOverride;
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

  const { data: variant, error: dbError } = await supabaseAdmin
    .from('product_variants')
    .update(updateData)
    .eq('id', vid)
    .eq('product_id', productId)
    .select()
    .single();

  if (dbError || !variant) return notFound(res, 'Varijanta');

  success(res, {
    id: variant.id,
    name: variant.name,
    priceOverride: variant.price_override,
    stock: variant.stock,
    sortOrder: variant.sort_order,
  });
}

export async function deleteVariant(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { id: productId, vid } = req.params;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Proizvod');

  // Check if variant has existing orders
  const { count } = await supabaseAdmin
    .from('merch_orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_variant_id', vid);

  if (count && count > 0) {
    return error(res, `Ne možete obrisati varijantu sa ${count} narudžbina`, 'VARIANT_HAS_ORDERS', 400);
  }

  await supabaseAdmin.from('product_variants').delete().eq('id', vid).eq('product_id', productId);

  success(res, { message: 'Varijanta obrisana' });
}

/* ══════════════════════ Merch Orders (Star) ══════════════════════ */

export async function getMerchOrders(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const statusFilter = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('merch_orders')
    .select(
      `*, products!inner(name, slug),
       product_variants(name),
       profiles!buyer_id(full_name, avatar_url)`
    )
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error: dbError } = await query;
  if (dbError) return error(res, 'Greška pri učitavanju narudžbina', 'DB_ERROR', 500);

  const orders = (data || []).map((o: Record<string, unknown>) => {
    const product = o.products as Record<string, unknown>;
    const variant = o.product_variants as Record<string, unknown> | null;
    const buyer = o.profiles as Record<string, unknown> | null;

    return {
      id: o.id,
      buyerName: buyer?.full_name || o.buyer_name,
      buyerAvatar: buyer?.avatar_url || '',
      productName: product?.name || '',
      productSlug: product?.slug || '',
      variantName: variant?.name || null,
      quantity: o.quantity,
      totalPrice: o.total_price,
      status: o.status,
      shippingName: o.shipping_name,
      shippingAddress: o.shipping_address,
      shippingCity: o.shipping_city,
      shippingPostal: o.shipping_postal,
      shippingNote: o.shipping_note,
      trackingNumber: o.tracking_number,
      createdAt: o.created_at,
    };
  });

  success(res, orders);
}

export async function updateMerchOrderStatus(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { id } = req.params;
  const { status: newStatus, trackingNumber } = req.body as UpdateMerchOrderStatusInput;

  const { data: order } = await supabaseAdmin
    .from('merch_orders')
    .select('status, celebrity_id, buyer_email, buyer_name, product_id')
    .eq('id', id)
    .single();

  if (!order || order.celebrity_id !== celebrity.id) {
    return notFound(res, 'Narudžbina');
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
  };

  if (!validTransitions[order.status]?.includes(newStatus)) {
    return error(res, `Nije moguć prelaz iz "${order.status}" u "${newStatus}"`, 'INVALID_TRANSITION', 400);
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'confirmed') updateData.confirmed_at = new Date().toISOString();
  if (newStatus === 'shipped') {
    updateData.shipped_at = new Date().toISOString();
    if (trackingNumber) updateData.tracking_number = trackingNumber;
  }
  if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();

  // If cancelled, restore stock
  if (newStatus === 'cancelled') {
    const { data: fullOrder } = await supabaseAdmin
      .from('merch_orders')
      .select('product_variant_id, quantity')
      .eq('id', id)
      .single();

    if (fullOrder?.product_variant_id) {
      const { data: variant } = await supabaseAdmin
        .from('product_variants')
        .select('stock')
        .eq('id', fullOrder.product_variant_id)
        .single();

      if (variant) {
        await supabaseAdmin
          .from('product_variants')
          .update({ stock: variant.stock + fullOrder.quantity })
          .eq('id', fullOrder.product_variant_id);
      }
    }
  }

  const { error: dbError } = await supabaseAdmin
    .from('merch_orders')
    .update(updateData)
    .eq('id', id);

  if (dbError) return error(res, 'Greška pri ažuriranju statusa', 'DB_ERROR', 500);

  // Fire-and-forget: email notifications
  const { data: productData } = await supabaseAdmin
    .from('products')
    .select('name')
    .eq('id', order.product_id)
    .single();

  const { data: celebrityData } = await supabaseAdmin
    .from('celebrities')
    .select('name')
    .eq('id', celebrity.id)
    .single();

  if (newStatus === 'confirmed') {
    sendMerchOrderConfirmed(order.buyer_email, {
      buyerName: order.buyer_name,
      starName: celebrityData?.name || '',
      productName: productData?.name || '',
      totalPrice: 0, // not critical for notification
    });
  } else if (newStatus === 'shipped') {
    sendMerchOrderShipped(order.buyer_email, {
      buyerName: order.buyer_name,
      starName: celebrityData?.name || '',
      productName: productData?.name || '',
      trackingNumber: trackingNumber || null,
    });
  }

  success(res, { id, status: newStatus });
}

/* ══════════════════════ Merch Earnings ══════════════════════ */

export async function getMerchEarnings(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { data: completedOrders } = await supabaseAdmin
    .from('merch_orders')
    .select('total_price, created_at, products!inner(name)')
    .eq('celebrity_id', celebrity.id)
    .in('status', ['confirmed', 'shipped', 'delivered']);

  const { data: pendingOrders } = await supabaseAdmin
    .from('merch_orders')
    .select('id')
    .eq('celebrity_id', celebrity.id)
    .eq('status', 'pending');

  const orders = completedOrders || [];
  const totalMerchEarnings = orders.reduce((sum, o) => sum + o.total_price, 0);

  const dayNames = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
  const weeklyMap = new Map<string, number>();
  dayNames.forEach((d) => weeklyMap.set(d, 0));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, number>();

  const productMap = new Map<string, { amount: number; count: number }>();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  for (const o of orders) {
    const date = new Date(o.created_at);

    if (date >= weekAgo) {
      const day = dayNames[date.getDay()];
      weeklyMap.set(day, (weeklyMap.get(day) || 0) + o.total_price);
    }

    if (date >= sixMonthsAgo) {
      const month = monthNames[date.getMonth()];
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + o.total_price);
    }

    const productName = (o.products as unknown as Record<string, unknown>).name as string;
    const existing = productMap.get(productName) || { amount: 0, count: 0 };
    productMap.set(productName, { amount: existing.amount + o.total_price, count: existing.count + 1 });
  }

  success(res, {
    totalMerchEarnings,
    completedOrders: orders.length,
    pendingOrders: pendingOrders?.length || 0,
    weeklyEarnings: dayNames.map((day) => ({ day, amount: weeklyMap.get(day) || 0 })),
    monthlyEarnings: [...monthlyMap.entries()].map(([month, amount]) => ({ month, amount })),
    earningsByProduct: [...productMap.entries()].map(([product, data]) => ({ product, ...data })),
  });
}
