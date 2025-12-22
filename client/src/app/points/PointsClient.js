'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion'; 
import { 
  CreditCard, ShieldCheck, Zap, Star, Gem, 
  ArrowRight, Info, Loader2 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const POINT_PACKAGES = [
  { 
    id: 'starter',
    points: 1000, 
    amount: 1000, 
    label: 'Starter', 
    icon: <Zap className="w-6 h-6 text-emerald-500" />,
    bg: "bg-emerald-50",
    description: 'まずは少しだけ応援したい方に。'
  },
  { 
    id: 'standard',
    points: 5000, 
    amount: 5000, 
    label: 'Standard', 
    icon: <Star className="w-6 h-6 text-white" />,
    isRecommended: true,
    bg: "bg-white",
    description: '複数の企画に参加できる一番人気のプラン。'
  },
  { 
    id: 'premium',
    points: 10000, 
    amount: 10000, 
    label: 'Premium', 
    icon: <Gem className="w-6 h-6 text-purple-500" />,
    bg: "bg-purple-50",
    description: '大きな企画や主催者支援に最適です。'
  },
];

const Reveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
  >
    {children}
  </motion.div>
);

// --- ロジックを含むメインコンポーネント ---
function PointsMain() {
  const { user, loading: authLoading } = useAuth();
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  const handleCheckout = async (pkg) => {
    if (!user) {
      toast.error('ポイントを購入するにはログインが必要です');
      router.push('/login');
      return;
    }
    setProcessingId(pkg.id);
    try {
      const response = await fetch(`${API_URL}/api/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pkg.amount,
          points: pkg.points,
          userId: user.id, 
        }),
      });
      if (!response.ok) throw new Error('決済セッションの作成に失敗しました');
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error('決済URLが取得できませんでした');
    } catch (error) {
      toast.error(`エラー: ${error.message}`);
      setProcessingId(null);
    }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full p-10 text-center bg-white rounded-[40px] shadow-2xl border border-slate-100">
        <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
           <CreditCard size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-4">ログインが必要です</h2>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">ポイントを購入して推し活を始めるには、<br/>アカウントへのログインが必要です。</p>
        <Link href="/login" className="block w-full py-4 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full hover:shadow-lg transition-all">ログインページへ</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans text-slate-800 overflow-x-hidden">
      <section className="relative bg-white pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <Reveal>
            <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-pink-600 text-xs font-bold mb-6">POINT CHARGE</span>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-6">推し活のための<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">エネルギーチャージ</span></h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto mb-10">企画を支援したり、お祝いのお花を贈るために必要なポイントを購入します。</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="inline-block bg-white/80 backdrop-blur-xl p-2 pr-8 rounded-full shadow-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md">🪙</div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Current Balance</p>
                        <p className="text-xl font-black text-slate-800">{(user.points || 0).toLocaleString()} <span className="text-sm font-bold text-slate-500">pt</span></p>
                    </div>
                </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {POINT_PACKAGES.map((pkg, index) => {
            const isRec = pkg.isRecommended;
            return (
              <Reveal key={pkg.id} delay={0.3 + (index * 0.1)}>
                <motion.div whileHover={{ y: -10 }} className={`relative h-full flex flex-col p-8 rounded-[40px] border transition-all duration-300 bg-white ${isRec ? 'shadow-2xl border-pink-200 z-10 scale-105 md:scale-110' : 'shadow-lg border-slate-100'}`}>
                  {isRec && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-1.5 rounded-full text-xs font-bold">MOST POPULAR</div>}
                  <div className="mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isRec ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : pkg.bg}`}>{pkg.icon}</div>
                      <h3 className="text-lg font-black">{pkg.label}</h3>
                      <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                  </div>
                  <div className="mb-8">
                      <div className="flex items-baseline gap-1"><span className="text-4xl font-black">{pkg.points.toLocaleString()}</span><span className="text-sm font-bold text-slate-400">pt</span></div>
                      <p className="text-sm font-bold text-slate-400 mt-1">¥{pkg.amount.toLocaleString()} (税込)</p>
                  </div>
                  <div className="mt-auto">
                      <button onClick={() => handleCheckout(pkg)} disabled={!!processingId} className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${isRec ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-slate-800 text-white'}`}>
                        {processingId === pkg.id ? <Loader2 className="animate-spin" /> : <><span className="relative z-10">購入する</span><ArrowRight size={18} /></>}
                      </button>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-6 mt-20 max-w-3xl text-center">
        <Reveal delay={0.6}>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 inline-block w-full">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-slate-500 text-sm font-medium">
                    <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" /><span>Stripeによる安全な決済</span></div>
                    <div className="flex items-center gap-2"><CreditCard className="text-slate-400" /><span>各種クレジットカード対応</span></div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400 text-left leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>ポイントの有効期限は、最終利用日から1年間です。</li>
                        <li>決済完了後の払い戻しは原則として行えません。</li>
                    </ul>
                </div>
                <div className="mt-4 text-xs"><Link href="/legal/transactions" className="text-pink-500 hover:underline">特定商取引法に基づく表記</Link></div>
            </div>
        </Reveal>
      </section>
    </div>
  );
}

// --- 親エクスポート (内部で再度 Suspense を噛ませる) ---
export default function PointsClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    }>
      <PointsMain />
    </Suspense>
  );
}