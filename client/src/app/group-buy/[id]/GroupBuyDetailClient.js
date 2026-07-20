'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.__flastalToken;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(n) {
  return Number(n).toLocaleString('ja-JP') + '円';
}

// ステータスバッジ
function StatusBadge({ status }) {
  const map = {
    OPEN:      { label: '受付中',   bg: 'bg-green-100',  text: 'text-green-800' },
    FUNDED:    { label: '成立済み', bg: 'bg-blue-100',   text: 'text-blue-800' },
    CANCELLED: { label: 'キャンセル', bg: 'bg-gray-100', text: 'text-gray-600' },
    REFUNDED:  { label: '返金済み', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  };
  const s = map[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// プログレスバー
function ProgressBar({ soldSlots, targetSlots }) {
  const pct = targetSlots > 0 ? Math.min(100, Math.round((soldSlots / targetSlots) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-indigo-700">{pct}% 達成</span>
        <span className="text-gray-500">{soldSlots} / {targetSlots} 口</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GroupBuyDetailClient() {
  const { id } = useParams();
  const router = useRouter();

  const [groupBuy, setGroupBuy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState(1);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const fetchGroupBuy = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/group-buys/${id}`);
      if (!res.ok) throw new Error('グループ購入情報の取得に失敗しました。');
      const data = await res.json();
      setGroupBuy(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroupBuy();
  }, [fetchGroupBuy]);

  const handleJoin = async () => {
    setJoinError(null);
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`${API_URL}/api/group-buys/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slots }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '参加処理に失敗しました。');
      // Stripe Checkoutへリダイレクト
      window.location.href = data.url;
    } catch (e) {
      setJoinError(e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !groupBuy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'グループ購入が見つかりません。'}</p>
        <button onClick={() => router.back()} className="text-indigo-600 underline">戻る</button>
      </div>
    );
  }

  const gb = groupBuy;
  const soldSlots = gb.soldSlots ?? 0;
  const remainSlots = gb.maxSlots !== null ? gb.maxSlots - soldSlots : null;
  const totalForSlots = gb.pricePerSlot * slots;
  const isOpen = gb.status === 'OPEN' && new Date() <= new Date(gb.deadline);
  const isFunded = gb.status === 'FUNDED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 戻るリンク */}
      <Link href={`/projects/${gb.projectId}`} className="text-indigo-600 hover:underline text-sm mb-4 inline-block">
        &larr; 企画ページへ戻る
      </Link>

      {/* タイトル・ステータス */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{gb.title}</h1>
        <StatusBadge status={gb.status} />
      </div>

      {/* 説明 */}
      {gb.description && (
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{gb.description}</p>
      )}

      {/* 成立済みバナー */}
      {isFunded && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-blue-800">このグループ購入は成立しました！</p>
            <p className="text-sm text-blue-600">花屋への発注が可能な状態です。</p>
          </div>
        </div>
      )}

      {/* 詳細カード */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* 料金・目標 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-xs text-indigo-500 font-medium mb-1">一口金額</p>
            <p className="text-2xl font-bold text-indigo-700">{formatPrice(gb.pricePerSlot)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">目標口数</p>
            <p className="text-2xl font-bold text-gray-700">{gb.targetSlots} 口</p>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mb-5">
          <ProgressBar soldSlots={soldSlots} targetSlots={gb.targetSlots} />
        </div>

        {/* 締切・上限残数 */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
          <div>
            <span className="font-medium text-gray-700">締切：</span>
            {formatDate(gb.deadline)}
          </div>
          {remainSlots !== null && (
            <div>
              <span className="font-medium text-gray-700">残り：</span>
              {remainSlots} 口
            </div>
          )}
        </div>

        {/* 参加フォーム */}
        {isOpen && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">参加する</p>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-gray-600">口数：</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSlots(s => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg flex items-center justify-center"
                >-</button>
                <span className="w-8 text-center font-semibold text-lg">{slots}</span>
                <button
                  onClick={() => setSlots(s => Math.min(10, s + 1))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg flex items-center justify-center"
                >+</button>
              </div>
              <span className="text-sm text-gray-500">
                合計: <span className="font-semibold text-indigo-700">{formatPrice(totalForSlots)}</span>
              </span>
            </div>

            {joinError && (
              <p className="text-red-500 text-sm mb-3">{joinError}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {joining ? '処理中...' : `${slots}口で参加する（${formatPrice(totalForSlots)}）`}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Stripeの安全な決済ページへ移動します
            </p>
          </div>
        )}

        {!isOpen && gb.status === 'OPEN' && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 text-center">申込締切を過ぎています。</p>
          </div>
        )}
      </div>

      {/* 参加者一覧 */}
      {gb.entries && gb.entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            参加者一覧（{gb.entries.length}名）
          </h2>
          <ul className="space-y-3">
            {gb.entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3">
                {entry.user?.iconUrl ? (
                  <img
                    src={entry.user.iconUrl}
                    alt={entry.user.handleName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {(entry.user?.handleName || '?')[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {entry.user?.handleName || '匿名'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {entry.slots}口
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
