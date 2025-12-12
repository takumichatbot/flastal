'use client';

import { useState, useEffect, useCallback, useMemo } from 'react'; // ★ useMemoを追加
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/app/contexts/AuthContext'; 
import { 
    FiMapPin, FiPhone, FiGlobe, FiCamera, FiAward, FiClock, FiCheckCircle, 
    FiUser, FiHeart, FiStar 
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// オファー用のモーダルコンポーネント (既存ロジックは省略)
function OfferModal({ floristId, onClose }) { /* ... */ return null; }

// ヘルパーコンポーネント (ProfileItem)
const ProfileItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="text-pink-500 p-2 bg-pink-50 rounded-full mr-4 mt-1">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-base text-gray-800 font-bold break-words">{value}</p>
        </div>
    </div>
);

// メインのページコンポーネント
export default function FloristDetailPage() { 
  const { id } = useParams();
  const { user, token } = useAuth(); 
  
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // ★ 選択中のタグを保持
  const [activeTag, setActiveTag] = useState(null); 
  
  // いいねの状態管理を含む投稿リスト
  const [appealPosts, setAppealPosts] = useState([]); 

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


  // ★★★ いいねのトグル機能 ★★★
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
        const toastId = toast.loading('処理中...');
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
        
        // UIを更新
        setAppealPosts(prevPosts => 
            prevPosts.map(p => {
                if (p.id === post.id) {
                    const isLiked = data.liked;
                    const newLikeCount = isLiked ? p._count.likes + 1 : p._count.likes - 1;
                    
                    // likes配列も更新（現在のユーザーのIDを追加/削除）
                    const newLikesArray = isLiked 
                        ? [...p.likes, { userId: user.id }]
                        : p.likes.filter(like => like.userId !== user.id);

                    return { 
                        ...p, 
                        _count: { likes: newLikeCount }, 
                        likes: newLikesArray 
                    };
                }
                return p;
            })
        );
        
        toast.success(data.message, { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error(error.message || 'いいねの操作中にエラーが発生しました。');
    }
  };


  // ★★★ 新規追加: すべての投稿から一意なタグを抽出 ★★★
  const availableTags = useMemo(() => {
    const tags = new Set();
    appealPosts.forEach(post => {
        // 例: #バルーン装飾 のような形式を抽出
        const matches = post.content.match(/#[^\s#]+/g);
        if (matches) {
            matches.forEach(match => tags.add(match.substring(1))); // # を削除して追加
        }
    });

    // Floristの得意なタグ (specialties) も追加 (カンマ、スペース、読点で分割)
    if (florist && florist.specialties && typeof florist.specialties === 'string' && florist.specialties !== '未設定') {
        florist.specialties.split(/[\s,、]+/).forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag) tags.add(trimmedTag);
        });
    }
    
    return Array.from(tags).sort();
  }, [appealPosts, florist]);


  // ★★★ 新規追加: フィルタリングロジック ★★★
  const filteredPosts = useMemo(() => {
    if (!activeTag) {
        return appealPosts;
    }
    
    return appealPosts.filter(post => {
        // post.content に #タグ が含まれているかチェック
        if (post.content && post.content.includes(`#${activeTag}`)) {
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
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;
  
  const isMyProfile = user && user.role === 'FLORIST' && user.id === florist.id; 

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          
          {/* 1. ヘッダーセクション */}
          <header className="mb-6">
              <div className="flex items-center gap-6">
                  {/* アイコン画像 */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-pink-100 shadow-md">
                      {florist.iconUrl ? (
                          <Image src={florist.iconUrl} alt={`${florist.platformName}のアイコン`} fill style={{objectFit: 'cover'}} />
                      ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl">
                              <FiUser />
                          </div>
                      )}
                  </div>
                  
                  {/* 基本情報 */}
                  <div>
                      <h1 className="text-3xl font-bold text-gray-900">{florist.platformName}</h1>
                      <p className="text-sm text-pink-600 font-medium mt-1">{florist.shopName || 'フラワーショップ'}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-semibold text-yellow-500 flex items-center">
                            <FiStar className="mr-1"/> {averageRating.toFixed(1)}
                          </span>
                           <span className="text-sm text-gray-500">({reviewCount}件)</span>
                           
                          {/* 自分のプロフィールの場合は編集ボタンを表示 */}
                          {isMyProfile && (
                             <Link href="/florists/dashboard" className="text-xs ml-4 px-3 py-1 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors">
                                ダッシュボードへ
                             </Link>
                          )}
                      </div>
                  </div>
              </div>
          </header>

          {/* 2. タブナビゲーション */}
          <div className="border-b border-gray-200 mt-6">
              <nav className="-mb-px flex space-x-8">
                  <button onClick={() => setActiveTab('profile')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'profile' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      プロフィール
                  </button>
                  <button onClick={() => setActiveTab('appeal')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'appeal' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      制作アピール ({appealPosts.length})
                  </button>
                  <button onClick={() => setActiveTab('reviews')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'reviews' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      レビュー ({reviewCount})
                  </button>
              </nav>
          </div>

          {/* 3. タブコンテンツ */}
          <div className="py-6">
              
              {/* === プロフィールタブ === */}
              {activeTab === 'profile' && (
                  <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-800 border-b pb-3">自己紹介</h2>
                      <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{florist.portfolio || 'まだ自己紹介がありません。'}</p>

                      <h2 className="text-xl font-bold text-gray-800 border-b pb-3 pt-4">連絡先・専門性</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                        <ProfileItem icon={<FiMapPin />} label="所在地" value={florist.address || '未設定'} />
                        <ProfileItem icon={<FiPhone />} label="電話番号" value={florist.phoneNumber || '未設定'} />
                        <ProfileItem icon={<FiGlobe />} label="ウェブサイト" value={florist.website ? <a href={florist.website.startsWith('http') ? florist.website : `https://${florist.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{florist.website}</a> : '未設定'} />
                        <ProfileItem icon={<FiClock />} label="営業時間" value={florist.businessHours || '未設定'} />
                        <ProfileItem icon={<FiCheckCircle />} label="特急注文" value={florist.acceptsRushOrders ? '対応可能' : '不可'} />
                        {/* specialties は ProfileItem 内で文字列表示 */}
                        <ProfileItem icon={<FiAward />} label="得意な装飾" value={florist.specialties || '未設定'} />
                      </div>
                  </div>
              )}
              
              {/* === 制作アピールタブ (ギャラリー) === */}
              {activeTab === 'appeal' && (
                  <div className="space-y-6">
                      
                      {/* ★★★ タグフィルター UI ★★★ */}
                      {availableTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                              <button 
                                  onClick={() => setActiveTag(null)} 
                                  className={`px-3 py-1 text-sm rounded-full font-bold transition-colors ${!activeTag ? 'bg-pink-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                  すべて ({appealPosts.length})
                              </button>
                              {availableTags.map(tag => (
                                  <button 
                                      key={tag}
                                      onClick={() => setActiveTag(tag)} 
                                      className={`px-3 py-1 text-sm rounded-full font-bold transition-colors ${activeTag === tag ? 'bg-pink-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                  >
                                      #{tag}
                                  </button>
                              ))}
                          </div>
                      )}

                      {filteredPosts.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {filteredPosts.map(post => { // ★ フィルタリングされたリストを使用
                                  // ログインユーザーが既にいいねしているかチェック
                                  const isLikedByCurrentUser = user && post.likes.some(like => like.userId === user.id);
                                  
                                  return (
                                      <div key={post.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group">
                                          <div className="relative aspect-square bg-gray-200">
                                              {post.imageUrl && (
                                                  <Image 
                                                      src={post.imageUrl} 
                                                      alt={post.content.substring(0, 50)} 
                                                      fill
                                                      sizes="(max-width: 768px) 50vw, 33vw"
                                                      style={{ objectFit: 'cover' }}
                                                      className="w-full h-full object-cover" 
                                                  />
                                              )}
                                              {/* いいねボタンとカウント */}
                                              <button 
                                                  onClick={() => handleLikeToggle(post)}
                                                  disabled={isMyProfile || !token} // 自分の投稿、または未ログイン/不適切なアカウントは無効
                                                  className={`absolute bottom-2 right-2 p-2 rounded-full flex items-center gap-1 transition-all ${
                                                      isLikedByCurrentUser 
                                                          ? 'bg-red-500 text-white hover:bg-red-600' 
                                                          : 'bg-white/80 text-gray-700 hover:bg-white'
                                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                              >
                                                  <FiHeart size={16} fill={isLikedByCurrentUser ? 'white' : 'none'}/>
                                                  <span className="font-bold text-sm">{post._count.likes}</span>
                                              </button>
                                          </div>
                                          <div className="p-3">
                                              <p className="text-sm text-gray-700 line-clamp-3">
                                                  {post.content}
                                              </p>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      ) : (
                          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                              <p className="text-gray-500 font-bold mb-2 text-xl">
                                  {activeTag ? `#${activeTag}の作品` : '公開された作品'} は見つかりませんでした。
                              </p>
                              <p className="text-sm text-gray-400 mt-1">お花屋さんが公開設定にすると、ここに作品が表示されます。</p>
                          </div>
                      )}
                  </div>
              )}
              
              {/* === レビュータブ === */}
              {activeTab === 'reviews' && (
                  <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-800 border-b pb-3">レビュー ({reviewCount}件)</h2>
                      <div className="space-y-6">
                           {reviews.length > 0 ? reviews.map(review => (
                                review && review.id && review.user && review.project ? ( 
                                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-gray-700">{review.user.handleName || '匿名'}</span>
                                            <span className="font-semibold text-yellow-500">{review.rating} ★</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">
                                            企画名: <Link href={`/projects/${review.project.id}`}><span className="text-sky-600 hover:underline">{review.project.title || '不明な企画'}</span></Link>
                                        </p>
                                        {review.comment && <p className="text-gray-800 bg-gray-50 p-3 rounded whitespace-pre-wrap">{review.comment}</p>}
                                        <p className="text-xs text-gray-400 text-right mt-1">{new Date(review.createdAt).toLocaleDateString('ja-JP')}</p>
                                    </div>
                                ) : null
                            )) : (
                                <p className="text-gray-500 py-4 text-center">まだレビューがありません。</p>
                            )}
                      </div>
                  </div>
              )}

          </div>

          <div className="text-center border-t pt-8 mt-6">
            {/* 企画オファーボタン */}
            {user ? ( 
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 shadow-md"
              >
                このお花屋さんに企画をオファーする
              </button>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg inline-block">
                <p className="text-gray-700">企画をオファーするには、ログインしてください。</p>
                <Link href="/login">
                  <span className="mt-2 inline-block text-blue-500 hover:underline font-semibold">ログインページへ</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && <OfferModal floristId={id} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}