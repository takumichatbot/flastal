"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { ChevronLeft, ChevronRight, MessageCircle, User, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { EmptyState } from '@/app/components/EmptyState';


function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}時間前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function ChatInboxPage() {
  const { isAuthenticated, isLoading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');

  const fetchRooms = useCallback(async () => {
    try {
      // 生fetchだとアクセストークン失効時に静かに失敗するため、リフレッシュ付きの共通fetchを使う
      const res = await authenticatedFetch('/api/project-details/my-chats');
      if (res.ok) {
        setRooms(await res.json());
        setLoadError(false);
      } else {
        // 500等の失敗を「空」と混同しないよう、明示的にエラー状態にする
        setLoadError(true);
        toast.error('チャットの読み込みに失敗しました');
      }
    } catch {
      setLoadError(true);
      toast.error('チャットの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (!authLoading && isAuthenticated) fetchRooms();
  }, [authLoading, isAuthenticated, fetchRooms, router]);

  const filtered = rooms.filter(room => {
    if (!search) return true;
    const floristName = room.offer?.florist?.platformName || room.offer?.florist?.shopName || '';
    const projectTitle = room.offer?.project?.title || '';
    return floristName.includes(search) || projectTitle.includes(search);
  });

  return (
    <div
      className="flex flex-col bg-[#F7F7FA] font-sans"
      style={{ height: '100dvh' }}
    >
      {/* ── ヘッダー ── */}
      <header
        className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 h-14 max-w-xl md:max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-black text-slate-800 text-base flex-1">チャット</h1>
          {rooms.length > 0 && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {rooms.length}件
            </span>
          )}
        </div>

        {rooms.length > 4 && (
          <div className="px-4 pb-3 max-w-xl md:max-w-3xl mx-auto">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="お花屋さん・企画名で検索"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-full text-[16px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all text-sm"
              />
            </div>
          </div>
        )}
      </header>

      {/* ── コンテンツ ── */}
      <div
        className="flex-1 overflow-y-auto max-w-xl md:max-w-3xl mx-auto w-full"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-pink-400" size={28} />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={26} className="text-rose-300" />
            </div>
            <p className="text-sm font-black text-slate-600">チャットを読み込めませんでした</p>
            <p className="text-xs text-slate-400 font-medium mt-1">通信環境をご確認のうえ、もう一度お試しください</p>
            <button
              onClick={() => { setLoading(true); fetchRooms(); }}
              className="mt-5 px-6 py-2.5 bg-pink-500 text-white rounded-full text-xs font-black shadow-md shadow-pink-200 active:scale-95 transition-transform"
            >
              再読み込み
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="message"
            title={search ? '一致するチャットなし' : 'まだチャットがありません'}
            description={search ? '別のキーワードで検索してみてください' : 'お花屋さんにオファーを送るとここでチャットできます'}
            action={!search ? { label: 'お花屋さんを探す', href: '/florists' } : undefined}
            className="py-24"
          />
        ) : (
          <div className="bg-white divide-y divide-slate-50 mt-1 rounded-b-none">
            {filtered.map((room, i) => {
              const florist = room.offer?.florist;
              const project = room.offer?.project;
              const lastMsg = room.messages?.[0];
              const floristName = florist?.platformName || florist?.shopName || 'お花屋さん';

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <Link
                    href={`/chat/${room.id}`}
                    className="flex items-center gap-3 px-4 py-4 active:bg-pink-50/30 transition-colors select-none"
                  >
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                      {florist?.iconUrl ? (
                        <Image
                          src={florist.iconUrl}
                          alt={floristName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={22} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-black text-sm text-slate-800 truncate">{floristName}</p>
                        {lastMsg && (
                          <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                            {timeAgo(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      {project?.title && (
                        <p className="text-[10px] font-black text-pink-500 truncate mb-0.5">
                          📌 {project.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 truncate">
                        {lastMsg?.content || 'メッセージを送ってみましょう'}
                      </p>
                    </div>

                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
