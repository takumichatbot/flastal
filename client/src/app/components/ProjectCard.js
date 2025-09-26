'use client';
import Link from 'next/link';
import { useState } from 'react';
import ImageModal from './ImageModal';

export default function ProjectCard({ project }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const progressPercentage = project.targetAmount > 0 
    ? (project.collectedAmount / project.targetAmount) * 100 
    : 0;

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <Link href={`/projects/${project.id}`}>
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-sky-200/50 hover:-translate-y-2 cursor-pointer">
          <div className="bg-gradient-to-br from-sky-100 to-indigo-200 h-48 flex items-center justify-center relative">
            {project.imageUrl ? (
              <img src={project.imageUrl} alt={project.title} className="w-full h-full object-contain"/>
            ) : (
              <span className="text-slate-400">画像がありません</span>
            )}
            {project.imageUrl && (
              <div 
                onClick={handleImageClick} 
                className="absolute inset-0 bg-transparent group-hover:bg-black/40 flex items-center justify-center transition-colors duration-300"
              >
                <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            )}
            {project.status === 'SUCCESSFUL' && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                🎉 達成！
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-sky-600 transition-colors mb-2 truncate">
              {project.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                企画者: {project.planner?.handleName || '読み込み中...'}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-2 rounded-full" 
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="font-bold text-sky-600">{Math.floor(progressPercentage)}%</span>
              <span className="text-gray-500">{project.collectedAmount.toLocaleString()} pt</span>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-auto">
              <p className="text-xs text-gray-500">目標: {project.targetAmount.toLocaleString()} pt</p>
            </div>
          </div>
        </div>
      </Link>
      {isModalOpen && <ImageModal src={project.imageUrl} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}