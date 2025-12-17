'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { FiDollarSign, FiCreditCard, FiList, FiAlertCircle, FiCheckCircle, FiSave, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FloristPayoutsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [bankAccount, setBankAccount] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // フォーム・モーダル用
  const [showBankForm, setShowBankForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // 入力ステート
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

      const [bankRes, payoutRes] = await Promise.all([
        fetch(`${API_URL}/api/bank-accounts`, { headers }),
        fetch(`${API_URL}/api/payouts`, { headers })
      ]);

      if (bankRes.ok) {
        const data = await bankRes.json();
        if (data && data.id) {
            setBankAccount(data);
            setBankForm({
                bankName: data.bankName,
                branchName: data.branchName,
                accountType: data.accountType,
                accountNumber: data.accountNumber,
                accountHolder: data.accountHolder
            });
        }
      }
      
      if (payoutRes.ok) {
        setPayouts(await payoutRes.json());
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

  // 口座保存
  const handleSaveBank = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/bank-accounts`, {
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

  // 出金申請
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = parseInt(requestAmount);
    if (amount < 1000) return toast.error('申請は1,000ptから可能です');
    if (amount > user.points) return toast.error('ポイント残高が不足しています');

    if (!confirm(`${amount.toLocaleString()}円の出金申請を行いますか？\n振込手数料250円が差し引かれます。`)) return;

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
        router.refresh(); 
        fetchData(); 
        setTimeout(() => window.location.reload(), 1500); 

    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading || authLoading) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
            {/* ★★★ 修正箇所: 戻り先をダッシュボードへ ★★★ */}
            <Link href="/florists/dashboard" className="p-2 bg-white rounded-full shadow text-gray-500 hover:text-gray-800">←ダッシュボードへ戻る</Link>
            <h1 className="text-2xl font-bold text-gray-800">売上管理・出金</h1>
        </div>

        {/* 1. ポイント残高カード */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-pink-100 font-medium mb-1">現在の売上残高 (出金可能額)</p>
                <div className="text-5xl font-bold font-mono tracking-tight">
                    {user?.points?.toLocaleString() || 0} <span className="text-2xl">円分</span>
                </div>
                <div className="mt-6">
                    <button 
                        onClick={() => {
                            if (!bankAccount) return toast.error('先に口座情報を登録してください');
                            setShowRequestModal(true);
                        }}
                        disabled={!user || user.points < 1000}
                        className="bg-white text-pink-600 px-6 py-3 rounded-full font-bold shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <FiDollarSign /> 出金申請をする
                    </button>
                    <p className="text-xs text-pink-100 mt-2 ml-2">※ 1,000円分から申請可能 / 手数料250円</p>
                </div>
            </div>
            <FiDollarSign className="absolute -right-6 -bottom-6 text-9xl text-white opacity-20 transform rotate-12" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            
            {/* 2. 銀行口座情報 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2"><FiCreditCard/> 振込先口座</h2>
                    <button 
                        onClick={() => setShowBankForm(true)} 
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        {bankAccount ? '編集する' : '登録する'}
                    </button>
                </div>
                
                {bankAccount ? (
                    <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-bold w-20 inline-block">銀行名:</span> {bankAccount.bankName}</p>
                        <p><span className="font-bold w-20 inline-block">支店名:</span> {bankAccount.branchName}</p>
                        <p><span className="font-bold w-20 inline-block">種別:</span> {bankAccount.accountType}</p>
                        <p><span className="font-bold w-20 inline-block">口座番号:</span> ****{bankAccount.accountNumber.slice(-3)}</p>
                        <p><span className="font-bold w-20 inline-block">名義:</span> {bankAccount.accountHolder}</p>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-400">
                        <FiAlertCircle className="mx-auto text-3xl mb-2"/>
                        <p>口座情報が未登録です</p>
                        <button onClick={() => setShowBankForm(true)} className="mt-2 text-indigo-500 font-bold underline">登録する</button>
                    </div>
                )}
            </div>

            {/* 3. 最近の申請履歴 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><FiList/> 申請履歴</h2>
                <div className="space-y-3 overflow-y-auto max-h-[250px]">
                    {payouts.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">履歴はありません</p>
                    ) : (
                        payouts.map(pay => (
                            <div key={pay.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800">{pay.amount.toLocaleString()}円</p>
                                    <p className="text-xs text-gray-500">{new Date(pay.requestedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                        pay.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        pay.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {pay.status === 'COMPLETED' ? '振込完了' : 
                                         pay.status === 'REJECTED' ? '却下' : '申請中'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* --- モーダル: 口座登録 --- */}
        {showBankForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold mb-4">口座情報の登録</h3>
                    <form onSubmit={handleSaveBank} className="space-y-4">
                        <input value={bankForm.bankName} onChange={e=>setBankForm({...bankForm, bankName:e.target.value})} placeholder="銀行名 (例: 三菱UFJ銀行)" className="w-full p-2 border rounded" required />
                        <input value={bankForm.branchName} onChange={e=>setBankForm({...bankForm, branchName:e.target.value})} placeholder="支店名 (例: 渋谷支店)" className="w-full p-2 border rounded" required />
                        <select value={bankForm.accountType} onChange={e=>setBankForm({...bankForm, accountType:e.target.value})} className="w-full p-2 border rounded">
                            <option value="普通">普通</option>
                            <option value="当座">当座</option>
                        </select>
                        <input value={bankForm.accountNumber} onChange={e=>setBankForm({...bankForm, accountNumber:e.target.value})} placeholder="口座番号 (半角数字)" className="w-full p-2 border rounded" required />
                        <input value={bankForm.accountHolder} onChange={e=>setBankForm({...bankForm, accountHolder:e.target.value})} placeholder="口座名義 (全角カナ)" className="w-full p-2 border rounded" required />
                        
                        <div className="flex gap-2 pt-4">
                            <button type="button" onClick={()=>setShowBankForm(false)} className="flex-1 py-2 bg-gray-100 rounded">キャンセル</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">{isSubmitting ? '保存中...':'保存'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- モーダル: 出金申請 --- */}
        {showRequestModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                    <h3 className="text-lg font-bold mb-2">出金申請</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        申請額を入力してください。<br/>
                        振込手数料 <span className="text-red-500">250円</span> が差し引かれます。
                    </p>
                    <form onSubmit={handleRequestPayout} className="space-y-4">
                        <div className="relative">
                            <input 
                                type="number" 
                                value={requestAmount} 
                                onChange={e=>setRequestAmount(e.target.value)} 
                                placeholder="1000" 
                                min="1000" 
                                max={user.points}
                                className="w-full p-3 border-2 border-pink-100 rounded-xl text-center text-xl font-bold focus:border-pink-500 outline-none"
                                required 
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400">pt</span>
                        </div>
                        
                        {requestAmount >= 1000 && (
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                                <div className="flex justify-between"><span>申請額:</span><span>{parseInt(requestAmount).toLocaleString()} 円</span></div>
                                <div className="flex justify-between text-red-500"><span>手数料:</span><span>- 250 円</span></div>
                                <div className="flex justify-between font-bold border-t border-gray-300 mt-1 pt-1"><span>振込予定額:</span><span>{(parseInt(requestAmount) - 250).toLocaleString()} 円</span></div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={()=>setShowRequestModal(false)} className="flex-1 py-2 bg-gray-100 rounded">キャンセル</button>
                            <button type="submit" disabled={isSubmitting || requestAmount < 1000} className="flex-1 py-2 bg-pink-500 text-white rounded font-bold hover:bg-pink-600 disabled:bg-gray-300">
                                {isSubmitting ? '処理中...' : '申請する'}
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