'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart, Award, User, LayoutGrid, Lock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-slate-50 animate-pulse">
    <div className="h-60 bg-slate-200" />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-20">
      <div className="bg-white rounded-3xl shadow-sm p-8 pb-12 text-center border border-slate-100">
        <div className="w-40 h-40 bg-slate-200 rounded-full mx-auto border-4 border-white mb-6" />
        <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
        <div className="h-4 bg-slate-200 rounded w-96 mx-auto mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    </div>
  </div>
);

function ProjectCard({ project, label, delay = 0 }) {
  const statusLabels = {
    'FUNDRAISING': { text: '募集中', color: 'bg-pink-500' },
    'SUCCESSFUL':  { text: '達成',  color: 'bg-emerald-500' },
    'CLOSED':      { text: '終了',  color: 'bg-slate-400' },
    'COMPLETED':   { text: '完了',  color: 'bg-purple-500' },
  };
  const status = statusLabels[project.status] || { text: project.status, color: 'bg-slate-400' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link href={`/projects/${project.id}`} className="block group h-full">
        <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <LayoutGrid size={32} className="mb-2 opacity-50" />
              <span className="text-xs font-bold">No Image</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <span className={`text-[10px] text-white px-2 py-0.5 rounded-full w-fit mb-2 ${status.color}`}>
              {status.text}
            </span>
            <p className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1">{project.title}</p>
            <span className="text-[10px] text-white/80 font-medium flex items-center gap-1">
              {label === 'Organizer' ? <Award size={12} /> : <Heart size={12} />} {label}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function PublicUserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}/profile`);
        if (res.status === 403) throw new Error('PRIVATE_PROFILE');
        if (!res.ok) throw new Error('USER_NOT_FOUND');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            {error === 'PRIVATE_PROFILE' ? <Lock size={40} /> : <AlertCircle size={40} />}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {error === 'PRIVATE_PROFILE' ? 'このプロフィールは非公開です' : 'ユーザーが見つかりません'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {error === 'PRIVATE_PROFILE'
              ? 'このユーザーはプロフィールの公開範囲を制限しています。'
              : 'URLが間違っているか、ユーザーが退会した可能性があります。'}
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
            トップページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  const createdCount = profile.createdProjects?.length || 0;
  const backedCount = profile.pledges?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">

      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-300 via-rose-300 to-purple-300" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24">

        <div className="bg-white rounded-[30px] shadow-xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="flex-shrink-0 relative group">
              <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-lg overflow-hidden bg-white relative z-10">
                {profile.iconUrl ? (
                  <Image src={profile.iconUrl} alt={profile.handleName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <User size={60} />
                  </div>
                )}
              </div>
              <div className="absolute -inset-2 bg-gradient-to-tr from-pink-400 to-rose-400 rounded-full opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
            </div>

            <div className="flex-grow text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{profile.handleName}</h1>
                  <p className="text-slate-400 text-sm font-mono">@{id.substring(0, 8)}...</p>
                </div>

                <div className="flex gap-4 mt-4 md:mt-0 justify-center">
                  {profile.twitterUrl && (
                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" aria-label="X (Twitter)">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {profile.instagramUrl && (
                    <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-[#E1306C] hover:bg-pink-50 transition-all" aria-label="Instagram">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/></svg>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {profile.favoriteGenres?.map(g => (
                  <span key={g} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full shadow-sm">
                    #{g}
                  </span>
                ))}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap mb-8 max-w-2xl mx-auto md:mx-0">
                {profile.bio || '自己紹介はまだ設定されていません。'}
              </p>

              <div className="flex justify-center md:justify-start gap-8 border-t border-slate-100 pt-6">
                <div className="text-center md:text-left">
                  <p className="text-2xl font-black text-slate-800">{createdCount}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hosted</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl font-black text-slate-800">{backedCount}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Backed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">

          <div className="flex justify-center mb-10">
            <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 inline-flex">
              <button
                onClick={() => setActiveTab('created')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'created'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Award size={15} /> 主催した企画 <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] ml-1">{createdCount}</span>
              </button>
              <button
                onClick={() => setActiveTab('backed')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'backed'
                    ? 'bg-gradient-to-r from-purple-500 to-rose-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Heart size={15} /> 参加した企画 <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] ml-1">{backedCount}</span>
              </button>
            </div>
          </div>

          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === 'created' ? (
                <motion.div
                  key="created"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {createdCount > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {profile.createdProjects.map((p, i) => (
                        <ProjectCard key={p.id} project={p} label="Organizer" delay={i * 0.05} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Award size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">まだ主催した企画はありません</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="backed"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {backedCount > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {profile.pledges.map((pledge, i) => (
                        <ProjectCard key={pledge.project.id} project={pledge.project} label="Supporter" delay={i * 0.05} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Heart size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">まだ参加した企画はありません</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
