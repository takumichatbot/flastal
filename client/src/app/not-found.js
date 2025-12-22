import { Suspense } from 'react';
import Link from 'next/link';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

// 実際の表示内容
function NotFoundContent() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
        <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-4">ページが見つかりません</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          お探しのページは削除されたか、URLが間違っている可能性があります。
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
        >
          <FiHome /> トップページへ戻る
        </Link>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}