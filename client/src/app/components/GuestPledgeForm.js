"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiMessageSquare, FiCreditCard } from 'react-icons/fi';

export default function GuestPledgeForm({ projectId, projectTitle, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    amount: 1000, // デフォルト金額
    comment: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.guestName || !formData.guestEmail || formData.amount < 500) {
      toast.error('必須項目を正しく入力してください（金額は500円以上）');
      return;
    }

    if (!window.confirm(`${formData.amount.toLocaleString()}円で支援を確定しますか？`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guest/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'エラーが発生しました');

      toast.success('ゲスト支援が完了しました！メールをご確認ください。');
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-sm text-yellow-800">
        <strong>💡 ゲスト支援モード</strong><br/>
        アカウントを作らずに、クレジットカード等で今すぐ支援できます。<br/>
        <span className="text-xs text-yellow-600">※ポイント機能は利用できません。</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 金額入力 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">支援金額 (円)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
            <input
              type="number"
              name="amount"
              min="500"
              value={formData.amount}
              onChange={handleChange}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-bold text-lg"
              required
            />
          </div>
        </div>

        {/* お名前 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">お名前 (ニックネーム可)</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="guestName"
              placeholder="推し活 太郎"
              value={formData.guestName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
        </div>

        {/* メールアドレス */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス (完了通知用)</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="guestEmail"
              placeholder="example@flastal.com"
              value={formData.guestEmail}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
        </div>

        {/* 応援コメント */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">応援コメント (任意)</label>
          <div className="relative">
            <FiMessageSquare className="absolute left-3 top-3 text-gray-400" />
            <textarea
              name="comment"
              rows="3"
              placeholder="企画成功を祈っています！"
              value={formData.comment}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? '処理中...' : <><FiCreditCard /> ゲストとして支払う</>}
          </button>
        </div>
      </form>
    </div>
  );
}