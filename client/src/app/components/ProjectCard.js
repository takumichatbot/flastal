'use client';

import Link from 'next/link';
import { useState } from 'react';
import ImageModal from './ImageModal';
import { FiUser, FiMapPin, FiClock, FiZoomIn, FiCheckCircle } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa'; // ハートアイコン用

export default function ProjectCard({ project }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // データガード
  if (!project || !project.id) return null;

  const collectedAmount = project.collectedAmount || 0;
  const targetAmount = project.targetAmount || 0;
  
  // 達成率 (最大100%に丸めない。100%超えも表現できるようにするが、バーは100で止める)
  const rawPercentage = targetAmount > 0 ? (collectedAmount / targetAmount) * 100 : 0;
  const progressPercentage = Math.min(rawPercentage, 100);

  // 画像拡大モーダルを開く（リンク遷移をキャンセル）
  const handleImageClick = (e) => {
    e.preventDefault();  // リンク遷移を防ぐ
    e.stopPropagation(); // 親要素へのイベント伝播を防ぐ
    setIsModalOpen(true);
  };

  // ステータスバッジのスタイル定義
  const getStatusBadge = (status) => {
    switch(status) {
        case 'FUNDRAISING': 
            return { label: '募集中', className: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-200' };
        case 'SUCCESSFUL': 
            return { label: '🎉 達成決定', className: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200' };
        case 'COMPLETED': 
            return { label: '💐 完了', className: 'bg-slate-500 text-white' };
        case 'CANCELED': 
            return { label: '中止', className: 'bg-red-500 text-white' };
        default: 
            return { label: status, className: 'bg-gray-400 text-white' };
    }
  };

  const statusObj = getStatusBadge(project.status);

  return (
    <>
      <Link href={`/projects/${project.id}`} className="block h-full group">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-pink-100 relative">
            
          {/* 画像エリア */}
          <div className="relative aspect-video bg-slate-100 overflow-hidden">
            {project.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={project.imageUrl} 
                alt={project.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                <span className="text-4xl">💐</span>
              </div>
            )}
            
            {/* ステータスバッジ (左上) */}
            <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full shadow-lg z-10 ${statusObj.className}`}>
                {statusObj.label}
            </div>

            {/* ズームボタン (ホバーで出現) */}
            {project.imageUrl && (
              <button
                onClick={handleImageClick}
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 group/btn"
                title="画像を拡大"
              >
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white transform transition-transform group-hover/btn:scale-110">
                    <FiZoomIn size={24} />
                </div>
              </button>
            )}
          </div>

          {/* コンテンツエリア */}
          <div className="p-5 flex flex-col flex-grow">
            
            {/* タイトル */}
            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
              {project.title}
            </h3>

            {/* 補足情報 (場所・日付など) */}
            <div className="flex flex-col gap-1 mb-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate">
                    <FiMapPin className="shrink-0 text-slate-400"/>
                    <span className="truncate">{project.deliveryAddress || '場所未定'}</span>
                </div>
                {project.deliveryDateTime && (
                    <div className="flex items-center gap-1.5 truncate">
                        <FiClock className="shrink-0 text-slate-400"/>
                        <span>{new Date(project.deliveryDateTime).toLocaleDateString()} お届け</span>
                    </div>
                )}
            </div>

            <div className="mt-auto">
                {/* 進捗バー */}
                <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl font-black text-slate-800">
                        {Math.floor(rawPercentage)}<span className="text-sm font-bold text-slate-500 ml-0.5">%</span>
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                        あと {(targetAmount - collectedAmount).toLocaleString()}pt
                    </span>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            rawPercentage >= 100 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-r from-pink-400 to-rose-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                {/* フッター (企画者情報) */}
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {project.planner?.iconUrl ? (
                             // eslint-disable-next-line @next/next/no-img-element
                            <img src={project.planner.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                                <FiUser />
                            </div>
                        )}
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">
                            {project.planner?.handleName || '企画者'}
                        </span>
                    </div>
                    
                    {/* いいね数など (あれば表示) */}
                    {/* <div className="flex items-center gap-1 text-xs text-slate-400">
                        <FaHeart className="text-pink-300" /> 12
                    </div> */}
                </div>
            </div>

          </div>
        </div>
      </Link>

      {isModalOpen && (
        <ImageModal 
            src={project.imageUrl} 
            alt={project.title}
            onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}