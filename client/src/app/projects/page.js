'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '../components/ProjectCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
        alert('企画データの読み込みに失敗しました。');
      } 
      finally { setLoading(false); }
    };
    fetchProjects();
  }, []);

  return (
    <div>
      <main>
        <div className="relative w-full bg-white min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-sky-100/50 -z-10"></div>
          
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900">みんなの企画</h1>
              <Link href="/projects/create">
                <span className="rounded-full bg-sky-500 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-sky-600 transition-all transform hover:scale-105">
                  企画を作成する
                </span>
              </Link>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-16">読み込み中...</p>
            ) : projects.length === 0 ? (
               <div className="text-center py-16 bg-white/50 rounded-2xl">
                  <p className="text-gray-500">まだ企画がありません。</p>
                  <p className="mt-2 text-gray-600">最初の企画を作成してみましょう！</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}