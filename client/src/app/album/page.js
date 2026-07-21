'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Heart, MessageCircle, MoreHorizontal, Bookmark,
  Send, X, ChevronLeft, Camera, Loader2, Search,
  Grid3X3, Rows3, Flame, Clock, SlidersHorizontal
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
  const sz = { 7: 28, 8: 32, 9: 36, 10: 40 }[size] || 36;
  const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shrink-0`;
  if (user?.iconUrl) {
    return (
      <div className={cls}>
        <Image src={user.iconUrl} alt={user.handleName} width={sz} height={sz} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cls}>
      <span className="text-white font-black text-sm">{user?.handleName?.[0] ?? '?'}</span>
    </div>
  );
}

function CommentSheet({ post, onClose, onCommentAdded }) {
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
    setTimeout(() => inputRef.current?.focus(), 300);
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
      onCommentAdded?.();
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
      className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
      style={{ maxHeight: '80dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* drag handle */}
      <div className="flex justify-center pt-3 pb-1 shrink-0">
        <div className="w-10 h-1 bg-slate-200 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 shrink-0">
        <h3 className="font-black text-slate-800">コメント {comments.length > 0 && <span className="text-pink-500">{comments.length}</span>}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 rounded-full hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-400" size={24} /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-bold">最初のコメントをしよう</p>
          </div>
        ) : comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <Avatar user={c.user} size={8} />
            <div className="flex-1">
              <div className="bg-slate-50 rounded-2xl rounded-tl-sm px-3 py-2">
                <span className="text-xs font-black text-slate-700 block mb-0.5">{c.user.handleName}</span>
                <span className="text-sm text-slate-600 leading-relaxed">{c.content}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1 font-bold">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {isAuthenticated && (
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="コメントを追加..."
            className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-[16px] outline-none font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shadow-md shadow-pink-200 shrink-0"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function FeedPostCard({ post: initialPost, onDelete }) {
  const { isAuthenticated, user, authenticatedFetch } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isOwn = user?.id === post.user?.id;

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('ログインしていいねしよう');
    const prev = { ...post };
    setPost(p => ({
      ...p,
      likedByMe: !p.likedByMe,
      _count: { ...p._count, likes: p.likedByMe ? p._count.likes - 1 : p._count.likes + 1 },
    }));
    if (!post.likedByMe) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 700); }
    try {
      const res = await authenticatedFetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setPost(prev);
    }
  };

  const handleDoubleTap = (() => {
    let last = 0;
    return () => {
      const now = Date.now();
      if (now - last < 300 && !post.likedByMe) handleLike();
      last = now;
    };
  })();

  const captionLong = (post.caption?.length ?? 0) > 60;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-100"
      >
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar user={post.user} size={9} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">{post.user?.handleName}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-bold truncate">{post.eventName}</span>
              {post.senderName && (
                <>
                  <span className="text-slate-200 text-[10px]">·</span>
                  <span className="text-[10px] text-pink-400 font-black truncate">{post.senderName}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-300 font-bold">{timeAgo(post.createdAt)}</span>
            {isOwn && (
              <button
                onClick={() => {
                  if (confirm('この投稿を削除しますか？')) {
                    authenticatedFetch(`/api/posts/${post.id}`, { method: 'DELETE' })
                      .then(r => { if (r.ok) { toast.success('削除しました'); onDelete(post.id); } });
                  }
                }}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-all"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        </div>

        {/* image */}
        <div className="relative aspect-square bg-slate-100 cursor-pointer select-none" onClick={handleDoubleTap}>
          <Image src={post.imageUrl} alt={post.eventName} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" />
          <AnimatePresence>
            {likeAnim && (
              <motion.div
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart size={80} className="text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* actions */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center gap-1 mb-2.5">
            <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike} className="p-1.5 -ml-1.5 rounded-full">
              <Heart size={26} className={`transition-all duration-200 ${post.likedByMe ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-800'}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => setShowComments(true)} className="p-1.5 rounded-full">
              <MessageCircle size={24} className="text-slate-800" />
            </motion.button>
            <div className="flex-1" />
            <button className="p-1.5 rounded-full">
              <Bookmark size={22} className="text-slate-800" />
            </button>
          </div>

          {post._count.likes > 0 && (
            <p className="text-sm font-black text-slate-900 mb-1.5">
              {post._count.likes.toLocaleString()}件のいいね
            </p>
          )}

          {post.caption && (
            <p className="text-sm text-slate-700 leading-relaxed mb-1">
              <span className="font-black text-slate-900 mr-1">{post.user?.handleName}</span>
              {captionLong && !expanded ? (
                <>{post.caption.slice(0, 60)}…<button onClick={() => setExpanded(true)} className="text-slate-400 font-bold ml-1">続きを見る</button></>
              ) : post.caption}
            </p>
          )}

          {post._count.comments > 0 && (
            <button onClick={() => setShowComments(true)} className="text-[12px] text-slate-400 font-bold hover:text-slate-600 transition-colors">
              コメント{post._count.comments}件をすべて見る
            </button>
          )}
        </div>
      </motion.article>

      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowComments(false)}
            />
            <CommentSheet
              post={post}
              onClose={() => setShowComments(false)}
              onCommentAdded={() => setPost(p => ({ ...p, _count: { ...p._count, comments: p._count.comments + 1 } }))}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function GridPostCard({ post, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(post)}
      className="relative aspect-square bg-slate-100 cursor-pointer overflow-hidden"
    >
      <Image src={post.imageUrl} alt={post.eventName} fill className="object-cover" sizes="33vw" />
      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200" />
      {post._count.likes > 0 && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <Heart size={10} className="fill-white text-white" />
          <span className="text-white text-[9px] font-black">{post._count.likes}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function AlbumPage() {
  const { isAuthenticated, user, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'grid'
  const [sort, setSort] = useState('new'); // 'new' | 'popular'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [gridSelectedPost, setGridSelectedPost] = useState(null);
  const [gridPostComments, setGridPostComments] = useState([]);
  const [gridCommentText, setGridCommentText] = useState('');
  const [gridSending, setGridSending] = useState(false);
  const searchDebounce = useRef(null);

  const fetchPosts = useCallback(async (p = 1, reset = false, q = searchQuery, s = sort) => {
    // ページ追加読み込み中の二重発火を防ぐ（「もっと見る」連打で同じページが二重追加されるのを防止）
    if (!reset && loadingMoreRef.current) return;
    if (reset) setLoading(true); else { setLoadingMore(true); loadingMoreRef.current = true; }
    try {
      const token = typeof window !== 'undefined' ? window.__flastalToken : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({ page: p, limit: 12, sort: s, ...(q ? { search: q } : {}) });
      const res = await fetch(`${API_URL}/api/posts?${params}`, { headers });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const newPosts = data.posts || [];
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(p < data.pages);
      setPage(p);
    } catch {
      toast.error('フィードの取得に失敗しました');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [searchQuery, sort]);

  useEffect(() => { fetchPosts(1, true, searchQuery, sort); }, [sort]); // eslint-disable-line
  useEffect(() => { fetchPosts(1, true, '', 'new'); }, []); // eslint-disable-line

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearchQuery(val);
      fetchPosts(1, true, val, sort);
    }, 400);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    fetchPosts(1, true, searchQuery, newSort);
  };

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id));

  const openGridPost = (post) => {
    setGridSelectedPost(post);
    setGridPostComments([]);
    fetch(`${API_URL}/api/posts/${post.id}/comments`).then(r => r.json()).then(setGridPostComments);
  };

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          {/* back */}
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center text-slate-600 rounded-full hover:bg-slate-100 transition-all shrink-0"
          >
            <ChevronLeft size={22} />
          </button>

          {/* search bar */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="イベント名・ユーザーで検索"
              className="w-full pl-9 pr-8 py-2 bg-slate-100 rounded-full text-[16px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* view toggle */}
          <button
            onClick={() => setViewMode(v => v === 'feed' ? 'grid' : 'feed')}
            className="w-9 h-9 flex items-center justify-center text-slate-500 rounded-full hover:bg-slate-100 transition-all shrink-0"
          >
            {viewMode === 'feed' ? <Grid3X3 size={18} /> : <Rows3 size={18} />}
          </button>

          {/* post button */}
          {isAuthenticated && (
            <button
              onClick={() => setShowUpload(true)}
              className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-200 transition-transform active:scale-95 shrink-0"
            >
              <Camera size={17} />
            </button>
          )}
        </div>

        {/* sort pills */}
        <div className="flex gap-2 px-4 pb-3 max-w-lg mx-auto">
          {[
            { id: 'new', label: '新着順', icon: Clock },
            { id: 'popular', label: '人気順', icon: Flame },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleSortChange(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all border ${
                sort === id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
          {searchQuery && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200 text-xs font-black">
              <Search size={11} />
              &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      </header>

      {/* ── Upload sheet ── */}
      <AnimatePresence>
        {showUpload && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowUpload(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl overflow-hidden"
              style={{ maxHeight: '95dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800">新しい投稿</h3>
                <button onClick={() => setShowUpload(false)} className="w-9 h-9 flex items-center justify-center text-slate-400 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(95dvh - 80px)' }}>
                <UploadForm onUploadSuccess={() => { setShowUpload(false); fetchPosts(1, true, searchQuery, sort); }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <div className={viewMode === 'feed' ? 'max-w-lg mx-auto' : ''}>
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-pink-400" size={32} />
            <p className="text-slate-400 text-sm font-bold">読み込み中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-24 px-6 text-center">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4 border-2 border-pink-100">
              {searchQuery ? <Search size={28} className="text-pink-300" /> : <Camera size={28} className="text-pink-300" />}
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-1">
              {searchQuery ? `"${searchQuery}" の投稿なし` : 'まだ投稿がありません'}
            </h3>
            <p className="text-sm text-slate-400 font-bold mb-6">
              {searchQuery ? '別のキーワードで試してみよう' : 'フラスタの写真を最初に投稿しよう📸'}
            </p>
            {searchQuery ? (
              <button onClick={() => handleSearchChange('')}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full font-black text-sm">
                検索をリセット
              </button>
            ) : isAuthenticated && (
              <button onClick={() => setShowUpload(true)}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-pink-200">
                写真を投稿する
              </button>
            )}
          </div>
        ) : viewMode === 'feed' ? (
          <>
            {posts.map(post => <FeedPostCard key={post.id} post={post} onDelete={handleDelete} />)}
            {hasMore && (
              <div className="flex justify-center py-6">
                <button onClick={() => fetchPosts(page + 1, false, searchQuery, sort)} disabled={loading || loadingMore}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-black shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                  {loadingMore ? <Loader2 className="animate-spin" size={15} /> : <SlidersHorizontal size={14} />}
                  もっと見る
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map(post => <GridPostCard key={post.id} post={post} onClick={openGridPost} />)}
            </div>
            {hasMore && (
              <div className="flex justify-center py-6">
                <button onClick={() => fetchPosts(page + 1, false, searchQuery, sort)} disabled={loading || loadingMore}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-black shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={15} /> : null}
                  もっと見る
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Grid Post Detail Modal ── */}
      <AnimatePresence>
        {gridSelectedPost && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setGridSelectedPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed inset-x-3 bottom-3 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none"
            >
              <div
                className="pointer-events-auto bg-white rounded-3xl w-full md:max-w-sm overflow-hidden flex flex-col"
                style={{ maxHeight: '88dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                {/* close */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Avatar user={gridSelectedPost.user} size={8} />
                    <div>
                      <p className="text-sm font-black text-slate-800">{gridSelectedPost.user?.handleName}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{gridSelectedPost.eventName}</p>
                    </div>
                  </div>
                  <button onClick={() => setGridSelectedPost(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 rounded-full hover:bg-slate-100">
                    <X size={18} />
                  </button>
                </div>

                {/* image */}
                <div className="relative aspect-square bg-slate-100 shrink-0">
                  <Image src={gridSelectedPost.imageUrl} alt={gridSelectedPost.eventName} fill className="object-cover" sizes="400px" />
                </div>

                {/* actions */}
                <div className="px-4 pt-3 shrink-0">
                  <div className="flex items-center gap-1 mb-2">
                    <motion.button whileTap={{ scale: 0.8 }}
                      onClick={async () => {
                        if (!isAuthenticated) return toast.error('ログインが必要です');
                        const prev = { ...gridSelectedPost };
                        const next = {
                          ...gridSelectedPost,
                          likedByMe: !gridSelectedPost.likedByMe,
                          _count: { ...gridSelectedPost._count, likes: gridSelectedPost.likedByMe ? gridSelectedPost._count.likes - 1 : gridSelectedPost._count.likes + 1 },
                        };
                        setGridSelectedPost(next);
                        setPosts(ps => ps.map(p => p.id === next.id ? next : p));
                        try {
                          const res = await authenticatedFetch(`/api/posts/${gridSelectedPost.id}/like`, { method: 'POST' });
                          if (!res.ok) throw new Error();
                        } catch {
                          setGridSelectedPost(prev);
                          setPosts(ps => ps.map(p => p.id === prev.id ? prev : p));
                        }
                      }}
                      className="p-1.5 -ml-1.5 rounded-full"
                    >
                      <Heart size={26} className={`transition-all ${gridSelectedPost.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-800'}`} />
                    </motion.button>
                    <button className="p-1.5 rounded-full"><MessageCircle size={24} className="text-slate-800" /></button>
                    <div className="flex-1" />
                    {user?.id === gridSelectedPost.user?.id && (
                      <button
                        onClick={async () => {
                          if (!confirm('削除しますか？')) return;
                          const res = await authenticatedFetch(`/api/posts/${gridSelectedPost.id}`, { method: 'DELETE' });
                          if (res.ok) { toast.success('削除しました'); setPosts(ps => ps.filter(p => p.id !== gridSelectedPost.id)); setGridSelectedPost(null); }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {gridSelectedPost._count.likes > 0 && (
                    <p className="text-sm font-black text-slate-900 mb-1">{gridSelectedPost._count.likes.toLocaleString()}件のいいね</p>
                  )}
                  {gridSelectedPost.caption && (
                    <p className="text-sm text-slate-700 leading-relaxed mb-2">
                      <span className="font-black text-slate-900 mr-1">{gridSelectedPost.user?.handleName}</span>
                      {gridSelectedPost.caption}
                    </p>
                  )}
                </div>

                {/* comments */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 border-t border-slate-100">
                  {gridPostComments.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs font-bold py-3">まだコメントはありません</p>
                  ) : gridPostComments.map(c => (
                    <div key={c.id} className="flex gap-2 items-start">
                      <Avatar user={c.user} size={7} />
                      <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-sm px-3 py-2">
                        <span className="text-xs font-black text-slate-700 block mb-0.5">{c.user.handleName}</span>
                        <span className="text-xs text-slate-600">{c.content}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* comment input */}
                {isAuthenticated && (
                  <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center shrink-0">
                    <input
                      type="text"
                      value={gridCommentText}
                      onChange={e => setGridCommentText(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key !== 'Enter' || !gridCommentText.trim() || gridSending) return;
                        setGridSending(true);
                        try {
                          const res = await authenticatedFetch(`/api/posts/${gridSelectedPost.id}/comments`, {
                            method: 'POST', body: JSON.stringify({ content: gridCommentText.trim() }),
                          });
                          if (res.ok) {
                            const c = await res.json();
                            setGridPostComments(prev => [...prev, c]);
                            setGridSelectedPost(p => ({ ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }));
                            setPosts(ps => ps.map(p => p.id === gridSelectedPost.id ? { ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } } : p));
                            setGridCommentText('');
                          }
                        } finally { setGridSending(false); }
                      }}
                      placeholder="コメントを追加..."
                      className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-[16px] outline-none font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-pink-200 transition-all"
                    />
                    <button
                      disabled={!gridCommentText.trim() || gridSending}
                      onClick={async () => {
                        if (!gridCommentText.trim() || gridSending) return;
                        setGridSending(true);
                        try {
                          const res = await authenticatedFetch(`/api/posts/${gridSelectedPost.id}/comments`, {
                            method: 'POST', body: JSON.stringify({ content: gridCommentText.trim() }),
                          });
                          if (res.ok) {
                            const c = await res.json();
                            setGridPostComments(prev => [...prev, c]);
                            setGridSelectedPost(p => ({ ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } }));
                            setPosts(ps => ps.map(p => p.id === gridSelectedPost.id ? { ...p, _count: { ...p._count, comments: (p._count?.comments ?? 0) + 1 } } : p));
                            setGridCommentText('');
                          }
                        } finally { setGridSending(false); }
                      }}
                      className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
