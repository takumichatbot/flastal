'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ★ アイコン表示用のヘルパーコンポーネント
function UserIcon({ entity, entityType }) {
  let iconUrl = null;

  if (entityType === 'USER' || entityType === 'ADMIN') {
    iconUrl = entity?.iconUrl; // User または Admin の iconUrl を使用
  } else if (entityType === 'FLORIST') {
    iconUrl = entity?.iconUrl; // Florist の iconUrl を使用
  }

  if (iconUrl) {
    return <img src={iconUrl} alt="icon" className="h-8 w-8 rounded-full object-cover" />;
  }

  // デフォルトアイコン (entityType に応じて色を変えても良い)
  let defaultIconColor = "bg-gray-200 text-gray-500";
  if (entityType === 'FLORIST') defaultIconColor = "bg-pink-100 text-pink-500";
  if (entityType === 'VENUE') defaultIconColor = "bg-green-100 text-green-500";

  return (
    <div className={`h-8 w-8 rounded-full ${defaultIconColor} flex items-center justify-center`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
    </div>
  );
}


export default function Header() {
  const { user, logout } = useAuth(); 
  const router = useRouter();
  
  const [loggedInEntity, setLoggedInEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);

  useEffect(() => {
      if (user) {
          setLoggedInEntity(user);
          if (user.role === 'ADMIN') {
              setEntityType('ADMIN');
          } else {
              setEntityType('USER');
          }
      } else {
          const floristInfo = localStorage.getItem('flastal-florist');
          const venueInfo = localStorage.getItem('flastal-venue');
          if (floristInfo) {
              try {
                  const floristData = JSON.parse(floristInfo);
                  setLoggedInEntity(floristData);
                  setEntityType('FLORIST');
              } catch (e) { localStorage.removeItem('flastal-florist'); }
          } else if (venueInfo) {
              try {
                  setLoggedInEntity(JSON.parse(venueInfo));
                  setEntityType('VENUE');
              } catch (e) { localStorage.removeItem('flastal-venue'); }
          } else {
              setLoggedInEntity(null);
              setEntityType(null);
          }
      }
  }, [user]); 


  const handleLogout = () => {
    if (entityType === 'USER' || entityType === 'ADMIN') {
      logout(); 
      router.push('/');
    } else if (entityType === 'FLORIST') {
      localStorage.removeItem('flastal-florist');
      setLoggedInEntity(null);
      setEntityType(null);
      router.push('/');
    } else if (entityType === 'VENUE') {
      localStorage.removeItem('flastal-venue');
       setLoggedInEntity(null); 
       setEntityType(null);
      router.push('/');
    } else {
      logout(); 
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
        case 'ADMIN': return '/admin'; 
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
        case 'ADMIN': return '管理者画面';
        case 'FLORIST': return '管理画面';
        case 'VENUE': return '管理画面';
        default: return '';
    }
  }
  
  const getDisplayName = () => {
      if (!loggedInEntity) return '';
      // ★ USER/ADMIN の場合は AuthContext の handleName を優先
      if (entityType === 'USER' || entityType === 'ADMIN') {
        return loggedInEntity.handleName || 'ゲスト';
      }
      // お花屋さん・会場
      return loggedInEntity.platformName || loggedInEntity.venueName || 'ゲスト';
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
                  
                  {/* ★ アイコンを表示 */}
                  <UserIcon entity={loggedInEntity} entityType={entityType} />

                  <span className="text-gray-700 text-sm">
                    {getDisplayName()}
                    <span className="ml-1">さん</span>
                  </span>
                  
                  {(entityType === 'USER' || entityType === 'ADMIN') && (
                    <>
                      <Link href="/projects/create" className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors">
                          企画を作成
                      </Link>
                      <Link href="/points" className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                          ポイント購入
                      </Link>
                    </>
                  )}

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
        </div>
      </nav>
    </header>
  );
}