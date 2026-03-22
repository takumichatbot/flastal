'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Star, Heart, Sparkles, Loader2, User, MessageCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ライブ会場のペンライトのように、ふわふわ光るパーティクル
const GlowingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(20)].map((_, i) => {
        const isPink = i % 2 === 0;
        return (
          <motion.div key={i} 
            className={`absolute w-2 h-2 rounded-full blur-[2px] ${isPink ? 'bg-pink-400' : 'bg-sky-400'}`}
            initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height, opacity: 0 }}
            animate={{ 
              y: [null, Math.random() * -100 - 50], 
              x: [null, (Math.random() - 0.5) * 50], 
              opacity: [0, 0.8, 0], 
              scale: [0.5, 1.5, 0.5] 
            }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 5 }}
          />
        );
      })}
    </div>
  );
};

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
        <p className="tracking-widest text-[10px] font-black uppercase text-pink-400 animate-pulse">Loading Credits...</p>
    </div>
  );
  
  if (!data) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-bold">データが見つかりませんでした</div>;

  const shareText = `【${data.title}】のデジタル芳名板に名前が掲載されました！✨ #FLASTAL`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative font-sans selection:bg-pink-500 selection:text-white">
      
      {/* 背景エフェクト（ダークガラスモーフィズム） */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {data.imageUrl && (
            <img src={data.imageUrl} alt="" className="w-full h-full object-cover blur-3xl opacity-20 scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        {/* ぼんやりした光 */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-600/20 blur-[120px] rounded-full mix-blend-screen" />
        
        <GlowingParticles />
      </div>

      {/* ヘッダーナビ (固定) */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-center pointer-events-none">
        <Link href={`/projects/${id}`} className="text-white/70 hover:text-white flex items-center transition-all hover:-translate-x-1 pointer-events-auto backdrop-blur-md bg-white/10 px-5 py-2.5 rounded-full border border-white/10 shadow-lg text-sm font-bold">
            <ArrowLeft className="mr-2" size={18}/> BACK
        </Link>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-sm font-black flex items-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(244,114,182,0.4)] pointer-events-auto text-white shadow-lg">
            <Share2 className="mr-2" size={16}/> SHARE
        </a>
      </div>

      {/* エンドロール・コンテンツ */}
      <div className="relative z-10 w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-32 md:py-40 text-center space-y-32">
            
            {/* タイトルセクション */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="relative">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-pink-400/50 to-pink-400"></div>
                <p className="text-pink-400 font-black tracking-[0.3em] text-[10px] md:text-xs mb-6 uppercase flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]">
                    <span className="w-8 h-px bg-pink-400/50"></span>
                    <Sparkles size={14}/> Special Thanks To <Sparkles size={14}/>
                    <span className="w-8 h-px bg-pink-400/50"></span>
                </p>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] tracking-tighter px-4">
                    {data.title}
                </h1>
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
                    <span className="text-[10px] text-pink-300 font-black uppercase tracking-widest">Organizer</span>
                    <span className="text-sm font-bold text-white">{data.planner.handleName}</span>
                </div>
            </motion.div>

            {/* 支援者リスト */}
            <div className="space-y-20">
                
                {/* 1. VIP (Top 3) */}
                <div className="space-y-12">
                    {data.pledges.slice(0, 3).map((pledge, index) => (
                        <motion.div 
                          key={pledge.id} 
                          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                          className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
                            <div className="relative flex flex-col items-center">
                                <div className="mb-4 text-yellow-400 drop-shadow-[0_0_15px_rgba(253,224,71,0.6)] animate-pulse">
                                    {index === 0 ? <Star size={36} className="fill-yellow-400"/> : <Star size={28} className="fill-yellow-400/80"/>}
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 px-8 py-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                                    {pledge.user.iconUrl ? (
                                        <Image src={pledge.user.iconUrl} alt="" width={48} height={48} className="rounded-full border-2 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full border-2 border-white/50 bg-white/10 flex items-center justify-center text-white/50"><User size={24}/></div>
                                    )}
                                    <span className="text-2xl md:text-4xl font-black text-white tracking-wide drop-shadow-lg">
                                        {pledge.user.handleName}
                                    </span>
                                </div>
                                {pledge.comment && (
                                    <p className="mt-6 text-sm md:text-base text-pink-50 font-medium italic max-w-lg mx-auto leading-relaxed px-6 py-4 bg-pink-500/10 rounded-2xl border border-pink-500/20 backdrop-blur-sm relative">
                                        <span className="absolute -top-3 left-6 text-pink-400 text-2xl font-serif">“</span>
                                        {pledge.comment}
                                        <span className="absolute -bottom-4 right-6 text-pink-400 text-2xl font-serif">”</span>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 2. Divider */}
                <div className="flex items-center justify-center gap-4 opacity-40 py-8">
                    <span className="w-16 md:w-32 h-px bg-gradient-to-r from-transparent to-pink-400"></span>
                    <Heart size={20} className="text-pink-400 fill-pink-400" />
                    <span className="w-16 md:w-32 h-px bg-gradient-to-l from-transparent to-pink-400"></span>
                </div>

                {/* 3. Regular Supporters (Grid Layout) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-4 px-4">
                    {data.pledges.slice(3).map((pledge, i) => (
                        <motion.div 
                          key={pledge.id} 
                          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                          className="flex flex-col items-center group cursor-default"
                        >
                            <span className="text-sm md:text-base text-slate-300 font-bold group-hover:text-white transition-colors duration-300 group-hover:scale-110 transform drop-shadow-md">
                                {pledge.user.handleName}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* メッセージカード一覧 (Masonry Layout風) */}
            {data.messages.length > 0 && (
                <div className="pt-24 border-t border-white/10 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent blur-sm"></div>
                    
                    <h2 className="text-xl font-black text-sky-300 tracking-widest uppercase mb-12 inline-flex items-center gap-3">
                        <MessageCircle size={20}/> Messages from Fans
                    </h2>
                    
                    <div className="columns-1 md:columns-2 gap-6 text-left space-y-6">
                        {data.messages.map((msg, i) => (
                            <motion.div 
                              key={msg.id} 
                              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 5) * 0.1 }}
                              className="break-inside-avoid bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:shadow-[0_10px_30px_rgba(56,189,248,0.15)] hover:-translate-y-1 group"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400 mt-2 shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.8)] group-hover:animate-pulse"></div>
                                    <p className="text-white/90 whitespace-pre-wrap font-medium text-sm leading-relaxed">
                                        {msg.content}
                                    </p>
                                </div>
                                <div className="flex justify-end items-center gap-2 mt-6 pt-4 border-t border-white/5">
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">From</span>
                                    <p className="text-sm font-black text-sky-300">{msg.cardName}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* フッター */}
            <div className="pt-40 pb-24 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-500/10 blur-[100px] pointer-events-none"></div>
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-px h-24 bg-gradient-to-b from-white/30 to-transparent"></div>
                    <p className="text-3xl font-black tracking-[0.3em] text-white/90 mt-4 drop-shadow-lg">THANK YOU</p>
                    <div className="flex items-center gap-2 mt-8 text-white/30 hover:text-white/80 transition-colors">
                        <span className="text-[9px] font-black tracking-widest">POWERED BY</span>
                        <span className="font-black text-sm tracking-widest flex items-center gap-1"><Sparkles size={12}/> FLASTAL</span>
                    </div>
                </div>
            </div>

        </div>
      </div>

      <style jsx global>{`
        /* スクロールバーを隠す (没入感のため) */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}