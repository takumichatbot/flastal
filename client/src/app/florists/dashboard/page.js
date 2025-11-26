'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
// ▼▼▼ 修正箇所: パスを修正しました (../を1つ減らしました) ▼▼▼
import { useAuth } from '../../contexts/AuthContext'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// StatCard Component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
    <div className="flex items-center gap-4">
      <div className="bg-sky-100 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default function FloristDashboardPage() {
  const { user, token, logout } = useAuth(); // useAuthから情報を取得
  const router = useRouter();
  
  const [floristData, setFloristData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [payoutAmount, setPayoutAmount] = useState('');
  const [accountInfo, setAccountInfo] = useState('');

  const MINIMUM_PAYOUT_AMOUNT = 1000;

  // データ取得関数 (トークンを使用)
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      // ダッシュボード情報と出金履歴を並行取得
      const [dashboardRes, payoutsRes] = await Promise.all([
        fetch(`${API_URL}/api/florists/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/florists/payouts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (dashboardRes.status === 401 || dashboardRes.status === 403) {
        throw new Error('認証エラー: 再ログインしてください');
      }

      if (!dashboardRes.ok || !payoutsRes.ok) {
        throw new Error('データの取得に失敗しました');
      }
      
      const dashboardData = await dashboardRes.json();
      const payoutsData = await payoutsRes.json();

      setFloristData(dashboardData.florist);
      setOffers(dashboardData.offers || []);
      setPayouts(payoutsData || []);

    } catch (error) {
      console.error(error);
      toast.error(error.message);
      if (error.message.includes('認証エラー')) {
        logout();
        router.push('/florists/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    // user情報がロードされるのを待つ
    if (!user && !loading) {
        // 未ログイン時の処理が必要であれば記述
    }
    
    if (user && user.role === 'FLORIST' && token) {
        fetchData();
    } else if (user && user.role !== 'FLORIST') {
        // お花屋さん以外がアクセスした場合
        // toast.error('権限がありません'); // 必要に応じてコメントアウト解除
        // router.push('/');
    }
  }, [user, token]); 

  // オファー状態更新
  const handleUpdateOfferStatus = async (offerId, newStatus) => {
    const promise = fetch(`${API_URL}/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
    }).then(async (response) => {
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || '更新に失敗しました');
        }
        return response.json();
    });

    toast.promise(promise, {
        loading: '更新中...',
        success: () => {
          fetchData(); // データ再取得
          return `オファーを「${newStatus === 'ACCEPTED' ? '承認' : '辞退'}」しました。`;
        },
        error: (err) => err.message,
    });
  };

  // 出金申請
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (window.confirm(`${payoutAmount}ptを出金申請します。よろしいですか？`)) {
      const promise = fetch(`${API_URL}/api/payouts`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseInt(payoutAmount),
          accountInfo: accountInfo,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        return res.json();
      });

      toast.promise(promise, {
        loading: '申請中...',
        success: () => {
          setPayoutAmount('');
          setAccountInfo('');
          fetchData(); 
          return '出金申請を受け付けました。';
        },
        error: (err) => err.message,
      });
    }
  };

  // ログアウト
  const handleLogout = () => {
      logout();
      toast.success('ログアウトしました。');
      router.push('/florists/login');
  };
      
  // ローディング表示
  if (loading || !floristData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }
  
  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
  const isPayoutDisabled = !payoutAmount || !accountInfo || Number(payoutAmount) < MINIMUM_PAYOUT_AMOUNT || Number(payoutAmount) > (floristData.balance || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-pink-600">お花屋さんダッシュボード</h1>
            <p className="text-sm text-gray-500">ようこそ、{floristData.platformName}さん</p> 
          </div>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
              ログアウト
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* ステータスカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
                title="現在の売上残高" 
                value={`${floristData.balance?.toLocaleString() || 0} pt`} 
                icon={<svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
            <StatCard 
                title="対応中の企画数" 
                value={`${acceptedOffers.length} 件`} 
                icon={<svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
            />
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center border border-slate-100">
               <Link href="/florists/profile/edit" className="w-full"> 
                  <span className="block w-full text-center px-6 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors shadow-md">
                    プロフィールを編集
                  </span>
                </Link>
            </div>
          </div>

          {/* メインタブエリア */}
          <div className="bg-white shadow-lg rounded-2xl p-6 border border-slate-100">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <button onClick={() => setActiveTab('pending')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'pending' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>新着オファー ({pendingOffers.length})</button>
                <button onClick={() => setActiveTab('accepted')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'accepted' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>対応中の企画 ({acceptedOffers.length})</button>
                <button onClick={() => setActiveTab('payout')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'payout' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>売上・出金管理</button>
              </nav>
            </div>

            <div className="py-6">
              {/* 1. 新着オファー */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {pendingOffers.length > 0 ? pendingOffers.map(offer => (
                    <div key={offer.id} className="border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">依頼中</span>
                            <p className="text-xs text-gray-400">{new Date(offer.createdAt).toLocaleString('ja-JP')}</p>
                        </div>
                        <p className="font-bold text-lg text-gray-900">{offer.project.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {offer.project.planner?.iconUrl && <img src={offer.project.planner.iconUrl} alt="" className="w-5 h-5 rounded-full" />}
                            <p className="text-sm text-gray-600">企画者: {offer.project.planner?.handleName || '不明'}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <Link href={`/projects/${offer.project.id}`} target="_blank" className="flex-1 md:flex-none text-center px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                           詳細確認
                        </Link>
                        <button onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')} className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 shadow-sm">承認</button>
                        <button onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')} className="flex-1 md:flex-none px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">辞退</button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-gray-500">現在、新しいオファーはありません。</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. 対応中の企画 */}
              {activeTab === 'accepted' && (
                <div className="space-y-4">
                  {acceptedOffers.length > 0 ? acceptedOffers.map(offer => (
                    <div key={offer.id} className="border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">進行中</span>
                            <p className="text-xs text-gray-400">承認日: {new Date(offer.updatedAt).toLocaleDateString('ja-JP')}</p> 
                        </div>
                        <p className="font-bold text-lg text-gray-900">{offer.project.title}</p>
                        <p className="text-sm text-gray-600 mt-1">企画者: {offer.project.planner?.handleName}</p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <Link href={`/projects/${offer.project.id}`} target="_blank" className="flex-1 md:flex-none text-center px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                           詳細
                        </Link>
                        {offer.chatRoom ? (
                          <Link href={`/chat/${offer.chatRoom.id}`} className="flex-1 md:flex-none text-center px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm flex items-center justify-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                             チャット
                          </Link>
                        ) : (
                          <span className="px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
                            準備中...
                          </span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-gray-500">現在、対応中の企画はありません。</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. 売上・出金管理 */}
               {activeTab === 'payout' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 出金申請フォーム */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                     <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">出金申請</h3>
                     <div className="mb-4">
                        <p className="text-sm text-gray-600">出金可能額</p>
                        <p className="text-2xl font-bold text-sky-600">{floristData.balance?.toLocaleString() || 0} <span className="text-sm text-gray-500">pt</span></p>
                     </div>
                     <form onSubmit={handlePayoutSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="payoutAmount" className="block text-sm font-medium text-gray-700">出金希望額 (pt)</label>
                          <input 
                            id="payoutAmount"
                            type="number" 
                            value={payoutAmount} 
                            onChange={(e) => setPayoutAmount(e.target.value)} 
                            required 
                            min={MINIMUM_PAYOUT_AMOUNT}
                            max={floristData.balance || 0}
                            placeholder="例: 10000"
                            className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors" 
                          />
                          <p className="text-xs text-gray-500 mt-1">※ 最低出金額: {MINIMUM_PAYOUT_AMOUNT.toLocaleString()} pt</p>
                        </div>
                        <div>
                          <label htmlFor="accountInfo" className="block text-sm font-medium text-gray-700">振込先情報</label>
                          <textarea 
                            id="accountInfo"
                            value={accountInfo} 
                            onChange={(e) => setAccountInfo(e.target.value)} 
                            required 
                            rows="4" 
                            placeholder="銀行名、支店名、口座種別、口座番号、口座名義（カナ）を正確に入力してください。" 
                            className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                          ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isPayoutDisabled} 
                            className="w-full px-4 py-3 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                          申請する
                        </button>
                     </form>
                  </div>

                  {/* 出金履歴 */}
                  <div>
                     <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">出金履歴</h3>
                     <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                       {payouts.length > 0 ? payouts.map(p => (
                          <div key={p.id} className="p-4 border border-slate-200 rounded-xl bg-white flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString('ja-JP')}</p>
                                <p className="font-bold text-gray-800 text-lg mt-1">{p.amount.toLocaleString()} <span className="text-sm font-normal">pt</span></p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {p.status === 'COMPLETED' ? '完了' : p.status === 'PENDING' ? '処理中' : '失敗'}
                            </span>
                          </div>
                       )) : (
                           <div className="text-center py-8 text-gray-400 bg-slate-50 rounded-lg border border-dashed">履歴はありません</div>
                       )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  );
}