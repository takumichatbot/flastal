// client/src/lib/prisma.js (最終修正: globalThisを使用し、型チェックを確実にする)

import { PrismaClient } from '@prisma/client';

// グローバルオブジェクトに型の拡張を宣言 (Next.js環境のベストプラクティス)
const globalForPrisma = globalThis;

// 開発環境と本番環境でインスタンス生成方法を分ける
// 開発環境: グローバルにインスタンスを保存し、ホットリロードで再生成を防ぐ
// 本番環境: グローバルに保存せず、モジュールスコープでインスタンスを保持

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // グローバルにインスタンスがなければ生成
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;