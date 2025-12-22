'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/context/AuthContext'; // ※パスは環境に合わせて調整してください
import { 
    FiMapPin, FiPhone, FiGlobe, FiCamera, FiAward, FiClock, FiCheckCircle, 
    FiUser, FiHeart, FiStar, FiX 
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- サブコンポーネント ---

// プロフィール項目表示用ヘルパー
const ProfileItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="text-pink-500 p-2 bg-pink-50 rounded-full mr-4 mt-1 shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-base text-gray-800 font-medium break-words mt-0.5">{value}</p>
        </div>
    </div>
);

// オファー申請モーダル (簡易実装)
function OfferModal({ floristId, floristName, onClose }) {
    const router = useRouter();
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">企画をオファーする</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>
                <div className="p-6 text-center">
                    <p className="text-gray-600 mb-6">
                        <span className="font-bold text-pink-600">{floristName}</span> さんに<br/>
                        新しいフラワースタンド制作を依頼しますか？
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => router.push(`/projects/create?floristId=${floristId}`)}
                            className="w-full py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                        >
                            新規企画を作成してオファー
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            キャンセル
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
  const { user, token } = useAuth(); 
  
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile | appeal | reviews
  
  // フィルタリング用ステート
  const [activeTag, setActiveTag] = useState(null); 
  
  // 投稿リスト（いいね更新用）
  const [appealPosts, setAppealPosts] = useState([]); 

  // データ取得
  const fetchFlorist = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    
    try {
      const floristRes = await fetch(`${API_URL}/api/florists/${id}`);
      
      if (!floristRes.ok) {
          throw new Error(floristRes.status === 404 ? '指定された花屋は見つかりませんでした。' : '花屋情報の取得中にエラーが発生しました。');
      }
      
      const floristData = await floristRes.json();

       // null を空文字/空配列に変換（表示のための安全対策）
      Object.keys(floristData).forEach(key => {
          if (key === 'portfolioImages' && floristData[key] === null) {
              floristData[key] = [];
          } else if (key === 'appealPosts' && floristData[key] === null) {
               floristData[key] = [];
          } else if (floristData[key] === null) {
               floristData[key] = '';
          }
      });
      
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


  // --- いいねのトグル機能 ---
  const handleLikeToggle = async (post) => {
    if (!token || user.role === 'FLORIST' || user.role === 'VENUE') {
        toast.error("いいねをするには、一般ユーザーとしてログインしてください。");
        return;
    }
    
    if (user.id === florist.id) {
        toast.error("自分の投稿にはいいねできません。");
        return;
    }

    try {
        // UIを楽観的に更新（即時反応）
        // ※ 実際のAPIコールが失敗したら元に戻す処理を入れるのがベストですが、ここでは簡易的に実装
        
        const res = await fetch(`${API_URL}/api/florists/posts/${post.id}/like`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
            },
        });

        if (!res.ok) {
            const errorDetail = await res.json();
            throw new Error(errorDetail.message || 'いいねの処理に失敗しました。');
        }

        const data = await res.json();
        
        // ステートをAPIレスポンスに基づいて正式更新
        setAppealPosts(prevPosts => 
            prevPosts.map(p => {
                if (p.id === post.id) {
                    const isLiked = data.liked;
                    const newLikeCount = isLiked ? p._count.likes + 1 : p._count.likes - 1;
                    
                    // likes配列も更新（現在のユーザーのIDを追加/削除）
                    // 簡易的に likes 配列を操作して、currentUserがいいね済みかどうかの整合性を保つ
                    const newLikesArray = isLiked 
                        ? [...(p.likes || []), { userId: user.id }]
                        : (p.likes || []).filter(like => like.userId !== user.id);

                    return { 
                        ...p, 
                        _count: { likes: newLikeCount }, 
                        likes: newLikesArray 
                    };
                }
                return p;
            })
        );
        
        // 成功時のToastは邪魔になることがあるので、必要に応じてコメントアウト
        // toast.success(data.message);

    } catch (error) {
        console.error(error);
        toast.error(error.message || 'いいねの操作中にエラーが発生しました。');
    }
  };


  // --- タグ抽出ロジック (useMemo) ---
  const availableTags = useMemo(() => {
    const tags = new Set();
    appealPosts.forEach(post => {
        // 例: #バルーン装飾 のような形式を抽出
        const content = post.content || '';
        const matches = content.match(/#[^\s#]+/g);
        if (matches) {
            matches.forEach(match => tags.add(match.substring(1))); // # を削除して追加
        }
    });

    // Floristの得意なタグ (specialties) も追加
    if (florist && florist.specialties && typeof florist.specialties === 'string' && florist.specialties !== '未設定') {
        florist.specialties.split(/[\s,、]+/).forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag) tags.add(trimmedTag);
        });
    }
    
    return Array.from(tags).sort();
  }, [appealPosts, florist]);


  // --- フィルタリングロジック (useMemo) ---
  const filteredPosts = useMemo(() => {
    if (!activeTag) {
        return appealPosts;
    }
    
    return appealPosts.filter(post => {
        const content = post.content || '';
        if (content.includes(`#${activeTag}`)) {
            return true;
        }
        return false;
    });
  }, [appealPosts, activeTag]);


  // --- UI レンダリング ---
  
  if (loading || !florist) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
      );
  }

  const reviews = florist.reviews || [];
  const reviewCount = reviews.length;
  // ratingの計算（安全対策付き）
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviewCount
    : 0;
  
  const isMyProfile = user && user.role === 'FLORIST' && user.id === florist.id; 

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100">
          
          {/* 1. ヘッダーセクション */}
          <header className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              {/* アイコン画像 */}
              <div className="relative w-32 h-32 shrink-0 rounded-full overflow-hidden border-4 border-pink-100 shadow-md bg-white">
                  {florist.iconUrl ? (
                      <Image src={florist.iconUrl} alt={`${florist.platformName}のアイコン`} fill style={{objectFit: 'cover'}} />
                  ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <FiUser size={40} />
                      </div>
                  )}
              </div>
              
              {/* 基本情報 */}
              <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 break-words">{florist.platformName}</h1>
                  <p className="text-lg text-pink-600 font-medium mt-1">{florist.shopName || 'フラワーショップ'}</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                      <div className="flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                        <FiStar className="mr-1 fill-yellow-400 text-yellow-400"/> 
                        <span className="font-bold">{averageRating.toFixed(1)}</span>
                        <span className="text-xs ml-1 text-yellow-600/80">({reviewCount})</span>
                      </div>
                       
                      {/* 自分のプロフィールの場合は編集ボタンを表示 */}
                      {isMyProfile && (
                         <Link href="/florists/dashboard" className="text-sm px-4 py-1.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors shadow-sm">
                            ダッシュボードへ移動
                         </Link>
                      )}
                  </div>
              </div>

              {/* ヘッダーアクション (PC表示時) */}
              <div className="hidden md:block">
                 {user && !isMyProfile ? (
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 transition-transform transform hover:scale-105 shadow-md flex items-center gap-2"
                      >
                        <FiCheckCircle /> 制作を依頼する
                      </button>
                 ) : null}
              </div>
          </header>

          {/* 2. タブナビゲーション */}
          <div className="border-b border-gray-100 mt-2 mb-6">
              <nav className="flex space-x-8 overflow-x-auto pb-1">
                  {[
                      { id: 'profile', label: 'プロフィール' },
                      { id: 'appeal', label: `制作アピール (${appealPosts.length})` },
                      { id: 'reviews', label: `レビュー (${reviewCount})` }
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`whitespace-nowrap py-3 px-2 border-b-2 font-bold text-sm transition-colors ${
                            activeTab === tab.id 
                            ? 'border-pink-500 text-pink-600' 
                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                        }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </nav>
          </div>

          {/* 3. タブコンテンツ */}
          <div className="min-h-[400px]">
              
              {/* === プロフィールタブ === */}
              {activeTab === 'profile' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                      <div className="lg:col-span-2 space-y-6">
                         <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiUser className="text-pink-500"/> 自己紹介
                            </h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {florist.portfolio || 'まだ自己紹介がありません。'}
                            </p>
                         </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit space-y-5">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">店舗情報</h2>
                        <ProfileItem icon={<FiMapPin />} label="所在地" value={florist.address || '未設定'} />
                        <ProfileItem icon={<FiPhone />} label="電話番号" value={florist.phoneNumber || '未設定'} />
                        <ProfileItem 
                            icon={<FiGlobe />} 
                            label="ウェブサイト" 
                            value={florist.website ? <a href={florist.website.startsWith('http') ? florist.website : `https://${florist.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all block">{florist.website}</a> : '未設定'} 
                        />
                        <ProfileItem icon={<FiClock />} label="営業時間" value={florist.businessHours || '未設定'} />
                        <ProfileItem icon={<FiCheckCircle />} label="特急注文" value={florist.acceptsRushOrders ? '対応可能' : '不可'} />
                        <ProfileItem icon={<FiAward />} label="得意な装飾" value={florist.specialties || '未設定'} />
                      </div>
                  </div>
              )}
              
              {/* === 制作アピールタブ (ギャラリー) === */}
              {activeTab === 'appeal' && (
                  <div className="animate-fadeIn">
                      
                      {/* タグフィルター UI */}
                      {availableTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-8">
                              <button 
                                  onClick={() => setActiveTag(null)} 
                                  className={`px-4 py-1.5 text-sm rounded-full font-bold transition-all border ${
                                      !activeTag 
                                      ? 'bg-pink-600 text-white border-pink-600 shadow-md' 
                                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                  }`}
                              >
                                  すべて
                              </button>
                              {availableTags.map(tag => (
                                  <button 
                                      key={tag}
                                      onClick={() => setActiveTag(tag)} 
                                      className={`px-4 py-1.5 text-sm rounded-full font-bold transition-all border ${
                                          activeTag === tag 
                                          ? 'bg-pink-600 text-white border-pink-600 shadow-md' 
                                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                      }`}
                                  >
                                      #{tag}
                                  </button>
                              ))}
                          </div>
                      )}

                      {filteredPosts.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                              {filteredPosts.map(post => {
                                  // ログインユーザーが既にいいねしているかチェック
                                  const isLikedByCurrentUser = user && post.likes && post.likes.some(like => like.userId === user.id);
                                  
                                  return (
                                      <div key={post.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                                          <div className="relative aspect-square bg-gray-100">
                                              {post.imageUrl ? (
                                                  <Image 
                                                      src={post.imageUrl} 
                                                      alt={post.content ? post.content.substring(0, 50) : '作品画像'} 
                                                      fill
                                                      sizes="(max-width: 768px) 50vw, 33vw"
                                                      style={{ objectFit: 'cover' }}
                                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                  />
                                              ) : (
                                                  <div className="flex items-center justify-center w-full h-full text-gray-300">
                                                      <FiCamera size={32} />
                                                  </div>
                                              )}
                                              
                                              {/* オーバーレイ (テキスト) */}
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                                  <p className="text-white text-xs line-clamp-2">{post.content}</p>
                                              </div>

                                              {/* いいねボタン */}
                                              <button 
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleLikeToggle(post);
                                                  }}
                                                  disabled={isMyProfile || !token} 
                                                  className={`absolute top-2 right-2 p-2 rounded-full flex items-center gap-1 transition-all shadow-sm z-10 ${
                                                      isLikedByCurrentUser 
                                                          ? 'bg-red-500 text-white hover:bg-red-600' 
                                                          : 'bg-white/90 text-gray-500 hover:bg-white hover:text-red-500'
                                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                              >
                                                  <FiHeart size={16} fill={isLikedByCurrentUser ? 'currentColor' : 'none'}/>
                                                  <span className="font-bold text-xs">{post._count?.likes || 0}</span>
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                                  <FiCamera className="w-8 h-8 text-gray-300" />
                              </div>
                              <p className="text-gray-500 font-bold mb-1">
                                  {activeTag ? `#${activeTag} の作品は見つかりませんでした` : 'まだ作品が公開されていません'}
                              </p>
                          </div>
                      )}
                  </div>
              )}
              
              {/* === レビュータブ === */}
              {activeTab === 'reviews' && (
                  <div className="animate-fadeIn max-w-3xl mx-auto">
                      <div className="space-y-6">
                           {reviews.length > 0 ? reviews.map(review => {
                                if (!review || !review.id) return null;
                                return ( 
                                    <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                    <FiUser size={14} />
                                                </div>
                                                <span className="font-bold text-gray-700">{review.user?.handleName || 'ゲストユーザー'}</span>
                                            </div>
                                            <div className="flex text-yellow-400 text-sm">
                                                {[...Array(5)].map((_, i) => (
                                                    <FiStar key={i} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {review.project && (
                                            <Link href={`/projects/${review.project.id}`} className="inline-block mb-3 px-3 py-1 bg-sky-50 text-sky-700 text-xs rounded-lg hover:bg-sky-100 transition-colors">
                                                企画: {review.project.title || 'タイトルなし'}
                                            </Link>
                                        )}
                                        
                                        {review.comment && (
                                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl">
                                                {review.comment}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 text-right mt-3">
                                            {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    まだレビューがありません。
                                </div>
                            )}
                      </div>
                  </div>
              )}

          </div>

          {/* フッターアクション (モバイル用) */}
          <div className="md:hidden sticky bottom-4 z-30 mt-8">
            {user && !isMyProfile ? ( 
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full px-6 py-4 font-bold text-white bg-green-500 rounded-full shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={20} /> このお花屋さんに依頼する
              </button>
            ) : !user ? (
              <div className="p-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg text-center">
                <p className="text-sm text-gray-600 mb-2">依頼するにはログインが必要です</p>
                <Link href="/login" className="block w-full py-2 bg-pink-600 text-white text-sm font-bold rounded-lg">
                  ログイン・登録
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isModalOpen && (
          <OfferModal 
            floristId={id} 
            floristName={florist.platformName} 
            onClose={() => setIsModalOpen(false)} 
          />
      )}
    </>
  );
}