'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Trash2, CornerDownRight, User } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { AppCard } from './shared.js';
import { DeleteConfirmModal } from '@/app/components/DeleteConfirmModal';
import { EmptyState } from '@/app/components/EmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return `${Math.floor(diff / 86400)}日前`;
}

function Avatar({ user }) {
    return (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
            {user?.iconUrl
                ? <Image src={user.iconUrl} alt={user.handleName} width={32} height={32} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={14} /></div>
            }
        </div>
    );
}

function DiscussionPost({ post, projectId, onRefresh, currentUserId, depth = 0 }) {
    const [showReply, setShowReply] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { authenticatedFetch } = useAuth();

    const handleReply = async () => {
        if (!replyBody.trim()) return;
        setSubmitting(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/projects/${projectId}/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: replyBody, parentId: post.id }),
            });
            if (!res.ok) throw new Error('返信の投稿に失敗しました');
            setReplyBody('');
            setShowReply(false);
            onRefresh();
        } catch (err) {
            toast.error(err.message || '返信の投稿に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/projects/${projectId}/discussions/${post.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('コメントの削除に失敗しました');
            onRefresh();
        } catch (err) {
            toast.error(err.message || 'コメントの削除に失敗しました');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <>
        <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
            title="このコメントを削除しますか？"
            description="削除したコメントは元に戻せません。"
            isLoading={deleting}
        />
        <div className={depth > 0 ? 'ml-8 mt-3' : ''}>
            <div className="flex gap-3">
                <Avatar user={post.author} />
                <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-700">{post.author?.handleName}</span>
                            <span className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.body}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                        {depth === 0 && currentUserId && (
                            <button onClick={() => setShowReply(v => !v)}
                                className="text-[11px] font-black text-slate-400 hover:text-pink-500 flex items-center gap-1 transition-colors">
                                <CornerDownRight size={11} /> 返信
                            </button>
                        )}
                        {post.authorId === currentUserId && (
                            <button onClick={() => setShowDeleteModal(true)}
                                className="text-[11px] font-black text-slate-300 hover:text-red-400 flex items-center gap-1 transition-colors">
                                <Trash2 size={11} /> 削除
                            </button>
                        )}
                    </div>
                    {showReply && (
                        <div className="mt-2 flex gap-2">
                            <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
                                rows={2} placeholder="返信を入力..."
                                className="flex-1 text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300" />
                            <button onClick={handleReply} disabled={submitting || !replyBody.trim()}
                                className="self-end px-3 py-2 bg-pink-500 text-white rounded-xl text-xs font-black disabled:opacity-50">
                                <Send size={13} />
                            </button>
                        </div>
                    )}
                    {post.replies?.map(r => (
                        <DiscussionPost key={r.id} post={r} projectId={projectId} onRefresh={onRefresh}
                            currentUserId={currentUserId} depth={depth + 1} />
                    ))}
                </div>
            </div>
        </div>
        </>
    );
}

export default function DiscussionTab({ ctx }) {
    const { project } = ctx;
    const { user, authenticatedFetch } = useAuth();
    const [posts, setPosts] = useState([]);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            const r = await fetch(`${API_URL}/api/projects/${project.id}/discussions`);
            if (r.ok) setPosts(await r.json());
        } finally {
            setLoading(false);
        }
    }, [project.id]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleSubmit = async () => {
        if (!body.trim()) return;
        setSubmitting(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/projects/${project.id}/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body }),
            });
            if (!res.ok) throw new Error('コメントの投稿に失敗しました');
            setBody('');
            fetchPosts();
        } catch (err) {
            toast.error(err.message || 'コメントの投稿に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppCard>
            <h2 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                <MessageSquare className="text-slate-400" size={20} /> ディスカッション
            </h2>

            {user && (
                <div className="flex gap-3 mb-6">
                    <Avatar user={user} />
                    <div className="flex-1">
                        <textarea value={body} onChange={e => setBody(e.target.value)}
                            rows={3} placeholder="質問・コメントを投稿..."
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300" />
                        <button onClick={handleSubmit} disabled={submitting || !body.trim()}
                            className="mt-2 px-5 py-2 bg-pink-500 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-pink-600 disabled:opacity-50 transition-colors">
                            <Send size={13} /> 投稿する
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <EmptyState
                    icon="message"
                    title="まだコメントはありません"
                    description="最初のコメントを投稿してみましょう！"
                    className="py-8"
                />
            ) : (
                <div className="space-y-4">
                    {posts.map(p => (
                        <DiscussionPost key={p.id} post={p} projectId={project.id}
                            onRefresh={fetchPosts} currentUserId={user?.id} />
                    ))}
                </div>
            )}
        </AppCard>
    );
}
