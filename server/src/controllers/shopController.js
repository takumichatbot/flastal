import prisma from '../config/prisma.js';
import Stripe from 'stripe';

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
export const adminUpdateOrderStatus = async (req, res) => {
  const { status, trackingNumber } = req.body;
  const order = await prisma.shopOrder.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(trackingNumber !== undefined && { trackingNumber }),
    },
  });
  res.json(order);
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

  await prisma.$transaction(async (tx) => {
    const order = await tx.shopOrder.create({
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

    // 在庫減算
    for (const item of cart.items) {
      await tx.shopProduct.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // カートをクリア
    await tx.shopCartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
};
