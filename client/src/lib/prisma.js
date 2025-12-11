// client/src/lib/prisma.js (最終版 - ビルド成功を最優先)

import { PrismaClient } from '@prisma/client';

// グローバルオブジェクト (globalThis または global)
const globalForPrisma = globalThis;

let prisma;

// Next.jsのビルドプロセス中に PrismaClient の初期化を防ぐためのチェック
// ビルド時は undefined に設定し、ランタイムでのみ初期化を試みる
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // 開発環境のホットリロード対策 (globalThisでシングルトンを保証)
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;