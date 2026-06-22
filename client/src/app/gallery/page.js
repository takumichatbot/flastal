'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Camera, X, Loader2, ImageOff, ExternalLink, Plus, Trash2, Heart, ChevronDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const GENRE_TABS = [
    { id: 'all', label: 'すべて' },
    { id: 'idol', label: 'アイドル' },
    { id: 'vtuber', label: 'VTuber' },
    { id: 'anime', label: 'アニメ' },
    { id: 'voice_actor', label: '声優' },
];

const SORT_OPTIONS = [
    { id: 'newest', label: '新着順' },
    { id: 'likes', label: 'いいね順' },
    { id: 'project', label: 'プロジェクト別' },
];

function PhotoCard({ photo, onDelete, canDelete, token, onLikeUpdate }) {
    const [showFull, setShowFull] = useState(false);
    const [liked, setLiked] = useState(photo.likedByMe || false);
    const [likeCount, setLikeCount] = useState(photo.likeCount || 0);
    const [liking, setLiking] = useState(false);

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!token || liking) return;
        setLiking(true);
        try {
            const res = await fetch(`${API_URL}/api/gallery/${photo.id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const newLiked = data.liked ?? !liked;
                const newCount = data.likeCount ?? (newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
                setLiked(newLiked);
                setLikeCount(newCount);
                if (onLikeUpdate) onLikeUpdate(photo.id, newLiked, newCount);
            }
        } catch { /* ignore */ }
        finally { setLiking(false); }
    };

    return (
        <>
            <div className="group relative rounded-2xl overflow-hidden bg-slate-100 aspect-square cursor-pointer"
                onClick={() => setShowFull(true)}>
                <Image
                    src={photo.imageUrl}
                    alt={photo.caption || photo.project?.title || ''}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    {photo.project && (
                        <p className="text-white text-[10px] font-bold truncate">{photo.project.title}</p>
                    )}
                    <p className="text-white/80 text-[10px] truncate">{photo.uploader?.handleName}</p>
                </div>
                {canDelete && (
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(photo.id); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500">
                        <Trash2 size={12} className="text-white" />
                    </button>
                )}
                {/* いいねボタン */}
                <button
                    onClick={handleLike}
                    disabled={!token || liking}
                    className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-[10px] font-black backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-500/80 disabled:cursor-not-allowed"
                >
                    <Heart size={10} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
                    {likeCount > 0 && <span>{likeCount}</span>}
                </button>
            </div>

            {showFull && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowFull(false)}>
                    <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-video bg-black">
                            <Image src={photo.imageUrl} alt={photo.caption || ''} fill className="object-contain" unoptimized />
                        </div>
                        <div className="p-4">
                            {photo.caption && <p className="text-sm font-bold text-slate-700 mb-2">{photo.caption}</p>}
                            <div className="flex items-center justify-between">
                                <div>
                                    {photo.project && (
                                        <Link href={`/projects/${photo.project.id}`}
                                            className="text-xs font-black text-violet-500 hover:underline flex items-center gap-1">
                                            {photo.project.title} <ExternalLink size={10} />
                                        </Link>
                                    )}
                                    <p className="text-[11px] text-slate-400">{photo.uploader?.handleName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleLike}
                                        disabled={!token || liking}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${liked ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'} disabled:opacity-50`}
                                    >
                                        <Heart size={12} className={liked ? 'fill-rose-500' : ''} />
                                        {likeCount > 0 ? likeCount : 'いいね'}
                                    </button>
                                    <button onClick={() => setShowFull(false)}
                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function UploadModal({ onClose, onSuccess, token }) {
    const [projectId, setProjectId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState('');

    const handleFile = async (f) => {
        setPreview(URL.createObjectURL(f));
        setUploading(true);
        const fd = new FormData();
        fd.append('image', f);
        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url || data.imageUrl || '');
            }
        } finally { setUploading(false); }
    };

    const submit = async () => {
        if (!imageUrl || !projectId) return;
        setUploading(true);
        const res = await fetch(`${API_URL}/api/gallery/${projectId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, caption }),
        });
        setUploading(false);
        if (res.ok) onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <p className="font-black text-slate-800">達成写真を投稿</p>
                    <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <input
                        type="text"
                        value={projectId}
                        onChange={e => setProjectId(e.target.value)}
                        placeholder="企画ID（URLの末尾の番号）"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-violet-400"
                    />
                    <label className={`block border-2 border-dashed rounded-xl cursor-pointer overflow-hidden aspect-video flex items-center justify-center transition-colors ${preview ? 'border-transparent' : 'border-slate-200 hover:border-violet-300'}`}>
                        {preview ? (
                            <div className="relative w-full h-full">
                                <Image src={preview} alt="" fill className="object-cover" unoptimized />
                            </div>
                        ) : (
                            <div className="text-center">
                                <Camera size={24} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-xs text-slate-400 font-bold">クリックして写真を選択</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="sr-only"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </label>

                    <input
                        type="text"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        placeholder="コメント（任意）"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-violet-400"
                        maxLength={200}
                    />
                    <button
                        onClick={submit}
                        disabled={uploading || !imageUrl || !projectId}
                        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white font-black text-sm py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                        {uploading && <Loader2 size={16} className="animate-spin" />}
                        {uploading ? 'アップロード中...' : '投稿する'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GalleryPage() {
    const { token, user } = useAuth();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [activeGenre, setActiveGenre] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/gallery/feed?limit=40`);
            if (res.ok) setPhotos(await res.json());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id) => {
        if (!confirm('この写真を削除しますか？')) return;
        await fetch(`${API_URL}/api/gallery/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setPhotos(p => p.filter(ph => ph.id !== id));
    };

    const handleLikeUpdate = (photoId, newLiked, newCount) => {
        setPhotos(p => p.map(ph =>
            ph.id === photoId ? { ...ph, likedByMe: newLiked, likeCount: newCount } : ph
        ));
    };

    const filteredAndSorted = [...photos]
        .filter(ph => {
            if (activeGenre === 'all') return true;
            return ph.genre === activeGenre || ph.project?.genre === activeGenre;
        })
        .sort((a, b) => {
            if (sortBy === 'likes') return (b.likeCount || 0) - (a.likeCount || 0);
            if (sortBy === 'project') return (a.project?.title || '').localeCompare(b.project?.title || '');
            // newest: 降順
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

    const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label || '新着順';

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            {/* ヒーローセクション */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white py-10 px-4 text-center">
                <h1 className="text-2xl font-black">達成報告ギャラリー</h1>
                <p className="text-pink-100 mt-1 text-sm">完成したフラスタの写真を共有しよう</p>
                {token && (
                    <button
                        onClick={() => setShowUpload(true)}
                        className="mt-4 inline-flex items-center gap-2 bg-white text-pink-500 font-black text-sm px-5 py-2.5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow active:scale-95">
                        <Plus size={16} /> 写真を投稿する
                    </button>
                )}
            </div>

            {/* フィルタータブ */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
                    {GENRE_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveGenre(tab.id)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                                activeGenre === tab.id
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* ソート + 件数 */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black text-slate-400">
                        {filteredAndSorted.length}件
                    </p>
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(v => !v)}
                            className="flex items-center gap-1.5 text-xs font-black text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:border-pink-300 transition-colors"
                        >
                            {currentSortLabel}
                            <ChevronDown size={12} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-20 min-w-[120px]">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors ${sortBy === opt.id ? 'text-pink-500 bg-pink-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-pink-400" />
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <div className="text-center py-20">
                        <ImageOff size={36} className="mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-400 font-bold text-sm">まだ写真がありません</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredAndSorted.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onDelete={handleDelete}
                                canDelete={user?.id === photo.uploaderId || user?.role === 'ADMIN'}
                                token={token}
                                onLikeUpdate={handleLikeUpdate}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* フローティング投稿ボタン（ログイン済みのみ） */}
            {token && (
                <button
                    onClick={() => setShowUpload(true)}
                    className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-xl shadow-pink-200 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                    aria-label="写真を投稿"
                >
                    <Plus size={24} />
                </button>
            )}

            {showUpload && (
                <UploadModal
                    token={token}
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => { setShowUpload(false); load(); }}
                />
            )}
        </div>
    );
}
