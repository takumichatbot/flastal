'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Store, Users, ChevronRight, Star } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const SLIDES = [
  {
    id: 0,
    bg: 'from-pink-400 to-rose-500',
    icon: Sparkles,
    iconBg: 'bg-white',
    useLogo: true,
    title: 'FLASTALへようこそ',
    subtitle: 'フラスタをもっと\n楽しく、スマートに',
    body: '推し活の必須アイテム「フラスタ（フラワースタンド）」を、みんなで一緒に企画・制作できるプラットフォームです。',
    accent: 'white',
  },
  {
    id: 1,
    bg: 'from-violet-500 to-purple-600',
    icon: Heart,
    iconBg: 'bg-white/20',
    title: '企画を立てよう',
    subtitle: 'アイデアを形に\n推しへの想いを届けよう',
    body: '企画を作って支援者を募集。目標金額に達したら自動的にお花屋さんへの発注が確定します。',
    accent: 'white',
  },
  {
    id: 2,
    bg: 'from-sky-400 to-blue-500',
    icon: Store,
    iconBg: 'bg-white/20',
    title: 'お花屋さんを選ぼう',
    subtitle: 'プロのお花屋さんが\nあなたの企画を形にする',
    body: 'フラスタ制作に特化したお花屋さんを全国から検索。実績・口コミで比較して、理想のデザインをオファーできます。',
    accent: 'white',
  },
  {
    id: 3,
    bg: 'from-amber-400 to-orange-500',
    icon: Users,
    iconBg: 'bg-white/20',
    title: 'みんなで支援しよう',
    subtitle: '仲間と一緒に\n大きな夢を叶えよう',
    body: 'ポイントを使って企画を支援。支援者が増えるほど豪華なフラスタが実現します。一人ではできないことも、みんなの力で！',
    accent: 'white',
  },
  // ステップ4: 推しジャンル選択
  {
    id: 4,
    bg: 'from-fuchsia-500 to-pink-600',
    icon: Star,
    iconBg: 'bg-white/20',
    title: '推しのジャンルは？',
    subtitle: 'あなたの推し活を\nもっと楽しくする',
    body: '興味のあるジャンルを選ぶと、おすすめの企画やイラストレーターが表示されます。',
    accent: 'white',
    isGenreStep: true,
  },
];

const GENRE_OPTIONS = [
  { label: 'アイドル', emoji: '' },
  { label: 'VTuber', emoji: '' },
  { label: 'アニメ', emoji: '' },
  { label: '声優', emoji: '' },
  { label: '2.5次元', emoji: '' },
  { label: 'その他', emoji: '' },
];

const slideVariants = {
  initial: (d) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
  animate: { x: '0%', opacity: 1 },
  exit: (d) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const touchStartX = useRef(null);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const goTo = (next) => {
    if (next < 0 || next >= SLIDES.length) return;
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleGenre = (label) => {
    setSelectedGenres((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const saveGenresAndFinish = async () => {
    setIsSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && selectedGenres.length > 0) {
        await fetch(`${API_URL}/api/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferredGenres: selectedGenres }),
        });
      }
    } catch (err) {
      // ジャンル保存失敗はオンボーディング完了をブロックしない
      console.error('Failed to save genres:', err);
    } finally {
      setIsSaving(false);
      finish();
    }
  };

  const finish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingDone', '1');
    }
    router.replace('/login');
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    // ジャンル選択ステップはスワイプ無効（誤操作防止）
    if (slide.isGenreStep) return;
    if (dx < 0 && step < SLIDES.length - 1) goTo(step + 1);
    if (dx > 0 && step > 0) goTo(step - 1);
  };

  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 overflow-hidden font-sans select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}
        />
      </AnimatePresence>

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          key={`blob1-${step}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          key={`blob2-${step}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/5 rounded-full blur-3xl"
        />
      </div>

      {/* Skip button */}
      {!isLast && (
        <button
          onClick={finish}
          className="absolute top-5 right-5 z-20 text-white/60 font-bold text-sm px-4 py-2 rounded-full hover:text-white transition-colors"
        >
          スキップ
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-8 pt-16 pb-10 max-w-md mx-auto">

        {/* Icon card + テキスト */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className={`w-28 h-28 rounded-[2.5rem] ${slide.iconBg} flex items-center justify-center border border-white/20 shadow-xl backdrop-blur-md`}>
                {slide.useLogo ? (
                  <img src="/icon-512x512.png" alt="FLASTAL" width={76} height={76} style={{ borderRadius: '18px' }} />
                ) : (
                  <Icon size={52} className="text-white" strokeWidth={1.5} />
                )}
              </div>

              <div className="w-full">
                <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em] mb-3">
                  {step + 1} / {SLIDES.length}
                </p>
                <h1 className="text-3xl font-black text-white mb-2 leading-tight tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-lg font-black text-white/90 mb-5 leading-snug whitespace-pre-line">
                  {slide.subtitle}
                </p>
                <p className="text-sm font-medium text-white/80 leading-relaxed max-w-xs mx-auto">
                  {slide.body}
                </p>

                {/* 推しジャンル選択UI */}
                {slide.isGenreStep && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {GENRE_OPTIONS.map(({ label }) => (
                      <motion.button
                        key={label}
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleGenre(label)}
                        className={[
                          'px-4 py-2 rounded-full text-sm font-black border-2 transition-all',
                          selectedGenres.includes(label)
                            ? 'bg-white text-fuchsia-600 border-white shadow-lg'
                            : 'bg-white/20 text-white border-white/40 hover:bg-white/30',
                        ].join(' ')}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-6 pb-4">
          {/* Dot indicators */}
          <div className="flex gap-2 items-center">
            {SLIDES.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => !slide.isGenreStep && goTo(i)}
                animate={{
                  width: i === step ? 24 : 8,
                  opacity: i === step ? 1 : 0.4,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="h-2 rounded-full bg-white"
              />
            ))}
          </div>

          {/* CTA button */}
          {isLast ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={saveGenresAndFinish}
              disabled={isSaving}
              className="w-full py-4 bg-white rounded-2xl font-black text-base shadow-xl active:scale-[0.98] transition-transform text-fuchsia-600 disabled:opacity-70"
            >
              {isSaving ? '保存中...' : 'はじめる'}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => goTo(step + 1)}
              className="w-full py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl font-black text-white text-base shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              次へ <ChevronRight size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
