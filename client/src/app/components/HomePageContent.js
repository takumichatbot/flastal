import Link from 'next/link';
import FeaturedProjects from './FeaturedProjects';
import Testimonials from './Testimonials';
import Faq from './Faq'; 

// --- アイコンコンポーネント ---
const CheckIcon = () => (
  <svg className="h-6 w-6 flex-none text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FeatureIcon = ({ children }) => (
  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm text-sky-600 shadow-lg ring-1 ring-slate-200">
    {children}
  </div>
);

// --- 決済ロゴ ---
const paymentLogos = [
  { name: 'Visa', src: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' },
  { name: 'Mastercard', src: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
  { name: 'JCB', src: 'https://upload.wikimedia.org/wikipedia/commons/4/40/JCB_logo.svg' },
  { name: 'American Express', src: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_(2018).svg' },
  { name: 'Diners Club', src: 'https://cdn.worldvectorlogo.com/logos/diners-club-international.svg' },
];

export default function HomePageContent() {

  const heroStyle = {
    backgroundImage: `
      radial-gradient(at 20% 20%, hsla(212,100%,85%,0.3) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(280,100%,85%,0.3) 0px, transparent 50%),
      radial-gradient(at 50% 80%, hsla(180,100%,80%,0.3) 0px, transparent 50%),
      url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='0.5' stroke='%23bae6fd'%3e%3cpath d='M0 16 L16 0 L32 16 L16 32 Z'/%3e%3c/svg%3e")
    `,
    backgroundColor: '#ffffff',
  };
  
  // ★★★ ご利用フローのデータを5ステップに更新 ★★★
  const usageSteps = [
    {
      step: '01',
      title: '企画を立てる',
      description: '企画の目的や目標金額などを入力し、魅力的な企画ページを数分で作成。あなたの想いを言葉にしましょう。',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
    },
    {
      step: '02',
      title: '仲間を集める',
      description: '作成したページをSNSでシェア！グループチャットやアンケート機能で参加者と意見を交換し、企画をブラッシュアップ。',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      step: '03',
      title: 'お花屋さんと相談',
      description: '集まったポイントを元に、理想を形にしてくれるお花屋さんを探してオファー。チャットで見積もりやデザインを相談します。',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.73 18a2.73 2.73 0 0 1-3.85-3.85l3.85-3.85a2.73 2.73 0 0 1 3.85 3.85z"/><path d="M12.24 12.24 9.41 15.06"/><path d="m9.13 18.05 2.83-2.83"/><path d="M14.24 14.24 11.41 17.06"/><path d="M3.51 3.51a2.73 2.73 0 0 1 3.85 3.85L3.51 11.21a2.73 2.73 0 0 1-3.85-3.85z"/></svg>
    },
    {
      step: '04',
      title: '実行と進捗報告',
      description: 'お花屋さんへの支払いはポイントで安全に。ToDoリストや収支報告機能で、企画の進行状況はいつでも透明です。',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    },
    {
      step: '05',
      title: '「感動」を共有する',
      description: '企画完了後、主催者は完成したお花の写真を投稿できます。参加者全員で達成感を分かち合い、最高の思い出として形に残しましょう。',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    },
  ];

  return (
    <>
      {/* 1. ヒーローセクション */}
      <div className="relative w-full overflow-hidden" style={heroStyle}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
            その想い、最高の輝きで届けよう。
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            FLASTALは、ファン企画の複雑さを「透明」に、体験を「感動」に変える<br />オールインワン・フラスタ支援プラットフォームです。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/projects">
              <span className="rounded-full bg-sky-500 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all transform hover:scale-105 hover:shadow-sky-400 hover:shadow-[0_0_30px_theme(colors.sky.400)]">
                輝いている企画を探す
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* 2. 注目の企画セクション */}
      <FeaturedProjects />

      {/* 3. 主催者の声セクション */}
      <Testimonials />

      {/* 4. お悩み解決セクション */}
      <div className="bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-sky-500">もう、ひとりで悩まない</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ファン企画の「大変」は、すべてFLASTALが解決します
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-5xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900"><div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500"><span className="text-white text-xl">💎</span></div>お金の管理</dt>
                {/* ★★★ 返金についての文言を追加 ★★★ */}
                <dd className="mt-2 text-base leading-7 text-gray-600">ポイント決済で集金も支払いも安全・簡単。万が一企画が中止になってもポイントは全額返金。収支報告機能で、お金の流れはいつでもクリスタルのように透明です。</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900"><div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500"><span className="text-white text-xl">💬</span></div>お店との連携</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">お花屋さんへのオファーからデザイン相談、見積もり、支払いまで、専用チャットでスムーズに完結します。</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900"><div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500"><span className="text-white text-xl">🤝</span></div>参加者との連携</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">参加者限定のグループチャットやアンケート機能で、意見調整もスムーズ。一体感が生まれます。</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900"><div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500"><span className="text-white text-xl">📅</span></div>タスク管理</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">企画の準備に必要なタスクをToDoリストで管理。複雑なスケジュールも、もう混乱しません。</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900"><div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500"><span className="text-white text-xl">💌</span></div>メッセージ募集</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">フラスタに添える「寄せ書きメッセージ」を簡単に募集・管理。参加者の想いを一つにまとめます。</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900"><div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500"><span className="text-white text-xl">📢</span></div>進捗の連絡</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">お知らせ機能を使えば、企画の進捗や大切な連絡を、参加者全員に確実に伝えられます。</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* 5. ご利用フローセクション */}
      <div className="bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-sky-500">ご利用フロー</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              想いが形になるまでの、かんたん5ステップ
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            {/* ★★★ 5ステップ表示に対応 ★★★ */}
            <dl className="grid grid-cols-1 gap-y-16 md:grid-cols-3 lg:grid-cols-5 md:gap-x-8">
              {usageSteps.map((step) => (
                <div key={step.title} className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-300 to-slate-400">
                    {step.step}
                  </div>
                  <dt className="mt-4 flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                      {step.icon}
                    </span>
                    {step.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{step.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* 6. 機能紹介セクション */}
      <div className="w-full bg-slate-50 py-24 sm:py-32" style={heroStyle}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">FLASTALの多面的な機能</h2>
            <p className="mt-4 text-lg text-slate-600">あなたの企画を、あらゆる角度からサポートします。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            <div className="text-center">
              <FeatureIcon><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 2 4.25 4.25-1.5 1.5-2.75-2.75-2.75 2.75-1.5-1.5L12 2zM2 12l4.25 4.25 1.5-1.5L5 12l2.75-2.75-1.5-1.5L2 12zm20 0-4.25-4.25-1.5 1.5L19 12l-2.75 2.75 1.5 1.5L22 12zM12 22l-4.25-4.25 1.5-1.5 2.75 2.75 2.75-2.75 1.5 1.5L12 22z"/></svg></FeatureIcon>
              <h3 className="mt-6 text-xl font-semibold leading-7 text-gray-900">企画のスムーズな進行</h3>
              {/* ★★★ 中止・返金機能を追加 ★★★ */}
              <ul className="mt-4 space-y-2 text-base leading-7 text-gray-600"><li className="flex gap-x-3"><CheckIcon /><span>企画作成＆支援募集</span></li><li className="flex gap-x-3"><CheckIcon /><span>ToDoリストによる進捗管理</span></li><li className="flex gap-x-3"><CheckIcon /><span>透明性の高い収支報告</span></li><li className="flex gap-x-3"><CheckIcon /><span>安全な中止＆返金機能</span></li></ul>
            </div>
            <div className="text-center">
              <FeatureIcon><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22v-9M12 22a5 5 0 0 0 5-5V8.5a5 5 0 0 0-10 0V17a5 5 0 0 0 5 5zM12 2a5 5 0 0 0-5 5v1.5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/></svg></FeatureIcon>
              <h3 className="mt-6 text-xl font-semibold leading-7 text-gray-900">プロとの簡単連携</h3>
              <ul className="mt-4 space-y-2 text-base leading-7 text-gray-600"><li className="flex gap-x-3"><CheckIcon /><span>花屋さんへのオファー機能</span></li><li className="flex gap-x-3"><CheckIcon /><span>NGワードフィルタ付きチャット</span></li><li className="flex gap-x-3"><CheckIcon /><span>安心のレビュー（評価）機能</span></li></ul>
            </div>
            <div className="text-center">
              <FeatureIcon><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 20A7 7 0 0 1 4 13v0a7 7 0 0 1 7-7v0a7 7 0 0 1 7 7v0a7 7 0 0 1-7 7z"/><path d="M11 20v2M11 4V2M4 13H2M20 13h-2"/></svg></FeatureIcon>
              <h3 className="mt-6 text-xl font-semibold leading-7 text-gray-900">輝くコミュニティ機能</h3>
              {/* ★★★ 完成報告機能を追加 ★★★ */}
              <ul className="mt-4 space-y-2 text-base leading-7 text-gray-600"><li className="flex gap-x-3"><CheckIcon /><span>リアルタイム・グループチャット</span></li><li className="flex gap-x-3"><CheckIcon /><span>企画をまとめるアンケート</span></li><li className="flex gap-x-3"><CheckIcon /><span>想いを集める寄せ書き機能</span></li><li className="flex gap-x-3"><CheckIcon /><span>完成写真の共有ギャラリー</span></li></ul>
            </div>
          </div>
        </div>
      </div>

      {/* 7. 決済方法セクション */}
      <div className="bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto lg:text-center">
             <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              決済はかんたん、そして安全に。
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              世界最高水準のセキュリティを誇るStripeと連携。主要なクレジットカードに対応しています。
            </p>
          </div>
          <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 sm:gap-x-12 gap-y-6">
            {paymentLogos.map((logo) => (
              <img key={logo.name} className="h-8 transition-transform transform hover:scale-110" src={logo.src} alt={logo.name} />
            ))}
          </div>
        </div>
      </div>

      {/* 8. よくある質問セクション */}
      <Faq />

      {/* 9. パートナー募集セクション（お花屋さん・会場向け） - 修正版 */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              FLASTALで、<br className="md:hidden" />
              新しい「推し花」体験を一緒に作りませんか？
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              お花屋さんの技術と、会場の空間を最大限に活かし、
              ファンの想いを形にするパートナーを募集しています。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* お花屋さん向けカード */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full mb-2">
                  For Florists
                </span>
                <h3 className="text-2xl font-bold mb-2">お花屋さんの方へ</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  クラウドファンディング形式だから、予算や納期が明確。
                  あなたのデザインセンスを活かして、ファンと一緒に最高のフラスタを作り上げましょう。
                  在庫ロスを減らし、新しい顧客層へリーチできます。
                </p>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-4">
                <Link href="/florists/login" className="flex items-center justify-center py-3 rounded-lg border border-white/30 hover:bg-white/10 transition-colors text-sm font-medium">
                  ログイン
                </Link>
                <Link href="/florists/register" className="flex items-center justify-center py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-colors text-sm font-medium shadow-lg shadow-pink-500/20">
                  新規登録
                </Link>
              </div>
            </div>

            {/* 会場向けカード */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full mb-2">
                  For Venues
                </span>
                <h3 className="text-2xl font-bold mb-2">イベント会場の方へ</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  搬入出のトラブルやレギュレーション違反を未然に防ぎます。
                  公式に登録することで、スムーズな運営管理が可能に。
                  施設公認のフラスタ受付で、イベントの満足度を高めましょう。
                </p>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-4">
                <Link href="/venue/login" className="flex items-center justify-center py-3 rounded-lg border border-white/30 hover:bg-white/10 transition-colors text-sm font-medium">
                  ログイン
                </Link>
                <Link href="/venue/register" className="flex items-center justify-center py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-colors text-sm font-medium shadow-lg shadow-blue-500/20">
                  新規登録
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. 最終コールトゥアクションセクション */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto text-center py-24 px-6 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            <span className="block">さあ、あなたの想いを形にしよう。</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <Link href="/projects/create">
              <span className="inline-flex rounded-full shadow-lg">
                <span className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium text-white bg-sky-500 hover:bg-sky-600">
                  無料で企画を立てる
                </span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}