'use client';
import Link from 'next/link';
import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi';

export default function OrganizerMessagesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center border border-white">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FiMessageSquare size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">メッセージ機能</h1>
        <p className="text-slate-500 font-bold mb-8 leading-relaxed">
          参加者への一斉メッセージ機能は現在準備中です。<br/>
          今しばらくお待ちください。
        </p>
        <Link href="/organizers/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100">
          <FiArrowLeft /> ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}