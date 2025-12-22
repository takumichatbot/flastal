'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
// eslint-disable-next-line @next/next/no-img-element
import { FiArrowLeft, FiShare2, FiStar, FiHeart } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function DigitalNameBoardPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${id}/board`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-t-pink-500 border-white/20 rounded-full animate-spin"></div>
        <p className="tracking-widest text-xs uppercase opacity-70">Loading Credits...</p>
    </div>
  );
  
  if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Data not found</div>;

  const shareText = `【${data.title}】のデジタル芳名板に名前が掲載されました！✨ #FLASTAL`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative font-sans selection:bg-pink-500 selection:text-white">
      
      {/* 背景エフェクト */}
      <div className="fixed inset-0 pointer-events-none">
        {data.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt="" className="w-full h-full object-cover blur-md opacity-20 scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950"></div>
        {/* パーティクル的な装飾 */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      </div>

      {/* ヘッダーナビ (固定) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <Link href={`/projects/${id}`} className="text-white/70 hover:text-white flex items-center transition-all hover:-translate-x-1 pointer-events-auto backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full border border-white/10">
            <FiArrowLeft className="mr-2"/> BACK
        </Link>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-sm font-bold flex items-center transition-all border border-white/20 hover:border-pink-400/50 pointer-events-auto shadow-lg shadow-pink-500/10">
            <FiShare2 className="mr-2"/> SHARE
        </a>
      </div>

      {/* エンドロール・コンテンツ */}
      <div className="relative z-10 w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth perspective-1000">
        <div className="max-w-3xl mx-auto px-6 py-40 text-center space-y-32 animate-fadeInUp">
            
            {/* タイトルセクション */}
            <div className="relative">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-white/50"></div>
                <p className="text-pink-400 font-bold tracking-[0.3em] text-xs mb-6 uppercase flex items-center justify-center gap-3">
                    <span className="w-8 h-px bg-pink-400/50"></span>
                    Special Thanks To
                    <span className="w-8 h-px bg-pink-400/50"></span>
                </p>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {data.title}
                </h1>
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Organizer</span>
                    <span className="text-sm font-bold text-white">{data.planner.handleName}</span>
                </div>
            </div>

            {/* 支援者リスト */}
            <div className="space-y-16">
                
                {/* 1. VIP (Top 3) */}
                <div className="space-y-8">
                    {data.pledges.slice(0, 3).map((pledge, index) => (
                        <div key={pledge.id} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                            <div className="relative flex flex-col items-center transform transition-transform duration-500 hover:scale-105">
                                <div className="mb-3 text-yellow-400 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]">
                                    {index === 0 ? <FiStar size={32} fill="currentColor"/> : <FiStar size={24}/>}
                                </div>
                                <div className="flex items-center gap-4">
                                    {pledge.user.iconUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={pledge.user.iconUrl} alt="" className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg" />
                                    )}
                                    <span className="text-2xl md:text-4xl font-bold text-white tracking-wide drop-shadow-md font-serif">
                                        {pledge.user.handleName}
                                    </span>
                                </div>
                                {pledge.comment && (
                                    <p className="mt-4 text-sm text-pink-100/80 italic max-w-lg mx-auto leading-relaxed border-l-2 border-pink-500/30 pl-4 py-1">
                                        &quot;{pledge.comment}&quot;
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. Divider */}
                <div className="flex items-center justify-center gap-4 opacity-30">
                    <span className="w-16 h-px bg-white"></span>
                    <FiHeart size={16} />
                    <span className="w-16 h-px bg-white"></span>
                </div>

                {/* 3. Regular Supporters (Grid Layout) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                    {data.pledges.slice(3).map((pledge) => (
                        <div key={pledge.id} className="flex flex-col items-center group">
                            <span className="text-sm md:text-base text-slate-300 font-medium group-hover:text-white transition-colors duration-300">
                                {pledge.user.handleName}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* メッセージカード一覧 (Masonry Layout風) */}
            {data.messages.length > 0 && (
                <div className="pt-20 border-t border-white/5">
                    <h2 className="text-xl font-serif italic text-white/50 mb-12 inline-block relative">
                        Messages from Fans
                        <span className="absolute -bottom-2 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent"></span>
                    </h2>
                    
                    <div className="columns-1 md:columns-2 gap-6 text-left space-y-6">
                        {data.messages.map((msg) => (
                            <div key={msg.id} className="break-inside-avoid bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 hover:-translate-y-1">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>
                                    <p className="text-white/90 whitespace-pre-wrap font-medium text-sm leading-relaxed tracking-wide">
                                        {msg.content}
                                    </p>
                                </div>
                                <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                    <span className="text-xs text-white/40">From</span>
                                    <p className="text-sm font-bold text-pink-300">{msg.cardName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* フッター */}
            <div className="pt-40 pb-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-px h-16 bg-gradient-to-b from-white/50 to-transparent"></div>
                    <p className="text-2xl font-bold tracking-[0.2em] text-white/90">THANK YOU</p>
                    <div className="flex items-center gap-2 mt-8 opacity-50 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] tracking-widest">POWERED BY</span>
                        <span className="font-bold text-sm tracking-widest">FLASTAL</span>
                    </div>
                </div>
            </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
            animation: fadeInUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        /* スクロールバーを隠す (没入感のため) */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
        /* テキスト選択色 */
        ::selection {
            background: #ec4899;
            color: #fff;
        }
      `}</style>
    </div>
  );
}