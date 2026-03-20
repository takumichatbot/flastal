'use client';

import React, { useState } from 'react';
import { FiMail, FiSend, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsSent(true);
        toast.success('お問い合わせを送信しました');
      } else {
        throw new Error('送信失敗');
      }
    } catch (err) {
      toast.error('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-500 rounded-full mb-4">
            <FiMail size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">お問い合わせ</h1>
          <p className="text-slate-500 mt-2 font-medium">サービスに関するご質問やご相談を承ります。</p>
        </div>

        {isSent ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center animate-fadeIn">
            <FiCheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">送信完了</h2>
            <p className="text-slate-500 mt-2">
              お問い合わせありがとうございます。<br />
              内容を確認次第、担当よりメールにてご連絡いたします。
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all"
            >
              トップへ戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">お名前</label>
              <input 
                type="text" name="name" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all"
                placeholder="推し活 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス</label>
              <input 
                type="email" name="email" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all"
                placeholder="example@flastal.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">お問い合わせ内容</label>
              <textarea 
                name="message" rows="5" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all resize-none"
                placeholder="ご質問内容を入力してください"
              ></textarea>
            </div>
            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : <><FiSend /> メッセージを送信する</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}