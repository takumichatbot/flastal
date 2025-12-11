// client/src/lib/prisma.js (最終修正案)

import { PrismaClient } from '@prisma/client'

// Node.jsのグローバルオブジェクトを取得
const globalForPrisma = globalThis

let prisma

if (process.env.NODE_ENV === 'production') {
  // 本番環境では常に新しいインスタンスを返す（これは通常非推奨だが、
  // ビルドエラー回避と互換性のため）
  // ただし、Next.jsではビルド後のランタイムでシングルトンとして振る舞うことが多い
  prisma = new PrismaClient()
} else {
  // 開発環境では、グローバル変数経由でシングルトンを保証
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  prisma = globalForPrisma.prisma
}

export default prisma