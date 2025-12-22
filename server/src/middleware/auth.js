import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt'; // NextAuthを使用している場合

export async function middleware(req) {
  // NextAuthのセッション（トークン）を取得
  // NEXTAUTH_SECRET は .env.local に設定されている必要があります
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ★ 公開ページ（ログインしていなくてもアクセスできるページ）のリスト
  // ここに '/' (トップページ) を必ず含めます
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/forgot-password', '/reset-password', '/verify-email'];

  // 静的ファイル（画像など）やAPIルートの一部は無視する設定
  // 認証が必要なAPIルートは別途保護する必要がありますが、ここではページ遷移の制御を主に行います
  if (pathname.includes('.') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ★ 1. アクセスしているページが公開ページかどうかチェック
  // 完全一致またはパスの前方一致（例: /login/hoge も許可する場合など）で判定
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

  // ★ 2. ログイン済みの場合の処理
  if (token) {
    // ログイン済みユーザーが「ログイン画面」や「登録画面」に来たら、ダッシュボード（またはマイページ）へ飛ばす
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/mypage', req.url)); // ダッシュボードまたはマイページへ
    }
    // それ以外（トップページ含む）はそのまま表示許可
    return NextResponse.next();
  }

  // ★ 3. 未ログインの場合の処理
  if (!token) {
    // 公開ページならそのまま表示許可
    if (isPublicPath) {
      return NextResponse.next();
    }
    // それ以外の保護されたページ（/mypageなど）なら、ログイン画面へリダイレクト
    // ログイン後に元のページに戻れるように callbackUrl を設定することも一般的です
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
}

// 適用するパスの設定
export const config = {
  matcher: [
    /*
     * 以下のパスを除外してすべてにミドルウェアを適用
     * - api (API routes) ※ただし認証APIは上記ロジックで許可が必要な場合もあるので注意
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (imagesなど)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|public).*)',
  ],
};