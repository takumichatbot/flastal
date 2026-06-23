'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Twitter, Youtube, ExternalLink, CheckCircle2, Heart, ArrowRight, Users, Calendar, MapPin, Ticket, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const CATEGORY_LABELS = {
    idol:        'アイドル・アーティスト',
    vtuber:      'VTuber・配信者',
    stage:       '舞台・ミュージカル',
    voice:       '声優・役者',
    anime:       'アニメ・ゲーム',
    anniversary: '生誕祭・周年記念',
    kpop:        'K-POP',
    band:        'バンド・ライブ',
};

function ProjectCard({ project, index }) {
    const router = useRouter();
    const percent = Math.min(
        Math.round(((project.collectedAmount || 0) / (project.targetAmount || 1)) * 100),
        100
    );
    const isSuccess = percent >= 100 || ['SUCCESSFUL', 'COMPLETED'].includes(project.status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
        >
            <div className="aspect-square bg-gradient-to-br from-pink-50 to-rose-50 relative overflow-hidden">
                {project.coverImageUrl
                    ? <img src={project.coverImageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><Heart size={32} className="text-pink-200" /></div>
                }
                <div className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white ${isSuccess ? 'bg-emerald-500' : 'bg-pink-500'}`}>
                    {isSuccess ? '達成!' : `${percent}%`}
                </div>
            </div>
            <div className="p-3">
                <p className="text-xs font-black text-slate-800 line-clamp-2 leading-snug mb-2">{project.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <Users size={10} />
                    <span>{project._count?.pledges || 0}人が支援</span>
                </div>
                <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" style={{ width: `${percent}%` }} />
                </div>
            </div>
        </motion.div>
    );
}

function EventCard({ event, index }) {
    const router = useRouter();
    const eventDate = event.eventDate ? new Date(event.eventDate) : null;
    const formattedDate = eventDate
        ? eventDate.toLocaleString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric',
              weekday: 'short', hour: '2-digit', minute: '2-digit',
              timeZone: 'Asia/Tokyo',
          })
        : '日時未定';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden"
        >
            <div className="h-24 bg-gradient-to-br from-pink-50 to-rose-50 relative overflow-hidden">
                {event.imageUrls?.[0]
                    ? <img src={event.imageUrls[0]} alt={event.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full flex items-center justify-center"><Ticket size={28} className="text-pink-200" /></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="p-4">
                <h3 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug mb-3">{event.title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mb-1.5">
                    <Calendar size={11} className="text-pink-400 shrink-0" />
                    <span>{formattedDate}</span>
                </div>
                {event.venue?.venueName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mb-3">
                        <MapPin size={11} className="text-pink-400 shrink-0" />
                        <span className="truncate">{event.venue.venueName}</span>
                    </div>
                )}
                <Link
                    href={`/projects/create?eventId=${event.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all active:scale-95"
                >
                    <Heart size={11} /> 企画する <ArrowRight size={11} />
                </Link>
            </div>
        </motion.div>
    );
}

export default function ArtistPageClient({ artist, projects, events = [] }) {
    const { user, authenticatedFetch } = useAuth();
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // フォロー状態を取得
    useEffect(() => {
        if (!user || !artist?.id) return;
        authenticatedFetch(`${API_URL}/api/feed/follow/status?artistPageId=${artist.id}`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => { if (d) setFollowing(d.following); })
            .catch(() => {});
    }, [user, artist?.id, authenticatedFetch]);

    const handleFollow = async () => {
        if (!user) {
            toast.error('フォローするにはログインが必要です');
            return;
        }
        setFollowLoading(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/feed/follow/artist`, {
                method: 'POST',
                body: JSON.stringify({ artistPageId: artist.id }),
            });
            if (!res.ok) throw new Error();
            const d = await res.json();
            setFollowing(d.following);
            toast.success(d.following ? `${artist.name} をフォローしました` : 'フォローを解除しました');
        } catch {
            toast.error('操作に失敗しました');
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* ヒーロー */}
            <div className="relative h-56 md:h-72 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-600 overflow-hidden">
                {artist.coverImageUrl && (
                    <img src={artist.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
                    {artist.iconUrl && (
                        <img src={artist.iconUrl} alt={artist.name}
                            className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                                {CATEGORY_LABELS[artist.category] || artist.category}
                            </span>
                            {artist.verified && (
                                <span className="flex items-center gap-1 text-[10px] font-black text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={10} /> 公式
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-sm">{artist.name}</h1>
                        {artist.nameKana && <p className="text-white/70 text-xs font-bold mt-0.5">{artist.nameKana}</p>}
                    </div>
                    {/* フォローボタン */}
                    <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-60 ${
                            following
                                ? 'bg-white/20 border border-white/40 text-white backdrop-blur-md'
                                : 'bg-white text-pink-500 hover:bg-pink-50'
                        }`}
                    >
                        {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        {following ? 'フォロー中' : 'フォロー'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* プロフィール */}
                {(artist.description || artist.twitterUrl || artist.youtubeUrl || artist.officialUrl) && (
                    <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100">
                        {artist.description && (
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">{artist.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {artist.twitterUrl && (
                                <a href={artist.twitterUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-black text-sky-500 hover:text-sky-700 transition-colors">
                                    <Twitter size={14} /> X (Twitter)
                                </a>
                            )}
                            {artist.youtubeUrl && (
                                <a href={artist.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-black text-rose-500 hover:text-rose-700 transition-colors">
                                    <Youtube size={14} /> YouTube
                                </a>
                            )}
                            {artist.officialUrl && (
                                <a href={artist.officialUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors">
                                    <ExternalLink size={14} /> 公式サイト
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* 開催予定のイベント */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={16} className="text-pink-500" />
                        <h2 className="text-lg font-black text-slate-800">開催予定のイベント</h2>
                    </div>
                    {events.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 py-10 text-center">
                            <Calendar size={32} className="mx-auto mb-2 text-slate-200" />
                            <p className="text-sm font-bold text-slate-400">現在開催予定のイベントはありません</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
                        </div>
                    )}
                </div>

                {/* 企画一覧 */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-slate-800">
                        {artist.name}への応援企画
                        <span className="ml-2 text-sm font-bold text-slate-400">{projects.length}件</span>
                    </h2>
                    <Link href={`/projects/create?artist=${artist.slug}`}>
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black rounded-xl shadow-sm hover:shadow-md transition-all">
                            <Heart size={12} /> 企画を立てる <ArrowRight size={12} />
                        </button>
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Heart size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-sm">まだ企画がありません</p>
                        <p className="text-xs mt-1">最初の企画を立ちあげてみましょう！</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
