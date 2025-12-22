import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 特定ユーザーの投稿一覧を取得
export async function GET(request, { params }) {
  const userId = params.id;
  const { searchParams } = new URL(request.url);

  // 1. クエリパラメータの取得とバリデーション
  // page: 現在のページ番号 (デフォルト1)
  // limit: 1ページあたりの表示数 (デフォルト10, 最大50)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;

  // Prismaクライアントのチェック（防御的記述）
  if (!prisma) {
    return NextResponse.json(
      { error: 'Database service is temporarily unavailable' }, 
      { status: 503 }
    );
  }

  try {
    // 2. トランザクションで「総件数」と「データ本体」を同時に取得
    // ※ $transactionを使うことで、一貫性のあるデータ取得が可能
    const [totalPosts, posts] = await prisma.$transaction([
      // A. 総件数の取得 (ページネーション計算用)
      prisma.post.count({
        where: {
          userId: userId,
          status: 'PUBLISHED', // 公開済みのみ
          deletedAt: null,     // 論理削除されていないもの
        },
      }),

      // B. 投稿データの取得
      prisma.post.findMany({
        where: {
          userId: userId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        take: limit, // 取得件数
        skip: skip,  // 何件飛ばすか
        orderBy: { createdAt: 'desc' }, // 新しい順
        // フロントエンドで必要な情報を結合 (Eager Loading)
        include: {
          photos: {
            select: {
              id: true,
              url: true,
              alt: true,
            }
          },
          // 関連プロジェクトがある場合、その名前とIDを取得
          project: {
            select: {
              id: true,
              title: true,
            }
          },
          // いいね数やコメント数などのカウント
          _count: {
            select: {
              likes: true,
              comments: true,
            }
          }
        },
      }),
    ]);

    // 3. ページネーション情報の計算
    const totalPages = Math.ceil(totalPosts / limit);
    const hasNextPage = page < totalPages;

    // 4. レスポンスの構築
    // 配列をそのまま返すのではなく、dataとmetaに分けるのがAPI設計の定石です
    return NextResponse.json({
      data: posts,
      meta: {
        total: totalPosts,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
      },
    });

  } catch (error) {
    console.error("API Error [GET /api/users/:id/posts]:", error);
    return NextResponse.json(
      { error: 'Failed to fetch posts. Please try again later.' }, 
      { status: 500 }
    );
  }
}