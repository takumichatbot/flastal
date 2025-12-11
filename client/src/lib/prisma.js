// client/src/lib/prisma.js (NEXT_PHASE利用版)

import { PrismaClient } from '@prisma/client';

// Next.jsのビルドフェーズを検出する（Renderでも機能する可能性が高い）
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';

// グローバルオブジェクト (globalThis を使用)
const globalForPrisma = globalThis;

let prisma;

if (isNextBuild) {
  // ★★★ ビルドフェーズ中は絶対に初期化を行わない ★★★
  prisma = undefined;
} else if (process.env.NODE_ENV === 'production') {
  // 本番実行環境時
  prisma = new PrismaClient();
} else {
  // 開発環境 (ホットリロード対策)
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

// undefined ではないことを保証するためにチェックを追加
if (prisma === undefined) {
    console.error("Prisma Client initialization skipped during build phase.");
}

export default prisma;