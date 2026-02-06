'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiLogOut, FiCamera, FiUser, FiMenu, FiX } from 'react-icons/fi';

/**
 * ダッシュボードのメインレイアウト
 */
export function DashboardContainer({ children, themeColor = '#ec4899', className = '' }) {
  const oshiThemeStyle = useMemo(() => ({
    '--oshi-color': themeColor,
  }), [themeColor]);

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col md:flex-row ${className}`} style={oshiThemeStyle}>
      {children}
    </div>
  );
}

/**
 * サイドバーコンポーネント (修正版)
 */
export function DashboardSidebar({ 
  user, 
  profileIcon, 
  badge, 
  pointsDisplay,
  navigation,
  onLogout,
  editProfileHref = '/mypage/edit'
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* --- モバイル用ヘッダー --- */}
      <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm h-16">
         <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full relative overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                {user?.iconUrl ? (
                    <Image src={user.iconUrl} alt="icon" fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><FiUser size={18}/></div>
                )}
             </div>
             <span className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{user?.handleName || 'User'}</span>
         </div>
         <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Menu"
         >
             <FiMenu size={24} />
         </button>
      </div>

      {/* --- サイドバー本体 --- 
          修正: z-indexを z-[200] に強化して、フッターや他の要素より手前に表示
      */}
      <aside className={`
          fixed inset-y-0 left-0 z-[200] w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:w-80 md:shadow-none md:border-r md:border-slate-100 md:h-screen md:sticky md:top-0 md:flex md:flex-col md:z-20
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          {/* モバイル用閉じるボタン */}
          <div className="md:hidden p-4 flex justify-end border-b border-slate-50">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                  <FiX size={20} />
              </button>
          </div>

          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {/* プロフィールセクション */}
              <div className="p-8 pb-6 flex flex-col items-center border-b border-slate-50">
                <div className="w-24 h-24 rounded-[2rem] relative overflow-hidden border-4 border-white shadow-xl mb-4 group ring-4 ring-[var(--oshi-color)]/5">
                  {user?.iconUrl ? (
                    <Image src={user.iconUrl} alt="アイコン" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                      <FiUser size={40}/>
                    </div>
                  )}
                  <Link href={editProfileHref} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="text-white" size={24} />
                  </Link>
                </div>
                <h2 className="font-black text-slate-900 text-lg tracking-tighter text-center px-4">{user?.handleName || user?.platformName || 'ユーザー'}</h2>
                {badge && <div className="mt-3">{badge}</div>}
              </div>

              {/* ポイント表示 */}
              {pointsDisplay && (
                <div className="px-6 py-6">
                  {pointsDisplay}
                </div>
              )}

              {/* ナビゲーション */}
              <nav className="mt-2 pb-10">
                {navigation}
              </nav>
          </div>

          {/* ログアウトボタン (下部固定) 
              修正: pb-28 を追加してスマホのアドレスバー分を底上げ
          */}
          {onLogout && (
            <div className="p-4 border-t border-slate-50 bg-white md:bg-transparent mt-auto pb-28 md:pb-4">
                <button 
                onClick={onLogout} 
                className="w-full flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                <FiLogOut size={18} /><span>ログアウト</span>
                </button>
            </div>
          )}
      </aside>

      {/* モバイル用バックドロップ (黒背景) */}
      {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-[190] md:hidden backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
      )}
    </>
  );
}

// ... (以下の NavButton, NavSection 等は変更なし) ...
export function NavButton({ id, label, icon: Icon, badge, color = "text-slate-600", activeTab, onClick }) {
  const isActive = activeTab === id;
  
  return (
    <button 
      onClick={() => onClick(id)} 
      className={`w-full flex items-center gap-4 px-8 py-4 text-[15px] font-bold transition-all relative ${
        isActive 
          ? 'text-[var(--oshi-color)] bg-[var(--oshi-color)]/5' 
          : `${color} hover:bg-slate-50`
      }`}
    >
      <Icon size={20} className={isActive ? "text-[var(--oshi-color)]" : "text-slate-400"} />
      <span className="flex-grow text-left">{label}</span>
      {badge > 0 && (
        <span className="bg-[var(--oshi-color)] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
          {badge}
        </span>
      )}
      {isActive && <div className="absolute left-0 w-1.5 h-full bg-[var(--oshi-color)] rounded-r-full" />}
    </button>
  );
}

export function NavSection({ title }) {
  return (
    <p className="px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-3 mt-8">
      {title}
    </p>
  );
}

export function DashboardMain({ children, maxWidth = '4xl' }) {
  return (
    <main className="flex-grow p-4 md:p-10 lg:p-16 w-full overflow-x-hidden">
      <div className={`max-w-${maxWidth} mx-auto space-y-8 md:space-y-12 pb-20 md:pb-0`}>
        {children}
      </div>
    </main>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-8 md:mb-12">
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{title}</h1>
        {description && (
          <p className="text-slate-400 text-xs md:text-sm font-bold mt-2 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--oshi-color)] animate-pulse" />
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {actions}
        </div>
      )}
    </header>
  );
}

export function StatCard({ title, value, subValue, icon: Icon, color = 'sky', onClick, href }) {
  const colors = {
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const content = (
    <div className="p-5 md:p-6 rounded-2xl md:rounded-[2rem] border bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex items-start justify-between group cursor-pointer h-full">
      <div className="flex-grow">
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider mb-1 md:mb-2">{title}</p>
        <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-0.5 md:mb-1">{value}</h3>
        {subValue && (
          <p className="text-[10px] md:text-xs mt-1 font-bold text-slate-400">{subValue}</p>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${colors[color]} transition-transform group-hover:scale-110 shrink-0`}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-left">{content}</button>;
  return content;
}

export function SectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white p-5 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ 
  icon = '🌸', 
  title = 'データがありません', 
  description, 
  actionLabel, 
  actionHref 
}) {
  return (
    <div className="bg-white p-10 md:p-20 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
      <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center text-2xl md:text-4xl mb-4 md:mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg md:text-2xl font-black text-slate-800 mb-2">{title}</h3>
      {description && (
        <p className="text-xs md:text-sm text-slate-400 font-bold mb-8 max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link 
          href={actionHref} 
          className="bg-[var(--oshi-color)] text-white px-8 md:px-12 py-3 md:py-5 rounded-2xl md:rounded-[1.5rem] font-black shadow-lg shadow-[var(--oshi-color)]/30 hover:opacity-90 transition-all text-sm md:text-lg"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', message }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-12 h-12', lg: 'w-16 h-16' };
  return (
    <div className="flex flex-col items-center justify-center p-10 h-full w-full">
      <div className={`animate-spin rounded-full ${sizes[size]} border-4 border-[var(--oshi-color)] border-t-transparent`} />
      {message && (
        <p className="text-slate-400 font-bold mt-4 text-xs md:text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}

export function PointsCard({ points = 0, onAddPoints }) {
  return (
    <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 text-white shadow-xl shadow-slate-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 md:mb-2">Balance</p>
      <div className="flex justify-between items-center relative z-10">
        <p className="text-2xl md:text-3xl font-black tracking-tight">
          {points.toLocaleString()}
          <span className="text-xs ml-1 text-slate-500 uppercase">pt</span>
        </p>
        {onAddPoints && (
          <button 
            onClick={onAddPoints}
            className="bg-[var(--oshi-color)] hover:opacity-90 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-[var(--oshi-color)]/20 active:scale-90"
            aria-label="Add Points"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}