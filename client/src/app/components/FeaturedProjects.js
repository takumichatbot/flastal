'use client';
import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import SkeletonCard from './SkeletonCard'; // ★ 1. SkeletonCardをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true); // データを取得する前に必ずloadingをtrueに
      try {
        const res = await fetch(`${API_URL}/api/projects/featured`);
        if(res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch featured projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // ★★★ 2. ローディング中の表示をスケルトンに差し替え ★★★
  // projects.length === 0 のチェックは、ローディングが終わった後に行う
  if (loading) {
    return (
      <div className="bg-white w-full py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-16 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 4つのスケルトンカードを仮表示 */}
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null; // データがない場合はセクション自体を表示しない
  }

  // ★★★ 3. ローディング完了後の表示 (ここは変更なし) ★★★
  return (
    <div className="bg-white w-full py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-16">
          注目の企画
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}