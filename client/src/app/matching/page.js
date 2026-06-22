'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Search, Filter, Plus, Loader2, Calendar, MapPin, User, Sparkles, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const GENRE_OPTIONS = [
  { value: '', label: 'すべてのジャンル' },
  { value: 'idol', label: 'アイドル' },
  { value: 'vtuber', label: 'VTuber' },
  { value: 'anime', label: 'アニメ・声優' },
  { value: 'stage', label: '舞台・2.5次元' },
  { value: 'voice', label: '声優' },
  { value: 'anniversary', label: '記念日' },
  { value: 'other', label: 'その他' },
];

const STATUS_LABEL = {
  FUNDRAISING: '募集中',
  PENDING_APPROVAL: '審査中',
  SUCCESSFUL: '目標達成',
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function ProjectCard({ project }) {
  const percent = Math.min(
    Math.round(((project.collectedAmount || 0) / (project.targetAmount || 1)) * 100),
    100
  );
  const currentMembers = project.pledges?.length || 0;
  const deliveryDate = project.deliveryDateTime
    ? new Date(project.deliveryDateTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
    : '未定';

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all active:scale-[0.98] overflow-hidden group">
        {/* サムネイル */}
        <div className="relative h-36 bg-gradient-to-br from-pink-100 to-rose-100 overflow-hidden">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Sparkles size={32} className="text-pink-300 mb-1" />
              <span className="text-xs font-bold text-pink-300">NO IMAGE</span>
            </div>
          )}
          {/* ステータスバッジ */}
          <div className="absolute top-2 right-2">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-black border',
              project.status === 'FUNDRAISING'
                ? 'bg-pink-50 text-pink-600 border-pink-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            )}>
              {STATUS_LABEL[project.status] || project.status}
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {/* ジャンル */}
          {project.event?.genre && (
            <span className="inline-block text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100 mb-2">
              {GENRE_OPTIONS.find(g => g.value === project.event.genre)?.label || project.event.genre}
            </span>
          )}

          {/* タイトル */}
          <h3 className="font-black text-slate-800 text-sm leading-snug mb-2 line-clamp-2">
            {project.title}
          </h3>

          {/* メタ情報 */}
          <div className="flex flex-col gap-1 mb-3">
            {project.venue?.venueName && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                <MapPin size={11} className="text-rose-400 shrink-0" />
                <span className="truncate">{project.venue.venueName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
              <Calendar size={11} className="text-pink-400 shrink-0" />
              <span>{deliveryDate}</span>
            </div>
          </div>

          {/* プランナー */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 overflow-hidden border border-white shadow-sm shrink-0 flex items-center justify-center">
                {project.planner?.iconUrl ? (
                  <img src={project.planner.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-pink-500" />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">
                {project.planner?.handleName || '主催者'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-black text-pink-500">
              <Users size={12} />
              <span>{currentMembers} 人参加中</span>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-400">達成率</span>
              <span className="text-[10px] font-black text-pink-500">{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-1000"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 参加申し込みボタン */}
        <div className="px-4 pb-4">
          <div className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 group-hover:brightness-105 transition-all">
            <Plus size={13} />
            参加を申し込む
            <ChevronRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MatchingPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('');
  const [keyword, setKeyword] = useState('');
  const [inputValue, setInputValue] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // まず専用APIを試みる、なければ通常のプロジェクト一覧APIにフォールバック
      let url = `${API_URL}/api/projects/matching-requests`;
      const params = new URLSearchParams();
      if (genre) params.set('genre', genre);
      if (keyword) params.set('keyword', keyword);
      const query = params.toString();

      let res = await fetch(`${url}${query ? `?${query}` : ''}`);

      if (!res.ok) {
        // フォールバック: 通常のプロジェクト一覧から募集中のものを取得
        const fallbackParams = new URLSearchParams({ status: 'FUNDRAISING', limit: '20' });
        if (genre) fallbackParams.set('genre', genre);
        if (keyword) fallbackParams.set('keyword', keyword);
        res = await fetch(`${API_URL}/api/projects?${fallbackParams.toString()}`);
      }

      if (!res.ok) throw new Error('データの取得に失敗しました');
      const data = await res.json();

      // レスポンス形式の正規化（配列 or { projects: [...] }）
      const list = Array.isArray(data) ? data : (data.projects || data.data || []);
      setProjects(list);
    } catch (err) {
      toast.error(err.message || '企画の取得に失敗しました');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, keyword]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(inputValue);
  };

  const handleClearKeyword = () => {
    setInputValue('');
    setKeyword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ヒーローヘッダー */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white py-12 px-4 text-center relative overflow-hidden">
        {/* 装飾 */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />

        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 transition-all"
          aria-label="戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
        </button>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest mb-4 border border-white/20">
            <Users size={12} />
            Matching
          </div>
          <h1 className="text-2xl font-black drop-shadow-sm">みんなで企画しよう</h1>
          <p className="text-pink-100 mt-2 text-sm font-bold leading-relaxed">
            同じ推しのファン同士でフラスタを作ろう
          </p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* キーワード検索 */}
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="企画名・アーティスト名で検索"
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:border-pink-400 focus:bg-white outline-none transition-all"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearKeyword}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </form>

          {/* ジャンルフィルター */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Filter size={13} className="text-slate-400 shrink-0" />
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGenre(g.value)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black border transition-all',
                  genre === g.value
                    ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-pink-200 hover:text-pink-500'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* マッチングリクエスト投稿ボタン */}
        <Link href="/projects/create">
          <div className="w-full mb-6 p-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl flex items-center gap-3 shadow-lg shadow-violet-200 hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 shrink-0">
              <Plus size={20} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm">マッチングリクエストを投稿</p>
              <p className="text-[11px] text-violet-100 font-bold mt-0.5">
                メンバー募集中の企画を作成しよう
              </p>
            </div>
            <ChevronRight size={18} className="text-white/70" />
          </div>
        </Link>

        {/* 件数表示 */}
        {!loading && (
          <p className="text-xs font-bold text-slate-400 mb-4">
            {projects.length > 0
              ? `${projects.length} 件の企画が募集中`
              : '現在募集中の企画はありません'}
          </p>
        )}

        {/* カードグリッド */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-pink-400" />
            <p className="text-sm font-bold text-slate-400">企画を探しています...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-100">
              <Users size={28} className="text-pink-300" />
            </div>
            <p className="text-base font-black text-slate-600 mb-2">企画が見つかりませんでした</p>
            <p className="text-sm font-bold text-slate-400 mb-6">
              {keyword || genre
                ? '条件を変えて再度お試しください'
                : '最初のマッチングリクエストを投稿してみましょう！'}
            </p>
            {(keyword || genre) && (
              <button
                onClick={() => { setGenre(''); setKeyword(''); setInputValue(''); }}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                フィルターをリセット
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
