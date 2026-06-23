// src/app/florists/[id]/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/app/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ShareButtons from '@/app/components/ShareButtons';

import {
    Camera, Award, Clock,
    User, Heart, Star, X, Shield, Zap, AlertCircle, ArrowLeft, Briefcase,
    Store, Truck, Loader2, CheckCircle2, MapPin, Bookmark, BookmarkCheck
} from 'lucide-react';

import FloristDeliveryInfo from '@/app/components/FloristDeliveryInfo';
import FloatingParticles from '@/app/components/FloatingParticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
const JpText = ({ children, className }) => <span className={cn("inline-block", className)}>{children}</span>;

// 住所文字列から都道府県のみを確実に取り出す関数
const extractPrefecture = (address) => {
  if (!address) return '全国対応';
  
  // 47都道府県の完全なリスト
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  // 住所の中に都道府県名が含まれているかチェック
  const found = prefectures.find(pref => address.includes(pref));
  
  // 見つかれば都道府県名だけを返し、見つからなければ念のため元の住所を返す
  return found || address;
};

// --- 🎨 Glassmorphism Components ---
const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-10", className)}>
    {children}
  </div>
);

// プロフィール項目表示用
const ProfileItem = ({ icon, label, value, colorClass = "text-pink-500 bg-pink-50 border-pink-100" }) => (
    <div className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-white/60 border border-white shadow-sm hover:shadow-md transition-all">
        <div className={cn("p-3 rounded-[1rem] border shadow-inner shrink-0", colorClass)}>
            {icon}
        </div>
        <div className="pt-1 w-full overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className="text-sm md:text-base text-slate-800 font-bold break-words mt-1 truncate whitespace-normal"><JpText>{value || '未設定'}</JpText></div>
        </div>
    </div>
);

