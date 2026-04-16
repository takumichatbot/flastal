'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  DollarSign, CreditCard, List, AlertCircle, CheckCircle2, 
  Save, ChevronLeft, Edit3, Plus, X, Info, Loader2, ArrowRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 🎨 ANIMATION & MAGIC UI COMPONENTS
// ==========================================

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} className="absolute w-3 h-3 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-30"
          initial={{ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height }}
          animate={{ y: [null, Math.random() * -200], x: [null, (Math.random() - 0.5) * 100], opacity: [0.2, 0.5, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    'PENDING': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: '申請中' },
    'COMPLETED': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: '振込完了' },
    'REJECTED': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', label: '却下' },
  };
  const current = styles[status] || styles['PENDING'];

  return (
    <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", current.bg, current.text, current.border)}>
      {current.label}
    </span>
  );
};

export default function FloristPayoutsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [bankAccount, setBankAccount] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [floristBalance, setFloristBalance] = useState(0); // ★ お花屋さんの売上残高
  const [loading, setLoading] = useState(true);
  
  const [showBankForm, setShowBankForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const [bankForm, setBankForm] = useState({
    bankName: '', branchName: '', accountType: '普通', accountNumber: '', accountHolder: ''
  });
  const [requestAmount, setRequestAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const headers = { 'Authorization': `Bearer ${token}` };

      // ★ プロフィールAPIも叩いて売上残高（balance）を取得する
      const [bankRes, payoutRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/api/florists/bank-accounts`, { headers }),
          fetch(`${API_URL}/api/florists/payouts`, { headers }),
          fetch(`${API_URL}/api/florists/profile`, { headers }) 
      ]);

      if (bankRes.ok) {
        const data = await bankRes.json();
        if (data && (data.id || data.bankName)) {
            setBankAccount(data);
            setBankForm({
                bankName: data.bankName || '',
                branchName: data.branchName || '',
                accountType: data.accountType || '普通',
                accountNumber: data.accountNumber || '',
                accountHolder: data.accountHolder || ''
            });
        }
      }
      
      if (payoutRes.ok) {
        const history = await payoutRes.json();
        setPayouts(Array.isArray(history) ? history : []);
      }

      if (profileRes.ok) {
          const profileData = await profileRes.json();
          setFloristBalance(profileData.balance || 0);
      }

    } catch (error) {
      console.error(error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'FLORIST') {
        toast.error('お花屋さん専用ページです');
        router.push('/florists/login');
        return;
    }
    fetchData();
  }, [authLoading, isAuthenticated, user, router, fetchData]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if(!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
        return toast.error("必須項目を入力してください");
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/florists/bank-accounts`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bankForm)
      });
      
      if (!res.ok) throw new Error('保存に失敗しました');
      
      toast.success('口座情報を保存しました');
      setShowBankForm(false);
      fetchData(); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = parseInt(requestAmount);
    
    if (isNaN(amount) || amount < 1000) return toast.error('申請は1,000円分から可能です');
    if (amount > floristBalance) return toast.error('売上残高が不足しています'); // ★ 修正: floristBalanceを使用

    if (!confirm(`${amount.toLocaleString()}円の出金申請を行いますか？\n(手数料250円が差し引かれます)`)) return;

    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        
        // ★ 修正: 口座情報を文字列化してバックエンドに渡す
        const accountInfoStr = `銀行名: ${bankAccount.bankName}\n支店名: ${bankAccount.branchName}\n種別: ${bankAccount.accountType}\n口座番号: ${bankAccount.accountNumber}\n名義: ${bankAccount.accountHolder}`;

        // ★ 修正: 正しいAPIエンドポイントへリクエスト
        const res = await fetch(`${API_URL}/api/florists/request-payout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount, accountInfo: accountInfoStr })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || '申請に失敗しました');
        }

        toast.success('出金申請を受け付けました');
        setShowRequestModal(false);
        setRequestAmount('');
        
        await fetchData();

    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-emerald-50/50">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 to-sky-50/80 font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <Link href="/florists/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-600 transition-colors bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-white w-fit">
                <ChevronLeft size={16}/> ダッシュボードへ戻る
            </Link>
            <h1 className="text-2xl font-black text-slate-800 ml-2 tracking-tighter">売上・出金管理</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-400 rounded-[3rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden border border-emerald-300/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <p className="text-emerald-50 font-black mb-3 flex items-center gap-2 text-sm uppercase tracking-widest">
                        <CheckCircle2 size={18}/> 現在の売上残高 (出金可能額)
                    </p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-6xl font-black tracking-tighter font-mono drop-shadow-md">
                            {floristBalance.toLocaleString()} {/* ★ 修正: 売上残高を表示 */}
                        </span>
                        <span className="text-2xl font-bold text-emerald-100">円</span>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-inner">
                    <p className="text-xs font-black mb-4 text-white/90 uppercase tracking-widest text-center">Action</p>
                    <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (!bankAccount) return toast.error('先に出金先の銀行口座を登録してください');
                            setShowRequestModal(true);
                        }}
                        disabled={floristBalance < 1000} // ★ 修正
                        className="w-full bg-white text-emerald-600 px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        <DollarSign size={20} /> 出金申請をする
                    </motion.button>
                    <p className="text-[10px] font-bold text-center text-emerald-100 mt-4 flex items-center justify-center gap-1">
                        <Info size={14}/> 最低出金額 1,000円 / 手数料 250円
                    </p>
                </div>
            </div>
            
            <DollarSign className="absolute -right-10 -bottom-10 text-[15rem] text-white opacity-10 rotate-12 pointer-events-none" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
              <GlassCard className="!p-0 h-full flex flex-col overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <CreditCard className="text-emerald-500"/> 振込先銀行口座
                      </h2>
                      {bankAccount && (
                          <button onClick={() => setShowBankForm(true)} className="text-xs flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors text-slate-600 font-bold shadow-sm">
                              <Edit3 size={14}/> 編集
                          </button>
                      )}
                  </div>
                  
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                      {bankAccount ? (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">銀行名</p>
                                      <p className="font-bold text-slate-800 text-sm">{bankAccount.bankName}</p>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">支店名</p>
                                      <p className="font-bold text-slate-800 text-sm">{bankAccount.branchName}</p>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">口座種別</p>
                                      <p className="font-bold text-slate-800 text-sm">{bankAccount.accountType}</p>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">口座番号</p>
                                      <p className="font-bold text-slate-800 text-sm font-mono tracking-widest">
                                          ****{bankAccount.accountNumber.slice(-3)}
                                      </p>
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">口座名義 (カナ)</p>
                                  <p className="font-bold text-slate-800 text-sm">{bankAccount.accountHolder}</p>
                              </div>
                          </div>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500 shadow-inner">
                                  <AlertCircle size={32}/>
                              </div>
                              <p className="font-black text-slate-700 mb-2">口座情報が未登録です</p>
                              <p className="text-xs font-bold text-slate-400 mb-6">売上の出金を行うには口座登録が必要です</p>
                              <button onClick={() => setShowBankForm(true)} className="px-6 py-3 bg-slate-900 text-white rounded-full font-black hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg">
                                  <Plus size={18}/> 口座を登録する
                              </button>
                          </div>
                      )}
                  </div>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
              <GlassCard className="!p-0 h-full flex flex-col overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <List className="text-sky-500"/> 申請履歴
                      </h2>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar p-4 md:p-6">
                      {payouts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                              <List size={40} className="mb-4 opacity-50"/>
                              <p className="font-bold text-sm">履歴はありません</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {payouts.map(pay => (
                                  <div key={pay.id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all flex justify-between items-center group">
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="text-lg font-black text-slate-800 font-mono">
                                                  {pay.amount.toLocaleString()} <span className="text-xs font-bold text-slate-400">円</span>
                                              </span>
                                          </div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                              申請日: {new Date(pay.requestedAt || pay.createdAt).toLocaleDateString('ja-JP')}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                          <StatusBadge status={pay.status} />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </GlassCard>
            </motion.div>
        </div>

        {/* --- モーダル: 口座登録 --- */}
        <AnimatePresence>
          {showBankForm && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
                      <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><CreditCard className="text-emerald-500" size={20}/> 口座情報の{bankAccount ? '編集' : '登録'}</h3>
                          <button onClick={()=>setShowBankForm(false)} className="p-2 hover:bg-slate-200 bg-white shadow-sm rounded-full text-slate-400 transition-colors"><X size={18}/></button>
                      </div>
                      
                      <form onSubmit={handleSaveBank} className="p-6 md:p-8 space-y-5 bg-white">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">銀行名</label>
                                  <input value={bankForm.bankName} onChange={e=>setBankForm({...bankForm, bankName:e.target.value})} placeholder="例: みずほ銀行" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-sm" required />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">支店名</label>
                                  <input value={bankForm.branchName} onChange={e=>setBankForm({...bankForm, branchName:e.target.value})} placeholder="例: 渋谷支店" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-sm" required />
                              </div>
                          </div>

                          <div>
                              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">口座種別</label>
                              <select value={bankForm.accountType} onChange={e=>setBankForm({...bankForm, accountType:e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all appearance-none font-bold text-sm cursor-pointer">
                                  <option value="普通">普通</option>
                                  <option value="当座">当座</option>
                              </select>
                          </div>

                          <div>
                              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">口座番号 (半角数字)</label>
                              <input type="tel" value={bankForm.accountNumber} onChange={e=>setBankForm({...bankForm, accountNumber:e.target.value})} placeholder="1234567" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-mono font-bold text-sm" required />
                          </div>

                          <div>
                              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">口座名義 (全角カナ)</label>
                              <input value={bankForm.accountHolder} onChange={e=>setBankForm({...bankForm, accountHolder:e.target.value})} placeholder="ヤマダ タロウ" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold text-sm" required />
                          </div>
                          
                          <div className="flex gap-3 pt-4 border-t border-slate-100/50">
                              <button type="button" onClick={()=>setShowBankForm(false)} className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 transition-colors text-sm">キャンセル</button>
                              <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 text-sm">
                                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} {isSubmitting ? '保存中...':'保存する'}
                              </button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}

          {/* --- モーダル: 出金申請 --- */}
          {showRequestModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-0 overflow-hidden border border-white">
                      <div className="bg-gradient-to-r from-emerald-400 to-sky-400 p-8 text-white text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-sm shadow-inner rotate-3">
                            <DollarSign size={32}/>
                          </div>
                          <h3 className="text-2xl font-black mb-1 relative z-10">出金申請</h3>
                          <p className="text-emerald-50 text-xs font-bold relative z-10">引き出す金額を入力してください</p>
                      </div>
                      
                      <form onSubmit={handleRequestPayout} className="p-6 md:p-8 space-y-6">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">出金希望額</label>
                              <div className="relative">
                                  <input 
                                      type="number" value={requestAmount} onChange={e=>setRequestAmount(e.target.value)} 
                                      placeholder="1000" min="1000" max={floristBalance} required // ★上限修正
                                      className="w-full p-4 border-2 border-slate-100 bg-slate-50 rounded-2xl text-center text-3xl font-black text-slate-800 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-mono"
                                  />
                                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">円</span>
                              </div>
                              <p className="text-right text-[10px] font-bold text-slate-400 mt-2">出金可能額: {floristBalance.toLocaleString()}円</p>
                          </div>
                          
                          <div className="bg-slate-50/80 p-5 rounded-2xl space-y-3 border border-slate-100">
                              <div className="flex justify-between text-xs font-bold text-slate-500">
                                  <span>申請額</span><span>{requestAmount ? parseInt(requestAmount).toLocaleString() : 0} 円</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-rose-500">
                                  <span>振込手数料</span><span>- 250 円</span>
                              </div>
                              <div className="border-t border-slate-200/50 pt-3 mt-3 flex justify-between items-center font-black text-slate-800">
                                  <span>振込予定額</span>
                                  <span className="text-xl text-emerald-600">
                                      {requestAmount && parseInt(requestAmount) >= 1000 
                                          ? (parseInt(requestAmount) - 250).toLocaleString() 
                                          : 0} 円
                                  </span>
                              </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                              <button type="button" onClick={()=>setShowRequestModal(false)} className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 transition-colors text-sm">キャンセル</button>
                              <button type="submit" disabled={isSubmitting || !requestAmount || requestAmount < 1000} 
                                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none shadow-xl transition-all text-sm flex justify-center items-center gap-2"
                              >
                                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                                  {isSubmitting ? '処理中...' : '申請を確定'}
                              </button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}