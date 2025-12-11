// /src/app/api/users/[id]/posts/route.js (最終修正)

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

// GET: 特定ユーザーの投稿一覧を取得
export async function GET(request, { params }) {
  const userId = params.id;

  // ★★★ 修正: prismaインスタンスの存在チェックを追加 ★★★
  if (!prisma) {
    console.error("Prisma client is not initialized in server runtime.");
    return NextResponse.json({ error: 'Database service is temporarily unavailable' }, { status: 503 });
  }
  // ---------------------------------------------------

  try {
    const posts = await prisma.post.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }, // 新しい順
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}