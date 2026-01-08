'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'; 
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiMapPin, FiCamera, FiAward, FiClock, FiCheckCircle, 
    FiUser, FiHeart, FiStar, FiX, FiShield, FiZap, FiAlertCircle, FiSearch, FiLoader
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- サブコンポーネント ---

// プロフィール項目表示用 (デザイン統一のためカード内では使わないが、詳細ページ用として維持)
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

// オファー申請モーダル (ロジック完全維持)
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

// --- メインページコンポーネント (一覧表示用に最適化しつつロジック維持) ---

function FloristListContent() { 
  const { user, token, logout } = useAuth(); 
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  // 一覧取得用ロジック (詳細取得ロジックを一覧用に拡張)
  const fetchFlorists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/florists`);
      if (res.ok) {
        const data = await res.json();
        // 各データに対して住所パース処理を適用 (提示コードのロジックを適用)
        const processedData = data.map(f => {
            if (f.address) {
                const prefMatch = f.address.match(/^(?:東京都|道庁所在地|.{2,3}府|.{2,3}県)/);
                f.displayPrefecture = prefMatch ? prefMatch[0] : f.address;
            }
            return f;
        });
        setFlorists(processedData);
      } else {
         throw new Error('一覧の取得に失敗しました');
      }
    } catch (error) {
        console.error(error);
        toast.error('お花屋さんデータの取得に失敗しました'); 
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlorists();
  }, [fetchFlorists]);

  // フィルタリングロジック
  const filteredFlorists = useMemo(() => {
    return florists.filter(f => {
      const nameMatch = (f.platformName || f.shopName || '').toLowerCase().includes(keyword.toLowerCase());
      const specMatch = Array.isArray(f.specialties) 
          ? f.specialties.some(s => s.toLowerCase().includes(keyword.toLowerCase()))
          : (f.specialties || '').toLowerCase().includes(keyword.toLowerCase());
      return nameMatch || specMatch;
    });
  }, [florists, keyword]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダーセクション */}
        <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">お花屋さんを探す</h1>
            <p className="text-gray-500 text-sm">あなたの想いをカタチにする、プロフェッショナルな制作者たち</p>
        </div>

        {/* 検索バー */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-10">
          <div className="relative max-w-2xl">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="店舗名、得意な装飾（バルーン, 連結など）で検索..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-white rounded-2xl h-80 shadow-sm border border-gray-100 animate-pulse">
                     <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                     <div className="p-5 space-y-3">
                         <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                         <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                     </div>
                 </div>
             ))}
          </div>
        ) : filteredFlorists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {filteredFlorists.map((florist) => {
               // 提示コードの評価計算ロジック
               const reviews = florist.reviews || [];
               const averageRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length : 0;
               
               return (
                <Link key={florist.id} href={`/florists/${florist.id}`} className="group h-full block">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative">
                    
                    {/* ポートフォリオ画像エリア */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {florist.portfolioImages?.[0] ? (
                            <Image 
                                src={florist.portfolioImages[0]} 
                                alt="Portfolio" fill style={{ objectFit: 'cover' }}
                                className="group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                <FiCamera size={40} className="opacity-50" />
                            </div>
                        )}
                        <div className="absolute top-3 right-3">
                            <span className="bg-white/90 backdrop-blur text-pink-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-pink-100">
                                <FiShield size={10}/> VERIFIED
                            </span>
                        </div>
                    </div>
                    
                    {/* 詳細情報エリア */}
                    <div className="p-5 flex flex-col flex-grow relative">
                        {/* アイコン（浮かせるデザイン） */}
                        <div className="absolute -top-10 left-5 w-16 h-16 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                            {florist.iconUrl ? (
                                <Image src={florist.iconUrl} alt="Icon" fill style={{objectFit: 'cover'}} />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-gray-300"><FiUser size={24}/></div>
                            )}
                        </div>

                        <div className="mt-6">
                            <h2 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1 mb-1">
                                {florist.platformName || florist.shopName}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Professional Artist</p>
                        </div>

                        <div className="space-y-2 mb-4 flex-grow">
                            <p className="text-xs text-gray-500 flex items-center">
                                <FiMapPin className="mr-1.5 text-indigo-400 shrink-0"/> 
                                {florist.displayPrefecture || '全国対応'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(Array.isArray(florist.specialties) ? florist.specialties : []).slice(0, 3).map((s, i) => (
                                    <span key={i} className="text-[10px] bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 font-bold">#{s}</span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center text-yellow-500 font-black text-sm">
                                <FiStar className="mr-1 fill-yellow-500"/>
                                {averageRating.toFixed(1)}
                                <span className="text-gray-300 font-bold ml-1 text-[10px]">({reviews.length})</span>
                            </div>
                            <div className="flex gap-2">
                                {florist.acceptsRushOrders && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5">
                                        <FiZap size={10} className="fill-amber-600"/> 特急OK
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>
                </Link>
               );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <FiAlertCircle size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">お花屋さんが見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FloristListPage() { 
  return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50"><FiLoader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"/></div>}>
          <FloristsListContent />
      </Suspense>
  );
}