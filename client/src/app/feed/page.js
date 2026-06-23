'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Rss, Users, ArrowLeft, RefreshCw, LayoutGrid } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function ProjectCard({ project, i }) {
  const percent = Math.min(Math.round(
    ((project.collectedAmount || 0) / Math.max(project.targetAmount || 1, 1)) * 100
  ), 100);
  const deadline = project.deadline
    ? Math.max(0, Math.ceil((new Date(project.deadline) - Date.now()) / 86400000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
    >
      <Link href={`/projects/${project.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="relative h-40 bg-slate-100">
          {project.imageUrl ? (
            <Image src={project.imageUrl} alt={project.title} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200">
              <LayoutGrid size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-pink-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-white text-[10px] font-black">{percent}% 達成</span>
              {deadline !== null && <span className="text-white/80 text-[10px] font-bold">残 {deadline}日</span>}
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            {project.planner?.iconUrl ? (
              <Image src={project.planner.iconUrl} alt={`${project.planner.handleName || 'プランナー'}のアイコン`} width={20} height={20} className="rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
                <Users size={10} className="text-pink-400" />
              </div>
            )}
            <span className="text-[11px] text-slate-400 font-bold truncate">{project.planner?.handleName}</span>
          </div>
          <p className="text-sm font-black text-slate-800 line-clamp-2 leading-tight">{project.title}</p>
          <p className="text-[11px] text-slate-400 font-bold mt-1">
            {project._count?.pledges || 0} 人が支援中
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchFeed();
  }, [isAuthenticated, loading]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/users/feed/following`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setIsEmpty((data.projects || []).length === 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-pink-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Rss size={18} className="text-pink-500" />
            <h1 className="text-lg font-black text-slate-800">フォロー中のフィード</h1>
          </div>
          <button onClick={fetchFeed} className="ml-auto p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
              <Users size={28} className="text-pink-300" />
            </div>
            <h2 className="text-base font-black text-slate-700 mb-2">フォロー中の企画者がいません</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              気になる企画者をフォローすると<br />新着企画がここに表示されます
            </p>
            <Link href="/projects" className="px-6 py-3 bg-pink-500 text-white rounded-full text-sm font-black shadow-md hover:bg-pink-600 transition-colors">
              企画を探す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {projects.map((p, i) => <ProjectCard key={p.id} project={p} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
