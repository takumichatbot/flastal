"use client";

import { useState, Suspense } from 'react'; // ★ Suspense をインポート
import { useSearchParams } from 'next/navigation'; // ★ useSearchParams をインポート
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★
// フォームのロジックを別コンポーネントに分離します
// (useSearchParams を使うコンポーネントは Suspense で囲む必要があるため)
// ★★★
function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  
  // 1. URLから userType を読み取る
  const searchParams = useSearchParams();
  // URLに ?userType=... がなければ 'USER' をデフォルトにする
  const userType = searchParams.get('userType') || 'USER'; 

  // 2. userType に応じて表示内容を変更
  const config = {
    USER: {
      title: 'ファン アカウント',
      loginLink: '/login',
    },
    FLORIST: {
      title: 'お花屋さん アカウント',
      loginLink: '/florists/login',
    },
    VENUE: {
      title: '会場 アカウント',
      loginLink: '/venues/login',
    }
  };
  // userType が FLORIST, VENUE, USER 以外の場合は USER として扱う
  const currentConfig = config[userType] || config.USER;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const promise = fetch(`${API_URL}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 3. ★★★ 修正点: ハードコードされた 'USER' の代わりに、URLから取得した userType を使う ★★★
      body: JSON.stringify({ email, userType: userType }), 
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'エラーが発生しました。');
      }
      return data;
    });

    toast.promise(promise, {
      loading: '送信中...',
      success: (data) => data.message, // バックエンドからの成功メッセージ
      error: (err) => err.message, // バックエンドからのエラーメッセージ
    });
  };

  // ★ フォームのJSX (元のコードとほぼ同じ)
  return (
    <div className="bg-white max-w-md w-full p-8 border rounded-xl shadow-md">
      {/* 4. タイトルを動的に変更 */}
      <h1 className="text-3xl font-bold text-sky-600 text-center mb-2">パスワードを忘れた場合</h1>
      <p className="text-center text-gray-500 mb-6 font-semibold">{currentConfig.title}</p>
      <p className="text-center text-gray-600 mb-8">登録したメールアドレスを入力してください。パスワード再設定用のリンクを送信します。</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="font-semibold text-gray-700">メールアドレス:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
          />
        </div>

        <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4 disabled:bg-gray-400">
          再設定メールを送信
        </button>
      </form>
      <div className="text-center mt-6">
        <p className="text-sm">
          {/* 5. 戻るリンクも動的に変更 */}
          <Link href={currentConfig.loginLink}>
            <span className="font-semibold text-sky-600 hover:underline">ログインページに戻る</span>
          </Link>
        </p>
      </div>
    </div>
  );
} // --- ForgotPasswordForm コンポーネントここまで ---


// ★★★
// メインのページ (default export)
// Suspense で ForgotPasswordForm を囲むラッパー（包むもの）になります
// ★★★
export default function ForgotPasswordPage() {
  return (
    <div className="bg-sky-50 min-h-screen flex items-center justify-center">
      {/* Suspenseで囲まないと useSearchParams が使えないため */}
      <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
