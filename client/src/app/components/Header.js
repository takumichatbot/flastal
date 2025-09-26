'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, userType, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    switch (userType) {
      case 'USER': return '/mypage';
      case 'FLORIST': return '/florists/dashboard';
      case 'VENUE': return `/venues/dashboard/${user.id}`;
      default: return null;
    }
  };

  const getDashboardText = () => {
    if (!user) return '';
    return userType === 'USER' ? 'マイページ' : 'ダッシュボード';
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左側：ロゴと主要リンク */}
          <div className="flex items-center">
            <Link href="/">
              <span className="font-bold text-2xl text-sky-500 cursor-pointer tracking-wider">FLASTAL</span>
            </Link>
            <div className="hidden md:block ml-10 space-x-4">
              <Link href="/projects"><span className="text-gray-600 hover:text-sky-500 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors">企画一覧</span></Link>
              <Link href="/florists"><span className="text-gray-600 hover:text-sky-500 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors">お花屋さんを探す</span></Link>
            </div>
          </div>

          {/* 右側：ログイン状態に応じたメニュー */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                // ★★★ ログインしている時の表示 (統一デザイン版) ★★★
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 text-sm">
                    ようこそ、
                    <strong className="ml-1">{user.handleName || user.shopName || user.venueName}</strong>
                    さん
                  </span>
                  
                  {userType === 'USER' && (
                    <>
                      {/* プライマリーボタン */}
                      <Link href="/projects/create">
                        <span className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors">
                          企画を作成
                        </span>
                      </Link>
                      {/* セカンダリーボタン */}
                      <Link href="/points">
                        <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                          ポイント購入
                        </span>
                      </Link>
                    </>
                  )}

                  {/* ターシャリーボタン */}
                  {getDashboardLink() && (
                    <Link href={getDashboardLink()}>
                       <span className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                        {getDashboardText()}
                      </span>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
                    ログアウト
                  </button>
                </div>
              ) : (
                // ★★★ ログアウトしている時の表示 (統一デザイン版) ★★★
                <div className="flex items-center gap-2">
                  {/* プライマリーボタン */}
                  <Link href="/login">
                    <span className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 shadow-sm cursor-pointer transition-colors">ファン ログイン</span>
                  </Link>
                  {/* セカンダリーボタン */}
                  <Link href="/florists/login">
                    <span className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-lg hover:bg-pink-200 cursor-pointer transition-colors">お花屋さん</span>
                  </Link>
                   <Link href="/venues/login">
                    <span className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 cursor-pointer transition-colors">会場の方</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}