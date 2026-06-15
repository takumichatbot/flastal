"use client";
import Link from 'next/link';
import { TrendingUp, Gift, Star, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function UpsellAlert({ target, collected, projectId }) {
  const remaining = Math.max(0, target - collected);
  const progress = target > 0 ? (collected / target) * 100 : 0;

  // 1. 全く集まっていない場合 (0〜10%) は、逆にプレッシャーになるので静かに応援モード
  // 2. 達成済み (100%以上) は、ネクストゴールへの誘導モード
  // 3. それ以外は、ラストスパートモード

  let config = {
    theme: "blue",
    icon: <TrendingUp />,
    title: "",
    description: "",
    buttonText: "支援して応援する",
    animate: false,
    showButton: true,
  };

  if (progress >= 100) {
    // ★ 達成済み (ネクストゴール誘導)
    config = {
      theme: "green",
      icon: <CheckCircle2 className="text-2xl" />,
      title: "🎉 目標達成おめでとうございます！",
      description: "さらなる高みへ！集まったポイントは全て企画のグレードアップに使用されます。",
      buttonText: "さらに盛り上げる",
      animate: false,
      showButton: true,
    };
  } else if (remaining <= 5000) {
    // ★ 超目前 (緊急度MAX)
    config = {
      theme: "rose",
      icon: <Star className="text-2xl animate-spin-slow" />, // ゆっくり回転
      title: `🔥 あと ${remaining.toLocaleString()} ptで達成です！`,
      description: "あなたが最後のピースを埋めて、企画を成立させませんか？",
      buttonText: "今すぐ達成させる！",
      animate: true, // シマーエフェクト有効
      showButton: true,
    };
  } else if (remaining <= 20000) {
    // ★ もう一息
    config = {
      theme: "orange",
      icon: <Gift className="text-2xl" />,
      title: `あと ${remaining.toLocaleString()} ptで目標達成！`,
      description: "お花を確実に届けるために、あなたのお力添えが必要です。",
      buttonText: "支援する",
      animate: false,
      showButton: true,
    };
  } else if (progress >= 50) {
    // ★ 折り返し地点
    config = {
      theme: "indigo",
      icon: <TrendingUp className="text-2xl" />,
      title: "現在、目標の50%を突破しました！",
      description: `達成まであと ${remaining.toLocaleString()} pt。一緒にゴールを目指しましょう！`,
      buttonText: "支援に参加する",
      animate: false,
      showButton: true,
    };
  } else {
    // ★ まだ序盤 (10%未満などは非表示にするか、静かな表示)
    // ここでは「非表示」を選択
    return null;
  }

  // テーマごとのスタイル定義
  const styles = {
    green: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-900",
    rose:  "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-900",
    orange: "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-900",
    indigo: "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 text-pink-900",
  };
  
  const buttonStyles = {
    green: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    rose:  "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
    orange: "bg-orange-500 hover:bg-orange-600 shadow-orange-200",
    indigo: "bg-pink-500 hover:bg-pink-600 shadow-pink-200",
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 shadow-sm p-5 mb-8 transition-all duration-300 ${styles[config.theme]}`}>
      
      {/* シマーエフェクト (緊急時のみ光が走る) */}
      {config.animate && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-0"></div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* 左側: アイコンとテキスト */}
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="p-3 bg-white/80 backdrop-blur rounded-full shadow-sm shrink-0">
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight mb-1">
              {config.title}
            </h3>
            <p className="text-sm opacity-90 leading-snug">
              {config.description}
            </p>
          </div>
        </div>

        {/* 右側: アクションボタン */}
        {config.showButton && (
          <Link 
            href={`/projects/${projectId}/pledge`} // 支援ページへ遷移
            className={`
              shrink-0 flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95
              ${buttonStyles[config.theme]}
            `}
          >
            {config.buttonText} <ArrowRight />
          </Link>
        )}

      </div>
    </div>
  );
}