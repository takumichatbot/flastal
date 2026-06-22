'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Rss, Plus, Trash2, Image as ImageIcon, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { AppCard } from './shared.js';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return new Date(dateStr).toLocaleDateString('ja-JP');
}

function UpdateCard({ update, canDelete, onDelete }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{update.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(update.createdAt)}</p>
                </div>
                {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {open && (
                <div className="px-4 pb-4 border-t border-slate-50">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap mt-3 leading-relaxed">{update.body}</p>
                    {update.imageUrls?.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {update.imageUrls.map((url, i) => (
                                <div key={i} className="relative w-32 h-32 shrink-0">
                                    <Image src={url} alt={`${update.title || '更新画像'} ${i + 1}`} fill className="object-cover rounded-xl border border-slate-100" />
                                </div>
                            ))}
                        </div>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => onDelete(update.id)}
                            className="mt-3 flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600 font-bold transition-colors"
                        >
                            <Trash2 size={12} /> 削除
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function PostForm({ projectId, onPosted }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken')?.replace(/^"|"$/g, '') : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/updates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title, body }),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            toast.success('アップデートを投稿しました');
            setTitle(''); setBody('');
            onPosted();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-pink-50 border border-pink-100 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-pink-600 flex items-center gap-1.5"><Plus size={12} /> 新しいアップデートを投稿</p>
            <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="タイトル"
                className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-medium outline-none focus:border-pink-400"
            />
            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="支援者への近況・進捗報告を書きましょう..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-pink-200 bg-white text-sm outline-none focus:border-pink-400 resize-none leading-relaxed"
            />
            <button
                type="submit"
                disabled={loading || !title.trim() || !body.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black rounded-xl disabled:opacity-50"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Rss size={14} />}
                投稿する
            </button>
        </form>
    );
}

export default function UpdatesTab({ ctx }) {
    const { project } = ctx;
    const { user } = useAuth();
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    const isAuthorized =
        user?.id === project.plannerId ||
        project.members?.some(m => m.userId === user?.id);

    const fetchUpdates = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/projects/${project.id}/updates`);
            if (res.ok) setUpdates(await res.json());
        } finally {
            setLoading(false);
        }
    }, [project.id]);

    useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

    const handleDelete = async (id) => {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        const res = await fetch(`${API_URL}/api/projects/${project.id}/updates/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { toast.success('削除しました'); fetchUpdates(); }
        else toast.error('削除に失敗しました');
    };

    return (
        <AppCard>
            <div className="flex items-center gap-2 mb-5">
                <Rss className="text-pink-500" size={18} />
                <h2 className="font-black text-slate-800 text-lg">企画アップデート</h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{updates.length}件</span>
            </div>

            {isAuthorized && (
                <div className="mb-5">
                    <PostForm projectId={project.id} onPosted={fetchUpdates} />
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-400" size={28} /></div>
            ) : updates.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <Rss size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-bold">まだアップデートはありません</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {updates.map(u => (
                        <UpdateCard
                            key={u.id}
                            update={u}
                            canDelete={isAuthorized || user?.role === 'ADMIN'}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </AppCard>
    );
}
