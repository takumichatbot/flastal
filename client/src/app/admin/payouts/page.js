'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; 
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiRefreshCw, FiCheckCircle, FiXCircle, FiCreditCard, 
    FiDownload, FiCopy, FiAlertTriangle, FiSearch 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loadingData, setLoadingData] = useState(true); 
  const [selectedBank, setSelectedBank] = useState(null); 
  const [processingId, setProcessingId] = useState(null); 
  
  // フィルター用ステート
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | HISTORY
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter(); 
  const { user, isAuthenticated, loading, logout } = useAuth();

  // 認証チェック & 初期ロード
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

  // データ取得
  const fetchPayouts = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/admin/payouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
          localStorage.removeItem('authToken'); 
          toast.error('セッション切れです。再ログインしてください。');
          router.push('/login'); 
          return;
      }
      
      if (!res.ok) throw new Error('データ取得に失敗しました');
      
      const data = await res.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
      setPayouts([]);
    } finally {
      setLoadingData(false);
    }
  };

  // ステータス更新
  const handleUpdateStatus = async (payoutId, newStatus) => {
    const isComplete = newStatus === 'COMPLETED';
    const message = isComplete 
        ? '「振込完了」として処理しますか？\n※ 実際に銀行振込を行ってから押してください。'
        : 'この申請を「却下」しますか？\n※ ポイントは返還されます。';

    if (!window.confirm(message)) return;

    let adminComment = '';
    if (!isComplete) {
        adminComment = prompt('却下理由を入力 (申請者に通知されます)', '口座情報不備のため');
        if (adminComment === null) return; 
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
            body: JSON.stringify({ status: newStatus, adminComment })
        });

        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.message || '更新失敗');
        }

        toast.success(isComplete ? '完了処理しました' : '却下しました', { id: toastId });
        fetchPayouts(); 

    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setProcessingId(null);
    }
  };

  // クリップボードコピー
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('コピーしました', { duration: 1000, position: 'bottom-center' });
  };

  // フィルタリング処理
  const filteredPayouts = useMemo(() => {
    let data = payouts;

    // タブフィルター
    if (activeTab === 'PENDING') {
        data = data.filter(p => p.status === 'PENDING');
    } else {
        data = data.filter(p => p.status !== 'PENDING');
    }

    // 検索フィルター
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        data = data.filter(p => 
            (p.user?.platformName && p.user.platformName.toLowerCase().includes(lower)) ||
            (p.user?.email && p.user.email.toLowerCase().includes(lower))
        );
    }

    // ソート (新しい順)
    return data.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }, [payouts, activeTab, searchTerm]);

  // CSVダウンロード (ダミー機能)
  const handleDownloadCSV = () => {
    toast('CSVダウンロード機能は準備中です', { icon: '🚧' });
  };

  if (loading || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>;
  }
 
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FiCreditCard className="text-indigo-600"/> 出金申請管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">花屋からの売上出金リクエストを確認・処理します。</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => { logout(); router.push('/login'); }} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">ログアウト</button>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 inline-flex flex-wrap gap-1">
          {[
            { name: 'ダッシュボード', path: '/admin' },
            { name: '出金管理', path: '/admin/payouts', active: true },
            { name: 'チャット監視', path: '/admin/moderation' },
            { name: '花屋審査', path: '/admin/florist-approval' },
            { name: '企画審査', path: '/admin/project-approval' },
          ].map((nav) => (
            <Link 
              key={nav.path}
              href={nav.path}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-all
                ${nav.active 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              {nav.name}
            </Link>
          ))}
        </div>

        {/* コントロールバー */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
            {/* タブ */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('PENDING')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'PENDING' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    <FiAlertTriangle className={activeTab === 'PENDING' ? "text-indigo-500" : ""} />
                    未処理
                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'PENDING' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-300 text-white'}`}>
                        {payouts.filter(p => p.status === 'PENDING').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                    履歴 (完了/却下)
                </button>
            </div>

            {/* 検索・CSV */}
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="店舗名やメールで検索..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <button onClick={handleDownloadCSV} className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" title="CSVダウンロード">
                    <FiDownload />
                </button>
                <button onClick={fetchPayouts} className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" title="更新">
                    <FiRefreshCw className={loadingData ? "animate-spin" : ""} />
                </button>
            </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">
          {loadingData ? (
            <div className="flex justify-center py-20 text-gray-400">読み込み中...</div>
          ) : filteredPayouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FiCheckCircle className="text-4xl text-gray-200 mb-3" />
                <p>該当する申請はありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">申請日</th>
                    <th className="px-6 py-4">申請者 (花屋)</th>
                    <th className="px-6 py-4">振込金額</th>
                    <th className="px-6 py-4 text-center">口座情報</th>
                    <th className="px-6 py-4 text-center">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-indigo-50/30 transition-colors group">
                        {/* 申請日 */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(payout.requestedAt).toLocaleDateString()}
                            <div className="text-xs text-gray-400">
                                {new Date(payout.requestedAt).toLocaleTimeString()}
                            </div>
                        </td>

                        {/* 申請者 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-800">{payout.user?.platformName || payout.user?.handleName || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{payout.user?.email}</div>
                        </td>

                        {/* 金額 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-gray-900">
                                    ¥{payout.finalAmount?.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400">
                                (総売上: ¥{payout.amount?.toLocaleString()} - 手数料: ¥{payout.fee?.toLocaleString()})
                            </div>
                        </td>

                        {/* 口座情報ボタン */}
                        <td className="px-6 py-4 text-center">
                            <button 
                                onClick={() => setSelectedBank(payout.user?.bankAccount)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm text-xs font-bold"
                            >
                                <FiCreditCard /> 詳細
                            </button>
                        </td>

                        {/* アクション */}
                        <td className="px-6 py-4 text-center">
                            {payout.status === 'PENDING' ? (
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(payout.id, 'COMPLETED')}
                                        disabled={processingId === payout.id}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <FiCheckCircle /> 振込完了
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(payout.id, 'REJECTED')}
                                        disabled={processingId === payout.id}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="却下する"
                                    >
                                        <FiXCircle size={18} />
                                    </button>
                                </div>
                            ) : (
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                    payout.status === 'COMPLETED' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                    {payout.status === 'COMPLETED' ? <FiCheckCircle/> : <FiXCircle/>}
                                    {payout.status === 'COMPLETED' ? '完了済み' : '却下済み'}
                                </span>
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
        {selectedBank && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setSelectedBank(null)}>
                <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-sm overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><FiCreditCard/> 振込先情報</h3>
                        <button onClick={() => setSelectedBank(null)} className="hover:bg-white/20 p-1 rounded-full"><FiXCircle size={20}/></button>
                    </div>
                    
                    <div className="p-6 space-y-4 bg-gray-50">
                        {[
                            { label: '銀行名', value: selectedBank.bankName },
                            { label: '支店名', value: selectedBank.branchName },
                            { label: '口座種別', value: selectedBank.accountType },
                            { label: '口座番号', value: selectedBank.accountNumber, isCopy: true },
                            { label: '口座名義', value: selectedBank.accountHolder, isCopy: true, highlight: true }
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <span className="text-xs font-bold text-gray-500 uppercase">{item.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono font-bold ${item.highlight ? 'text-indigo-700 text-base' : 'text-gray-800'}`}>
                                        {item.value || '-'}
                                    </span>
                                    {item.isCopy && item.value && (
                                        <button 
                                            onClick={() => copyToClipboard(item.value)}
                                            className="text-gray-400 hover:text-indigo-500 transition-colors p-1"
                                            title="コピー"
                                        >
                                            <FiCopy />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-4 bg-white border-t border-gray-100 text-center">
                        <button onClick={() => setSelectedBank(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
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