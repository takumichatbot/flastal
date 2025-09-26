'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

// ダッシュボードの上部に表示される統計情報カードの部品です
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg">
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

// ダッシュボードページの本体です
export default function FloristDashboardPage() {
  const { user, userType } = useAuth();
  const router = useRouter();
  
  // 画面に表示するデータを管理するための箱（State）
  const [floristData, setFloristData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // 出金申請機能のためのState
  const [payouts, setPayouts] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [accountInfo, setAccountInfo] = useState('');

  // 最低出金額を定義
  const MINIMUM_PAYOUT_AMOUNT = 1000;

  // サーバーからダッシュボードに必要なデータを全て取得する関数
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // ダッシュボード情報と出金履歴を同時に取得
      const [dashboardRes, payoutsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/florists/${user.id}/dashboard`),
        fetch(`http://localhost:3001/api/florists/${user.id}/payouts`),
      ]);
      if (!dashboardRes.ok || !payoutsRes.ok) throw new Error('データ取得に失敗しました');
      
      const dashboardData = await dashboardRes.json();
      const payoutsData = await payoutsRes.json();

      setFloristData(dashboardData.florist);
      setOffers(dashboardData.offers);
      setPayouts(payoutsData);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ページが読み込まれた時に、ログイン状態をチェックしてデータを取得する
  useEffect(() => {
    if (user && userType === 'FLORIST') {
      fetchData();
    } else if (user) {
        // ログインはしているが、お花屋さんではない場合
        alert('アクセス権がありません。');
        router.push('/');
    }
  }, [user, userType, router]);

  // オファーの状態を更新する（承認・辞退）関数
  const handleUpdateOfferStatus = async (offerId, newStatus) => {
    try {
        const response = await fetch(`http://localhost:3001/api/offers/${offerId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) {
            throw new Error('オファーの更新に失敗しました。');
        }
        alert(`オファーを「${newStatus === 'ACCEPTED' ? '承認' : '辞退'}」しました。`);
        fetchData(); 
    } catch (error) {
        alert(`エラー: ${error.message}`);
    }
  };

  // 出金申請を送信する関数
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (window.confirm(`${payoutAmount}ptを出金申請します。よろしいですか？`)) {
      try {
        const res = await fetch('http://localhost:3001/api/payouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            floristId: user.id,
            amount: payoutAmount,
            accountInfo: accountInfo,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        alert('出金申請を受け付けました。運営からの連絡をお待ちください。');
        setPayoutAmount('');
        setAccountInfo('');
        fetchData(); // データを再取得して画面を更新
      } catch (error) {
        alert(`エラー: ${error.message}`);
      }
    }
  };
      
  if (!user) {
    return <div className="text-center p-10">読み込み中...</div>;
  }
  
  const pendingOffers = offers.filter(o => o.status === 'PENDING');
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
  
  // 出金ボタンが押せるかどうかを判定する
  const isPayoutDisabled = !payoutAmount || !accountInfo || Number(payoutAmount) < MINIMUM_PAYOUT_AMOUNT || Number(payoutAmount) > (floristData?.balance || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-16 md:top-0 z-40">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-pink-600">お花屋さんダッシュボード</h1>
          <p className="text-sm text-gray-500">ようこそ、{user.shopName}さん</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? <p className="p-4">データを読み込んでいます...</p> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="現在の売上残高" value={`${floristData?.balance.toLocaleString() || 0} pt`} icon={<svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m15 3H6" /></svg>} />
              <StatCard title="対応中の企画数" value={`${acceptedOffers.length} 件`} icon={<svg className="w-6 h-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m-5.043-.025a15.998 15.998 0 01-3.388-1.621m-1.622 3.385a15.998 15.998 0 01-3.388 1.621m6.732 3.385a15.998 15.998 0 003.388 1.622m-7.497-1.622a15.998 15.998 0 01-1.622 3.385" /></svg>} />
              <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center">
                 <Link href={`/florists/profile/${user.id}`}>
                    <span className="px-6 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
                      プロフィールを編集
                    </span>
                  </Link>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-2xl p-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button onClick={() => setActiveTab('pending')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'pending' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>新着オファー ({pendingOffers.length})</button>
                  <button onClick={() => setActiveTab('accepted')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'accepted' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>対応中の企画 ({acceptedOffers.length})</button>
                  <button onClick={() => setActiveTab('payout')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'payout' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>売上管理</button>
                </nav>
              </div>
              <div className="py-6">
                {activeTab === 'pending' && (
                  <div className="space-y-4">
                    {pendingOffers.length > 0 ? pendingOffers.map(offer => (
                      <div key={offer.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-lg text-gray-900">{offer.project.title}</p>
                          <p className="text-sm text-gray-600">企画者: {offer.project.planner.handleName}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')} className="px-3 py-1 text-white bg-green-500 rounded-md hover:bg-green-600">承認</button>
                          <button onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')} className="px-3 py-1 text-white bg-red-500 rounded-md hover:bg-red-600">辞退</button>
                        </div>
                      </div>
                    )) : <p className="text-gray-500">現在、新しいオファーはありません。</p>}
                  </div>
                )}
                {activeTab === 'accepted' && (
                  <div className="space-y-4">
                    {acceptedOffers.length > 0 ? acceptedOffers.map(offer => (
                      <div key={offer.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-lg text-gray-900">{offer.project.title}</p>
                          <p className="text-sm text-gray-600">企画者: {offer.project.planner.handleName}</p>
                        </div>
                        {offer.chatRoom ? (
                          <Link href={`/chat/${offer.chatRoom.id}`}>
                             <span className="px-3 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600">チャットする</span>
                          </Link>
                        ) : (
                          <span className="px-3 py-1 text-gray-500 bg-gray-200 rounded-md cursor-not-allowed">
                            準備中...
                          </span>
                        )}
                      </div>
                    )) : <p className="text-gray-500">現在、対応中の企画はありません。</p>}
                  </div>
                )}
                 {activeTab === 'payout' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-gray-900">出金申請</h3>
                       <p className="text-sm text-gray-600">現在の売上残高: <span className="font-bold text-lg">{floristData?.balance.toLocaleString() || 0} pt</span></p>
                       <form onSubmit={handlePayoutSubmit} className="space-y-4 pt-4 border-t">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">出金額 (pt)</label>
                            <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} required className="w-full mt-1 p-2 border rounded-md text-gray-900" />
                            <p className="text-xs text-gray-500 mt-1">※最低出金額は {MINIMUM_PAYOUT_AMOUNT.toLocaleString()} ptです。</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">振込先情報</label>
                            <textarea value={accountInfo} onChange={(e) => setAccountInfo(e.target.value)} required rows="4" placeholder="銀行名、支店名、口座種別、口座番号、口座名義（カナ）を正確に入力してください。" className="w-full mt-1 p-2 border rounded-md text-gray-900"></textarea>
                          </div>
                          <button type="submit" disabled={isPayoutDisabled} className="w-full px-4 py-2 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            この内容で申請する
                          </button>
                       </form>
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-gray-900">出金履歴</h3>
                       <div className="space-y-2 pt-4 border-t">
                         {payouts.length > 0 ? payouts.map(p => (
                            <div key={p.id} className="p-2 border-b text-sm text-gray-800">
                              <p>{new Date(p.createdAt).toLocaleDateString()}: <span className="font-bold">{p.amount.toLocaleString()} pt</span></p>
                              <p className="text-xs text-gray-500">状態: {p.status}</p>
                            </div>
                         )) : <p className="text-sm text-gray-500">まだ出金履歴はありません。</p>}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}