// /src/app/api/users/[id]/posts/route.js の修正案 2

import { NextResponse } from 'next/server';
// ★★★ 修正: パスを3階層に変更 (../../.. = users/[id]/posts から app/ まで戻る想定) ★★★
import prisma from '../../../lib/prisma'; 
// -------------------------------------------------------------

// GET: 特定ユーザーの投稿一覧を取得
export async function GET(request, { params }) {
  const userId = params.id;

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