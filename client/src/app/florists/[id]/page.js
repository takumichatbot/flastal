'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiMapPin, FiCamera, FiAward, FiClock, FiCheckCircle, 
    FiUser, FiHeart, FiStar, FiX, FiShield, FiZap, FiAlertCircle
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- サブコンポーネント ---

const ProfileItem = ({ icon, label, value, colorClass = "text-pink-500 bg-pink-50" }) => (
    <div className="flex items-start">
        <div className={`${colorClass} p-2 rounded-full mr-4 mt-1 shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-base text-gray-800 font-bold break-words mt-0.5">{value || '未設定'}</p>
        </div>
    </div>
);

function OfferModal({ floristId, floristName, onClose }) {
    const router = useRouter();
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm p-4 animate-fadeIn z-[9999] flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">制作オファーを出す</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAward size={32} />
                    </div>
                    <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                        <span className="font-bold text-gray-900">{floristName}</span> さんに<br/>
                        あなたの応援企画への参加を依頼します。<br/>
                        <span className="text-xs text-gray-400">※決済や進行はFLASTALが仲介し、安全を担保します</span>
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => router.push(`/projects/create?floristId=${floristId}`)}
                            className="w-full py-4 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 active:scale-95"
                        >
                            このお花屋さんで企画を立てる
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                        >
                            戻る
                        </button>
                    </div>
                </div>
            </div>
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
  const [activeTab, setActiveTab] = useState('profile'); 
  const [appealPosts, setAppealPosts] = useState([]); 
  const [activeTag, setActiveTag] = useState(null); 

  const fetchFlorist = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const floristRes = await fetch(`${API_URL}/api/florists/${id}`);
      if (!floristRes.ok) throw new Error('お花屋さんの取得に失敗しました');
      
      const floristData = await floristRes.json();
      
      if (floristData && floristData.address) {
          const prefMatch = floristData.address.match(/^(?:東京都|道庁所在地|.{2,3}府|.{2,3}県)/);
          floristData.displayPrefecture = prefMatch ? prefMatch[0] : floristData.address;
      }

      setFlorist(floristData);
      setAppealPosts(floristData.appealPosts || []);
    } catch (error) {
        console.error(error);
        toast.error(error.message); 
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFlorist();
  }, [fetchFlorist]);

  const handleLikeToggle = async (post) => {
    if (!token || !user) {
        toast.error("ログインが必要です。");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/florists/posts/${post.id}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.status === 401) {
            toast.error("セッションが切れました。再度ログインしてください。");
            logout();
            return;
        }

        if (!res.ok) throw new Error('失敗');
        const data = await res.json();
        setAppealPosts(prev => prev.map(p => {
            if (p.id === post.id) {
                const isLiked = data.liked;
                const newCount = isLiked ? (p._count?.likes || 0) + 1 : Math.max(0, (p._count?.likes || 0) - 1);
                const newLikes = isLiked 
                    ? [...(p.likes || []), { userId: user.id }] 
                    : (p.likes || []).filter(l => l.userId !== user.id);
                return { ...p, _count: { ...p._count, likes: newCount }, likes: newLikes };
            }
            return p;
        }));
    } catch (error) {
        toast.error('エラーが発生しました');
    }
  };

  const availableTags = useMemo(() => {
    const tags = new Set();
    appealPosts.forEach(post => {
        const matches = (post.content || '').match(/#[^\s#]+/g);
        if (matches) matches.forEach(m => tags.add(m.substring(1)));
    });
    if (florist?.specialties && florist.specialties !== '未設定') {
        florist.specialties.split(/[\s,、]+/).forEach(t => tags.add(t.trim()));
    }
    return Array.from(tags).sort();
  }, [appealPosts, florist]);

  const filteredPosts = useMemo(() => {
    if (!activeTag) return appealPosts;
    return appealPosts.filter(p => (p.content || '').includes(`#${activeTag}`));
  }, [appealPosts, activeTag]);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
      );
  }

  if (!florist) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-6">
            <FiAlertCircle size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Florist Not Found</h2>
            <Link href="/florists" className="text-pink-500 font-bold hover:underline">お花屋さん一覧へ戻る</Link>
        </div>
    );
  }

  const reviews = florist.reviews || [];
  const averageRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length : 0;
  // 安全なアクセス：user?.id を使用
  const isMyProfile = user && user.role === 'FLORIST' && user.id === florist.id; 

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto bg-white rounded-[40px] shadow-2xl p-6 md:p-12 border border-slate-100 overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400"></div>

          <header className="mb-12 flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
              <div className="relative w-40 h-40 shrink-0 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-white md:rotate-3">
                  {florist.iconUrl ? (
                      <Image src={florist.iconUrl} alt="アイコン" fill style={{objectFit: 'cover'}} />
                  ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-gray-300">
                          <FiUser size={60} />
                      </div>
                  )}
              </div>
              
              <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                          <FiShield size={12}/> Verified Artist
                      </span>
                  </div>
                  <h1 className="text-4xl font-black text-gray-900 break-words tracking-tight leading-tight">{florist.platformName || florist.shopName}</h1>
                  <p className="text-lg text-slate-400 font-bold mt-1">Professional Florist Partner</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                      <div className="flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-2xl border border-yellow-100 shadow-sm">
                        <FiStar className="mr-2 fill-yellow-400 text-yellow-400"/> 
                        <span className="font-black text-lg">{averageRating.toFixed(1)}</span>
                        <span className="text-xs ml-2 font-bold opacity-60">({reviews.length} reviews)</span>
                      </div>
                       
                      {isMyProfile && (
                         <Link href="/florists/dashboard" className="text-sm px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                            ダッシュボード
                         </Link>
                      )}
                  </div>
              </div>

              <div className="hidden md:block">
                 {(!user || user.role === 'USER') && !isMyProfile ? (
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-4 font-black text-white bg-pink-600 rounded-2xl hover:bg-pink-700 transition-all transform hover:-translate-y-1 shadow-xl shadow-pink-200 flex items-center gap-2"
                      >
                        <FiZap /> 制作オファー
                      </button>
                 ) : null}
              </div>
          </header>

          <div className="border-b border-gray-100 mb-10">
              <nav className="flex space-x-10 overflow-x-auto no-scrollbar pb-1">
                  {[
                      { id: 'profile', label: 'プロフィール' },
                      { id: 'appeal', label: `制作実績 (${appealPosts.length})` },
                      { id: 'reviews', label: `評価 (${reviews.length})` }
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`whitespace-nowrap py-4 px-2 border-b-4 font-black text-sm tracking-widest uppercase transition-all ${
                            activeTab === tab.id 
                            ? 'border-pink-500 text-pink-600 scale-110' 
                            : 'border-transparent text-gray-300 hover:text-gray-500'
                        }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </nav>
          </div>

          <div className="min-h-[500px]">
              {activeTab === 'profile' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fadeIn">
                      <div className="lg:col-span-2 space-y-8">
                         <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative">
                            <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                                <FiUser className="text-pink-500"/> 自己紹介 / コンセプト
                            </h2>
                            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed font-medium text-sm md:text-base">
                                {florist.portfolio || '自己紹介文がまだ設定されていません。'}
                            </p>
                            <div className="absolute top-8 right-8 opacity-5 text-gray-900 pointer-events-none">
                                <FiAward size={120} />
                            </div>
                         </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-inner h-fit space-y-8">
                        <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tighter">FLASTAL 登録情報</h2>
                        
                        <div className="space-y-6">
                            <ProfileItem 
                                icon={<FiMapPin />} 
                                label="主な活動エリア" 
                                value={florist.displayPrefecture || '全国対応'} 
                                colorClass="text-sky-500 bg-sky-50"
                            />
                            <ProfileItem 
                                icon={<FiClock />} 
                                label="オーダー受付時間" 
                                value={florist.businessHours} 
                                colorClass="text-purple-500 bg-purple-50"
                            />
                            <ProfileItem 
                                icon={<FiZap />} 
                                label="特急注文 (1週間以内)" 
                                value={florist.acceptsRushOrders ? '対応可能' : '要相談'} 
                                colorClass="text-amber-500 bg-amber-50"
                            />
                            <ProfileItem 
                                icon={<FiAward />} 
                                label="得意な装飾・スキル" 
                                value={florist.specialties} 
                                colorClass="text-emerald-500 bg-emerald-50"
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                                ※プライバシー保護のため、詳細な所在地や連絡先は非公開です。制作進行の際、システム内チャットにて詳細なやり取りが可能になります。
                            </p>
                        </div>
                      </div>
                  </div>
              )}
              
              {activeTab === 'appeal' && (
                  <div className="animate-fadeIn">
                      {availableTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-10">
                              <button 
                                  onClick={() => setActiveTag(null)} 
                                  className={`px-5 py-2 text-xs rounded-xl font-black tracking-widest uppercase transition-all ${
                                      !activeTag ? 'bg-gray-900 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                                  }`}
                              >
                                  All Works
                              </button>
                              {availableTags.map(tag => (
                                  <button 
                                      key={tag}
                                      onClick={() => setActiveTag(tag)} 
                                      className={`px-5 py-2 text-xs rounded-xl font-black tracking-widest uppercase transition-all ${
                                          activeTag === tag ? 'bg-pink-600 text-white shadow-xl shadow-pink-100' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
                                      }`}
                                  >
                                      #{tag}
                                  </button>
                              ))}
                          </div>
                      )}

                      {filteredPosts.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                              {filteredPosts.map(post => {
                                  const isLiked = user && post.likes?.some(l => l.userId === user.id);
                                  return (
                                      <div key={post.id} className="group relative aspect-square bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                                          {post.imageUrl && (
                                              <Image src={post.imageUrl} alt="作品" fill sizes="(max-width: 768px) 33vw, 50vw" style={{objectFit: 'cover'}} className="transition-transform duration-700 group-hover:scale-110" />
                                          )}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                              <p className="text-white text-xs font-bold leading-relaxed line-clamp-3">{post.content}</p>
                                          </div>
                                          <button 
                                              onClick={(e) => {
                                                  e.preventDefault();
                                                  handleLikeToggle(post);
                                              }}
                                              className={`absolute top-4 right-4 p-3 rounded-2xl backdrop-blur-md transition-all z-20 ${
                                                  isLiked ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-gray-400 hover:text-red-500'
                                              }`}
                                          >
                                              <FiHeart size={18} fill={isLiked ? 'currentColor' : 'none'}/>
                                          </button>
                                      </div>
                                  );
                              })}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                              <FiCamera className="w-16 h-16 text-slate-200 mb-4" />
                              <p className="text-slate-400 font-black tracking-widest uppercase text-sm">No works posted yet</p>
                          </div>
                      )}
                  </div>
              )}
              
              {activeTab === 'reviews' && (
                  <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
                       {reviews.length > 0 ? reviews.map(review => (
                            <div key={review.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                            <FiUser size={24} />
                                        </div>
                                        <div>
                                            <span className="font-black text-gray-800 block leading-none">{review.user?.handleName || 'Guest'}</span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-1 block uppercase tracking-tighter">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex text-yellow-400 gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <FiStar key={i} fill={i < review.rating ? "currentColor" : "none"} size={16}/>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl italic">
                                    &quot;{review.comment}&quot;
                                </p>
                            </div>
                        )) : (
                            <div className="text-center py-20 text-slate-300 font-black tracking-widest uppercase bg-slate-50 rounded-[3rem]">No reviews found</div>
                        )}
                  </div>
              )}
          </div>

          <div className="md:hidden sticky bottom-4 z-30 mt-12">
            {(!user || user.role === 'USER') && !isMyProfile ? ( 
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-5 font-black text-white bg-pink-600 rounded-3xl shadow-2xl shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <FiZap size={24} /> 制作オファーを出す
              </button>
            ) : !user ? (
              <div className="p-6 bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Login required for orders</p>
                <Link href="/login" className="block w-full py-4 bg-gray-900 text-white font-bold rounded-2xl">
                  ログインして依頼する
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isModalOpen && (
          <OfferModal 
            floristId={id} 
            floristName={florist.platformName || florist.shopName} 
            onClose={() => setIsModalOpen(false)} 
          />
      )}
    </>
  );
}