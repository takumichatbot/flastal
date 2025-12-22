'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiSearch, FiCrown, FiLayout, FiX, FiTrendingUp } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

/**
 * 成功企画テンプレート選択モーダル
 * デザイン刷新: 検索機能、グリッド表示、達成率バーなどを追加
 */
export default function SuccessTemplateModal({ onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // データ取得
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/successful-templates`);
        if (!res.ok) throw new Error('データの取得に失敗しました');
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        console.error(err);
        toast.error('テンプレートの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // 検索フィルタリング
  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.designSummary && t.designSummary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* 背景オーバーレイ */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all scale-100">
        
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiCrown className="text-yellow-300 text-2xl" /> 成功企画テンプレート
              </h2>
              <p className="text-sky-100 text-sm mt-1 opacity-90">
                過去の成功事例（達成率100%超）の構成をコピーして、企画作成をショートカットできます。
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* 検索バー */}
          <div className="mt-6 relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-200 group-focus-within:text-white transition-colors" />
            <input 
              type="text"
              placeholder="キーワードで検索 (例: 生誕祭, フラスタ, 楽屋花...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-sky-200/70 rounded-lg pl-10 pr-4 py-2.5 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* コンテンツエリア (スクロール) */}
        <div className="overflow-y-auto p-6 bg-slate-50 flex-grow scrollbar-thin scrollbar-thumb-slate-300">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
             </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
               <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                   <FiLayout className="text-3xl opacity-50" />
               </div>
               <p className="font-bold">テンプレートが見つかりませんでした。</p>
               <p className="text-xs mt-1">検索ワードを変えてお試しください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => {
                // 達成率計算 (例: 120%など)
                const rawPercentage = (template.totalPledged / template.totalTarget) * 100;
                const percentage = Math.min(rawPercentage, 100);
                
                return (
                  <div 
                    key={template.id} 
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 hover:border-sky-300 transition-all duration-300 group cursor-pointer flex flex-col h-full relative overflow-hidden"
                    onClick={() => onSelect(template)}
                  >
                    {/* 背景装飾 */}
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FiCrown size={60} className="text-sky-500 transform rotate-12"/>
                    </div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <FiTrendingUp /> SUCCESS
                        </span>
                    </div>

                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors relative z-10">
                        {template.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-grow relative z-10 leading-relaxed">
                        {template.designSummary || 'デザイン詳細なし'}
                    </p>

                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 mb-4 border border-slate-100 relative z-10">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">目標金額</span>
                            <span className="font-bold text-slate-700">{template.totalTarget.toLocaleString()} pt</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">達成額</span>
                            <span className="font-bold text-sky-600">{template.totalPledged.toLocaleString()} pt</span>
                        </div>
                        {/* プログレスバー */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-1.5 rounded-full"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <div className="text-right text-[10px] text-sky-600 font-bold">
                            達成率 {rawPercentage.toFixed(0)}%
                        </div>
                    </div>

                    <button 
                        className="w-full py-2.5 text-sm font-bold text-white bg-sky-500 rounded-lg shadow-md group-hover:bg-sky-600 group-hover:shadow-lg transition-all flex items-center justify-center gap-2 relative z-10"
                    >
                        <FiCheckCircle /> この構成を使う
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}