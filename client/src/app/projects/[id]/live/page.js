'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Radio, Send, Heart, ChevronLeft, Youtube, Plus, Settings, Zap } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const SUPERCHAT_AMOUNTS = [100, 500, 1000, 3000, 5000, 10000];

const SUPERCHAT_COLORS = {
  100:   'from-sky-400 to-sky-500',
  500:   'from-teal-400 to-emerald-500',
  1000:  'from-amber-400 to-yellow-500',
  3000:  'from-orange-400 to-rose-500',
  5000:  'from-pink-500 to-rose-600',
  10000: 'from-purple-500 to-indigo-600',
};

const SUPERCHAT_PRESETS = [
  { amount: 500,  label: '¥500',   color: 'bg-blue-100 border-blue-300' },
  { amount: 1000, label: '¥1,000', color: 'bg-amber-100 border-amber-300' },
  { amount: 3000, label: '¥3,000', color: 'bg-pink-100 border-pink-300' },
  { amount: 0,    label: 'カスタム', color: 'bg-slate-100 border-slate-300' },
];

function SuperchatBanner({ superchat, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colorKey = SUPERCHAT_AMOUNTS.reduce((prev, cur) =>
    Math.abs(cur - superchat.amount) < Math.abs(prev - superchat.amount) ? cur : prev
  );
  const gradient = SUPERCHAT_COLORS[colorKey] || SUPERCHAT_COLORS[100];

  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-xl p-3 flex items-start gap-3 animate-bounce-in shadow-lg`}>
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-xs shrink-0">
        {superchat.displayName?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-white font-black text-xs">{superchat.displayName}</span>
          <span className="inline-block bg-gradient-to-r from-pink-400 to-amber-400 text-white text-xs font-black px-2 py-0.5 rounded-full">
            ¥{superchat.amount.toLocaleString()}
          </span>
        </div>
        {superchat.message && (
          <p className="text-white text-sm">{superchat.message}</p>
        )}
      </div>
    </div>
  );
}

export default function LivePage() {
  const { id: projectId } = useParams();
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFlorist = user?.role === 'FLORIST';

  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 花屋：セッション作成フォーム
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [creating, setCreating] = useState(false);

  // スーパーチャット
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [scMessage, setScMessage] = useState('');
  const [sendingSC, setSendingSC] = useState(false);
  const [recentSC, setRecentSC] = useState([]);

  const socketRef = useRef(null);

  // YouTubeURLからembedIDを抽出
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/))([^&?/]+)/);
    return m ? m[1] : null;
  };

  const fetchData = useCallback(async () => {
    const [pRes, sRes] = await Promise.all([
      fetch(`${API_URL}/api/projects/${projectId}`),
      fetch(`${API_URL}/api/live/projects/${projectId}/sessions`),
    ]);
    if (pRes.ok) setProject(await pRes.json());
    if (sRes.ok) {
      const data = await sRes.json();
      setSessions(data);
      const live = data.find(s => s.isLive);
      setActiveSession(live || data[0] || null);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // スーパーチャット決済成功後のトースト表示
  useEffect(() => {
    if (searchParams.get('superchat') === 'success') {
      const amount = searchParams.get('amount');
      const amountLabel = amount ? `¥${Number(amount).toLocaleString()}` : '';
      toast.success(`🎉 スーパーチャット ${amountLabel}を送りました！ありがとうございます`, {
        duration: 5000,
      });
      // URLからクエリパラメータを除去
      router.replace(`/projects/${projectId}/live`, { scroll: false });
    }
  }, [searchParams, projectId, router]);

  // Socket.io 接続（アクティブセッション変化時）
  useEffect(() => {
    if (!activeSession) return;
    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join_live', activeSession.id);
    socket.on('new_superchat', (sc) => {
      setRecentSC(prev => [sc, ...prev].slice(0, 5));
    });
    socket.on('session_updated', ({ isLive }) => {
      setActiveSession(prev => prev ? { ...prev, isLive } : prev);
    });
    return () => socket.disconnect();
  }, [activeSession?.id]);

  const handleCreateSession = async () => {
    if (!newTitle) return toast.error('タイトルを入力してください');
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/live/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, title: newTitle, youtubeUrl: newYoutubeUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('配信セッションを作成しました');
      setShowCreateForm(false);
      setNewTitle(''); setNewYoutubeUrl('');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'エラーが発生しました');
    } finally {
      setCreating(false);
    }
  };

  const toggleLive = async (session, isLive) => {
    const res = await fetch(`${API_URL}/api/live/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isLive }),
    });
    if (res.ok) {
      toast.success(isLive ? '配信を開始しました' : '配信を終了しました');
      setActiveSession(prev => prev?.id === session.id ? { ...prev, isLive } : prev);
    }
  };

  const handleSendSuperchat = async () => {
    if (!token) { toast.error('ログインしてください'); return; }
    const finalAmount = selectedAmount === 0 ? Number(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount < 100) {
      toast.error('金額は100円以上を入力してください');
      return;
    }
    setSendingSC(true);
    try {
      const res = await fetch(`${API_URL}/api/live/sessions/${activeSession.id}/superchat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalAmount, message: scMessage, displayName: user?.handleName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.message || '送信に失敗しました');
    } finally {
      setSendingSC(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const youtubeId = activeSession ? extractYoutubeId(activeSession.youtubeUrl) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ヘッダー */}
      <div className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/projects/${projectId}`} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">{project?.title || '...'}</h1>
            <p className="text-xs text-slate-400">制作中継</p>
          </div>
          {activeSession?.isLive && (
            <span className="flex items-center gap-1.5 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              <Radio size={12} /> LIVE
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* メイン：YouTube埋め込み */}
        <div className="lg:col-span-2">
          {activeSession ? (
            <>
              {youtubeId ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-slate-800 flex items-center justify-center">
                  <div className="text-center">
                    <Youtube size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">{activeSession.title}</p>
                    <p className="text-slate-500 text-sm mt-1">配信URLが設定されていません</p>
                  </div>
                </div>
              )}

              {/* セッション情報 */}
              <div className="mt-4 bg-slate-900 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {activeSession.isLive && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">LIVE</span>
                      )}
                      <h2 className="text-base font-bold">{activeSession.title}</h2>
                    </div>
                    <p className="text-sm text-slate-400">
                      🌸 {activeSession.florist?.shopName}
                    </p>
                  </div>
                  {isFlorist && activeSession.floristId === user?.id && (
                    <div className="flex gap-2">
                      {activeSession.isLive ? (
                        <button
                          onClick={() => toggleLive(activeSession, false)}
                          className="text-xs bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/30 transition-colors font-bold"
                        >
                          配信終了
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleLive(activeSession, true)}
                          className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors font-bold flex items-center gap-1"
                        >
                          <Radio size={13} /> 配信開始
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="aspect-video rounded-2xl bg-slate-900 flex items-center justify-center">
              <div className="text-center">
                <Youtube size={48} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-400">配信が準備されていません</p>
                {isFlorist && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 bg-sky-500 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors"
                  >
                    配信を開始する
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 花屋：セッション作成フォーム */}
          {isFlorist && (
            <div className="mt-4">
              {showCreateForm ? (
                <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sm">新規配信セッション</h3>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="配信タイトル（例: 〇〇のフラスタ制作中継）"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                  />
                  <input
                    value={newYoutubeUrl}
                    onChange={e => setNewYoutubeUrl(e.target.value)}
                    placeholder="YouTube Live URL（任意）"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreateSession} disabled={creating} className="flex-1 bg-sky-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-50">
                      {creating ? '作成中...' : '作成'}
                    </button>
                    <button onClick={() => setShowCreateForm(false)} className="px-4 bg-slate-800 text-slate-400 py-2.5 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-sky-500 py-3 rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={15} /> 新規配信セッションを追加
                </button>
              )}
            </div>
          )}
        </div>

        {/* サイドバー：スーパーチャット */}
        <div className="space-y-4">
          {/* 最近のスーパーチャット */}
          {recentSC.length > 0 && (
            <div className="space-y-2">
              {recentSC.map(sc => (
                <SuperchatBanner key={sc.id} superchat={sc} onDismiss={() => setRecentSC(prev => prev.filter(s => s.id !== sc.id))} />
              ))}
            </div>
          )}

          {/* スーパーチャット送信 */}
          {activeSession?.isLive && !isFlorist && (
            <div className="bg-slate-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm">スーパーチャット</h3>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {SUPERCHAT_PRESETS.map(({ amount, label, color }) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); if (amount !== 0) setCustomAmount(''); }}
                    className={`border-2 rounded-xl py-2 text-xs font-black transition-all ${color} ${
                      selectedAmount === amount
                        ? 'ring-2 ring-pink-400 scale-105 text-slate-800'
                        : 'opacity-70 text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {selectedAmount === 0 && (
                <input
                  type="number"
                  placeholder="金額を入力（円）"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="w-full border border-slate-600 bg-slate-800 text-white rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-sky-500"
                  min="100"
                />
              )}

              <textarea
                value={scMessage}
                onChange={e => setScMessage(e.target.value)}
                placeholder="応援メッセージ（任意）"
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 resize-none mb-3"
              />

              <button
                onClick={handleSendSuperchat}
                disabled={sendingSC}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap size={15} />
                {selectedAmount === 0
                  ? customAmount ? `¥${Number(customAmount).toLocaleString()} を送る` : '金額を入力してください'
                  : `¥${selectedAmount.toLocaleString()} を送る`
                }
              </button>
            </div>
          )}

          {/* セッション一覧 */}
          {sessions.length > 1 && (
            <div className="bg-slate-900 rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3 text-slate-400">配信一覧</h3>
              <div className="space-y-2">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`w-full text-left p-3 rounded-xl transition-colors text-sm ${
                      activeSession?.id === s.id ? 'bg-sky-500/20 border border-sky-500/30' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {s.isLive && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
                      <span className="font-medium truncate">{s.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(s.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!activeSession?.isLive && (
            <div className="bg-slate-900 rounded-2xl p-5 text-center">
              <Radio size={32} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">現在配信中の制作中継はありません</p>
              <p className="text-slate-500 text-xs mt-1">配信が始まるとここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
