'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Camera, X, Loader2, ImageOff, ExternalLink, Plus, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function PhotoCard({ photo, onDelete, canDelete }) {
    const [showFull, setShowFull] = useState(false);

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
                                <button onClick={() => setShowFull(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function UploadModal({ projectId, onClose, onSuccess, token }) {
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
        if (!imageUrl) return;
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
                        disabled={uploading || !imageUrl}
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
    const [uploadProjectId, setUploadProjectId] = useState('');

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

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            <div className="bg-gradient-to-br from-rose-400 to-pink-500 py-10 px-4">
                <div className="max-w-3xl mx-auto">
                    <p className="text-rose-200 text-xs font-black uppercase tracking-widest mb-1">Gallery</p>
                    <h1 className="text-2xl font-black text-white">達成報告ギャラリー</h1>
                    <p className="text-white/70 text-sm font-bold mt-1">みんなが完成させたフラスタの写真</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {token && (
                    <div className="mb-6 flex items-center gap-3">
                        <input
                            type="text"
                            value={uploadProjectId}
                            onChange={e => setUploadProjectId(e.target.value)}
                            placeholder="企画ID（URLの末尾から取得）"
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-pink-400"
                        />
                        <button
                            onClick={() => uploadProjectId && setShowUpload(true)}
                            disabled={!uploadProjectId}
                            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-sm px-4 py-2.5 rounded-xl disabled:opacity-40">
                            <Plus size={14} /> 投稿
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-pink-400" />
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-20">
                        <ImageOff size={36} className="mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-400 font-bold text-sm">まだ写真がありません</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onDelete={handleDelete}
                                canDelete={user?.id === photo.uploaderId || user?.role === 'ADMIN'}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showUpload && (
                <UploadModal
                    projectId={uploadProjectId}
                    token={token}
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => { setShowUpload(false); load(); }}
                />
            )}
        </div>
    );
}
