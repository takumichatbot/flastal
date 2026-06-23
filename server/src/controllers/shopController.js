import prisma from '../config/prisma.js';
import Stripe from 'stripe';
import { queueEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE = 0.10;
const FREE_SHIPPING_THRESHOLD = 10000; // ¥10,000以上で送料無料
const SHIPPING_FEE = 800;

// ─────────────────────────────────────────
// カテゴリ一覧
// ─────────────────────────────────────────
export const getCategories = async (_req, res) => {
  const categories = await prisma.shopProductCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  res.json(categories);
};

// ─────────────────────────────────────────
// 商品一覧（公開・検索・カテゴリフィルタ）
// ─────────────────────────────────────────
export const getProducts = async (req, res) => {
  const { category, q, featured, page = '1', limit = '24' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    isActive: true,
    ...(category && { category: { slug: category } }),
    ...(featured === 'true' && { isFeatured: true }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.shopProduct.findMany({
      where,
      include: { category: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: Number(limit),
    }),
    prisma.shopProduct.count({ where }),
  ]);

  res.json({ products, total, page: Number(page), limit: Number(limit) });
};

// ─────────────────────────────────────────
// 商品詳細
// ─────────────────────────────────────────
export const getProduct = async (req, res) => {
  const product = await prisma.shopProduct.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product || !product.isActive) return res.status(404).json({ message: '商品が見つかりません。' });
  res.json(product);
};

// ─────────────────────────────────────────
// カート取得（花屋のみ）
// ─────────────────────────────────────────
export const getCart = async (req, res) => {
  const floristId = req.user.id;
  const cart = await prisma.shopCart.findUnique({
    where: { floristId },
    include: {
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });
  res.json(cart || { items: [] });
};

// ─────────────────────────────────────────
// カートに追加 / 数量更新
// ─────────────────────────────────────────
export const upsertCartItem = async (req, res) => {
  const floristId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    return res.status(400).json({ message: '商品IDと数量（1以上）を指定してください。' });
  }

  const product = await prisma.shopProduct.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) return res.status(404).json({ message: '商品が見つかりません。' });
  if (product.stock < Number(quantity)) return res.status(400).json({ message: `在庫が不足しています。（残り${product.stock}${product.unit}）` });
  if (Number(quantity) < product.minOrder) return res.status(400).json({ message: `最低注文数は${product.minOrder}${product.unit}です。` });

  const cart = await prisma.shopCart.upsert({
    where: { floristId },
    create: { floristId, updatedAt: new Date() },
    update: { updatedAt: new Date() },
  });

  const item = await prisma.shopCartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: Number(quantity) },
    update: { quantity: Number(quantity) },
    include: { product: { include: { category: true } } },
  });

  res.json(item);
};

// ─────────────────────────────────────────
// カートアイテム削除
// ─────────────────────────────────────────
export const removeCartItem = async (req, res) => {
  const floristId = req.user.id;
  const { productId } = req.params;

  const cart = await prisma.shopCart.findUnique({ where: { floristId } });
  if (!cart) return res.status(404).json({ message: 'カートが見つかりません。' });

  await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id, productId } });
  res.json({ message: 'カートから削除しました。' });
};

// ─────────────────────────────────────────
// Stripe チェックアウトセッション作成
// ─────────────────────────────────────────
export const createCheckoutSession = async (req, res) => {
  const floristId = req.user.id;
  const florist = await prisma.florist.findUnique({ where: { id: floristId } });
  if (!florist) return res.status(404).json({ message: '花屋情報が見つかりません。' });

  const cart = await prisma.shopCart.findUnique({
    where: { floristId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'カートが空です。' });

  // 在庫チェック
  for (const item of cart.items) {
    if (!item.product.isActive) return res.status(400).json({ message: `「${item.product.name}」は現在販売停止中です。` });
    if (item.product.stock < item.quantity) return res.status(400).json({ message: `「${item.product.name}」の在庫が不足しています。` });
  }

  const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const lineItems = cart.items.map(item => ({
    price_data: {
      currency: 'jpy',
      product_data: {
        name: item.product.name,
        images: item.product.images.slice(0, 1),
        metadata: { productId: item.product.id },
      },
      unit_amount: Math.round(item.product.price * (1 + TAX_RATE)),
    },
    quantity: item.quantity,
  }));

  if (shippingFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'jpy',
        product_data: { name: '送料' },
        unit_amount: shippingFee,
      },
      quantity: 1,
    });
  }

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.flastal.com';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: florist.email,
    metadata: {
      type: 'shop_order',
      floristId,
      cartId: cart.id,
      subtotal: String(subtotal),
      shippingFee: String(shippingFee),
    },
    success_url: `${FRONTEND_URL}/shop/orders?success=1`,
    cancel_url: `${FRONTEND_URL}/shop/cart?cancelled=1`,
  });

  res.json({ url: session.url });
};

