import { PrismaClient } from '@prisma/client'

// Node.jsのグローバルオブジェクトにPrismaClientを保持するための型定義
// これにより、開発中のホットリロードで新しいインスタンスが作成されるのを防ぎます
const prisma = global.prisma || new PrismaClient()

// 開発環境でのみ、グローバルオブジェクトにクライアントを保存
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma