'use client';

// Next.js 15 ビルドエラー回避
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiAlertCircle, FiLoader, FiArrowRight, FiMail } from 'react-icons/fi';
import Link from 'next/link';

// API URLの設定
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('認証情報を確認しています...');
  const [countdown, setCountdown] = useState(5);
  
  // React 18 Strict Mode対策: 実行済みフラグ
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('無効なリンクです。トークンが見つかりません。');
      return;
    }

    // すでに実行済みなら何もしない
    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyEmail = async () => {
      try {
        // UX向上のため、あえて少し待機（ローディングを見せる）
        await new Promise(resolve => setTimeout(resolve, 800));

        const res = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'メールアドレスの認証が完了しました！');
        } else {
          setStatus('error');
          // ステータスコードによるメッセージの出し分け
          if (res.status === 400 || res.status === 401) {
             setMessage('リンクの有効期限が切れているか、既に使用されています。');
          } else {
             setMessage(data.message || '認証に失敗しました。もう一度お試しください。');
          }
        }
      } catch (error) {
        console.error('Verify Error:', error);
        setStatus('error');
        setMessage('サーバー接続エラーが発生しました。時間を置いて再度お試しください。');
      }
    };

    verifyEmail();
  }, [token]);

  // 成功時のカウントダウン処理
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/login'); // 遷移先
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, router]);

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* メインカード */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden p-8 text-center transition-all duration-500 transform hover:scale-[1.01]">
        
        {/* --- ステータスアイコン --- */}
        <div className="mb-6 flex justify-center">
          {status === 'loading' && (
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FiLoader className="text-indigo-500" />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-in text-green-600 shadow-inner">
              <FiCheckCircle size={40} />
            </div>
          )}

          {status === 'error' && (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-shake text-red-600 shadow-inner">
              <FiAlertCircle size={40} />
            </div>
          )}
        </div>

        {/* --- タイトル & メッセージ --- */}
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
          {status === 'loading' && '認証中...'}
          {status === 'success' && '認証完了！'}
          {status === 'error' && '認証エラー'}
        </h1>
        
        <p className="text-slate-600 mb-8 leading-relaxed text-sm font-medium">
          {message}
        </p>

        {/* --- アクションエリア --- */}
        
        {/* 成功時: カウントダウンとログインボタン */}
        {status === 'success' && (
          <div className="space-y-5 animate-fadeIn">
            {/* プログレスバー */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-slate-400">
              <span className="font-bold text-slate-600">{countdown}秒後</span> に自動的に移動します
            </p>

            <button 
              onClick={() => router.push('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              今すぐログインする 
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* エラー時: 戻るボタン */}
        {status === 'error' && (
          <div className="space-y-4 animate-fadeIn">
            <Link 
              href="/login"
              className="block w-full py-3.5 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              ログイン画面へ戻る
            </Link>
            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
              もしメールが届かない、または期限切れの場合は<br/>
              再度、新規登録または再送信の手続きを行ってください。
            </p>
          </div>
        )}
      </div>
      
      {/* フッター */}
      <div className="text-center mt-8 text-slate-400 text-xs font-medium flex items-center justify-center gap-1 opacity-70">
        <FiMail /> FLASTAL Secure Verification
      </div>
    </div>
  );
}

// サスペンス境界を設定
export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-pink-50 flex items-center justify-center">
      <Suspense fallback={
        <div className="text-slate-400 font-bold flex items-center gap-2 animate-pulse">
          <FiLoader className="animate-spin" /> Loading...
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}