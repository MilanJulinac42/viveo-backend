import type { Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { CreateDigitalProductInput, UpdateDigitalProductInput } from '../schemas/digital-product.schema.js';
import type { UpdateDigitalOrderStatusInput } from '../schemas/digital-order.schema.js';
import { generateSlug } from '../utils/slug.js';
import { sendDigitalOrderConfirmed, sendDigitalOrderCompleted } from '../services/emailService.js';
import logger from '../config/logger.js';

function previewUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/digital-product-previews/${path}`;
}

async function getCelebrityForUser(userId: string) {
  const { data } = await supabaseAdmin
    .from('celebrities')
    .select('id')
    .eq('profile_id', userId)
    .single();
  return data;
}

/* ══════════════════════ Digital Products CRUD ══════════════════════ */

export async function getDigitalProducts(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { data, error: dbError } = await supabaseAdmin
    .from('digital_products')
    .select(
      `*, digital_product_categories(name, slug)`
    )
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false });

  if (dbError) return error(res, 'Greška pri učitavanju proizvoda', 'DB_ERROR', 500);

  const products = (data || []).map((p: Record<string, unknown>) => {
    const cat = p.digital_product_categories as Record<string, unknown> | null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      isActive: p.is_active,
      featured: p.featured,
      fileType: p.file_type,
      fileSize: p.file_size,
      fileName: p.file_name,
      previewImageUrl: p.preview_image_path ? previewUrl(p.preview_image_path as string) : null,
      categoryName: cat?.name || '',
      downloadCount: p.download_count,
      createdAt: p.created_at,
    };
  });

  success(res, products);
}

export async function createDigitalProduct(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const input = req.body as CreateDigitalProductInput;
  const slug = generateSlug(input.name);

  // Check slug uniqueness for this celebrity
  const { data: existing } = await supabaseAdmin
    .from('digital_products')
    .select('id')
    .eq('celebrity_id', celebrity.id)
    .eq('slug', slug)
    .single();

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const { data: product, error: dbError } = await supabaseAdmin
    .from('digital_products')
    .insert({
      celebrity_id: celebrity.id,
      digital_product_category_id: input.digitalProductCategoryId || null,
      name: input.name,
      slug: finalSlug,
      description: input.description || '',
      price: input.price,
    })
    .select()
    .single();

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    createdAt: product.created_at,
  }, undefined, 201);
}

export async function getDigitalProductById(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { data: p, error: dbError } = await supabaseAdmin
    .from('digital_products')
    .select(
      `*, digital_product_categories(id, name, slug)`
    )
    .eq('id', req.params.id)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (dbError || !p) return notFound(res, 'Digitalni proizvod');

  const cat = p.digital_product_categories as Record<string, unknown> | null;

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
    fileType: p.file_type,
    fileSize: p.file_size,
    fileName: p.file_name,
    filePath: p.file_path,
    previewImageUrl: p.preview_image_path ? previewUrl(p.preview_image_path as string) : null,
    downloadCount: p.download_count,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  });
}

export async function updateDigitalProduct(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const input = req.body as UpdateDigitalProductInput;
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.digitalProductCategoryId !== undefined) updateData.digital_product_category_id = input.digitalProductCategoryId;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;
  if (input.featured !== undefined) updateData.featured = input.featured;

  const { error: dbError } = await supabaseAdmin
    .from('digital_products')
    .update(updateData)
    .eq('id', req.params.id)
    .eq('celebrity_id', celebrity.id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  return getDigitalProductById(req, res);
}

export async function deleteDigitalProduct(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const productId = req.params.id;

  // Get file paths before deletion
  const { data: product } = await supabaseAdmin
    .from('digital_products')
    .select('file_path, preview_image_path')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Digitalni proizvod');

  // Delete files from storage
  if (product.file_path) {
    await supabaseAdmin.storage.from('digital-products').remove([product.file_path]);
  }
  if (product.preview_image_path) {
    await supabaseAdmin.storage.from('digital-product-previews').remove([product.preview_image_path]);
  }

  const { error: dbError } = await supabaseAdmin
    .from('digital_products')
    .delete()
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, { message: 'Digitalni proizvod obrisan' });
}

/* ══════════════════════ File Upload ══════════════════════ */

export async function uploadDigitalFile(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const productId = req.params.id;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('digital_products')
    .select('id, file_path')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Digitalni proizvod');

  const file = req.file as Express.Multer.File;
  if (!file) {
    return error(res, 'Fajl je obavezan', 'NO_FILE', 400);
  }

  // Remove old file if exists
  if (product.file_path) {
    await supabaseAdmin.storage.from('digital-products').remove([product.file_path]);
  }

  const ext = file.originalname.split('.').pop() || 'bin';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${celebrity.id}/${productId}/${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('digital-products')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    logger.error('Digital file upload failed', { productId, error: uploadError.message });
    return error(res, 'Greška pri uploadu fajla', 'UPLOAD_ERROR', 500);
  }

  // Determine file type from extension
  const fileType = ext.toUpperCase();

  // Update product with file info
  const { error: dbError } = await supabaseAdmin
    .from('digital_products')
    .update({
      file_path: storagePath,
      file_name: file.originalname,
      file_size: file.size,
      file_type: fileType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, {
    fileName: file.originalname,
    fileSize: file.size,
    fileType,
  });
}

export async function uploadDigitalPreviewImage(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const productId = req.params.id;

  // Verify ownership
  const { data: product } = await supabaseAdmin
    .from('digital_products')
    .select('id, preview_image_path')
    .eq('id', productId)
    .eq('celebrity_id', celebrity.id)
    .single();

  if (!product) return notFound(res, 'Digitalni proizvod');

  const file = req.file as Express.Multer.File;
  if (!file) {
    return error(res, 'Slika je obavezna', 'NO_FILE', 400);
  }

  // Remove old preview if exists
  if (product.preview_image_path) {
    await supabaseAdmin.storage.from('digital-product-previews').remove([product.preview_image_path]);
  }

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[file.mimetype] || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${celebrity.id}/${productId}/${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('digital-product-previews')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    logger.error('Digital preview upload failed', { productId, error: uploadError.message });
    return error(res, 'Greška pri uploadu slike', 'UPLOAD_ERROR', 500);
  }

  // Update product
  const { error: dbError } = await supabaseAdmin
    .from('digital_products')
    .update({
      preview_image_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (dbError) return error(res, dbError.message, 'DB_ERROR', 500);

  success(res, {
    previewImageUrl: previewUrl(storagePath),
  });
}

/* ══════════════════════ Digital Orders (Star) ══════════════════════ */

export async function getDigitalOrders(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const statusFilter = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('digital_orders')
    .select(
      `*, digital_products!inner(name, slug, file_type),
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
    const product = o.digital_products as Record<string, unknown>;
    const buyer = o.profiles as Record<string, unknown> | null;

    return {
      id: o.id,
      buyerName: buyer?.full_name || o.buyer_name,
      buyerAvatar: buyer?.avatar_url || '',
      buyerEmail: o.buyer_email,
      productName: product?.name || '',
      productSlug: product?.slug || '',
      fileType: product?.file_type || '',
      price: o.price,
      status: o.status,
      downloadToken: o.download_token,
      downloadTokenExpiresAt: o.download_token_expires_at,
      downloadCount: o.download_count,
      createdAt: o.created_at,
    };
  });

  success(res, orders);
}

