'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/app/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { 
    MapPin, Camera, Award, Clock, CheckCircle2, 
    User, Heart, Star, X, Shield, Zap, AlertCircle, ArrowLeft, Briefcase
} from 'lucide-react'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
const JpText = ({ children, className }) => <span className={cn("inline-block", className)}>{children}</span>;

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-4 h-4 bg-sky-300 rounded-full mix-blend-multiply filter blur-[2px] opacity-20"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.1, 0.4, 0.1], scale: [1, 2, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const ProfileItem = ({ icon, label, value, colorClass = "text-pink-500 bg-pink-50 border-pink-100" }) => (
    <div className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-white/60 border border-white shadow-sm hover:shadow-md transition-all">
        <div className={cn("p-3 rounded-[1rem] border shadow-inner shrink-0", colorClass)}>
            {icon}
        </div>
        <div className="pt-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm md:text-base text-slate-800 font-bold break-words mt-1"><JpText>{value || '未設定'}</JpText></p>
        </div>
    </div>
);

// ★ 修正箇所：リンク先を `projects/create` へ繋ぐ際に正常に動作するよう修正
function OfferModal({ floristId, floristName, onClose }) {
    const router = useRouter();
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm p-4 z-[100] flex items-center justify-center">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Zap className="text-pink-500"/> 制作オファーを出す</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><X size={20} /></button>
                </div>
                <div className="p-8 md:p-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 text-pink-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner -rotate-3">
                        <Award size={36} />
                    </div>
                    <p className="text-slate-600 mb-8 leading-relaxed text-sm font-medium">
                        <span className="font-black text-slate-900 text-base border-b-2 border-pink-200">{floristName}</span> さんに<br/>
                        あなたの応援企画への参加を依頼します。<br/>
                        <span className="text-[10px] text-slate-400 font-bold mt-4 block">※決済や進行はFLASTALが仲介し、安全を担保します</span>
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => router.push(`/projects/create?floristId=${floristId}`)}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-full hover:shadow-lg hover:shadow-pink-200 active:scale-95 transition-all text-base"
                        >
                            このお花屋さんで企画を立てる
                        </button>
                        <button onClick={onClose} className="w-full py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-full hover:bg-slate-50 transition-all text-sm">戻る</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function FloristDetailPage() { 
  const { id } = useParams();
  const { user, token, logout } = useAuth(); 
  const router = useRouter();
  
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [appealPosts, setAppealPosts] = useState([]); 
  const [activeTag, setActiveTag] = useState(null); 

  const fetchFlorist = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const floristRes = await fetch(`${API_URL}/api/florists/${id}`);
      if (!floristRes.ok) {
          if (floristRes.status === 404) throw new Error('お花屋さんが見つかりませんでした。');
          throw new Error('情報の取得に失敗しました。');
      }
      
      const floristData = await floristRes.json();
      
      if (floristData && floristData.address) {
          const prefMatch = floristData.address.match(/^(?:東京都|道庁所在地|.{2,3}府|.{2,3}県)/);
          floristData.displayPrefecture = prefMatch ? prefMatch[0] : floristData.address;
      }

      setFlorist(floristData);
      setAppealPosts(floristData.appealPosts || []);
    } catch (error) {
        toast.error(error.message); 
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchFlorist(); }, [fetchFlorist]);

  const handleLikeToggle = async (post) => {
    if (!token || !user) {
        toast.error("ログインが必要です。");
        router.push('/login');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/florists/posts/${post.id}/like`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.status === 401) {
            toast.error("セッションが切れました。");
            logout();
            return;
        }

        if (!res.ok) throw new Error('失敗');
        const data = await res.json();
        setAppealPosts(prev => prev.map(p => {
            if (p.id === post.id) {
                const isLiked = data.liked;
                const newCount = isLiked ? (p._count?.likes || 0) + 1 : Math.max(0, (p._count?.likes || 0) - 1);
                const newLikes = isLiked ? [...(p.likes || []), { userId: user.id }] : (p.likes || []).filter(l => l.userId !== user.id);
                return { ...p, _count: { ...p._count, likes: newCount }, likes: newLikes };
            }
            return p;
        }));
    } catch (error) { toast.error('エラーが発生しました'); }
  };

  const availableTags = useMemo(() => {
    const tags = new Set();
    appealPosts.forEach(post => {
        const content = post.content || '';
        if (typeof content === 'string') {
            const matches = content.match(/#[^\s#]+/g);
            if (matches) matches.forEach(m => tags.add(m.substring(1)));
        }
    });

    const specs = florist?.specialties;
    if (specs) {
        if (typeof specs === 'string' && specs !== '未設定') {
            specs.split(/[\s,、]+/).forEach(t => {
                const trimmed = t.trim();
                if (trimmed) tags.add(trimmed);
            });
        } else if (Array.isArray(specs)) {
            specs.forEach(t => {
                if (typeof t === 'string' && t.trim()) tags.add(t.trim());
            });
        }
    }
    return Array.from(tags).sort();
  }, [appealPosts, florist]);

  const filteredPosts = useMemo(() => {
    if (!activeTag) return appealPosts;
    return appealPosts.filter(p => {
        const content = p.content || '';
        return typeof content === 'string' && content.includes(`#${activeTag}`);
    });
  }, [appealPosts, activeTag]);

  if (loading) {
      return <div className="flex items-center justify-center min-h-screen bg-slate-50/50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>;
  }

  if (!florist) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6"><AlertCircle size={40} className="text-slate-300" /></div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Florist Not Found</h2>
            <p className="text-sm font-bold text-slate-500 mb-8">お探しのページは見つかりませんでした。</p>
            <Link href={user?.role === 'FLORIST' ? "/florists/dashboard" : "/florists"}>
              <button className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                <ArrowLeft size={16}/> {user?.role === 'FLORIST' ? "ダッシュボードへ戻る" : "お花屋さん一覧へ戻る"}
              </button>
            </Link>
        </div>
    );
  }

  const reviews = florist.reviews || [];
  const averageRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length : 0;
  const isMyProfile = user && user.role === 'FLORIST' && user.id === florist.id; 

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-sky-50/50 font-sans relative overflow-hidden pb-24">
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10">
            
            <div className="mb-6">
                <Link href={user?.role === 'FLORIST' ? "/florists/dashboard" : "/florists"} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-black text-slate-500 hover:text-pink-500 hover:bg-white shadow-sm border border-white transition-all">
                    <ArrowLeft size={16}/> 戻る
                </Link>
            </div>

            <GlassCard className="!p-0 overflow-hidden mb-8 relative">
              <div className="h-4 w-full bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400"></div>

              <header className="p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left relative">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-white md:rotate-3 z-10">
                      {florist.iconUrl ? (
                          <Image src={florist.iconUrl} alt="アイコン" fill style={{objectFit: 'cover'}} />
                      ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={48} /></div>
                      )}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                          <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                              <Shield size={12}/> Verified Partner
                          </span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-slate-800 break-words tracking-tighter leading-tight"><JpText>{florist.platformName || florist.shopName}</JpText></h1>
                      <p className="text-xs md:text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest">Professional Florist</p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                          <div className="flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-[1rem] border border-yellow-100 shadow-sm">
                            <Star className="mr-2 fill-yellow-400 text-yellow-400" size={18}/> 
                            <span className="font-black text-lg">{averageRating.toFixed(1)}</span>
                            <span className="text-[10px] ml-2 font-bold opacity-60">({reviews.length} reviews)</span>
                          </div>
                           
                          {isMyProfile && (
                             <Link href="/florists/dashboard" className="text-sm px-6 py-3 bg-slate-900 text-white rounded-full font-black hover:bg-slate-800 transition-all shadow-md flex items-center gap-2">
                                <Briefcase size={16}/> ダッシュボード
                             </Link>
                          )}
                      </div>
                  </div>

                  <div className="hidden md:block z-10">
                     {(!user || user.role === 'USER') && !isMyProfile ? (
                         <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setIsModalOpen(true)}
                            className="px-8 py-5 font-black text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-[1.5rem] shadow-xl shadow-pink-200 flex items-center gap-2 text-lg"
                          >
                            <Zap size={20}/> 制作オファー
                          </motion.button>
                     ) : null}
                  </div>
              </header>
            </GlassCard>

            <div className="mb-10 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 min-w-max">
                    {[
                        { id: 'profile', label: 'プロフィール' },
                        { id: 'appeal', label: `制作実績 (${appealPosts.length})` },
                        { id: 'reviews', label: `評価 (${reviews.length})` }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                          className={cn(
                            "px-6 py-3.5 rounded-full font-black text-sm flex items-center gap-2 transition-all shadow-sm border",
                            activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white/80 backdrop-blur-md text-slate-500 border-white hover:border-pink-300 hover:text-pink-500'
                          )}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                               <GlassCard className="relative overflow-hidden">
                                  <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                      <User className="text-pink-500" size={20}/> 自己紹介 / コンセプト
                                  </h2>
                                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base relative z-10">
                                      <JpText>{florist.portfolio || '自己紹介文がまだ設定されていません。'}</JpText>
                                  </p>
                                  <Award className="absolute -bottom-10 -right-10 text-slate-900 opacity-[0.03] pointer-events-none" size={200}/>
                               </GlassCard>
                            </div>

                            <GlassCard className="h-fit space-y-8">
                              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">FLASTAL Info</h2>
                              
                              <div className="space-y-4">
                                  <ProfileItem icon={<MapPin size={20}/>} label="活動エリア" value={florist.displayPrefecture || '全国対応'} colorClass="text-sky-500 bg-sky-50 border-sky-100" />
                                  <ProfileItem icon={<Clock size={20}/>} label="受付時間" value={florist.businessHours} colorClass="text-purple-500 bg-purple-50 border-purple-100" />
                                  <ProfileItem icon={<Zap size={20}/>} label="特急注文" value={florist.acceptsRushOrders ? '対応可能' : '要相談'} colorClass="text-amber-500 bg-amber-50 border-amber-100" />
                                  <ProfileItem icon={<Award size={20}/>} label="得意な装飾" value={Array.isArray(florist.specialties) ? florist.specialties.join(' / ') : florist.specialties} colorClass="text-emerald-500 bg-emerald-50 border-emerald-100" />
                              </div>

                              <div className="pt-6 border-t border-slate-100">
                                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                      ※詳細な所在地や連絡先は非公開です。進行の際、システム内チャットにてやり取りが可能になります。
                                  </p>
                              </div>
                            </GlassCard>
                        </div>
                    )}
                    
                    {activeTab === 'appeal' && (
                        <div>
                            {availableTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    <button onClick={() => setActiveTag(null)} 
                                        className={cn("px-5 py-2.5 text-[10px] rounded-full font-black tracking-widest uppercase transition-all border", !activeTag ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white/80 text-slate-500 border-white hover:border-pink-200 hover:text-pink-500')}
                                    >All Works</button>
                                    {availableTags.map(tag => (
                                        <button key={tag} onClick={() => setActiveTag(tag)} 
                                            className={cn("px-5 py-2.5 text-[10px] rounded-full font-black tracking-widest uppercase transition-all border", activeTag === tag ? 'bg-pink-500 text-white border-pink-500 shadow-md' : 'bg-white/80 text-slate-500 border-white hover:border-pink-200 hover:text-pink-500')}
                                        >#{tag}</button>
                                    ))}
                                </div>
                            )}

                            {filteredPosts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                    {filteredPosts.map(post => {
                                        const isLiked = user && post.likes?.some(l => l.userId === user.id);
                                        return (
                                            <div key={post.id} className="group relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-500 border border-white">
                                                {post.imageUrl && (
                                                    <Image src={post.imageUrl} alt="作品" fill sizes="(max-width: 768px) 33vw, 50vw" style={{objectFit: 'cover'}} className="transition-transform duration-700 group-hover:scale-105" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5 md:p-6">
                                                    <p className="text-white text-[10px] md:text-xs font-bold leading-relaxed line-clamp-3"><JpText>{post.content}</JpText></p>
                                                </div>
                                                <button onClick={(e) => { e.preventDefault(); handleLikeToggle(post); }}
                                                    className={cn("absolute top-3 right-3 md:top-4 md:right-4 p-2.5 md:p-3 rounded-[1rem] backdrop-blur-md transition-all z-20 border", isLiked ? 'bg-rose-500 text-white border-rose-400 shadow-lg' : 'bg-white/80 text-slate-400 hover:text-rose-500 border-white/50')}
                                                >
                                                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'}/>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <GlassCard className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Camera className="text-slate-300" size={32} /></div>
                                    <p className="text-slate-400 font-black tracking-widest uppercase text-xs">No works posted yet</p>
                                </GlassCard>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'reviews' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                             {reviews.length > 0 ? reviews.map(review => (
                                  <GlassCard key={review.id} className="!p-8 transition-all hover:border-pink-200">
                                      <div className="flex items-center justify-between mb-6">
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 bg-slate-100 rounded-[1rem] flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                                                  <User size={20} />
                                              </div>
                                              <div>
                                                  <span className="font-black text-slate-800 block leading-none">{review.user?.handleName || 'Guest'}</span>
                                                  <span className="text-[9px] text-slate-400 font-black mt-1.5 block uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                                              </div>
                                          </div>
                                          <div className="flex text-yellow-400 gap-0.5">
                                              {[...Array(5)].map((_, i) => <Star key={i} fill={i < review.rating ? "currentColor" : "none"} size={14}/>)}
                                          </div>
                                      </div>
                                      <div className="bg-slate-50/80 p-5 md:p-6 rounded-[1.5rem] border border-slate-100 relative">
                                          <span className="absolute -top-3 left-4 text-3xl text-slate-200 font-serif leading-none">“</span>
                                          <p className="text-slate-600 text-sm leading-relaxed font-bold relative z-10"><JpText>{review.comment}</JpText></p>
                                      </div>
                                  </GlassCard>
                              )) : (
                                  <GlassCard className="text-center py-24 text-slate-300 font-black tracking-widest uppercase">No reviews found</GlassCard>
                              )}
                        </div>
                    )}
                  </motion.div>
                </AnimatePresence>
            </div>

            <div className="md:hidden sticky bottom-6 z-30 mt-12">
              {(!user || user.role === 'USER') && !isMyProfile ? ( 
                <button onClick={() => setIsModalOpen(true)} className="w-full py-5 font-black text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-[2rem] shadow-2xl shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg">
                  <Zap size={20} /> 制作オファーを出す
                </button>
              ) : !user ? (
                <div className="p-6 bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Login required for orders</p>
                  <Link href="/login" className="block w-full py-4 bg-slate-900 text-white font-black rounded-xl">ログインして依頼する</Link>
                </div>
              ) : null}
            </div>
        </div>
      </div>

      {isModalOpen && <OfferModal floristId={id} floristName={florist.platformName || florist.shopName} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}