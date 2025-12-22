'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  FiEye, FiEyeOff, FiLock, FiCheckCircle, FiAlertCircle, 
  FiKey, FiArrowRight, FiLoader 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // パスワード強度判定 (0-4)
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1; // 大文字
    if (/[0-9]/.test(newPassword)) score += 1; // 数字
    setStrength(score);
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // バリデーション
    if (newPassword.length < 6) {
      setErrorMsg('パスワードは6文字以上で入力してください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('確認用パスワードが一致しません');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'パスワードの更新に失敗しました。');
      }

      // 成功時
      setIsSuccess(true);
      toast.success('パスワードを更新しました！');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      toast.error('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 強度バーの色決定
  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-red-400';
    if (strength === 2) return 'bg-yellow-400';
    if (strength === 3) return 'bg-blue-400';
    return 'bg-green-500';
  };

  // 強度テキスト
  const getStrengthText = () => {
    if (newPassword.length === 0) return '';
    if (strength <= 1) return '弱い';
    if (strength === 2) return '普通';
    if (strength === 3) return '強い';
    return '非常に強い';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* --- 完了画面 --- */}
        {isSuccess ? (
          <div className="p-10 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">設定完了</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              新しいパスワードが設定されました。<br/>
              新しいパスワードでログインしてください。
            </p>
            <Link href="/login" className="block w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              ログインページへ <FiArrowRight />
            </Link>
          </div>
        ) : (
          /* --- 入力フォーム --- */
          <div className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiKey size={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">新しいパスワードの設定</h1>
              <p className="text-sm text-gray-500 mt-2">
                セキュリティのため、他で使っていない<br/>強力なパスワードを設定してください。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 新しいパスワード */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">新しいパスワード</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiLock />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                    placeholder="6文字以上"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                {/* 強度メーター */}
                {newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1 font-bold text-gray-500">
                      <span>強度: {getStrengthText()}</span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-full transition-colors duration-300 ${i < strength ? getStrengthColor() : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 確認用パスワード */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">新しいパスワード (確認)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiCheckCircle />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${
                        confirmPassword && newPassword !== confirmPassword 
                        ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                        : 'border-gray-300 focus:ring-sky-500'
                    }`}
                    placeholder="もう一度入力してください"
                    required
                  />
                </div>
                {/* 不一致エラー表示 */}
                {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 font-bold flex items-center">
                        <FiAlertCircle className="mr-1"/> パスワードが一致しません
                    </p>
                )}
              </div>

              {/* APIエラーメッセージ */}
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
                  <FiAlertCircle className="shrink-0"/>
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting || (confirmPassword && newPassword !== confirmPassword)}
                className="w-full py-3.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center transform active:scale-[0.98]"
              >
                {isSubmitting ? <><FiLoader className="animate-spin mr-2"/> 更新中...</> : 'パスワードを変更する'}
              </button>
            </form>

            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-sky-600 transition-colors">
                キャンセルしてログインへ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}