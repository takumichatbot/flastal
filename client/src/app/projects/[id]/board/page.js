'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiShare2 } from 'react-icons/fi';

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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Data not found</div>;

  // Xでのシェア用URL
  const shareText = `【${data.title}】のデジタル芳名板に名前が掲載されました！✨ #FLASTAL`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative font-sans">
      
      {/* 背景エフェクト */}
      <div className="absolute inset-0 opacity-30">
        {data.imageUrl && (
            <img src={data.imageUrl} className="w-full h-full object-cover blur-sm scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900"></div>
      </div>

      {/* ヘッダーナビ */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Link href={`/projects/${id}`} className="text-white/80 hover:text-white flex items-center transition-colors">
            <FiArrowLeft className="mr-2"/> 企画ページへ戻る
        </Link>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-sm font-bold flex items-center transition-all border border-white/20">
            <FiShare2 className="mr-2"/> シェアする
        </a>
      </div>

      {/* エンドロール・コンテンツ */}
      <div className="relative z-10 w-full h-screen overflow-y-auto scroll-smooth perspective-3d">
        <div className="max-w-2xl mx-auto px-6 py-32 text-center space-y-24 animate-fadeInUp">
            
            {/* タイトルセクション */}
            <div className="mb-20">
                <p className="text-pink-400 font-bold tracking-widest text-sm mb-4 uppercase">Special Thanks To</p>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-white to-sky-300 drop-shadow-lg">
                    {data.title}
                </h1>
                <p className="text-slate-400">Organizer: {data.planner.handleName}</p>
            </div>

            {/* 支援者リスト (Special Supporters) */}
            <div>
                <h2 className="text-2xl font-serif italic text-yellow-200 mb-12 border-b border-yellow-200/30 inline-block px-8 pb-2">
                    Supporters
                </h2>
                
                <div className="space-y-12">
                    {/* 高額支援者を目立たせる */}
                    {data.pledges.map((pledge, index) => {
                        const isVIP = index < 3; // Top 3
                        const sizeClass = isVIP ? 'text-2xl md:text-3xl font-bold text-white' : 'text-lg md:text-xl text-slate-200';
                        const decoration = isVIP ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : '';

                        return (
                            <div key={pledge.id} className="group">
                                <div className={`flex flex-col items-center justify-center transition-transform duration-500 ${isVIP ? 'scale-110 mb-8' : ''}`}>
                                    {isVIP && <span className="text-2xl mb-2">👑</span>}
                                    <div className="flex items-center gap-3">
                                        {pledge.user.iconUrl && (
                                            <img src={pledge.user.iconUrl} className="w-8 h-8 rounded-full border border-white/30" />
                                        )}
                                        <span className={`${sizeClass} ${decoration} tracking-wider`}>
                                            {pledge.user.handleName}
                                        </span>
                                    </div>
                                    {pledge.comment && (
                                        <p className="mt-3 text-sm text-slate-400 italic max-w-md mx-auto leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            "{pledge.comment}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* メッセージカード一覧 */}
            {data.messages.length > 0 && (
                <div className="pt-20">
                    <h2 className="text-xl font-serif italic text-pink-200 mb-10 border-b border-pink-200/30 inline-block px-8 pb-2">
                        Messages
                    </h2>
                    <div className="grid grid-cols-1 gap-6 text-left">
                        {data.messages.map((msg) => (
                            <div key={msg.id} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                                <p className="text-white/90 whitespace-pre-wrap font-medium">{msg.content}</p>
                                <p className="text-right text-sm text-white/50 mt-4">- {msg.cardName}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* フッター */}
            <div className="pt-32 pb-20">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-8"></div>
                <p className="text-xl font-bold tracking-widest text-white/80">THANK YOU FOR YOUR SUPPORT</p>
                <div className="mt-8">
                    <span className="text-xs text-slate-500">Presented by FLASTAL</span>
                </div>
            </div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
            animation: fadeInUp 1.5s ease-out forwards;
        }
        /* スクロールバーを隠す */
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
      `}</style>
    </div>
  );
}