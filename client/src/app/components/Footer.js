import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* サービス */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">サービス</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/projects" className="hover:text-white">企画一覧</Link></li>
              <li><Link href="/florists" className="hover:text-white">お花屋さんを探す</Link></li>
              <li><Link href="/#faq" className="hover:text-white">よくある質問</Link></li> 
              <li><Link href="/#contact" className="hover:text-white">お問い合わせ</Link></li>
            </ul>
          </div>

          {/* 参加する */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">参加する</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/register" className="hover:text-white">ファン登録</Link></li>
              <li><Link href="/florists/register" className="hover:text-white">お花屋さん登録</Link></li>
              <li><Link href="/venues/register" className="hover:text-white">会場登録</Link></li>
            </ul>
          </div>

          {/* FLASTALについて */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">FLASTALについて</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/#about" className="hover:text-white">運営会社</Link></li>
              <li><Link href="/terms" className="hover:text-white">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link></li>
              <li><Link href="/tokushoho" className="hover:text-white">特定商取引法に基づく表記</Link></li>
              {/* ★★★ 追加: キャンセルポリシー ★★★ */}
              <li><Link href="/legal/cancel" className="hover:text-white">キャンセルポリシー</Link></li>
            </ul>
          </div>

          {/* SNS */}
          <div>
             <h3 className="text-sm font-semibold text-white tracking-wider uppercase">SNS</h3>
             <ul className="mt-4 space-y-2">
                <li><a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white">X (Twitter)</a></li> 
             </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-700 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} FLASTAL. All rights reserved.</p>
          <Link href="/admin"><span className="text-xs text-slate-500 hover:text-white mt-2 block cursor-pointer">Admin</span></Link>
        </div>
      </div>
    </footer>
  );
}