export async function updateDigitalOrderStatus(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { id } = req.params;
  const { status: newStatus } = req.body as UpdateDigitalOrderStatusInput;

  const { data: order } = await supabaseAdmin
    .from('digital_orders')
    .select('status, celebrity_id, buyer_email, buyer_name, digital_product_id')
    .eq('id', id)
    .single();

  if (!order || order.celebrity_id !== celebrity.id) {
    return notFound(res, 'Narudžbina');
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
  };

  if (!validTransitions[order.status]?.includes(newStatus)) {
    return error(res, `Nije moguć prelaz iz "${order.status}" u "${newStatus}"`, 'INVALID_TRANSITION', 400);
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString();
  }

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

  if (dbError) return error(res, 'Greška pri ažuriranju statusa', 'DB_ERROR', 500);

  // Fire-and-forget: email notifications
  const { data: productData } = await supabaseAdmin
    .from('digital_products')
    .select('name')
    .eq('id', order.digital_product_id)
    .single();

  const { data: celebrityData } = await supabaseAdmin
    .from('celebrities')
    .select('name')
    .eq('id', celebrity.id)
    .single();

  if (newStatus === 'confirmed') {
    sendDigitalOrderConfirmed(order.buyer_email, {
      buyerName: order.buyer_name,
      starName: celebrityData?.name || '',
      productName: productData?.name || '',
    });
  } else if (newStatus === 'completed') {
    const downloadUrl = `${env.FRONTEND_URL}/moje-porudzbine?download=${id}&token=${updateData.download_token}`;
    sendDigitalOrderCompleted(order.buyer_email, {
      buyerName: order.buyer_name,
      starName: celebrityData?.name || '',
      productName: productData?.name || '',
      downloadUrl,
      expiresAt: updateData.download_token_expires_at as string,
    });
  }

  success(res, { id, status: newStatus });
}

/* ══════════════════════ Digital Earnings ══════════════════════ */

export async function getDigitalEarnings(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const celebrity = await getCelebrityForUser(user.id);
  if (!celebrity) return notFound(res, 'Profil zvezde');

  const { data: completedOrders } = await supabaseAdmin
    .from('digital_orders')
    .select('price, created_at, digital_products!inner(name)')
    .eq('celebrity_id', celebrity.id)
    .in('status', ['confirmed', 'completed']);

  const { data: pendingOrders } = await supabaseAdmin
    .from('digital_orders')
    .select('id')
    .eq('celebrity_id', celebrity.id)
    .eq('status', 'pending');

  const orders = completedOrders || [];
  const totalDigitalEarnings = orders.reduce((sum, o) => sum + o.price, 0);

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
      weeklyMap.set(day, (weeklyMap.get(day) || 0) + o.price);
    }

    if (date >= sixMonthsAgo) {
      const month = monthNames[date.getMonth()];
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + o.price);
    }

    const productName = (o.digital_products as unknown as Record<string, unknown>).name as string;
    const existing = productMap.get(productName) || { amount: 0, count: 0 };
    productMap.set(productName, { amount: existing.amount + o.price, count: existing.count + 1 });
  }

  success(res, {
    totalDigitalEarnings,
    completedOrders: orders.length,
    pendingOrders: pendingOrders?.length || 0,
    weeklyEarnings: dayNames.map((day) => ({ day, amount: weeklyMap.get(day) || 0 })),
    monthlyEarnings: [...monthlyMap.entries()].map(([month, amount]) => ({ month, amount })),
    earningsByProduct: [...productMap.entries()].map(([product, data]) => ({ product, ...data })),
  });
}
