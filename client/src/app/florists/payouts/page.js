'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // パスは環境に合わせて調整
import toast from 'react-hot-toast';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiList, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiSave, 
  FiChevronLeft,
  FiEdit2,
  FiPlus,
  FiX,
  FiInfo
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ステータスバッジ用コンポーネント
const StatusBadge = ({ status }) => {
  const styles = {
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '申請中' },
    'COMPLETED': { bg: 'bg-green-100', text: 'text-green-700', label: '振込完了' },
    'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', label: '却下' },
  };
  const current = styles[status] || styles['PENDING'];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${current.bg} ${current.text}`}>
      {current.label}
    </span>
  );
};

export default function FloristPayoutsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [bankAccount, setBankAccount] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // モーダル表示ステート
  const [showBankForm, setShowBankForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // フォームデータ
  const [bankForm, setBankForm] = useState({
    bankName: '', branchName: '', accountType: '普通', accountNumber: '', accountHolder: ''
  });
  const [requestAmount, setRequestAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 口座情報と履歴を並行取得
      const [bankRes, payoutRes] = await Promise.all([
        fetch(`${API_URL}/api/bank-accounts`, { headers }),
        fetch(`${API_URL}/api/payouts`, { headers })
      ]);

      if (bankRes.ok) {
        const data = await bankRes.json();
        // APIが空のオブジェクトを返す場合などを考慮
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

    } catch (error) {
      console.error(error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    // 権限チェック
    if (!isAuthenticated || user?.role !== 'FLORIST') {
        toast.error('お花屋さん専用ページです');
        router.push('/florists/login');
        return;
    }
    fetchData();
  }, [authLoading, isAuthenticated, user, router, fetchData]);

  // --- ハンドラ関数 ---

  // 口座情報の保存
  const handleSaveBank = async (e) => {
    e.preventDefault();
    
    // 簡易バリデーション
    if(!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
        return toast.error("必須項目を入力してください");
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/bank-accounts`, {
        method: 'POST', // サーバー仕様に合わせて PUT or POST
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bankForm)
      });
      
      if (!res.ok) throw new Error('保存に失敗しました');
      
      toast.success('口座情報を保存しました');
      setShowBankForm(false);
      fetchData(); // 画面リフレッシュ
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 出金申請
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = parseInt(requestAmount);
    
    // バリデーション
    if (isNaN(amount) || amount < 1000) return toast.error('申請は1,000円分から可能です');
    if (amount > (user?.points || 0)) return toast.error('ポイント残高が不足しています');

    if (!confirm(`${amount.toLocaleString()}円の出金申請を行いますか？\n(手数料250円が差し引かれます)`)) return;

    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        const res = await fetch(`${API_URL}/api/payouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || '申請に失敗しました');
        }

        toast.success('出金申請を受け付けました');
        setShowRequestModal(false);
        setRequestAmount('');
        
        // データ再取得 & ページリロード（残高更新のため）
        await fetchData();
        router.refresh();

    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- レンダリング ---

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link 
                href="/florists/dashboard" 
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-pink-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 w-fit"
            >
                <FiChevronLeft /> ダッシュボードへ戻る
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 ml-2">売上・出金管理</h1>
        </div>

        {/* 1. ポイント残高カード (ヒーローセクション) */}
        <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <p className="text-pink-100 font-bold mb-2 flex items-center gap-2">
                        <FiCheckCircle /> 現在の売上残高 (出金可能額)
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold tracking-tight font-mono">
                            {user?.points?.toLocaleString() || 0}
                        </span>
                        <span className="text-2xl font-bold">pt</span>
                    </div>
                    <p className="text-sm text-pink-100 mt-2 opacity-90">
                        ※ 1pt = 1円として換算されます
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <p className="text-sm font-bold mb-4 text-white/90">アクション</p>
                    <button 
                        onClick={() => {
                            if (!bankAccount) return toast.error('先に出金先の銀行口座を登録してください');
                            setShowRequestModal(true);
                        }}
                        disabled={!user || user.points < 1000}
                        className="w-full bg-white text-pink-600 px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        <FiDollarSign size={20} /> 出金申請をする
                    </button>
                    <p className="text-xs text-center text-pink-100 mt-3 flex items-center justify-center gap-1">
                        <FiInfo /> 最低出金額 1,000円 / 手数料 250円
                    </p>
                </div>
            </div>
            
            {/* 装飾用背景アイコン */}
            <FiDollarSign className="absolute -right-10 -bottom-10 text-[12rem] text-white opacity-10 rotate-12" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            
            {/* 2. 銀行口座情報 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FiCreditCard className="text-pink-500"/> 振込先銀行口座
                    </h2>
                    {bankAccount && (
                        <button 
                            onClick={() => setShowBankForm(true)} 
                            className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors text-gray-600 font-bold"
                        >
                            <FiEdit2 /> 編集
                        </button>
                    )}
                </div>
                
                <div className="p-6 flex-1">
                    {bankAccount ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">銀行名</p>
                                    <p className="font-bold text-gray-800">{bankAccount.bankName}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">支店名</p>
                                    <p className="font-bold text-gray-800">{bankAccount.branchName}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">口座種別</p>
                                    <p className="font-bold text-gray-800">{bankAccount.accountType}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">口座番号</p>
                                    <p className="font-bold text-gray-800 tracking-widest">
                                        ****{bankAccount.accountNumber.slice(-3)}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">口座名義 (カナ)</p>
                                <p className="font-bold text-gray-800">{bankAccount.accountHolder}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                            <div className="bg-pink-50 p-4 rounded-full mb-3">
                                <FiAlertCircle className="text-pink-500 text-2xl"/>
                            </div>
                            <p className="font-bold text-gray-600 mb-1">口座情報が未登録です</p>
                            <p className="text-sm text-gray-400 mb-6">出金を行うには口座登録が必要です</p>
                            <button 
                                onClick={() => setShowBankForm(true)} 
                                className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <FiPlus /> 口座を登録する
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. 最近の申請履歴 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FiList className="text-pink-500"/> 申請履歴
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px]">
                    {payouts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                            <p>履歴はありません</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {payouts.map(pay => (
                                <div key={pay.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-bold text-gray-800">
                                                {pay.amount.toLocaleString()} <span className="text-xs font-normal">円</span>
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            申請日: {new Date(pay.requestedAt).toLocaleDateString('ja-JP')}
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
            </div>
        </div>

        {/* --- モーダル: 口座登録 --- */}
        {showBankForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">口座情報の{bankAccount ? '編集' : '登録'}</h3>
                        <button onClick={()=>setShowBankForm(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><FiX /></button>
                    </div>
                    
                    <form onSubmit={handleSaveBank} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">銀行名</label>
                                <input 
                                    value={bankForm.bankName} 
                                    onChange={e=>setBankForm({...bankForm, bankName:e.target.value})} 
                                    placeholder="例: みずほ銀行" 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">支店名</label>
                                <input 
                                    value={bankForm.branchName} 
                                    onChange={e=>setBankForm({...bankForm, branchName:e.target.value})} 
                                    placeholder="例: 渋谷支店" 
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" 
                                    required 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">口座種別</label>
                            <select 
                                value={bankForm.accountType} 
                                onChange={e=>setBankForm({...bankForm, accountType:e.target.value})} 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all appearance-none"
                            >
                                <option value="普通">普通</option>
                                <option value="当座">当座</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">口座番号 (半角数字)</label>
                            <input 
                                type="tel"
                                value={bankForm.accountNumber} 
                                onChange={e=>setBankForm({...bankForm, accountNumber:e.target.value})} 
                                placeholder="1234567" 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all font-mono" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">口座名義 (全角カナ)</label>
                            <input 
                                value={bankForm.accountHolder} 
                                onChange={e=>setBankForm({...bankForm, accountHolder:e.target.value})} 
                                placeholder="ヤマダ タロウ" 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-pink-500 outline-none transition-all" 
                                required 
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={()=>setShowBankForm(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">キャンセル</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 flex items-center justify-center gap-2">
                                <FiSave /> {isSubmitting ? '保存中...':'保存する'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- モーダル: 出金申請 --- */}
        {showRequestModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-0 overflow-hidden">
                    <div className="bg-pink-600 p-6 text-white text-center">
                        <h3 className="text-xl font-bold mb-1">出金申請</h3>
                        <p className="text-pink-100 text-sm">申請額を入力してください</p>
                    </div>
                    
                    <form onSubmit={handleRequestPayout} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-600">出金希望額</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={requestAmount} 
                                    onChange={e=>setRequestAmount(e.target.value)} 
                                    placeholder="1000" 
                                    min="1000" 
                                    max={user?.points}
                                    className="w-full p-4 border-2 border-gray-100 rounded-xl text-center text-2xl font-bold text-gray-800 focus:border-pink-500 outline-none"
                                    required 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">円</span>
                            </div>
                            <p className="text-right text-xs text-gray-400">出金可能額: {user?.points?.toLocaleString()}円</p>
                        </div>
                        
                        {/* 計算プレビュー */}
                        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>申請額</span>
                                <span>{requestAmount ? parseInt(requestAmount).toLocaleString() : 0} 円</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500">
                                <span>振込手数料</span>
                                <span>- 250 円</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-800">
                                <span>振込予定額</span>
                                <span className="text-lg">
                                    {requestAmount && parseInt(requestAmount) >= 1000 
                                        ? (parseInt(requestAmount) - 250).toLocaleString() 
                                        : 0} 円
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={()=>setShowRequestModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">キャンセル</button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !requestAmount || requestAmount < 1000} 
                                className="flex-1 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-pink-200 transition-all"
                            >
                                {isSubmitting ? '処理中...' : '申請を確定'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}