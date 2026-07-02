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

    // 2. レシート内に該当商品があるか確認
    const inApp = appleResult.receipt?.in_app || [];
    const matchedItem = inApp.find(item => item.product_id === productId);
    if (!matchedItem) {
      return res.status(400).json({ message: 'レシートに該当商品が含まれていません' });
    }

    // 3. 二重処理防止: transactionId を確認
    const transactionId = matchedItem.transaction_id;
    const existing = await prisma.pledge.findFirst({
      where: { iapTransactionId: transactionId },
    });
    if (existing) {
      return res.json({ message: '既に処理済みです', pledgeId: existing.id });
    }

    // 4. 支援を記録（ポイント経由ではなく IAP 決済として直接記録）
    const pledgeAmount = parseInt(amount, 10);

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
    logger.error('IAP 検証エラー', { error: error.message, userId });
    return res.status(500).json({ message: error.message || 'IAP 処理に失敗しました' });
  }
};
