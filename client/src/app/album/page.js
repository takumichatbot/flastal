'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Heart, MessageCircle, MoreHorizontal, Bookmark,
  Send, X, ChevronLeft, Camera, Loader2, Flower2, Globe
} from 'lucide-react';
import UploadForm from '../components/UploadForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function Avatar({ user, size = 9 }) {
  const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0`;
  if (user?.iconUrl) {
    return (
      <div className={cls}>
        <Image src={user.iconUrl} alt={user.handleName} width={36} height={36} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cls}>
      <span className="text-white font-black text-sm">{user?.handleName?.[0] ?? '?'}</span>
    </div>
  );
}

function CommentSheet({ post, onClose }) {
  const { isAuthenticated, authenticatedFetch } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/posts/${post.id}/comments`)
      .then(r => r.json())
      .then(setComments)
      .finally(() => setLoading(false));
  }, [post.id]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await authenticatedFetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setText('');
    } catch {
      toast.error('コメントの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl"
      style={{ maxHeight: '75dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex flex-col h-full" style={{ maxHeight: '75dvh' }}>
        {/* handle */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-800">コメント</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-400" size={24} /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-slate-400 text-sm font-bold py-8">まだコメントはありません</p>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <Avatar user={c.user} size={8} />
              <div>
                <span className="text-xs font-black text-slate-700 mr-2">{c.user.handleName}</span>
                <span className="text-sm text-slate-600">{c.content}</span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* input */}
        {isAuthenticated && (
          <div className="px-4 py-3 border-t border-slate-100 flex gap-3 items-center shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="コメントを追加..."
              className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-[16px] outline-none font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
            />
            <button onClick={send} disabled={!text.trim() || sending}
              className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-95">
              <Send size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PostCard({ post: initialPost, onDelete }) {
  const { isAuthenticated, user, authenticatedFetch } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('ログインが必要です');
    const prev = { ...post };
    // optimistic
    setPost(p => ({
      ...p,
      likedByMe: !p.likedByMe,
      _count: { ...p._count, likes: p.likedByMe ? p._count.likes - 1 : p._count.likes + 1 },
    }));
    if (!post.likedByMe) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); }
    try {
      const res = await authenticatedFetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setPost(prev);
      toast.error('エラーが発生しました');
    }
  };

  const handleDoubleTap = (() => {
    let last = 0;
    return () => {
      const now = Date.now();
      if (now - last < 300) { if (!post.likedByMe) handleLike(); }
      last = now;
    };
  })();

  const isOwn = user?.id === post.user?.id;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-100"
      >
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/users/${post.user?.id}`}>
            <Avatar user={post.user} size={9} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">{post.user?.handleName}</p>
            <p className="text-[11px] text-slate-400 font-bold">{post.eventName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold">{timeAgo(post.createdAt)}</span>
            {isOwn && (
              <button onClick={() => {
                if (confirm('この投稿を削除しますか？')) {
                  authenticatedFetch(`/api/posts/${post.id}`, { method: 'DELETE' })
                    .then(() => { toast.success('削除しました'); onDelete(post.id); })
                    .catch(() => toast.error('削除に失敗しました'));
                }
              }} className="text-slate-300 hover:text-slate-500 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            )}
          </div>
        </div>

        {/* image */}
        <div className="relative aspect-square bg-slate-100 cursor-pointer" onClick={handleDoubleTap}>
          <Image src={post.imageUrl} alt={post.eventName} fill className="object-cover" />
          <AnimatePresence>
            {likeAnim && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart size={72} className="text-white fill-white drop-shadow-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* actions */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={handleLike} className="transition-transform active:scale-90">
              <Heart
                size={24}
                className={`transition-colors ${post.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
              />
            </button>
            <button onClick={() => setShowComments(true)} className="transition-transform active:scale-90">
              <MessageCircle size={24} className="text-slate-700" />
            </button>
            <div className="flex-1" />
            <Bookmark size={22} className="text-slate-700" />
          </div>

          {post._count.likes > 0 && (
            <p className="text-sm font-black text-slate-800 mb-1">{post._count.likes.toLocaleString()}件のいいね</p>
          )}

          {post.caption && (
            <p className="text-sm text-slate-700 leading-relaxed mb-1">
              <span className="font-black text-slate-800 mr-1">{post.user?.handleName}</span>
              {post.caption}
            </p>
          )}

          {post._count.comments > 0 && (
            <button onClick={() => setShowComments(true)}
              className="text-[12px] text-slate-400 font-bold mb-1 block hover:text-slate-600 transition-colors">
              コメントを{post._count.comments}件すべて見る
            </button>
          )}
        </div>
      </motion.article>

      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowComments(false)}
            />
            <CommentSheet post={post} onClose={() => setShowComments(false)} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AlbumPage() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchPosts = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken')?.replace(/^"|"$/g, '') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/posts?page=${p}&limit=12`, { headers });
      const data = await res.json();
      setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
      setHasMore(p < data.pages);
      setPage(p);
    } catch {
      toast.error('フィードの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(1, true); }, [fetchPosts]);

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-white border-b border-slate-100 flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(56px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <Flower2 size={20} className="text-pink-500" />
          <span className="text-lg font-black text-slate-800 tracking-tight">思い出アルバム</span>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowUpload(true)}
            className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-200 transition-transform active:scale-95"
          >
            <Camera size={18} />
          </button>
        )}
      </header>

      {/* Upload sheet */}
      <AnimatePresence>
        {showUpload && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowUpload(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-800">新しい投稿</h3>
                <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={22} />
                </button>
              </div>
              <UploadForm onUploadSuccess={() => { setShowUpload(false); fetchPosts(1, true); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="max-w-lg mx-auto">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-pink-400" size={32} />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-24 px-6 text-center">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4">
              <Camera size={32} className="text-pink-300" />
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-1">まだ投稿がありません</h3>
            <p className="text-sm text-slate-400 font-bold">フラスタの写真を最初に投稿しよう📸</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-pink-200"
              >
                写真を投稿する
              </button>
            )}
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
            {hasMore && (
              <div className="flex justify-center py-6">
                <button
                  onClick={() => fetchPosts(page + 1)}
                  disabled={loading}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-black shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'もっと見る'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
