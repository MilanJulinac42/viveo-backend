import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { success, error, notFound, forbidden } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { CreateDigitalOrderInput } from '../schemas/digital-order.schema.js';
import { sendNewDigitalOrderNotification } from '../services/emailService.js';

function previewUrl(path: string): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/digital-product-previews/${path}`;
}

/* ── Create digital order (fan) ── */
export async function createDigitalOrder(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const input = req.body as CreateDigitalOrderInput;

  // Fetch product with celebrity info
  const { data: product } = await supabaseAdmin
    .from('digital_products')
    .select('id, name, celebrity_id, price, is_active, file_path, celebrities!inner(name, profile_id)')
    .eq('id', input.digitalProductId)
    .single();

  if (!product || !product.is_active || !product.file_path) {
    return notFound(res, 'Digitalni proizvod');
  }

  const { data: order, error: dbError } = await supabaseAdmin
    .from('digital_orders')
    .insert({
      buyer_id: user.id,
      celebrity_id: product.celebrity_id,
      digital_product_id: product.id,
      price: product.price,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone || '',
    })
    .select()
    .single();

  if (dbError) {
    return error(res, 'Greška pri kreiranju narudžbine', 'DB_ERROR', 500);
  }

  // Fire-and-forget: notify star
  const celeb = product.celebrities as Record<string, unknown>;
  const { data: starProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', celeb.profile_id as string)
    .single();

  if (starProfile) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(starProfile.id);
    if (authUser?.user?.email) {
      sendNewDigitalOrderNotification(authUser.user.email, {
        starName: celeb.name as string,
        buyerName: input.buyerName,
        productName: product.name,
        price: product.price,
      });
    }
  }

  success(res, {
    id: order.id,
    price: order.price,
    status: order.status,
    createdAt: order.created_at,
  }, undefined, 201);
}

/* ── List fan's digital orders ── */
export async function listDigitalOrders(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;

  const { data, error: dbError } = await supabaseAdmin
    .from('digital_orders')
    .select(
      `*,
       digital_products!inner(name, slug, file_type, file_size, preview_image_path),
       celebrities!inner(name, slug)`
    )
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (dbError) {
    return error(res, 'Greška pri učitavanju narudžbina', 'DB_ERROR', 500);
  }

  const orders = (data || []).map((o: Record<string, unknown>) => {
    const product = o.digital_products as Record<string, unknown>;
    const celeb = o.celebrities as Record<string, unknown>;

    return {
      id: o.id,
      productName: product?.name || '',
      productSlug: product?.slug || '',
      previewImageUrl: product?.preview_image_path
        ? previewUrl(product.preview_image_path as string)
        : null,
      celebrityName: celeb?.name || '',
      celebritySlug: celeb?.slug || '',
      fileType: product?.file_type || '',
      fileSize: product?.file_size || 0,
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

/* ── Get single digital order ── */
export async function getDigitalOrderById(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.params;

  const { data: o } = await supabaseAdmin
    .from('digital_orders')
    .select(
      `*,
       digital_products!inner(name, slug, file_type, file_size, preview_image_path),
       celebrities!inner(name, slug)`
    )
    .eq('id', id)
    .single();

  if (!o) {
    return notFound(res, 'Narudžbina');
  }

  if (o.buyer_id !== user.id) {
    return forbidden(res);
  }

  const product = o.digital_products as Record<string, unknown>;
  const celeb = o.celebrities as Record<string, unknown>;

  success(res, {
    id: o.id,
    productName: product?.name || '',
    productSlug: product?.slug || '',
    previewImageUrl: product?.preview_image_path
      ? previewUrl(product.preview_image_path as string)
      : null,
    celebrityName: celeb?.name || '',
    celebritySlug: celeb?.slug || '',
    fileType: product?.file_type || '',
    fileSize: product?.file_size || 0,
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

/* ── Download digital product (token-based) ── */
export async function downloadDigitalProduct(req: Request, res: Response) {
  const { id } = req.params;
  const token = req.query.token as string;

  if (!token) {
    return error(res, 'Token za preuzimanje je obavezan', 'MISSING_TOKEN', 400);
  }

  const { data: order } = await supabaseAdmin
    .from('digital_orders')
    .select('*, digital_products!inner(file_path, file_name, download_count)')
    .eq('id', id)
    .eq('download_token', token)
    .eq('status', 'completed')
    .single();

  if (!order) {
    return notFound(res, 'Narudžbina');
  }

  if (new Date(order.download_token_expires_at) < new Date()) {
    return error(res, 'Link za preuzimanje je istekao', 'TOKEN_EXPIRED', 410);
  }

  const product = order.digital_products as Record<string, unknown>;
  const filePath = product.file_path as string;

  // Generate signed URL (valid 1 hour)
  const { data: signedUrlData, error: storageError } = await supabaseAdmin.storage
    .from('digital-products')
    .createSignedUrl(filePath, 3600);

  if (storageError || !signedUrlData) {
    return error(res, 'Greška pri generisanju linka za preuzimanje', 'STORAGE_ERROR', 500);
  }

  // Increment download counts (fire-and-forget)
  supabaseAdmin
    .from('digital_orders')
    .update({ download_count: order.download_count + 1 })
    .eq('id', id)
    .then(() => {});

  supabaseAdmin
    .from('digital_products')
    .update({ download_count: (product.download_count as number) + 1 })
    .eq('id', order.digital_product_id)
    .then(() => {});

  success(res, {
    downloadUrl: signedUrlData.signedUrl,
    fileName: product.file_name as string,
  });
}
