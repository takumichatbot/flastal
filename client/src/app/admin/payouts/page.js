'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; 
import { useAuth } from '../../contexts/AuthContext';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiCreditCard, FiArrowLeft, FiClock, FiSettings, FiEdit, FiMail, FiMessageSquare } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 
  const [selectedBank, setSelectedBank] = useState(null); // モーダル表示用
  const [processingId, setProcessingId] = useState(null); // 処理中のID
  const router = useRouter(); 
  
  const { user, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      toast.error('ログインが必要です。');
      router.push('/login');
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      toast.error('管理者権限がありません。');
      router.push('/mypage');
      return;
    }

    fetchPayouts();

  }, [isAuthenticated, user, router, loading]); 

  // データ取得関数
  const fetchPayouts = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/admin/payouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
          localStorage.removeItem('authToken'); 
          toast.error('セッションの有効期限が切れました。再度ログインしてください。');
          router.push('/login'); 
          return;
      }
      
      if (!res.ok) {
        throw new Error('出金申請の読み込みに失敗しました。');
      }
      const data = await res.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
      setPayouts([]);
    } finally {
      setLoadingData(false);
    }
  };

  // ステータス更新 (完了 or 却下)
  const handleUpdateStatus = async (payoutId, newStatus) => {
    const isComplete = newStatus === 'COMPLETED';
    const message = isComplete 
        ? '「振込完了」として処理しますか？\n申請者に完了メールが送信されます。'
        : 'この申請を「却下」しますか？\n差し引かれたポイントは申請者に返還されます。';

    if (!window.confirm(message)) return;

    // 却下理由の入力 (却下の場合のみ)
    let adminComment = '';
    if (!isComplete) {
        adminComment = prompt('却下理由を入力してください（申請者に通知されます）', '口座情報不備のため');
        if (adminComment === null) return; // キャンセル
    }

    setProcessingId(payoutId);
    const toastId = toast.loading('処理中...');

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/admin/payouts/${payoutId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                status: newStatus,
                adminComment 
            })
        });

        if (!res.ok) {
           let errorMsg = '更新に失敗しました。';
           try {
               const errData = await res.json();
               errorMsg = errData.message || errorMsg;
           } catch(e) { /* ignore */ }
           throw new Error(errorMsg);
        }

        toast.success(isComplete ? '振込完了処理を行いました' : '申請を却下しました', { id: toastId });
        fetchPayouts(); // リスト更新

    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setProcessingId(null);
    }
  };

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-700">管理者権限を確認中...</p>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">出金申請の管理</h1>
          
          <button onClick={() => {
              logout(); 
              router.push('/login'); 
            }} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="mb-6 flex gap-3 sm:gap-4 flex-wrap">
          <Link href="/admin" className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">ダッシュボード</Link>
          <Link href="/admin/payouts" className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors">出金管理</Link>
          <Link href="/admin/moderation" className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">チャット監視</Link>
          <Link href="/admin/florist-approval" className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">お花屋さん審査</Link>
          <Link href="/admin/project-approval" className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">プロジェクト審査</Link>
        </nav>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-gray-700">申請一覧</h2>
             <button onClick={fetchPayouts} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors" title="更新">
                <FiRefreshCw size={20} className={loadingData ? "animate-spin" : ""} />
             </button>
          </div>

          {loadingData ? (
            <p className="text-gray-500 text-center py-4">読み込み中...</p>
          ) : payouts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">現在、処理待ちの出金申請はありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">申請日時</th>
                    <th scope="col" className="px-6 py-3">店舗名</th>
                    <th scope="col" className="px-6 py-3">金額 (円)</th>
                    <th scope="col" className="px-6 py-3 text-center">口座情報</th>
                    <th scope="col" className="px-6 py-3 text-center">ステータス / 操作</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    payout && payout.id ? ( 
                      <tr key={payout.id} className={`border-b hover:bg-gray-50 transition-colors ${payout.status === 'PENDING' ? 'bg-yellow-50/30' : 'bg-white'}`}>
                        <td className="px-6 py-4">
                            {payout.requestedAt ? new Date(payout.requestedAt).toLocaleString('ja-JP') : '-'}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                            {payout.user?.platformName || payout.user?.handleName || '不明'}
                            <div className="text-xs text-gray-400">{payout.user?.email}</div>
                        </td> 
                        <td className="px-6 py-4">
                            <div className="font-bold text-lg text-sky-700">{payout.finalAmount?.toLocaleString() || 0}</div>
                            <div className="text-xs text-gray-400">手数料: {payout.fee}円</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => setSelectedBank(payout.user?.bankAccount)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs flex items-center justify-center gap-1 mx-auto bg-indigo-50 px-2 py-1 rounded"
                          >
                            <FiCreditCard /> 確認する
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {payout.status === 'PENDING' ? (
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(payout.id, 'COMPLETED')}
                                        disabled={processingId === payout.id}
                                        className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                    >
                                        <FiCheckCircle /> 完了
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(payout.id, 'REJECTED')}
                                        disabled={processingId === payout.id}
                                        className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                    >
                                        <FiXCircle /> 却下
                                    </button>
                                </div>
                            ) : (
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {payout.status === 'COMPLETED' ? '振込完了' : '却下済み'}
                                </span>
                            )}
                            {payout.completedAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                    {new Date(payout.completedAt).toLocaleDateString()}
                                </div>
                            )}
                        </td>
                      </tr>
                    ) : null
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 口座情報モーダル */}
        {selectedBank && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBank(null)}>
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <FiCreditCard className="text-indigo-500"/> 振込先口座情報
                    </h3>
                    <div className="space-y-3 text-gray-700 font-mono text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between">
                            <span className="text-gray-500">銀行名</span>
                            <span className="font-bold">{selectedBank.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">支店名</span>
                            <span className="font-bold">{selectedBank.branchName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">種別</span>
                            <span className="font-bold">{selectedBank.accountType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">口座番号</span>
                            <span className="font-bold text-lg select-all">{selectedBank.accountNumber}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                            <span className="text-gray-500">名義 (カナ)</span>
                            <span className="font-bold text-indigo-700 select-all">{selectedBank.accountHolder}</span>
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-xs text-red-500 mb-2">※ 表示内容を元にインターネットバンキング等で振込を行ってください。</p>
                        <button onClick={() => setSelectedBank(null)} className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 font-bold transition-colors">
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}