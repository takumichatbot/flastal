import { PrismaClient } from '@prisma/client';

// DATABASE_URL に接続プール設定を付加（未設定の場合のみ追加）
const rawDbUrl = process.env.DATABASE_URL;
const pooledDbUrl = rawDbUrl && !rawDbUrl.includes('connection_limit')
  ? `${rawDbUrl}${rawDbUrl.includes('?') ? '&' : '?'}connection_limit=10&pool_timeout=10`
  : rawDbUrl;

// Prismaクライアントのインスタンス化（開発環境での多重生成を防止）
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: pooledDbUrl,
      },
    },
  });
};

// globalオブジェクトを使用してシングルトンを保証
const globalForPrisma = global;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;