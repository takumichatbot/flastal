'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // Import icons

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const router = useRouter();
  // Removed useAuth hook - florist login is separate

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Use toast.promise for async feedback
    const promise = fetch(`${API_URL}/api/florists/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Send as JSON
      body: JSON.stringify({ email, password }),      // Send as JSON
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }
      return data; // Return successful data
    });

    toast.promise(promise, {
      loading: 'ログイン中...',
      success: (data) => {
        const florist = data.florist;
        
        if (florist.status === 'APPROVED') {
          // ★★★ Save florist info to localStorage ★★★
          localStorage.setItem('flastal-florist', JSON.stringify(florist)); 
          // Redirect to dashboard (ID in URL might not be necessary, depends on dashboard logic)
          router.push(`/florists/dashboard`); 
          return 'ログインしました！';
        } else if (florist.status === 'PENDING') {
          router.push('/florists/pending');
          return 'アカウントは現在審査中です。';
        } else {
          // REJECTED or other status
          throw new Error('アカウントが承認されていません。運営までお問い合わせください。');
        }
      },
      error: (err) => err.message, // Display error message from fetch or status check
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-pink-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          お花屋さん ログイン
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input 
              id="email" 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"
            />
          </div>
          <div className="relative"> {/* Added relative positioning */}
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} // Toggle type
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-3 py-2 mt-1 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"
            />
             {/* Password visibility toggle button */}
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-600"
              aria-label="パスワードを表示または非表示にする"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
              ログイン
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-600">
          <Link href="/forgot-password?userType=FLORIST">
            <span className="...">パスワードを忘れた方はこちら</span>
          </Link>
        </div>
        <p className="text-sm text-center text-gray-600">
          アカウントをお持ちでないですか？{' '}
          <Link href="/florists/register">
            <span className="font-medium text-sky-600 hover:underline">
              新規登録申請
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}