'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, Award, Heart, User, LayoutGrid, Lock,
  AlertCircle, Grid3X3, Images, MessageCircle,
  Share2, Calendar, TrendingUp, UserPlus, UserCheck, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import BadgeDisplay from '../../components/BadgeDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const SUPPORT_LEVELS = {
  BRONZE:   { label: 'ブロンズ',   color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
  SILVER:   { label: 'シルバー',   color: 'text-slate-600',  bg: 'bg-slate-100 border-slate-200',  dot: 'bg-slate-400' },
  GOLD:     { label: 'ゴールド',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-400' },
  PLATINUM: { label: 'プラチナ',   color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', dot: 'bg-violet-400' },
  DIAMOND:  { label: 'ダイヤモンド', color: 'text-sky-600',   bg: 'bg-sky-50 border-sky-200',       dot: 'bg-sky-400' },
};

function SupportBadge({ level }) {
  const info = SUPPORT_LEVELS[level];
  if (!info) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border', info.bg, info.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', info.dot)} />
      {info.label}サポーター
    </span>
  );
}

function ProjectCard({ project, delay = 0 }) {
  const percent = Math.min(Math.round(((project.collectedAmount || 0) / (project.targetAmount || 1)) * 100), 100);
  const statusMap = {
    FUNDRAISING: { text: '募集中', color: 'bg-pink-500' },
    SUCCESSFUL:  { text: '達成',   color: 'bg-emerald-500' },
    COMPLETED:   { text: '完了',   color: 'bg-purple-500' },
    CLOSED:      { text: '終了',   color: 'bg-slate-400' },
  };
  const s = statusMap[project.status] || { text: project.status, color: 'bg-slate-400' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <Link href={`/projects/${project.id}`} className="block active:opacity-70 transition-opacity">
        <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-50">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt={project.title} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
              <LayoutGrid size={28} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <span className={cn('text-[9px] text-white px-1.5 py-0.5 rounded-full font-black', s.color)}>{s.text}</span>
            <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight mt-1">{project.title}</p>
            {project.status === 'FUNDRAISING' && (
              <div className="mt-2">
                <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-[9px] text-white/70 mt-1 font-bold">{percent}% 達成</p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function AlbumGrid({ posts }) {
  const [selectedPost, setSelectedPost] = useState(null);

  if (!posts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-300">
        <Images size={40} className="mb-3" />
        <p className="text-sm font-bold text-slate-400">まだ投稿がありません</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-px">
        {posts.map((post, i) => (
          <motion.button
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square bg-slate-100 active:opacity-70 transition-opacity overflow-hidden"
          >
            <Image src={post.imageUrl} alt={post.eventName} fill className="object-cover" sizes="33vw" />
            {post._count?.likes > 0 && (
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <Heart size={8} className="fill-white text-white" />
                <span className="text-[8px] text-white font-black">{post._count.likes}</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white w-full max-w-lg rounded-t-[2rem] overflow-hidden"
              style={{ maxHeight: '90dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-square bg-slate-100">
                <Image src={selectedPost.imageUrl} alt={selectedPost.eventName} fill className="object-cover" sizes="100vw" />
              </div>
              <div className="p-5">
                <p className="font-black text-slate-800 text-base">{selectedPost.eventName}</p>
                {selectedPost.caption && (
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{selectedPost.caption}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Heart size={15} />
                    <span className="text-xs font-bold">{selectedPost._count?.likes ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MessageCircle size={15} />
                    <span className="text-xs font-bold">{selectedPost._count?.comments ?? 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function PublicUserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { user: me, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('created');
  const [followStatus, setFollowStatus] = useState({ following: false, followersCount: 0, followingCount: 0 });
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}/profile`);
        if (res.status === 403) throw new Error('PRIVATE_PROFILE');
        if (!res.ok) throw new Error('USER_NOT_FOUND');
        setProfile(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !me || me.id === id) return;
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    fetch(`${API_URL}/api/users/${id}/follow`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setFollowStatus(data); })
      .catch(() => {});
  }, [id, isAuthenticated, me]);

  const handleFollow = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setFollowLoading(true);
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    const method = followStatus.following ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/follow`, {
        method, headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowStatus(prev => ({
          ...prev,
          following: data.following,
          followersCount: prev.followersCount + (data.following ? 1 : -1),
        }));
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts?userId=${id}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'album') loadPosts();
  }, [activeTab, loadPosts]);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${profile?.handleName} さんのFLASTALプロフィール`;
    if (navigator.share) {
      await navigator.share({ title: text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 font-sans" style={{ height: '100dvh' }}>
        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-white font-sans" style={{ height: '100dvh' }}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 text-slate-300">
            {error === 'PRIVATE_PROFILE' ? <Lock size={36} /> : <AlertCircle size={36} />}
          </div>
          <h2 className="text-lg font-black text-slate-800 mb-2">
            {error === 'PRIVATE_PROFILE' ? 'プロフィールは非公開です' : 'ユーザーが見つかりません'}
          </h2>
          <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
            {error === 'PRIVATE_PROFILE'
              ? 'このユーザーはプロフィールの公開範囲を制限しています。'
              : 'URLが間違っているか、ユーザーが退会した可能性があります。'}
          </p>
          <button onClick={() => router.back()}
            className="px-6 py-3 bg-slate-800 text-white font-black rounded-2xl text-sm">
            戻る
          </button>
        </div>
      </div>
    );
  }

  const createdCount = profile.createdProjects?.length || 0;
  const backedCount = profile.pledges?.length || 0;
  const totalPledged = profile.totalPledgedAmount || 0;
  const joinedYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : null;

  const TABS = [
    { id: 'created', label: '主催',     icon: Award,    count: createdCount },
    { id: 'backed',  label: '支援',     icon: Heart,    count: backedCount },
    { id: 'album',   label: 'アルバム', icon: Grid3X3,  count: null },
  ];

  return (
    <div className="flex flex-col bg-[#F7F7FA] font-sans" style={{ minHeight: '100dvh' }}>

      {/* ── Fixed Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center px-4 h-14 max-w-xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="flex-1 text-center font-black text-slate-800 text-base truncate px-2">{profile.handleName}</p>
          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200 transition-colors shrink-0"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Scroll Content ── */}
      <div
        className="flex-1 overflow-y-auto max-w-xl mx-auto w-full"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* ── Hero ── */}
        <div className="relative">
          {/* Banner gradient */}
          <div className="h-32 bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          </div>

          {/* Avatar — overlaps banner */}
          <div className="px-5 -mt-12 flex items-end justify-between">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 shrink-0">
              {profile.iconUrl ? (
                <Image src={profile.iconUrl} alt={profile.handleName} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={40} />
                </div>
              )}
            </div>

            {/* フォローボタン + SNS links float right */}
            <div className="flex items-center gap-2 mb-2">
              {isAuthenticated && me && me.id !== id && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black shadow-sm border transition-all',
                    followStatus.following
                      ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      : 'bg-pink-500 text-white border-pink-500 hover:bg-pink-600',
                    followLoading && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  {followStatus.following ? <UserCheck size={13} /> : <UserPlus size={13} />}
                  {followStatus.following ? 'フォロー中' : 'フォロー'}
                </button>
              )}
              {profile.twitterUrl && (
                <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-700 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {profile.instagramUrl && (
                <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-pink-500 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile Info ── */}
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-800 leading-tight">{profile.handleName}</h1>
              {joinedYear && (
                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                  <Calendar size={10} /> {joinedYear}年から活動中
                </p>
              )}
            </div>
            {profile.supportLevel && <SupportBadge level={profile.supportLevel} />}
          </div>

          {profile.badgeIds?.length > 0 && (
            <div className="mb-3"><BadgeDisplay badgeIds={profile.badgeIds} size="sm" /></div>
          )}

          {profile.bio && (
            <p className="text-sm text-slate-600 leading-relaxed mb-3 font-medium">{profile.bio}</p>
          )}

          {profile.favoriteGenres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.favoriteGenres.map(g => (
                <span key={g} className="px-2.5 py-1 bg-pink-50 text-pink-600 text-[11px] font-black rounded-full border border-pink-100">
                  #{g}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: createdCount, label: '主催',     icon: Award,       iconColor: 'text-amber-500',  bg: 'bg-amber-50' },
              { value: backedCount,  label: '支援',     icon: Heart,       iconColor: 'text-pink-500',   bg: 'bg-pink-50' },
              { value: followStatus.followersCount, label: 'フォロワー', icon: Users, iconColor: 'text-sky-500', bg: 'bg-sky-50' },
              { value: totalPledged > 0 ? `¥${totalPledged.toLocaleString()}` : '−',
                                     label: '総支援額', icon: TrendingUp,  iconColor: 'text-emerald-500', bg: 'bg-emerald-50' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
                  <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-1.5', s.bg, s.iconColor)}>
                    <Icon size={14} strokeWidth={2.5} />
                  </div>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tight">{s.value}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex bg-white border-b border-slate-100 sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors relative',
                  active ? 'text-pink-500' : 'text-slate-400'
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-black">
                  {tab.label}{tab.count !== null ? ` ${tab.count}` : ''}
                </span>
                {active && (
                  <motion.div
                    layoutId="profileTabLine"
                    className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-pink-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'created' && (
            <motion.div
              key="created"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {createdCount > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {profile.createdProjects.map((p, i) => (
                    <ProjectCard key={p.id} project={p} delay={i * 0.04} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-3 text-amber-300">
                    <Award size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">まだ主催した企画はありません</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'backed' && (
            <motion.div
              key="backed"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {backedCount > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {profile.pledges.map((pledge, i) => (
                    <ProjectCard key={pledge.project.id} project={pledge.project} delay={i * 0.04} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-3 text-pink-300">
                    <Heart size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">まだ支援した企画はありません</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'album' && (
            <motion.div
              key="album"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlbumGrid posts={posts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
