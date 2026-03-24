'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

// lucide-reactに統一
import { 
    RefreshCw, CheckCircle2, XCircle, CreditCard, 
    Download, Copy, AlertTriangle, Search, Loader2, ArrowLeft, DollarSign
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6", className)}>
    {children}
  </div>
);

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 
  const [selectedBank, setSelectedBank] = useState(null); 
  const [processingId, setProcessingId] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('PENDING'); 
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter(); 
  const { user, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!user || user.role !== 'ADMIN') { router.push('/mypage'); return; }
    fetchPayouts();
  }, [isAuthenticated, user, router, loading]); 

  const fetchPayouts = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/admin/payouts`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('データ取得に失敗しました');
      const data = await res.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateStatus = async (payoutId, newStatus) => {
    const isComplete = newStatus === 'COMPLETED';
    if (!window.confirm(isComplete ? '「振込完了」として処理しますか？\n※ 実際に銀行振込を行ってから押してください。' : 'この申請を「却下」しますか？\n※ ポイントは返還されます。')) return;

    let adminComment = '';
    if (!isComplete) {
        adminComment = prompt('却下理由を入力 (申請者に通知されます)', '口座情報不備のため');
        if (adminComment === null) return; 
    }

    setProcessingId(payoutId);
    const toastId = toast.loading('処理中...');
    try {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        const res = await fetch(`${API_URL}/api/admin/payouts/${payoutId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus, adminComment })
        });
        if (!res.ok) throw new Error('更新失敗');
        toast.success(isComplete ? '完了処理しました' : '却下しました', { id: toastId });
        fetchPayouts(); 
    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setProcessingId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('コピーしました', { duration: 1000 });
  };

  const filteredPayouts = useMemo(() => {
    let data = activeTab === 'PENDING' ? payouts.filter(p => p.status === 'PENDING') : payouts.filter(p => p.status !== 'PENDING');
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        data = data.filter(p => (p.user?.platformName && p.user.platformName.toLowerCase().includes(lower)) || (p.user?.email && p.user.email.toLowerCase().includes(lower)));
    }
    return data.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }, [payouts, activeTab, searchTerm]);

  const StatusBadge = ({ status }) => {
    const styles = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-600 border-amber-200', label: '申請中' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-600 border-emerald-200', label: '振込完了' },
      REJECTED: { bg: 'bg-rose-50', text: 'text-rose-600 border-rose-200', label: '却下' },
    };
    const current = styles[status] || styles['PENDING'];
    return <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border", current.bg, current.text)}>{current.label}</span>;
  };

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') return <div className="flex justify-center items-center min-h-screen bg-slate-50"><Loader2 className="animate-spin text-sky-500 size-10" /></div>;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30 font-sans text-slate-800 pb-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-200/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      
      <div className="max-w-7xl mx-auto p-6 sm:p-12 relative z-10">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="space-y-3">
            <Link href="/admin" className="inline-flex items-center text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                <ArrowLeft size={14} className="mr-1.5"/> ダッシュボードへ戻る
            </Link>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase italic"><CreditCard className="text-emerald-500"/> Payouts</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">花屋からの売上出金リクエストを処理します</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => { logout(); router.push('/login'); }} className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">ログアウト</button>
          </div>
        </div>

        <GlassCard className="!p-4 md:!p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl w-full md:w-auto border border-white">
                <button onClick={() => setActiveTab('PENDING')} className={cn("flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2", activeTab === 'PENDING' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    <AlertTriangle size={14} className={activeTab === 'PENDING' ? "text-emerald-500" : ""} /> 未処理
                    <span className={cn("px-2 py-0.5 rounded-md", activeTab === 'PENDING' ? 'bg-emerald-100' : 'bg-slate-200 text-slate-500')}>{payouts.filter(p => p.status === 'PENDING').length}</span>
                </button>
                <button onClick={() => setActiveTab('HISTORY')} className={cn("flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all", activeTab === 'HISTORY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    履歴 (完了/却下)
                </button>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                    <input type="text" placeholder="店舗名やメールで検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-200 outline-none transition-all placeholder:text-slate-300"
                    />
                </div>
                <button onClick={() => toast('CSVダウンロード機能は準備中です', { icon: '🚧' })} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors shadow-md" title="CSVダウンロード"><Download size={18}/></button>
                <button onClick={fetchPayouts} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm" title="更新">
                    <RefreshCw size={18} className={loadingData ? "animate-spin" : ""}/>
                </button>
            </div>
        </GlassCard>

        {/* テーブル */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {loadingData ? (
            <div className="flex justify-center py-32 text-slate-400"><Loader2 className="animate-spin size-8 text-emerald-500"/></div>
          ) : filteredPayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <CheckCircle2 size={48} className="text-slate-200 mb-4" />
                <p className="font-black">該当する申請はありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">申請日</th>
                    <th className="px-8 py-5">申請者 (花屋)</th>
                    <th className="px-8 py-5">振込金額</th>
                    <th className="px-8 py-5 text-center">口座情報</th>
                    <th className="px-8 py-5 text-center">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                            <span className="text-slate-700 font-bold">{new Date(payout.requestedAt).toLocaleDateString()}</span>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{new Date(payout.requestedAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                            <div className="font-black text-slate-800">{payout.user?.platformName || payout.user?.handleName || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1">{payout.user?.email}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-1 font-black text-lg text-emerald-600">
                                <DollarSign size={16}/> {payout.finalAmount?.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold mt-1">
                                (総売上: ¥{payout.amount?.toLocaleString()} - 手数料: ¥{payout.fee?.toLocaleString()})
                            </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                            <button onClick={() => setSelectedBank(payout.user?.bankAccount)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm text-xs font-black">
                                <CreditCard size={14}/> 口座確認
                            </button>
                        </td>
                        <td className="px-8 py-5 text-center">
                            {payout.status === 'PENDING' ? (
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => handleUpdateStatus(payout.id, 'COMPLETED')} disabled={processingId === payout.id} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-md hover:bg-emerald-500 transition-all disabled:opacity-50 uppercase tracking-widest flex items-center gap-1.5">
                                        <CheckCircle2 size={14}/> 振込完了
                                    </button>
                                    <button onClick={() => handleUpdateStatus(payout.id, 'REJECTED')} disabled={processingId === payout.id} className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500 bg-rose-50 rounded-xl transition-all shadow-sm" title="却下する">
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            ) : (
                                <StatusBadge status={payout.status} />
                            )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 口座情報モーダル */}
        <AnimatePresence>
            {selectedBank && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedBank(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl p-0 w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-emerald-50 p-6 flex justify-between items-center border-b border-emerald-100">
                            <h3 className="font-black text-emerald-800 flex items-center gap-2"><CreditCard size={20}/> 振込先情報</h3>
                            <button onClick={() => setSelectedBank(null)} className="hover:bg-white p-2 rounded-full text-emerald-600 transition-colors shadow-sm"><XCircle size={20}/></button>
                        </div>
                        <div className="p-8 space-y-5 bg-white">
                            {[
                                { label: '銀行名', value: selectedBank.bankName },
                                { label: '支店名', value: selectedBank.branchName },
                                { label: '口座種別', value: selectedBank.accountType },
                                { label: '口座番号', value: selectedBank.accountNumber, isCopy: true },
                                { label: '口座名義', value: selectedBank.accountHolder, isCopy: true, highlight: true }
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-bold text-sm", item.highlight ? 'text-emerald-600 text-base font-black' : 'text-slate-700 font-mono')}>
                                            {item.value || '-'}
                                        </span>
                                        {item.isCopy && item.value && (
                                            <button onClick={() => copyToClipboard(item.value)} className="text-slate-400 hover:text-emerald-500 bg-slate-50 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors border border-slate-100" title="コピー">
                                                <Copy size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                            <button onClick={() => setSelectedBank(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-colors text-sm shadow-md">閉じる</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}