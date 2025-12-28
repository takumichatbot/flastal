import { PrismaClient } from '@prisma/client';

// Prismaクライアントのインスタンス化（開発環境での多重生成を防止）
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// globalオブジェクトを使用してシングルトンを保証
const globalForPrisma = global;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;