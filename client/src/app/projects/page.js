'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ★ Heartアイコンを追加！
import {
  Search, MapPin, Calendar, Loader2, Filter,
  PlusCircle, Sparkles, Heart
} from 'lucide-react';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// ==========================================
// 🎨 ANIMATION & MAGIC UI COMPONENTS
// ==========================================

const PROJECTS_PARTICLES = Array.from({ length: 12 }, () => ({
  xRatio: Math.random(),
  yRatio: Math.random(),
  dy: -(Math.random() * 200 + 50),
  dx: (Math.random() - 0.5) * 100,
  duration: Math.random() * 10 + 15,
}));

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {PROJECTS_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{ x: p.xRatio * windowSize.width, y: p.yRatio * windowSize.height }}
          animate={{
            y: [null, p.dy],
            x: [null, p.dx],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, type: "spring", bounce: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(244,114,182,0.1)] rounded-[2.5rem]", className)}>
    {children}
  </div>
);

// ==========================================
// 💡 メインのコンテンツコンポーネント
// ==========================================
function ProjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticatedFetch, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');

  const fetchProjects = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      const currentKeyword = searchParams.get('keyword');
      const currentPrefecture = searchParams.get('prefecture');

      if (currentKeyword) params.append('keyword', currentKeyword);
      if (currentPrefecture) params.append('prefecture', currentPrefecture);
      
      const queryString = params.toString();
      const fetchPath = queryString ? `/projects?${queryString}&t=${Date.now()}` : `/projects?t=${Date.now()}`;

      const res = await authenticatedFetch(fetchPath);
      
      if (!res || !res.ok) {
        throw new Error(`Fetch failed with status: ${res?.status}`);
      }
      
      const data = await res.json();
      let projectsArray = Array.isArray(data) ? data : (data?.projects || []);
      
      projectsArray = projectsArray.filter(project => {
        const isHidden = project.visibility === 'UNLISTED' || project.status === 'REJECTED' || project.status === 'CANCELED';
        return !isHidden;
      });

      setProjects(projectsArray);
      
      if (projectsArray.length === 0 && (currentKeyword || currentPrefecture)) {
        toast('条件に一致する企画はありませんでした', { icon: '🔍' });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('通信エラーが発生しました。再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  }, [searchParams, authenticatedFetch, authLoading]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (keyword.trim()) params.set('keyword', keyword);
    else params.delete('keyword');
    if (prefecture) params.set('prefecture', prefecture);
    else params.delete('prefecture');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-gradient-to-br from-pink-50/80 to-rose-50/80 min-h-screen font-sans text-slate-800 relative overflow-hidden pb-24">
      <FloatingParticles />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-rose-100/30 rounded-full blur-[100px] -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10">
        
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 md:mb-12 gap-6 text-center md:text-left">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm border border-pink-100 mb-4 text-pink-500 rotate-3">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">みんなの企画を探す</h1>
              <p className="text-slate-500 font-bold text-sm md:text-base">現在進行中のフラスタ企画を見つけて応援しよう🌸</p>
            </div>
            
            <Link href="/projects/create">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-full shadow-xl shadow-pink-200 transition-all gap-2 w-full md:w-auto justify-center"
              >
                <PlusCircle size={20} /> 自分で企画を立てる
              </motion.button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <GlassCard className="p-6 md:p-8 mb-12">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              
              <div className="md:col-span-6">
                <label className="block text-[10px] md:text-xs font-black text-slate-500 mb-2 uppercase tracking-widest pl-2">Keyword</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="企画名、グループ名、イベント名..."
                    className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  />
                </div>
              </div>
              
              <div className="md:col-span-4">
                <label className="block text-[10px] md:text-xs font-black text-slate-500 mb-2 uppercase tracking-widest pl-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <select
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none appearance-none cursor-pointer transition-all font-bold text-slate-700"
                  >
                    <option value="">すべての都道府県</option>
                    {PREFECTURES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Filter size={16} />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:brightness-105"
                >
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <><Search size={18}/> 検索</>}
                </motion.button>
              </div>
            </form>
          </GlassCard>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
             {[...Array(8)].map((_, i) => (
                 <div key={i} className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] h-[400px] shadow-sm border border-white animate-pulse overflow-hidden p-4">
                     <div className="h-48 bg-slate-200/50 rounded-[2rem]"></div>
                     <div className="p-4 mt-2 space-y-4">
                         <div className="h-5 bg-slate-200/50 rounded-full w-3/4"></div>
                         <div className="h-4 bg-slate-200/50 rounded-full w-1/2"></div>
                         <div className="pt-4 mt-auto">
                            <div className="h-3 bg-slate-200/50 rounded-full w-full"></div>
                         </div>
                     </div>
                 </div>
             ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            <AnimatePresence>
              {projects.map((project, i) => {
                const percent = Math.min(Math.round(((project.collectedAmount || 0) / (project.targetAmount || 1)) * 100), 100);
                const isSuccess = percent >= 100;
                
                let badgeLabel = isSuccess ? 'SUCCESS!' : '募集中';
                let badgeClass = isSuccess ? 'bg-emerald-500/90 border-emerald-400' : 'bg-pink-500/90 border-pink-400';

                return (
                  <Reveal key={project.id} delay={i * 0.05} className="h-full">
                    <div onClick={() => router.push(`/projects/${project.id}`)} className="group h-full block cursor-pointer">
                      
                      <GlassCard className="!p-4 sm:!p-5 h-full flex flex-col transition-all duration-500 overflow-hidden bg-white hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(244,114,182,0.15)] group-hover:border-pink-200">
                        
                        <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 shrink-0">
                          {project.imageUrl ? (
                            <Image 
                              src={project.imageUrl} alt={project.title} fill 
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-4xl">💐</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                          <div className="absolute top-4 left-4">
                              <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black shadow-md border backdrop-blur-md text-white uppercase tracking-widest", badgeClass)}>
                                  {badgeLabel}
                              </span>
                          </div>
                        </div>

                        <div className="pt-5 flex flex-col flex-grow px-2">
                          <h2 className="text-base font-bold transition-colors line-clamp-2 mb-4 leading-snug text-slate-800 group-hover:text-pink-500">
                              <JpText>{project.title}</JpText>
                          </h2>
                          
                          <div className="space-y-2 mb-4">
                              {project.deliveryDateTime && (
                                  <p className="text-[11px] font-bold text-slate-500 flex items-center">
                                      <Calendar className="mr-1.5 shrink-0 text-pink-400" size={14}/> 
                                      {new Date(project.deliveryDateTime).toLocaleDateString()}
                                  </p>
                              )}
                              <p className="text-[11px] font-bold text-slate-500 flex items-center truncate">
                                  <MapPin className="mr-1.5 shrink-0 text-rose-400" size={14}/>
                                  <span className="truncate">{project.venue?.venueName || project.deliveryAddress || '場所未定'}</span>
                              </p>
                          </div>

                          <div className="mt-auto pt-4 border-t border-slate-100/50">
                              <div className="flex justify-between items-end mb-2">
                                  <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current</p>
                                    <p className="text-base font-black leading-none text-slate-800">
                                      ¥{(project.collectedAmount || 0).toLocaleString()}
                                      <span className="text-[9px] text-slate-400 font-medium ml-1">/ ¥{(project.targetAmount || 0).toLocaleString()}</span>
                                    </p>
                                  </div>
                                  <span className={cn("text-xl font-black font-mono leading-none", isSuccess ? "text-emerald-500" : "text-pink-500")}>
                                    {percent}%
                                  </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner mb-3">
                                  <motion.div 
                                      initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1 }}
                                      className={cn("h-full rounded-full", isSuccess ? "bg-emerald-400" : "bg-gradient-to-r from-pink-400 to-rose-400")} 
                                  />
                              </div>

                              {project.status === 'FUNDRAISING' && (
                                  <div className="pt-3 border-t border-slate-100 border-dashed relative z-20">
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              router.push(`/projects/${project.id}#pledge-section`);
                                          }}
                                          className="w-full py-2.5 bg-pink-50 hover:bg-pink-500 text-pink-600 hover:text-white rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5"
                                      >
                                          <Heart size={14} className="fill-current" />
                                          支援する (1口 ¥{(project.minContributionAmount || 1000).toLocaleString()}〜)
                                      </button>
                                  </div>
                              )}
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  </Reveal>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-md rounded-[3rem] border border-white text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300 shadow-inner">
                  <Search size={36}/>
              </div>
              <p className="text-xl font-black text-slate-800 mb-2">企画が見つかりませんでした</p>
              <p className="text-sm font-bold text-slate-500 mb-8">条件を変更するか、新しい企画を立ち上げてみませんか？🌸</p>
              <Link href="/projects/create">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-full shadow-lg shadow-pink-200 flex items-center gap-2">
                    <PlusCircle size={18}/> 企画を作成する
                  </motion.button>
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 👑 ROOT EXPORT (Suspense Wrapper)
// ==========================================
export default function ProjectsPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-pink-50/30">
            <Loader2 className="animate-spin text-pink-500 w-12 h-12" />
        </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}