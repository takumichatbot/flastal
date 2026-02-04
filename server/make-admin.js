// make-admin.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const targetEmail = process.argv[2]; // コマンドライン引数からメールアドレスを取得

async function main() {
  if (!targetEmail) {
    console.error('❌ エラー: メールアドレスを指定してください。');
    console.log('使用法: node make-admin.js user@example.com');
    process.exit(1);
  }

  console.log(`🔍 ユーザーを検索中: ${targetEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.error('❌ エラー: 指定されたメールアドレスのユーザーが見つかりません。');
    process.exit(1);
  }

  console.log(`✅ ユーザーが見つかりました: ${user.handleName} (現在のRole: ${user.role})`);

  // 更新処理
  const updatedUser = await prisma.user.update({
    where: { email: targetEmail },
    data: { role: 'ADMIN' },
  });

  console.log(`🎉 成功: ${updatedUser.email} を管理者(ADMIN)に変更しました！`);
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });