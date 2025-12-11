import { NextResponse } from 'next/server';
// 修正: トップレベルでの直接的な初期化を削除し、シングルトンをインポート
import prisma from '@/lib/prisma'; // 👆 lib/prisma.jsのパスに合わせて修正してください (例: @/lib/prisma, または ../../../../lib/prisma)

// GET: 特定ユーザーの投稿一覧を取得
export async function GET(request, { params }) {
  const userId = params.id;

  try {
    const posts = await prisma.post.findMany({ // prismaインスタンスはシングルトンから取得されます
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }, // 新しい順
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}