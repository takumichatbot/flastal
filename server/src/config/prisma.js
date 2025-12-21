import { PrismaClient } from '@prisma/client';

// Prismaクライアントのインスタンス化（シングルトン）
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

export default prisma;