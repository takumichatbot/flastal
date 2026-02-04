// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // メールテンプレートの初期データ
  const templates = [
    {
      key: 'VERIFICATION_EMAIL',
      name: 'メールアドレス認証',
      subject: '【FLASTAL】メールアドレスの確認をお願いします',
      body: '{{userName}} 様\n\nFLASTALにご登録ありがとうございます。\n以下のリンクをクリックして、メールアドレスの認証を完了してください。\n\n認証リンク:\n{{verificationUrl}}',
    },
    {
      key: 'WELCOME',
      name: '会員登録完了',
      subject: '【FLASTAL】会員登録ありがとうございます',
      body: '{{userName}} 様\n\nFLASTALへようこそ！登録が完了しました。',
    },
    // 必要に応じて他のテンプレートも追加
  ];

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: {},
      create: t,
    });
  }
  console.log('Seed data inserted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });