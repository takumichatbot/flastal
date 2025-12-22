'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  FiClock, 
  FiCheck, 
  FiFileText, 
  FiLogOut, 
  FiRefreshCw, 
  FiHelpCircle,
  FiHome
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PendingApprovalPage() {
  const { user, logout, isApproved, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  // 承認済みならダッシュボードへリダイレクト
  useEffect(() => {
    if (!authLoading && isApproved) {
      toast.success('審査が完了しています！ダッシュボードへ移動します。');
      router.push('/florists/dashboard');
    }
  }, [authLoading, isApproved, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/florists/login');
      toast.success('ログアウトしました');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = () => {
    setIsChecking(true);
    // 画面をリロードして最新のステータス（AuthContext）を取得し直す
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
      
      {/* メインカード */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transform transition-all">
        
        {/* 上部アクセントカラー */}
        <div className="h-3 w-full bg-gradient-to-r from-pink-400 to-pink-600"></div>

        <div className="p-8 md:p-10 text-center">
          
          {/* アイコンアニメーション */}
          <div className="mx-auto w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6 relative">
             <div className="absolute inset-0 rounded-full border-4 border-pink-100 animate-ping opacity-20"></div>
             <FiClock className="w-10 h-10 text-pink-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            審査を行っております
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            ご登録ありがとうございます。<br/>
            現在、運営事務局にて登録内容の確認を行っております。<br/>
            通常<span className="font-bold text-pink-600">24時間以内</span>に審査結果をメールにてお知らせいたします。
          </p>

          {/* ステップインジケーター */}
          <div className="flex items-center justify-between mb-10 px-2 relative">
             {/* 連結線 */}
             <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
             
             {/* ステップ1 */}
             <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm shadow-sm">
                   <FiCheck />
                </div>
                <span className="text-xs font-bold text-gray-400">申請完了</span>
             </div>

             {/* ステップ2 (Active) */}
             <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg shadow-lg ring-4 ring-pink-50">
                   <FiClock className="animate-pulse" />
                </div>
                <span className="text-xs font-bold text-pink-600">審査中</span>
             </div>

             {/* ステップ3 */}
             <div className="flex flex-col items-center gap-2 bg-white px-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm">
                   <FiFileText />
                </div>
                <span className="text-xs font-bold text-gray-400">利用開始</span>
             </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
             <button 
                onClick={handleRefresh}
                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2"
             >
                {isChecking ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <FiRefreshCw />}
                ステータスを再確認する
             </button>
             
             <div className="grid grid-cols-2 gap-4">
               <Link href="/" className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                  <FiHome size={16} /> トップページ
               </Link>
               <button 
                  onClick={handleLogout} 
                  className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2 text-sm"
               >
                  <FiLogOut size={16} /> ログアウト
               </button>
             </div>
          </div>

        </div>
        
        {/* フッターインフォ */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <FiHelpCircle /> 審査についてご不明な点は <a href="/contact" className="text-pink-600 underline hover:text-pink-700">お問い合わせ</a> ください
           </p>
        </div>
      </div>
      
      <p className="mt-6 text-xs text-gray-400">
         ID: {user?.uid || user?.id || 'Unknown'}
      </p>
    </div>
  );
}