'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// import ProjectCard from '../components/ProjectCard'; // ProjectCardは後で統合します

// ★ 1. APIの接続先をPythonバックエンドに変更
const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // ★ 2. PythonのAPIエンドポイントを呼び出す
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

  // ★ 3. ProjectCardの代わりにシンプルな表示にする（後で統合）
  return (
    <div className="bg-sky-50 min-h-screen">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">みんなの企画</h1>
          <Link href="/projects/create">
            <span className="rounded-full bg-sky-500 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-sky-600">
              企画を作成する
            </span>
          </Link>
        </div>
        {loading ? <p>読み込み中...</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <h2 className="text-lg font-bold text-sky-600">{project.title}</h2>
                  <p className="text-sm text-gray-600 mt-2">企画者: {project.organizer}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}