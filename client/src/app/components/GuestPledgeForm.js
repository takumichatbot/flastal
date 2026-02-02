"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiMessageSquare, FiCreditCard, FiCheck, FiInfo, FiLock, FiLoader } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function GuestPledgeForm({ projectId, projectTitle, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    amount: 1000,
    comment: ''
  });

  const PRESET_AMOUNTS = [1000, 3000, 5000, 10000];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleAmountPreset = (val) => {
    setFormData(prev => ({ ...prev, amount: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreed) {
        return toast.error('利用規約への同意が必要です。');
    }
    if (!formData.guestName || !formData.guestEmail || formData.amount < 500) {
      return toast.error('入力内容を確認してください（金額は500円以上）');
    }

    setLoading(true);
    const toastId = toast.loading('決済ページへ移動中...');

    try {
      // ★修正: 決済セッション作成APIを呼び出す
      const res = await fetch(`${API_URL}/api/payment/checkout/create-guest-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData,
          amount: Number(formData.amount),
          // ★追加: 決済完了・キャンセル時の戻り先URL
          successUrl: `${window.location.origin}/projects/${projectId}?payment=success`,
          cancelUrl: `${window.location.origin}/projects/${projectId}?payment=cancelled`,
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'エラーが発生しました');

      // ★修正: sessionUrl が返ってくるのでリダイレクトする
      if (data.sessionUrl) {
          window.location.href = data.sessionUrl;
      } else {
          throw new Error('決済URLの取得に失敗しました');
      }

    } catch (error) {
      console.error(error);
      toast.error(error.message, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      
      {/* 案内メッセージ */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl mb-6 flex items-start gap-3">
        <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
            <FiInfo size={20} />
        </div>
        <div className="text-sm text-amber-900">
          <p className="font-bold mb-1">ゲスト支援モード</p>
          <p className="opacity-80 leading-relaxed">
            アカウントを作成せずに、メールアドレスだけで支援できます。<br/>
            <span className="text-xs">※ポイントの獲得や履歴の保存は行われません。</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. 支援金額 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">支援金額 (円)</label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_AMOUNTS.map(amount => (
                <button
                    key={amount}
                    type="button"
                    onClick={() => handleAmountPreset(amount)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                        formData.amount === amount 
                        ? 'bg-pink-500 border-pink-500 text-white shadow-md' 
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    ¥{amount.toLocaleString()}
                </button>
            ))}
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">¥</span>
            <input
              type="number"
              name="amount"
              min="500"
              value={formData.amount}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none font-bold text-2xl text-gray-800 transition-all placeholder-gray-300"
              placeholder="1000"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">JPY</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">最低支援額: 500円</p>
        </div>

        {/* 2. ゲスト情報 */}
        <div className="grid grid-cols-1 gap-4">
            <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">お名前 (ニックネーム可) <span className="text-red-500">*</span></label>
            <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                type="text"
                name="guestName"
                placeholder="推し活 太郎"
                value={formData.guestName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                required
                />
            </div>
            </div>

            <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">メールアドレス <span className="text-red-500">*</span></label>
            <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                type="email"
                name="guestEmail"
                placeholder="example@flastal.com"
                value={formData.guestEmail}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                required
                />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">※決済完了メールをお送りします</p>
            </div>
        </div>

        {/* 3. 応援コメント */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">応援コメント (任意)</label>
          <div className="relative">
            <FiMessageSquare className="absolute left-3 top-3 text-gray-400" />
            <textarea
              name="comment"
              rows="3"
              placeholder="企画成功を祈っています！"
              value={formData.comment}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* 4. 同意と送信 */}
        <div className="pt-2">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-600">
                    <a href="/terms" target="_blank" className="text-pink-600 underline hover:text-pink-700">利用規約</a> と <a href="/privacy" target="_blank" className="text-pink-600 underline hover:text-pink-700">プライバシーポリシー</a> に同意します
                </span>
            </label>
        </div>

        <div className="pt-2 flex gap-3 flex-col-reverse sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading || !agreed}
            className="flex-[2] py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
                <><FiLoader className="animate-spin" /> 準備中...</>
            ) : (
                <><FiCreditCard /> 支払いに進む</>
            )}
          </button>
        </div>
        
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <FiLock /> SSL暗号化通信により情報は安全に送信されます
        </p>

      </form>
    </div>
  );
}