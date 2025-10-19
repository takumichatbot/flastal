'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'; // ★ URLを修正

// ★ 企画カードをコンポーネントとして分離（デザイン改善）
function ProjectCard({ project }) {
  // 達成率を計算
  const progress = Math.min((project.collectedAmount / project.targetAmount) * 100, 100);

  return (
    <Link href={`/projects/${project.id}`} legacyBehavior>
      <a className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col">
        {/* 画像（ダミーまたはproject.imageUrl） */}
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">イメージ画像なし</span>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <h2 className="text-lg font-bold text-sky-700 truncate">{project.title}</h2>
          
          {/* ★ 修正: project.organizer -> project.planner.handleName */}
          <p className="text-sm text-gray-600 mt-2">
            企画者: <span className="font-medium">{project.planner.handleName}</span>
          </p>

          {/* ★ デザイン改善: 金額とプログレスバーを追加 */}
          <div className="mt-4">
            <span className="text-2xl font-bold text-gray-800">{project.collectedAmount.toLocaleString()} pt</span>
            <span className="text-sm text-gray-500"> / {project.targetAmount.toLocaleString()} pt</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
            <div 
              className="bg-sky-500 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-right text-sm font-medium text-sky-600">{Math.floor(progress)}% 達成</div>
        </div>
      </a>
    </Link>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/api/projects`);
        if (!response.ok) throw new Error('データの取得に失敗しました。');
        const data = await response.json();
        setProjects(data);
      } catch (error) { 
        console.error(error);
      } 
      finally { setLoading(false); }
    };
    fetchProjects();
  }, []);

  return (
    <div className="bg-sky-50 min-h-screen">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">みんなの企画</h1>
          <Link href="/projects/create">
            <span className="rounded-md bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-sky-600 transition-colors">
              企画を作成する
            </span>
          </Link>
        </div>
        
        {loading ? (
          <p className="text-center text-gray-600">企画を読み込んでいます...</p>
        ) : projects.length === 0 ? (
          <p className="text-center text-gray-600">現在、公開中の企画はありません。</p>
        ) : (
          // ★ 修正: ProjectCardコンポーネントを使う
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}