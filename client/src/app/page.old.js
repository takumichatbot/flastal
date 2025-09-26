import Link from 'next/link';
import FeaturedProjects from './components/FeaturedProjects';

export default function HomePage() {

  // ★★★ デザインを直接ここに書き込みます ★★★
  const heroBackgroundStyle = {
    background: 'radial-gradient(ellipse at top, #f0f9ff, white 70%)',
  };

  const heroPatternStyle = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23cbd5e1'%3e%3cpath d='M0 16 L16 0 L32 16 L16 32 Z'/%3e%3c/svg%3e")`,
  };
  return (
    <>
      {/* ヒーローセクション */}
      <div className="relative w-full overflow-hidden bg-white">
        {/* ★★★ ここがクリスタル背景の本体です ★★★ */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-sky-100/50 -z-10"></div>
        <div className="absolute top-0 left-0 w-full h-full hero-background opacity-40 -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
            あなたの「推し」に、<br />
            みんなで届ける最高のフラスタを。
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            FLASTALは、ファンが一同となってお花を贈るための<br />クラウドファンディング・プラットフォームです。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/projects">
              <span className="rounded-full bg-sky-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-sky-600 transition-all transform hover:scale-105">
                企画を探す
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* 注目の企画セクション */}
      <FeaturedProjects />

      {/* ご利用の流れセクション */}
      <div className="w-full bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">ご利用の流れ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center"><div className="text-3xl font-bold text-sky-200">01</div><h3 className="mt-2 text-lg font-semibold text-gray-900">企画を探す・作る</h3><p className="mt-2 text-sm text-gray-600">応援したい企画に参加したり、自分で新しい企画を立ち上げましょう。</p></div>
            <div className="text-center"><div className="text-3xl font-bold text-sky-200">02</div><h3 className="mt-2 text-lg font-semibold text-gray-900">支援する</h3><p className="mt-2 text-sm text-gray-600">ポイントを購入し、応援の気持ちを込めて企画を支援します。</p></div>
            <div className="text-center"><div className="text-3xl font-bold text-sky-200">03</div><h3 className="mt-2 text-lg font-semibold text-gray-900">お花屋さんにオファー</h3><p className="mt-2 text-sm text-gray-600">企画が成立したら、イメージに合うお花屋さんに製作を依頼します。</p></div>
            <div className="text-center"><div className="text-3xl font-bold text-sky-200">04</div><h3 className="mt-2 text-lg font-semibold text-gray-900">想いを届ける</h3><p className="mt-2 text-sm text-gray-600">ファン一同の想いがこもったフラスタが、会場に届けられます。</p></div>
          </div>
        </div>
      </div>

      {/* お花屋さん・会場向けCTA */}
      <div className="bg-slate-100/70">
        <div className="max-w-7xl mx-auto py-24 px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">お花屋さんへ</h2>
            <p className="mt-4 text-gray-600">あなたの技術とセンスで、ファンの想いを形にしませんか？FLASTALに登録して、新しいお客様と出会いましょう。</p>
            <div className="mt-6">
              <Link href="/florists/register"><span className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-600">お花屋さんとして登録</span></Link>
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">会場の運営者様へ</h2>
            <p className="mt-4 text-gray-600">会場のフラスタ規定を登録することで、ファンや業者とのやり取りをスムーズに。トラブルを未然に防ぎます。</p>
            <div className="mt-6">
              <Link href="/venues/register"><span className="rounded-full bg-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600">会場として登録</span></Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}