// 制作オファーモーダル（企画選択付き）
function OfferModal({ floristId, floristName, onClose }) {
    const { authenticatedFetch } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        authenticatedFetch(`${API_URL}/api/projects?myProjects=true&status=FUNDRAISING`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setProjects(Array.isArray(data) ? data : []))
            .catch(() => setProjects([]))
            .finally(() => setLoadingProjects(false));
    }, [authenticatedFetch]);

    const handleSend = async () => {
        if (!selectedId) return toast.error('企画を選択してください');
        setSubmitting(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/florists/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: selectedId, floristId }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.message || 'オファーに失敗しました');
            }
            setSent(true);
            toast.success('オファーを送信しました！');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm p-4 z-[100] flex items-center justify-center">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Zap className="text-pink-500" /> 制作オファーを出す
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm"><X size={20} /></button>
                </div>

                <div className="p-7 md:p-8">
                    {sent ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                <CheckCircle2 className="text-emerald-500" size={32} />
                            </div>
                            <p className="font-black text-slate-800 mb-1">オファーを送信しました！</p>
                            <p className="text-xs text-slate-500 font-medium mb-1">お花屋さんからの返答をお待ちください。</p>
                            <p className="text-xs text-amber-600 font-black mb-6">※ 回答期限は3日間です。期限を過ぎると自動的に期限切れになります。</p>
                            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white font-black rounded-full text-sm">閉じる</button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-slate-500 mb-4">
                                <span className="font-black text-slate-900 border-b-2 border-pink-200">{floristName}</span> さんにオファーを送る企画を選択してください。
                            </p>

                            {loadingProjects ? (
                                <div className="py-10 flex justify-center">
                                    <Loader2 className="animate-spin text-pink-400" size={28} />
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-6">
                                    <p className="text-sm font-bold text-slate-500 mb-3">募集中の企画がありません</p>
                                    <button onClick={onClose} className="text-xs text-pink-500 font-black hover:underline">企画を作ってからオファーしましょう</button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto mb-6 pr-1">
                                    {projects.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedId(p.id)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedId === p.id ? 'border-pink-400 bg-pink-50' : 'border-slate-100 hover:border-pink-200 bg-white'}`}
                                        >
                                            <p className="font-black text-slate-800 text-sm line-clamp-1">{p.title}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleSend}
                                    disabled={!selectedId || submitting || projects.length === 0}
                                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-full hover:shadow-lg hover:shadow-pink-200 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                                    {submitting ? '送信中...' : 'オファーを送信する'}
                                </button>
                                <button onClick={onClose} className="w-full py-3.5 bg-white border border-slate-200 text-slate-500 font-black rounded-full hover:bg-slate-50 transition-all text-sm">戻る</button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// 画像プレビューモーダル
function ImageLightbox({ url, onClose }) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 flex justify-center items-center z-[200] p-4 backdrop-blur-md" onClick={onClose}>
        <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[210] border border-white/20">
          <X size={24} />
        </button>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <img src={url} alt="Enlarged" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" loading="lazy" />
        </motion.div>
      </div>
    );
  }

// --- メインページコンポーネント ---

export default function FloristDetailPage() { 
  const { id } = useParams();
  const { user, token, logout } = useAuth(); 
  const router = useRouter();
  
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  const [activeTab, setActiveTab] = useState('profile');
  const [appealPosts, setAppealPosts] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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


      setFlorist(floristData);
      setAppealPosts(floristData.appealPosts || []);
    } catch (error) {
        toast.error(error.message); 
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchFlorist(); }, [fetchFlorist]);

  // お気に入り状態をチェック
  useEffect(() => {
    if (!token || !id) return;
    fetch(`${API_URL}/api/florists/my-favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(list => {
      setIsFavorited(list.some(f => f.id === id));
    }).catch(() => {});
  }, [id, token]);

  const handleToggleFavorite = async () => {
    if (!token || !user) { toast.error('ログインが必要です'); return; }
    setFavoriteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/florists/${id}/favorite`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.favorited);
        toast.success(data.favorited ? 'お気に入りに追加しました' : 'お気に入りを解除しました');
      }
    } catch { toast.error('エラーが発生しました'); }
    finally { setFavoriteLoading(false); }
  };

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
        
        if (res.status === 403) {
            toast.error("お花屋さんや運営者は「いいね」できません。");
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-sky-50/50 pb-24">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          {/* Hero card skeleton */}
          <div className="rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden shadow-sm">
            <div className="h-44 bg-gradient-to-r from-pink-100 to-rose-100" />
            <div className="px-8 pb-8 pt-4 flex flex-col md:flex-row items-center gap-6">
              <div className="w-28 h-28 rounded-[2rem] bg-slate-200 -mt-14 shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="h-6 bg-slate-200 rounded-full w-3/4" />
                <div className="h-4 bg-slate-100 rounded-full w-1/2" />
                <div className="flex gap-2 mt-2">
                  {[1,2,3].map(i => <div key={i} className="h-6 w-16 bg-slate-100 rounded-full" />)}
                </div>
              </div>
            </div>
          </div>
          {/* Portfolio grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-white rounded-[2rem] border border-slate-100 shadow-sm" />)}
          </div>
        </div>
      </div>
    );
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50/50 to-sky-50/50 font-sans relative overflow-hidden pb-24 md:pb-24" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <FloatingParticles />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10">

            {/* Floating back button — fixed top-left with safe area inset */}
            <button
              onClick={() => router.back()}
              className="fixed top-0 left-4 z-50 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-pink-500 hover:border-pink-200 transition-all"
              style={{ marginTop: 'calc(1rem + env(safe-area-inset-top))' }}
              aria-label="戻る"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Favorite button */}
            {user && user.role === 'USER' && (
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className="fixed top-0 right-4 z-50 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full border shadow-sm flex items-center justify-center transition-all"
                style={{ marginTop: 'calc(1rem + env(safe-area-inset-top))', borderColor: isFavorited ? '#f43f5e' : '#e2e8f0', color: isFavorited ? '#f43f5e' : '#94a3b8' }}
                aria-label="お気に入り"
              >
                {isFavorited ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            )}

            {/* Hero card — pink/rose gradient */}
            <GlassCard className="!p-0 overflow-hidden mb-8 relative">
              {/* Gradient hero banner */}
              <div className="relative h-44 md:h-56 bg-gradient-to-r from-pink-500 to-rose-500 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-32 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

                {/* Badges overlaid on the hero */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 border border-white/30 shadow-sm">
                    <Shield size={11}/> Verified Partner
                  </span>
                  {florist.acceptsRushOrders && (
                    <span className="px-3 py-1.5 bg-amber-400/90 backdrop-blur-md text-white text-[10px] font-black rounded-full flex items-center gap-1.5 shadow-sm border border-amber-300/50">
                      <Zap size={11} className="fill-white"/> お急ぎOK
                    </span>
                  )}
                </div>

                {/* Location badge — bottom-left of hero */}
                {florist.address && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-black rounded-full border border-white/30 shadow-sm">
                    <MapPin size={12}/> {florist.baseDeliveryArea || extractPrefecture(florist.address)}
                  </div>
                )}
              </div>

              <header className="px-8 md:px-12 pb-8 md:pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left relative">
                  {/* Florist icon — overlapping the hero */}
                  <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-white -mt-14 md:-mt-16 md:rotate-3 z-10">
                      {florist.iconUrl ? (
                          <Image src={florist.iconUrl} alt="アイコン" fill style={{objectFit: 'cover'}} />
                      ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={48} /></div>
                      )}
                  </div>

                  <div className="flex-1 min-w-0 z-10 pt-2 md:pt-4">
                      <h1 className="text-3xl md:text-5xl font-black text-slate-800 break-words tracking-tighter leading-tight"><JpText>{florist.platformName || florist.shopName}</JpText></h1>
                      <p className="text-xs md:text-sm text-slate-400 font-bold mt-1.5 uppercase tracking-widest">Professional Florist</p>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5">
                          <div className="flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-[1rem] border border-yellow-100 shadow-sm">
                            <Star className="mr-2 fill-yellow-400 text-yellow-400" size={18}/>
                            <span className="font-black text-lg">{averageRating.toFixed(1)}</span>
                            <span className="text-[10px] ml-2 font-bold opacity-60">({reviews.length} reviews)</span>
                          </div>

                          {florist.responseRate !== null && florist.responseRate !== undefined && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-[1rem] border border-emerald-100 shadow-sm">
                              <CheckCircle2 size={15} className="text-emerald-500" />
                              <span className="font-black text-sm">{florist.responseRate}%</span>
                              <span className="text-[10px] font-bold opacity-60">返答率</span>
                              {florist.avgResponseHours !== null && florist.avgResponseHours !== undefined && (
                                <span className="text-[10px] font-bold text-emerald-500 ml-1">
                                  avg {florist.avgResponseHours < 24 ? `${florist.avgResponseHours}h` : `${Math.round(florist.avgResponseHours / 24)}日`}
                                </span>
                              )}
                            </div>
                          )}

                          {isMyProfile && (
                             <Link href="/florists/dashboard" className="text-sm px-6 py-3 bg-slate-900 text-white rounded-full font-black hover:bg-slate-800 transition-all shadow-md flex items-center gap-2">
                                <Briefcase size={16}/> ダッシュボード
                             </Link>
                          )}
                          <div className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-[1rem] border border-white shadow-sm backdrop-blur-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Share</span>
                            <ShareButtons text={`フラスタ制作なら ${florist.platformName || florist.shopName} さんがおすすめ！過去の素敵な実績をチェック💐`} />
                          </div>
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
                               <motion.div
                                 initial={{ opacity: 0, y: 24 }}
                                 whileInView={{ opacity: 1, y: 0 }}
                                 viewport={{ once: true, margin: '-60px' }}
                                 transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                               >
                               <GlassCard className="relative overflow-hidden">
                                  <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                      <User className="text-pink-500" size={20}/> 自己紹介 / コンセプト
                                  </h2>
                                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base relative z-10 mb-8">
                                      <JpText>{florist.portfolio || '自己紹介文がまだ設定されていません。'}</JpText>
                                  </p>

                                  {florist.portfolioImages && florist.portfolioImages.length > 0 && (
                                      <div className="relative z-10 border-t border-slate-100 pt-6">
                                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Portfolio</h3>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                                              {florist.portfolioImages.map((url, i) => (
                                                  <div key={i} className="relative aspect-square rounded-[1rem] overflow-hidden border-2 border-white shadow-sm cursor-zoom-in group" onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}>
                                                      <Image src={url} alt={`portfolio-${i}`} fill sizes="(max-width: 768px) 50vw, 33vw" style={{objectFit: 'cover'}} className="group-hover:scale-110 transition-transform duration-500" />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}

                                  <Award className="absolute -bottom-10 -right-10 text-slate-900 opacity-[0.03] pointer-events-none" size={200}/>
                               </GlassCard>
                               </motion.div>

                               {florist.deliverySettings && (
                                   <motion.div
                                     initial={{ opacity: 0, y: 24 }}
                                     whileInView={{ opacity: 1, y: 0 }}
                                     viewport={{ once: true, margin: '-60px' }}
                                     transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                                   >
                                   <FloristDeliveryInfo deliverySettings={florist.deliverySettings} />
                                   </motion.div>
                               )}
                            </div>

                            <motion.div
                              initial={{ opacity: 0, y: 24 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: '-60px' }}
                              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
                            >
                            <GlassCard className="h-fit space-y-8">
                              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">FLASTAL Info</h2>
                              
                              <div className="space-y-4">
                                  {/* 1. 活動エリア（配送対応エリア） */}
                                  <ProfileItem icon={<Truck size={20}/>} label="活動エリア" value={florist.baseDeliveryArea || '全国対応'} colorClass="text-sky-500 bg-sky-50 border-sky-100" />
                                  
                                  {/* 2. 拠点住所（店舗のある都道府県のみ） */}
                                  <ProfileItem icon={<Store size={20}/>} label="拠点住所" value={extractPrefecture(florist.address)} colorClass="text-pink-500 bg-pink-50 border-pink-100" />
                                  
                                  <ProfileItem icon={<Clock size={20}/>} label="受付時間" value={florist.businessHours || '未設定'} colorClass="text-purple-500 bg-purple-50 border-purple-100" />
                                  <ProfileItem icon={<Zap size={20}/>} label="特急注文" value={florist.acceptsRushOrders ? '対応可能' : '要相談'} colorClass="text-amber-500 bg-amber-50 border-amber-100" />
                                  <ProfileItem icon={<Award size={20}/>} label="得意な装飾" value={Array.isArray(florist.specialties) && florist.specialties.length > 0 ? florist.specialties.join(' / ') : (florist.specialties || '未設定')} colorClass="text-emerald-500 bg-emerald-50 border-emerald-100" />
                              </div>

                              <div className="pt-6 border-t border-slate-100">
                                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                      ※詳細な所在地や連絡先は非公開です。進行の際、システム内チャットにてやり取りが可能になります。
                                  </p>
                              </div>
                            </GlassCard>
                            </motion.div>
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
                                <motion.div
                                  className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
                                  initial={{ opacity: 0, y: 24 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true, margin: '-60px' }}
                                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                >
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
                                </motion.div>
                            ) : (
                                <GlassCard className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Camera className="text-slate-300" size={32} /></div>
                                    <p className="text-slate-400 font-black tracking-widest uppercase text-xs">No works posted yet</p>
                                </GlassCard>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'reviews' && (
                        <div className="max-w-3xl mx-auto space-y-4">
                            {reviews.length > 0 ? reviews.map((review, idx) => (
                                <motion.div
                                  key={review.id}
                                  initial={{ opacity: 0, y: 24 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true, margin: '-60px' }}
                                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: idx * 0.05 }}
                                >
                                <GlassCard className="!p-6 transition-all hover:border-pink-200">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shrink-0 overflow-hidden">
                                            {review.user?.iconUrl
                                                ? <Image src={review.user.iconUrl} alt="" width={40} height={40} className="object-cover w-10 h-10" />
                                                : <User size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-black text-slate-800 text-sm block leading-tight">{review.user?.handleName || 'さん'}</span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">{new Date(review.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            {review.project && (
                                                <span className="text-[10px] text-pink-500 font-black mt-1 block truncate">
                                                    🌸 {review.project.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 relative">
                                        <span className="absolute -top-2 left-3 text-2xl text-slate-200 font-serif leading-none">"</span>
                                        <p className="text-slate-600 text-sm leading-relaxed font-medium relative z-10 pt-1"><JpText>{review.comment || '（コメントなし）'}</JpText></p>
                                    </div>
                                </GlassCard>
                                </motion.div>
                            )) : (
                                <GlassCard className="text-center py-16">
                                    <div className="text-4xl mb-3">🌸</div>
                                    <p className="font-black text-slate-400 text-sm">まだレビューがありません</p>
                                    <p className="text-xs text-slate-300 mt-1">企画完了後にプランナーからレビューが届きます</p>
                                </GlassCard>
                            )}
                        </div>
                    )}
                  </motion.div>
                </AnimatePresence>
            </div>

        </div>
      </div>

      {/* Mobile fixed bottom CTA */}
      {(!user || user.role === 'USER') && !isMyProfile && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 pt-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 font-black text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-base"
          >
            <Zap size={18} /> 制作オファーを出す
          </button>
        </div>
      )}

      <AnimatePresence>
        {isImageModalOpen && <ImageLightbox url={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
      </AnimatePresence>
      {isModalOpen && <OfferModal floristId={id} floristName={florist.platformName || florist.shopName} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}