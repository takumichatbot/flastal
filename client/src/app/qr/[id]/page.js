'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ==========================================
// ローディング用スケルトン
// ==========================================
function SkeletonBlock({ className }) {
  return (
    <div className={`animate-pulse bg-pink-100 rounded-2xl ${className || ''}`} />
  );
}

// ==========================================
// 支援者バッジ
// ==========================================
function BackerBadge({ pledge, index }) {
  const isEarly = index < 10;
  const user = pledge.user;

  return (
    <div className="flex items-start gap-3 p-4 bg-white/70 rounded-2xl shadow-sm border border-pink-100 backdrop-blur-sm">
      <div className="relative flex-shrink-0">
        {user?.iconUrl ? (
          <Image
            src={user.iconUrl}
            alt={user.handleName || '支援者'}
            width={40}
            height={40}
            className="rounded-full object-cover border-2 border-pink-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center border-2 border-pink-200">
            <span className="text-white text-sm font-bold">
              {(user?.handleName || '?')[0]}
            </span>
          </div>
        )}
        {isEarly && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] text-white font-black">★</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800 truncate">
            {user?.handleName || '匿名の支援者'}
          </p>
          {isEarly && (
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
              早期支援者
            </span>
          )}
        </div>
        {pledge.comment && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
            {pledge.comment}
          </p>
        )}
        <p className="text-[10px] text-rose-400 font-bold mt-1">
          ¥{pledge.amount?.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// メインページ
// ==========================================
export default function QRLandingPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // プロジェクト情報（pledges込み）を取得
        const [projectRes, photosRes] = await Promise.all([
          fetch(`${API_URL}/api/projects/${id}`),
          fetch(`${API_URL}/api/gallery/${id}`),
        ]);

        if (!projectRes.ok) throw new Error('プロジェクトが見つかりません');
        const projectData = await projectRes.json();
        setProject(projectData);

        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(Array.isArray(photosData) ? photosData : []);
        }
      } catch (err) {
        console.error('QR landing fetch error:', err);
        setError(err.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const shareText = project
    ? `#フラスタ 【${project.title}】に参加しました！`
    : '#フラスタ に参加しました！';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50">
      {/* 花柄装飾（背景） */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-fuchsia-200/20 blur-3xl" />
        <span className="absolute top-8 left-8 text-pink-200 text-5xl select-none">🌸</span>
        <span className="absolute top-16 right-12 text-rose-200 text-3xl select-none">🌷</span>
        <span className="absolute bottom-24 right-8 text-pink-200 text-4xl select-none">💐</span>
        <span className="absolute bottom-16 left-12 text-rose-200 text-3xl select-none">🌺</span>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10 pb-24">

        {/* ヘッダーロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent tracking-widest">
              FLASTAL
            </span>
          </Link>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">みんなで作るフラスタ</p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-500 text-sm font-bold mb-6">
            {error}
          </div>
        )}

        {/* ローディング中スケルトン */}
        {loading && (
          <div className="space-y-6">
            <SkeletonBlock className="h-64 w-full" />
            <SkeletonBlock className="h-8 w-3/4 mx-auto" />
            <SkeletonBlock className="h-4 w-1/2 mx-auto" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => <SkeletonBlock key={i} className="h-20 w-full" />)}
            </div>
          </div>
        )}

        {/* コンテンツ本体 */}
        {!loading && project && (
          <div className="space-y-8">

            {/* プロジェクトタイトルカード */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-4 tracking-widest shadow-md">
                <span>🌸</span> フラスタ完成記念
              </div>
              <h1 className="text-2xl font-black text-slate-800 leading-tight mb-2">
                {project.title}
              </h1>
              {project.planner?.handleName && (
                <p className="text-sm text-slate-500 font-medium">
                  企画者: <span className="text-rose-500 font-bold">{project.planner.handleName}</span>
                </p>
              )}
            </div>

            {/* 完成写真セクション */}
            <section>
              <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500 text-xs">📸</span>
                完成フラスタ写真
              </h2>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setLightboxUrl(photo.imageUrl)}
                      className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-pink-100 hover:scale-[1.02] transition-transform focus:outline-none focus:ring-2 focus:ring-pink-400"
                    >
                      <Image
                        src={photo.imageUrl}
                        alt={photo.caption || 'フラスタ写真'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, 200px"
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-[10px] text-white font-medium line-clamp-2">{photo.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/60 rounded-2xl border border-pink-100 text-center">
                  <span className="text-4xl mb-3">🌸</span>
                  <p className="text-sm font-bold text-slate-600">写真はまだ追加されていません。</p>
                  <p className="text-xs text-slate-400 mt-1">楽しみにお待ちください！</p>
                </div>
              )}
            </section>

            {/* 支援者一覧セクション */}
            {project.pledges && project.pledges.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 text-xs">💝</span>
                  このフラスタを支えた {project.pledges.length} 人
                </h2>
                <div className="space-y-2">
                  {project.pledges.map((pledge, index) => (
                    <BackerBadge key={pledge.id} pledge={pledge} index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* CTAボタン群 */}
            <div className="space-y-3 pt-2">
              {/* シェアボタン */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-black rounded-2xl shadow-lg transition-colors text-sm"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
                Xでシェアする
              </a>

              {/* 次の企画に参加するボタン */}
              <Link
                href="/projects"
                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black rounded-2xl shadow-lg transition-all text-sm"
              >
                <span>🌸</span>
                次の企画に参加する
              </Link>
            </div>

          </div>
        )}
      </div>

      {/* ライトボックス */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
          <div className="relative w-full max-w-sm aspect-square">
            <Image
              src={lightboxUrl}
              alt="フラスタ写真"
              fill
              className="object-contain rounded-2xl"
              sizes="(max-width: 640px) 90vw, 400px"
            />
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-t border-pink-100 text-center" style={{ paddingTop: '0.75rem', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <p className="text-[10px] text-slate-400 font-medium">
          FLASTALで作られたフラスタです ·{' '}
          <Link href="/" className="text-rose-400 hover:text-rose-500 font-bold">
            flastal.com
          </Link>
        </p>
      </footer>
    </div>
  );
}
