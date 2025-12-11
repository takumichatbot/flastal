// client/src/lib/prisma.js (最終・ビルドガード版)

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prisma;

// ★★★ 修正: Vercel/Next.jsのビルドガードを追加 ★★★
// VERCEL_ENV == 'production' (本番環境) AND
// process.env.NEXT_IS_SERVER が false でない時（つまり、サーバーランタイム時）にのみ new PrismaClient() を実行する

// ビルドフェーズを検出するためのヒント (Render/Next.js環境で有効なことが多い)
const isBuilding = process.env.VERCEL_ENV === 'production' && process.env.NEXT_IS_SERVER === 'true';

if (isBuilding) {
    // ビルド中: インスタンスを生成しない (エラー回避)
    prisma = undefined; 
} else if (process.env.NODE_ENV === 'production') {
    // 本番実行環境: 新しいインスタンスを生成
    prisma = new PrismaClient();
} else {
    // 開発環境: グローバル変数経由でシングルトンを保証
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient();
    }
    prisma = globalForPrisma.prisma;
}

export default prisma;