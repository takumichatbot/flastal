import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import https from 'https';

// IAP 商品 ID → 金額マップ（フロントと同期すること）
const PRODUCT_AMOUNTS = {
  'com.flastal.app.coin1000':  1000,
  'com.flastal.app.coin2000':  2000,
  'com.flastal.app.coin3000':  3000,
  'com.flastal.app.coin5000':  5000,
  'com.flastal.app.coin10000': 10000,
  'com.flastal.app.coin20000': 20000,
  'com.flastal.app.coin30000': 30000,
  'com.flastal.app.coin50000': 50000,
};

async function verifyAppleReceipt(receiptData) {
  const body = JSON.stringify({
    'receipt-data': receiptData,
    'password': process.env.APPLE_IAP_SHARED_SECRET || '',
    'exclude-old-transactions': true,
  });

  // まず本番で検証、SANDBOX エラー時は Sandbox にフォールバック
  const tryVerify = (url) => new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Apple レスポンスのパースに失敗')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  let result = await tryVerify('https://buy.itunes.apple.com/verifyReceipt');

  // status 21007 = サンドボックスのレシートを本番に送った場合
  if (result.status === 21007) {
    result = await tryVerify('https://sandbox.itunes.apple.com/verifyReceipt');
  }

  return result;
}

// IAP でポイントを付与する（/points ページから呼ばれる）
export const addPointsViaIAP = async (req, res) => {
  const userId = req.user.id;
  const { receipt, productId } = req.body;

  if (!receipt || !productId) {
    return res.status(400).json({ message: '必須パラメータが不足しています' });
  }

  const points = PRODUCT_AMOUNTS[productId];
  if (!points) {
    return res.status(400).json({ message: '不明な商品 ID です' });
  }

  try {
    const appleResult = await verifyAppleReceipt(receipt);
    if (appleResult.status !== 0) {
      logger.warn('Apple IAP 検証失敗 (points)', { status: appleResult.status, userId });
      return res.status(400).json({ message: `Apple 検証エラー (status: ${appleResult.status})` });
    }

    const inApp = appleResult.receipt?.in_app || [];
    // 同じ消耗型商品を再購入すると in_app に複数の取引が並ぶ。
    // .find だと最古の取引が返り「処理済み」で新規購入にポイントが付かないため、
    // 該当商品のうち「まだ未処理の取引」を新しい順に選ぶ。
    const candidates = inApp
      .filter(item => item.product_id === productId)
      .sort((a, b) => Number(b.purchase_date_ms || 0) - Number(a.purchase_date_ms || 0));
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'レシートに該当商品が含まれていません' });
    }

    let matchedItem = null;
    let alreadyProcessed = false;
    for (const item of candidates) {
      const existing = await prisma.pointTransaction.findFirst({
        where: { iapTransactionId: item.transaction_id },
      });
      if (!existing) { matchedItem = item; break; }
      alreadyProcessed = true;
    }
    if (!matchedItem) {
      // 全取引が処理済み（=真の重複）。冪等に成功を返す
      return res.json({ success: true, points, message: '既に処理済みです' });
    }

    const transactionId = matchedItem.transaction_id;

    // ポイント付与
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      });
      await tx.pointTransaction.create({
        data: {
          userId,
          amount: points,
          type: 'POINT_CHARGE',
          note: 'App内課金（Apple Pay）',
          iapTransactionId: transactionId,
        },
      });
    });

    logger.info('IAP ポイント付与完了', { userId, points, transactionId });
    return res.json({ success: true, points });

  } catch (error) {
    // iapTransactionId の一意制約違反（同一取引の同時二重送信）は冪等に成功扱いにする
    if (error.code === 'P2002') {
      return res.json({ success: true, points, message: '既に処理済みです' });
    }
    logger.error('IAP ポイント付与エラー', { error: error.message, userId });
    return res.status(500).json({ message: error.message || 'IAP 処理に失敗しました' });
  }
};

export const verifyIAPAndPledge = async (req, res) => {
  const userId = req.user.id;
  const { receipt, productId, projectId, amount, comment } = req.body;

  if (!receipt || !productId || !projectId || !amount) {
    return res.status(400).json({ message: '必須パラメータが不足しています' });
  }

  const expectedAmount = PRODUCT_AMOUNTS[productId];
  if (!expectedAmount) {
    return res.status(400).json({ message: '不明な商品 ID です' });
  }

  try {
    // 1. Apple でレシート検証
    const appleResult = await verifyAppleReceipt(receipt);

    if (appleResult.status !== 0) {
      logger.warn('Apple IAP 検証失敗', { status: appleResult.status, userId });
      return res.status(400).json({ message: `Apple 検証エラー (status: ${appleResult.status})` });
    }

    // 2. レシート内に該当商品があるか確認（未処理の取引を新しい順に選ぶ）
    const inApp = appleResult.receipt?.in_app || [];
    const candidates = inApp
      .filter(item => item.product_id === productId)
      .sort((a, b) => Number(b.purchase_date_ms || 0) - Number(a.purchase_date_ms || 0));
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'レシートに該当商品が含まれていません' });
    }

    // 3. 二重処理防止: 未処理の transactionId を選ぶ
    let matchedItem = null;
    for (const item of candidates) {
      const existing = await prisma.pledge.findFirst({
        where: { iapTransactionId: item.transaction_id },
      });
      if (!existing) { matchedItem = item; break; }
    }
    if (!matchedItem) {
      return res.json({ message: '既に処理済みです' });
    }
    const transactionId = matchedItem.transaction_id;

    // 4. 支援を記録。支援額は商品IDから導出した金額に固定する
    //    （クライアント指定の amount を信用せず、金額偽装を防ぐ）
    if (parseInt(amount, 10) !== expectedAmount) {
      return res.status(400).json({ message: '金額が商品と一致しません' });
    }
    const pledgeAmount = expectedAmount;

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { planner: true },
      });
      if (!project) throw new Error('企画が見つかりません');
      if (project.status !== 'FUNDRAISING') throw new Error('この企画は現在募集を停止しています');

      const pledge = await tx.pledge.create({
        data: {
          amount: pledgeAmount,
          projectId,
          userId,
          comment: comment || null,
          iapTransactionId: transactionId,
          paymentMethod: 'IAP_APPLE',
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: { collectedAmount: { increment: pledgeAmount } },
      });

      await tx.notification.create({
        data: {
          recipientId: project.plannerId,
          type: 'NEW_PLEDGE',
          message: `App内課金で支援がありました！`,
          projectId,
          linkUrl: `/projects/${projectId}`,
        },
      });

      return pledge;
    });

    logger.info('IAP 支援完了', { userId, projectId, amount: pledgeAmount, transactionId });
    return res.json({ success: true, pledgeId: result.id });

  } catch (error) {
    // iapTransactionId の一意制約違反（同一取引の同時二重送信）は冪等に処理済み扱い
    if (error.code === 'P2002') {
      return res.json({ success: true, message: '既に処理済みです' });
    }
    logger.error('IAP 検証エラー', { error: error.message, userId });
    return res.status(500).json({ message: error.message || 'IAP 処理に失敗しました' });
  }
};
