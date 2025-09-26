'use client';
import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard'; // 以前作成した企画カードを再利用

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true); // ★ ローディング状態を追加

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true); // ★ 読み込み開始
      try {
        const res = await fetch('http://localhost:3001/api/projects/featured');
        if(res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch featured projects:", error);
      } finally {
        setLoading(false); // ★ 読み込み完了
      }
    };
    fetchFeatured();
  }, []);

  // ★ 読み込み中は何も表示しない（ちらつき防止）
  if (loading) {
    return null;
  }

  // 表示する企画がない場合は、このセクション自体を表示しない
  if (projects.length === 0) {
    return null;
  }

  return (
    // ★★★ ここを bg-white に変更 ★★★
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