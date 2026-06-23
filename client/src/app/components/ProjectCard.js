'use client';

import Link from 'next/link';
import { useState } from 'react';
import ImageModal from './ImageModal';
import ImageWithFallback from './ImageWithFallback';
import { MapPin, Clock, ZoomIn, TrendingUp } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

// 達成確率スコア算出
function calcSuccessProbability(project) {
  const { collectedAmount, targetAmount, createdAt, deadline, status } = project;
  if (status !== 'FUNDRAISING' || !targetAmount || !createdAt) return null;
  const progress = collectedAmount / targetAmount;
  if (progress >= 1) return 100;

  const now = Date.now();
  const start = new Date(createdAt).getTime();
  const end = deadline ? new Date(deadline).getTime() : start + 30 * 86400000;
  const total = end - start;
  const elapsed = now - start;
  const remaining = end - now;
  if (remaining <= 0 || total <= 0) return Math.min(100, Math.round(progress * 100));

  const elapsedFrac = elapsed / total;
  // 経過時間比に対して進捗がどれだけ進んでいるか（ペース係数）
  const paceRatio = elapsedFrac > 0 ? progress / elapsedFrac : 0;
  // 残り時間で必要な残達成量をペース係数で割り算して確率推定
  const projectedFinal = progress + paceRatio * (1 - elapsedFrac);
  const raw = Math.min(projectedFinal, 1.5) / 1.5; // 150%超は確実とみなす
  return Math.round(raw * 100);
}

function SuccessBadge({ probability }) {
  if (probability === null) return null;
  const { text, cls } =
    probability >= 80 ? { text: `達成確率 ${probability}%`, cls: 'bg-emerald-500 text-white' } :
    probability >= 50 ? { text: `達成確率 ${probability}%`, cls: 'bg-amber-400 text-white' } :
                        { text: `達成確率 ${probability}%`, cls: 'bg-slate-300 text-slate-700' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cls}`}>
      <TrendingUp size={9} /> {text}
    </span>
  );
}

export default function ProjectCard({ project }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!project || !project.id) return null;

  const collectedAmount = project.collectedAmount || 0;
  const targetAmount = project.targetAmount || 0;

  const rawPercentage = targetAmount > 0 ? (collectedAmount / targetAmount) * 100 : 0;
  const progressPercentage = Math.min(rawPercentage, 100);
  const successProbability = calcSuccessProbability(project);

  const handleImageClick = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    // ... (既存のロジックそのまま) ...
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
            
            {/* ★修正: ImageWithFallback を使用 */}
            <ImageWithFallback
                src={project.imageUrl}
                alt={project.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* ステータスバッジ */}
            <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full shadow-lg z-10 ${statusObj.className}`}>
                {statusObj.label}
            </div>

            {/* ズームボタン (画像がある場合のみ) */}
            {project.imageUrl && (
              <button
                onClick={handleImageClick}
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 group/btn"
                title="画像を拡大"
              >
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white transform transition-transform group-hover/btn:scale-110">
                    <ZoomIn size={24} />
                </div>
              </button>
            )}
          </div>

          {/* コンテンツエリア (以下変更なし) */}
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-base font-black text-slate-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors leading-snug">
              {project.title}
            </h3>
            
            {/* ... (中略: 住所や日付など) ... */}
            
             <div className="flex flex-col gap-1 mb-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="shrink-0 text-slate-400"/>
                    <span className="truncate">{project.deliveryAddress || '場所未定'}</span>
                </div>
                {project.deliveryDateTime && (
                    <div className="flex items-center gap-1.5 truncate">
                        <Clock size={12} className="shrink-0 text-slate-400"/>
                        <span>{new Date(project.deliveryDateTime).toLocaleDateString()} お届け</span>
                    </div>
                )}
            </div>

            <div className="mt-auto">
                {successProbability !== null && (
                  <div className="mb-2">
                    <SuccessBadge probability={successProbability} />
                  </div>
                )}
                <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl font-black text-slate-800">
                        {Math.floor(rawPercentage)}<span className="text-sm font-bold text-slate-500 ml-0.5">%</span>
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                        残り ¥{(targetAmount - collectedAmount).toLocaleString()}
                    </span>
                </div>
                
                <ProgressBar value={rawPercentage} className="mb-4" />

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 shrink-0">
                           {/* アイコンもフォールバック対応 */}
                           <ImageWithFallback 
                              src={project.planner?.iconUrl} 
                              alt="Planner" 
                              width={20} 
                              height={20} 
                              fallbackText="" // アイコンなのでテキストなし
                              className="object-cover"
                           />
                        </div>
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">
                            {project.planner?.handleName || '企画者'}
                        </span>
                    </div>
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