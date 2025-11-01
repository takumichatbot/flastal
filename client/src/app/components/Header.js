'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Import useEffect and useState

export default function Header() {
  // Main user context (primarily for 'USER' type)
  const { user, logout } = useAuth(); 
  const router = useRouter();
  
  // Local state to also check for florist/venue login from localStorage
  const [loggedInEntity, setLoggedInEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);

  useEffect(() => {
      // Check for user from AuthContext first
      if (user) {
          setLoggedInEntity(user);
          // ★ 修正: user.role を見て ADMIN か USER かを判断する
          if (user.role === 'ADMIN') {
              setEntityType('ADMIN');
          } else {
              setEntityType('USER');
          }
      } else {
          // If no user from context, check localStorage for florist or venue
          const floristInfo = localStorage.getItem('flastal-florist');
          const venueInfo = localStorage.getItem('flastal-venue');
          if (floristInfo) {
              try {
                  setLoggedInEntity(JSON.parse(floristInfo));
                  setEntityType('FLORIST');
              } catch (e) { localStorage.removeItem('flastal-florist'); }
          } else if (venueInfo) {
              try {
                  setLoggedInEntity(JSON.parse(venueInfo));
                  setEntityType('VENUE');
              } catch (e) { localStorage.removeItem('flastal-venue'); }
          } else {
              // No one is logged in
              setLoggedInEntity(null);
              setEntityType(null);
          }
      }
  }, [user]); // Re-check whenever the user from AuthContext changes


  // ★★★ ログアウト処理を修正 ★★★
  const handleLogout = () => {
    // ADMIN と USER は AuthContext の logout を使う
    if (entityType === 'USER' || entityType === 'ADMIN') {
      logout(); // AuthContext の logout を呼び出す
      router.push('/'); // ホームにリダイレクト
    } else if (entityType === 'FLORIST') {
      localStorage.removeItem('flastal-florist');
      setLoggedInEntity(null);
      setEntityType(null);
      router.push('/'); // ホームにリダイレクト
    } else if (entityType === 'VENUE') {
      localStorage.removeItem('flastal-venue');
       setLoggedInEntity(null); 
       setEntityType(null);
      router.push('/'); // ホームにリダイレクト
    } else {
      // 万が一のフォールバック
      logout(); // AuthContext もクリア
      localStorage.removeItem('flastal-florist');
      localStorage.removeItem('flastal-venue');
      setLoggedInEntity(null);
      setEntityType(null);
      router.push('/');
    }
  };

  const getDashboardLink = () => {
      if (!loggedInEntity) return null;
      switch (entityType) {
        case 'ADMIN': return '/admin'; // ★ 修正済み
        case 'USER': return '/mypage';
        case 'FLORIST': return '/florists/dashboard'; 
        case 'VENUE': return `/venues/dashboard/${loggedInEntity.id}`;
        default: return null;
      }
    };

  const getDashboardText = () => {
    if (!loggedInEntity) return '';
    switch (entityType) {
        case 'USER': return 'マイページ';
        case 'ADMIN': return '管理者画面'; // ★ 修正済み
        case 'FLORIST': return '管理画面';
        case 'VENUE': return '管理画面';
        default: return '';
    }
  }
  
  const getDisplayName = () => {
      if (!loggedInEntity) return '';
      return loggedInEntity.handleName || loggedInEntity.platformName || loggedInEntity.venueName || 'ゲスト';
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo & Main Links */}
          <div className="flex items-center">
            <Link href="/" className="font-bold text-2xl text-sky-500 tracking-wider">
              FLASTAL
            </Link>
            <div className="hidden md:block ml-10 space-x-4">
              <Link href="/projects" className="text-gray-600 hover:text-sky-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">企画一覧</Link>
              <Link href="/florists" className="text-gray-600 hover:text-sky-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">お花屋さんを探す</Link>
            </div>
          </div>

          {/* Right Side: Auth Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {loggedInEntity ? (
                // Logged In View
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 text-sm">
                    ようこそ、
                    <strong className="ml-1">{getDisplayName()}</strong>
                    さん
                  </span>
                  
                  {/* Buttons specific to USER type (ADMIN には表示しない) */}
                  {entityType === 'USER' && (
                    <>
                      <Link href="/projects/create" className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors">
                          企画を作成
                      </Link>
                      <Link href="/points" className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                          ポイント購入
                      </Link>
                    </>
                  )}

                  {/* Dashboard/Mypage Link */}
                  {getDashboardLink() && (
                    <Link href={getDashboardLink()} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                       {getDashboardText()}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
                    ログアウト
                  </button>
                </div>
              ) : (
                // Logged Out View
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 shadow-sm transition-colors">ファン ログイン</Link>
                  <Link href="/florists/login" className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-lg hover:bg-pink-200 transition-colors">お花屋さん</Link>
                   <Link href="/venues/login" className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">会場の方</Link>
                </div>
              )}
            </div>
          </div>
          {/* Mobile Menu Button Placeholder (implement later if needed) */}
          {/* <div className="-mr-2 flex md:hidden"> ... </div> */}
        </div>
      </nav>
    </header>
  );
}