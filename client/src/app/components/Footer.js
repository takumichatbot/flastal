"use client";

import Link from 'next/link';
import { FiArrowUp, FiInstagram, FiTwitter } from 'react-icons/fi';

export default function Footer() {
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm relative overflow-hidden">
      
      {/* 装飾: 背景の淡い光 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto py-16 px-6 lg:px-8 relative z-10">
        
        {/* 上部: ロゴとメインリンクエリア */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* ブランド情報 */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black text-white tracking-tighter">
                FLASTAL<span className="text-pink-500">.</span>
              </span>
            </Link>
            <p className="mt-4 text-slate-500 leading-relaxed max-w-sm">
              推しへの想いを、花束に込めて。<br/>
              みんなで贈るフラワースタンド（フラスタ）の<br/>
              クラウドファンディングプラットフォーム。
            </p>
            
            {/* SNSアイコン */}
            <div className="flex gap-4 mt-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors group">
                {/* X Icon (SVG) */}
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                <FiInstagram size={20} />
              </a>
            </div>
          </div>

          {/* リンク集 */}
          <div>
            <h3 className="text-white font-bold mb-4">サービス</h3>
            <ul className="space-y-3">
              <li><Link href="/projects" className="hover:text-white transition-colors">企画一覧</Link></li>
              <li><Link href="/florists" className="hover:text-white transition-colors">お花屋さんを探す</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">よくある質問</Link></li> 
              <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">参加する</h3>
            <ul className="space-y-3">
              <li><Link href="/register" className="hover:text-white transition-colors">ファン登録</Link></li>
              <li><Link href="/florists/register" className="hover:text-white transition-colors">お花屋さん登録</Link></li>
              <li><Link href="/venues/register" className="hover:text-white transition-colors">会場・運営登録</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">FLASTALについて</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-white transition-colors">運営会社</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/tokushoho" className="hover:text-white transition-colors">特定商取引法に基づく表記</Link></li>
              <li><Link href="/legal/cancel" className="hover:text-white transition-colors">キャンセルポリシー</Link></li>
            </ul>
          </div>
        </div>

        {/* 下部: コピーライト & ユーティリティ */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} FLASTAL Inc. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <span className="text-xs text-slate-700 hover:text-slate-500 cursor-pointer transition-colors">Admin Portal</span>
            </Link>
            
            <button 
              onClick={scrollToTop} 
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
            >
              Page Top <FiArrowUp />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}