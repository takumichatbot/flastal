'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, CheckCircle2, Loader2, Music, Video, Users, MessageCircle, Command, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../components/EmptyState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const CATEGORIES = [
    { id: '',            label: 'すべて',        icon: Star },
    { id: 'idol',        label: 'アイドル',      icon: Music },
    { id: 'vtuber',      label: 'VTuber',        icon: Video },
    { id: 'stage',       label: '舞台',          icon: Users },
    { id: 'voice',       label: '声優',          icon: MessageCircle },
    { id: 'anime',       label: 'アニメ・ゲーム', icon: Command },
    { id: 'anniversary', label: '生誕祭',        icon: Crown },
];

export default function ArtistsPage() {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');
    const [q, setQ] = useState('');

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (q) params.set('q', q);
        fetch(`${API_URL}/api/artists?${params}`)
            .then(r => r.ok ? r.json() : [])
            .then(setArtists)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [category, q]);

    return (
        <div className="min-h-screen bg-[#FAF9FF] font-sans">
            {/* ヘッダー */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-black text-white mb-2">アーティスト一覧</h1>
                    <p className="text-pink-100 text-sm font-bold mb-6">推しへの企画をアーティストから探そう</p>
                    <div className="relative max-w-sm mx-auto">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={q} onChange={e => setQ(e.target.value)}
                            placeholder="アーティスト名で検索..."
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-sm font-medium text-slate-700 outline-none shadow-lg" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* カテゴリフィルター */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button key={cat.id} onClick={() => setCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black shrink-0 transition-all ${
                                    category === cat.id
                                        ? 'bg-pink-500 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
                                }`}>
                                <Icon size={12} />{cat.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-400" size={32} /></div>
                ) : artists.length === 0 ? (
                    <EmptyState
                        icon="🌸"
                        title="アーティストが見つかりません"
                        description="検索条件を変えて試してみてください"
                    />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={q + category}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                        >
                            {artists.map((artist, i) => (
                                <motion.div key={artist.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}>
                                    <Link href={`/artists/${artist.slug}`}>
                                        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                                            <div className="aspect-square bg-gradient-to-br from-pink-50 to-rose-50 relative overflow-hidden">
                                                {artist.iconUrl
                                                    ? <img src={artist.iconUrl} alt={artist.name} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-pink-200">{artist.name[0]}</div>
                                                }
                                                {artist.verified && (
                                                    <div className="absolute top-2 right-2 bg-white/90 rounded-full p-0.5 shadow">
                                                        <CheckCircle2 size={14} className="text-sky-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs font-black text-slate-800 truncate">{artist.name}</p>
                                                {artist.nameKana && <p className="text-[10px] text-slate-400 truncate">{artist.nameKana}</p>}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