// ─────────────────────────────────────────
// 注文一覧（花屋自身）
// ─────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  const floristId = req.user.id;
  const orders = await prisma.shopOrder.findMany({
    where: { floristId },
    include: {
      items: { include: { product: { include: { category: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
};

// ─────────────────────────────────────────
// 注文詳細（花屋自身）
// ─────────────────────────────────────────
export const getMyOrder = async (req, res) => {
  const floristId = req.user.id;
  const order = await prisma.shopOrder.findFirst({
    where: { id: req.params.id, floristId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).json({ message: '注文が見つかりません。' });
  res.json(order);
};

// ─────────────────────────────────────────
// ★ ADMIN: 商品一覧（管理者用）
// ─────────────────────────────────────────
export const adminGetProducts = async (req, res) => {
  const { page = '1', limit = '50', category } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    prisma.shopProduct.findMany({
      where: category ? { category: { slug: category } } : undefined,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.shopProduct.count({ where: category ? { category: { slug: category } } : undefined }),
  ]);
  res.json({ products, total });
};

// ─────────────────────────────────────────
// ★ ADMIN: 商品作成
// ─────────────────────────────────────────
export const adminCreateProduct = async (req, res) => {
  const { name, description, price, comparePrice, sku, images, categoryId, stock, unit, minOrder, isActive, isFeatured, tags } = req.body;

  if (!name || !price || !categoryId) return res.status(400).json({ message: '商品名・価格・カテゴリは必須です。' });

  const product = await prisma.shopProduct.create({
    data: {
      name, description, price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      sku: sku || null,
      images: images || [],
      categoryId,
      stock: Number(stock || 0),
      unit: unit || '個',
      minOrder: Number(minOrder || 1),
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      tags: tags || [],
    },
    include: { category: true },
  });
  res.status(201).json(product);
};

// ─────────────────────────────────────────
// ★ ADMIN: 商品更新
// ─────────────────────────────────────────
export const adminUpdateProduct = async (req, res) => {
  const { name, description, price, comparePrice, sku, images, categoryId, stock, unit, minOrder, isActive, isFeatured, tags } = req.body;

  const product = await prisma.shopProduct.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(comparePrice !== undefined && { comparePrice: comparePrice ? Number(comparePrice) : null }),
      ...(sku !== undefined && { sku }),
      ...(images !== undefined && { images }),
      ...(categoryId !== undefined && { categoryId }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(unit !== undefined && { unit }),
      ...(minOrder !== undefined && { minOrder: Number(minOrder) }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(tags !== undefined && { tags }),
    },
    include: { category: true },
  });
  res.json(product);
};

// ─────────────────────────────────────────
// ★ ADMIN: 商品削除
// ─────────────────────────────────────────
export const adminDeleteProduct = async (req, res) => {
  await prisma.shopProduct.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: '商品を無効化しました。' });
};

// ─────────────────────────────────────────
// ★ ADMIN: カテゴリ作成
// ─────────────────────────────────────────
export const adminCreateCategory = async (req, res) => {
  const { name, slug, emoji, sortOrder } = req.body;
  if (!name || !slug) return res.status(400).json({ message: 'カテゴリ名とスラッグは必須です。' });

  const category = await prisma.shopProductCategory.create({
    data: { name, slug, emoji: emoji || '🌸', sortOrder: Number(sortOrder || 0) },
  });
  res.status(201).json(category);
};

// ─────────────────────────────────────────
// ★ ADMIN: 全注文一覧
// ─────────────────────────────────────────
export const adminGetOrders = async (req, res) => {
  const { status, page = '1', limit = '50' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = status ? { status } : undefined;
  const [orders, total] = await Promise.all([
    prisma.shopOrder.findMany({
      where,
      include: {
        florist: { select: { id: true, shopName: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.shopOrder.count({ where }),
  ]);
  res.json({ orders, total });
};

// ─────────────────────────────────────────
// ★ ADMIN: 注文ステータス更新
// ─────────────────────────────────────────

// ステータス遷移ホワイトリスト（ShopOrderStatus enum に対応）
const STATUS_TRANSITIONS = {
  PENDING:    ['PAID', 'CANCELLED'],
  PAID:       ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED:    ['DELIVERED'],
  DELIVERED:  [],
  CANCELLED:  [],
  REFUNDED:   [],
};

export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status: newStatus, trackingNumber } = req.body;

    // ステータス変更がある場合のみ遷移チェック
    if (newStatus) {
      const order = await prisma.shopOrder.findUnique({
        where: { id: req.params.id },
        select: { id: true, status: true },
      });
      if (!order) return res.status(404).json({ message: '注文が見つかりません。' });

      const currentStatus = order.status;
      const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        return res.status(400).json({
          message: `${currentStatus} から ${newStatus} への遷移は許可されていません。`,
          allowedTransitions: allowed,
        });
      }
    }

    const updated = await prisma.shopOrder.update({
      where: { id: req.params.id },
      data: {
        ...(newStatus && { status: newStatus }),
        ...(trackingNumber !== undefined && { trackingNumber }),
      },
    });
    res.json(updated);
  } catch (err) {
    logger.error('adminUpdateOrderStatus error', { context: 'Shop', error: err.message });
    res.status(500).json({ message: '注文ステータスの更新に失敗しました。' });
  }
};

// ─────────────────────────────────────────
// 定期購入：新規作成
// ─────────────────────────────────────────
export const createSubscription = async (req, res) => {
  const floristId = req.user.id;
  const { productId, quantity = 1 } = req.body;

  const florist = await prisma.florist.findUnique({ where: { id: floristId } });
  const product = await prisma.shopProduct.findUnique({ where: { id: productId } });
  if (!florist || !product || !product.isActive) return res.status(404).json({ message: '商品が見つかりません。' });

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.flastal.com';

  // Stripe Product（月次）を動的作成
  const stripeProduct = await stripe.products.create({
    name: `${product.name} 定期購入 x${quantity}`,
    metadata: { productId, floristId },
  });
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(product.price * (1 + TAX_RATE)) * Number(quantity),
    currency: 'jpy',
    recurring: { interval: 'month' },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    customer_email: florist.email,
    metadata: {
      type: 'shop_subscription',
      floristId,
      productId,
      quantity: String(quantity),
      stripePriceId: stripePrice.id,
    },
    success_url: `${FRONTEND_URL}/shop/subscriptions?success=1`,
    cancel_url: `${FRONTEND_URL}/shop/subscriptions`,
  });

  res.json({ url: session.url });
};

// ─────────────────────────────────────────
// 定期購入：一覧取得
// ─────────────────────────────────────────
export const getSubscriptions = async (req, res) => {
  const floristId = req.user.id;
  const subs = await prisma.shopSubscription.findMany({
    where: { floristId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(subs);
};

// ─────────────────────────────────────────
// 定期購入：解約
// ─────────────────────────────────────────
export const cancelSubscription = async (req, res) => {
  const floristId = req.user.id;
  const sub = await prisma.shopSubscription.findFirst({
    where: { id: req.params.id, floristId },
  });
  if (!sub) return res.status(404).json({ message: '定期購入が見つかりません。' });

  await stripe.subscriptions.cancel(sub.stripeSubId);
  await prisma.shopSubscription.update({
    where: { id: sub.id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  res.json({ message: '定期購入を解約しました。' });
};

// ─────────────────────────────────────────
// Webhookから呼ぶ：定期購入 確定
// ─────────────────────────────────────────
export const fulfillShopSubscription = async (stripeSession) => {
  const { floristId, productId, quantity, stripePriceId } = stripeSession.metadata;
  const subId = stripeSession.subscription;

  await prisma.shopSubscription.create({
    data: {
      floristId,
      productId,
      quantity: Number(quantity),
      stripeSubId: subId,
      stripePriceId,
      status: 'active',
    },
  });
};

// ─────────────────────────────────────────
// Webhook内から呼ばれる: 注文確定処理
// ─────────────────────────────────────────
export const fulfillShopOrder = async (session) => {
  const { floristId, cartId, subtotal, shippingFee } = session.metadata;

  const cart = await prisma.shopCart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } } },
  });
  if (!cart) return;

  const sub = Number(subtotal);
  const ship = Number(shippingFee);
  const tax = Math.round(sub * TAX_RATE);
  const total = sub + tax + ship;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.shopOrder.create({
      data: {
        floristId,
        subtotal: sub,
        tax,
        shippingFee: ship,
        total,
        status: 'PAID',
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    // 在庫減算（在庫不足ならロールバック）
    for (const item of cart.items) {
      const updated = await tx.shopProduct.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw Object.assign(
          new Error(`「${item.product.name}」の在庫が不足しています。`),
          { code: 'INSUFFICIENT_STOCK', productId: item.productId, productName: item.product.name }
        );
      }
    }

    // カートをクリア
    await tx.shopCartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  // 花屋へ注文完了メールを送信
  const florist = await prisma.florist.findUnique({
    where: { id: floristId },
    select: { email: true, shopName: true }
  });
  if (florist?.email) {
    queueEmail(florist.email, 'SHOP_ORDER_CONFIRMED', {
      shopName: florist.shopName || 'お花屋さん',
      orderId: order.id.slice(-8).toUpperCase(),
      total: total.toLocaleString(),
      itemCount: cart.items.length,
    });
  }
};
