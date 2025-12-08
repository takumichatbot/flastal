import { defineMigrateConfig } from 'prisma/config';

// Renderで設定された環境変数 DATABASE_URL を利用します
export default defineMigrateConfig({
  url: process.env.DATABASE_URL,
});