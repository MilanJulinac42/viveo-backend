import type { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { success, error, notFound, forbidden } from '../utils/apiResponse.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { CreateMerchOrderInput } from '../schemas/merch-order.schema.js';
import { sendNewMerchOrderNotification } from '../services/emailService.js';

/* ── Create merch order (fan) ── */
export async function createMerchOrder(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const input = req.body as CreateMerchOrderInput;

  // Fetch product with celebrity info
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, name, celebrity_id, price, is_active, celebrities!inner(name, profile_id)')
    .eq('id', input.productId)
    .single();

  if (!product || !product.is_active) {
    return notFound(res, 'Proizvod');
  }

  // Determine price from variant or product base
  let unitPrice = product.price;
  let variantName: string | null = null;

  if (input.productVariantId) {
    const { data: variant } = await supabaseAdmin
      .from('product_variants')
      .select('id, name, price_override, stock')
      .eq('id', input.productVariantId)
      .eq('product_id', product.id)
      .single();

    if (!variant) {
      return error(res, 'Nevažeća varijanta proizvoda', 'INVALID_VARIANT', 400);
    }

    if (variant.stock < input.quantity) {
      return error(
        res,
        variant.stock === 0 ? 'Ova varijanta je rasprodata' : `Dostupno samo ${variant.stock} komada`,
        'OUT_OF_STOCK',
        400
      );
    }

    if (variant.price_override !== null) {
      unitPrice = variant.price_override;
    }
    variantName = variant.name;

    // Decrement stock
    const { error: stockError } = await supabaseAdmin
      .from('product_variants')
      .update({ stock: variant.stock - input.quantity })
      .eq('id', variant.id);

    if (stockError) {
      return error(res, 'Greška pri ažuriranju stanja', 'DB_ERROR', 500);
    }
  }

  const totalPrice = unitPrice * input.quantity;

  const { data: order, error: dbError } = await supabaseAdmin
    .from('merch_orders')
    .insert({
      buyer_id: user.id,
      celebrity_id: product.celebrity_id,
      product_id: product.id,
      product_variant_id: input.productVariantId || null,
      quantity: input.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone || '',
      shipping_name: input.shippingName,
      shipping_address: input.shippingAddress,
      shipping_city: input.shippingCity,
      shipping_postal: input.shippingPostal,
      shipping_note: input.shippingNote || '',
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
      sendNewMerchOrderNotification(authUser.user.email, {
        starName: celeb.name as string,
        buyerName: input.buyerName,
        productName: product.name,
        variantName: variantName || 'Standardna',
        quantity: input.quantity,
        totalPrice,
        shippingCity: input.shippingCity,
      });
    }
  }

  success(res, {
    id: order.id,
    totalPrice: order.total_price,
    status: order.status,
    createdAt: order.created_at,
  }, undefined, 201);
}

/* ── List fan's merch orders ── */
export async function listMerchOrders(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;

  const { data, error: dbError } = await supabaseAdmin
    .from('merch_orders')
    .select(
      `*,
       products!inner(name, slug, price),
       product_variants(name),
       celebrities!inner(name, slug, image)`
    )
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (dbError) {
    return error(res, 'Greška pri učitavanju narudžbina', 'DB_ERROR', 500);
  }

  const orders = (data || []).map((o: Record<string, unknown>) => {
    const product = o.products as Record<string, unknown>;
    const variant = o.product_variants as Record<string, unknown> | null;
    const celeb = o.celebrities as Record<string, unknown>;

    return {
      id: o.id,
      productName: product?.name || '',
      productSlug: product?.slug || '',
      variantName: variant?.name || null,
      celebrityName: celeb?.name || '',
      celebritySlug: celeb?.slug || '',
      celebrityImage: celeb?.image || '',
      quantity: o.quantity,
      unitPrice: o.unit_price,
      totalPrice: o.total_price,
      status: o.status,
      shippingCity: o.shipping_city,
      trackingNumber: o.tracking_number,
      createdAt: o.created_at,
    };
  });

  success(res, orders);
}

/* ── Get single merch order ── */
export async function getMerchOrderById(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const { id } = req.params;

  const { data: o } = await supabaseAdmin
    .from('merch_orders')
    .select(
      `*,
       products!inner(name, slug),
       product_variants(name),
       celebrities!inner(name, slug, image)`
    )
    .eq('id', id)
    .single();

  if (!o) {
    return notFound(res, 'Narudžbina');
  }

  if (o.buyer_id !== user.id) {
    return forbidden(res);
  }

  const product = o.products as Record<string, unknown>;
  const variant = o.product_variants as Record<string, unknown> | null;
  const celeb = o.celebrities as Record<string, unknown>;

  success(res, {
    id: o.id,
    productName: product?.name || '',
    productSlug: product?.slug || '',
    variantName: variant?.name || null,
    celebrityName: celeb?.name || '',
    celebritySlug: celeb?.slug || '',
    celebrityImage: celeb?.image || '',
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
