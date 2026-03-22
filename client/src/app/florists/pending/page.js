'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// lucide-reactに統一
import { Clock, Check, FileText, LogOut, RefreshCw, HelpCircle, Home, Loader2, Sparkles } from 'lucide-react';

// ふわふわ浮かぶパーティクル
const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

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
      <div className="flex items-center justify-center min-h-screen bg-pink-50/50">
          <Loader2 className="animate-spin text-pink-500 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-sky-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      
      {/* 背景のぼんやりした光 */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      {/* メインカード */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgba(244,114,182,0.15)] overflow-hidden border border-white relative z-10"
      >
        
        {/* 上部アクセントカラー */}
        <div className="h-3 w-full bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400"></div>

        <div className="p-8 md:p-10 text-center">
          
          {/* アイコンアニメーション */}
          <div className="mx-auto w-24 h-24 bg-pink-50 rounded-[1.5rem] flex items-center justify-center mb-6 relative border border-white shadow-sm rotate-3">
             <div className="absolute inset-0 rounded-[1.5rem] border-4 border-pink-100 animate-ping opacity-30"></div>
             <Clock className="w-10 h-10 text-pink-500" />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter">
            審査を行っております
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            ご登録ありがとうございます。<br/>
            現在、運営事務局にて登録内容の確認を行っております。<br/>
            通常<span className="font-black text-pink-600">24時間以内</span>に審査結果をメールにてお知らせいたします。
          </p>

          {/* ステップインジケーター */}
          <div className="flex items-center justify-between mb-10 px-2 relative">
             {/* 連結線 */}
             <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
             
             {/* ステップ1 */}
             <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-sm border-2 border-white">
                   <Check size={16}/>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">申請完了</span>
             </div>

             {/* ステップ2 (Active) */}
             <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg shadow-lg ring-4 ring-pink-100 border-2 border-white">
                   <Clock size={20} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest">審査中</span>
             </div>

             {/* ステップ3 */}
             <div className="flex flex-col items-center gap-2 bg-transparent px-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm border-2 border-white">
                   <FileText size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">利用開始</span>
             </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-4">
             <button 
                onClick={handleRefresh}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
             >
                {isChecking ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                ステータスを再確認する
             </button>
             
             <div className="grid grid-cols-2 gap-4">
               <Link href="/" className="w-full py-3.5 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm">
                  <Home size={16} /> トップページ
               </Link>
               <button 
                  onClick={handleLogout} 
                  className="w-full py-3.5 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors flex items-center justify-center gap-2 text-xs shadow-sm"
               >
                  <LogOut size={16} /> ログアウト
               </button>
             </div>
          </div>

        </div>
        
        {/* フッターインフォ */}
        <div className="bg-slate-50/50 px-8 py-5 text-center border-t border-slate-100">
           <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
              <HelpCircle size={14}/> 審査についてご不明な点は <a href="/contact" className="text-pink-500 hover:text-pink-600 transition-colors">お問い合わせ</a> ください
           </p>
        </div>
      </motion.div>
      
      <p className="mt-6 text-[10px] font-black text-slate-400 font-mono tracking-widest relative z-10">
         ID: {user?.uid || user?.id || 'Unknown'}
      </p>
    </div>
  );
}