'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import ProjectCard from './ProjectCard';
import SkeletonCard from './SkeletonCard'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// アニメーション設定
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  },
};

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true); 
      try {
        const res = await fetch(`${API_URL}/api/projects/featured`);
        if(res.ok) {
          const data = await res.json();
          setProjects(Array.isArray(data) ? data : []); 
        } else {
            console.error("Failed to fetch featured projects");
            setProjects([]); 
        }
      } catch (error) {
        console.error("Error:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // --- ローディング表示 ---
  if (loading) {
    return (
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center mb-16 space-y-4">
             <div className="h-8 w-64 bg-slate-200 rounded-full animate-pulse" />
             <div className="h-4 w-96 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  // データがない場合は非表示
  if (projects.length === 0) {
    return null; 
  }

  // --- メイン表示 ---
  return (
    <section className="relative py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      
      {/* 背景装飾 (動く丸) */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-10 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-40 pointer-events-none"
      />
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 w-80 h-80 bg-pink-100 rounded-full blur-3xl opacity-40 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* ヘッダー */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-pink-600 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <TrendingUp size={14} />
            Trending Now
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black text-slate-800 flex items-center justify-center gap-3"
          >
            <Sparkles className="text-yellow-400 fill-yellow-400" />
            注目の企画
            <Sparkles className="text-yellow-400 fill-yellow-400" />
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-500 font-medium"
          >
            いま多くのファンが参加している、熱い企画をピックアップ！
          </motion.p>
        </div>

        {/* 企画グリッド */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {projects.map(project => (
            project && project.id ? (
              <motion.div key={project.id} variants={itemVariants} className="h-full">
                <ProjectCard project={project} />
              </motion.div>
            ) : null
          ))}
        </motion.div>

        {/* もっと見るボタン */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link href="/projects">
            <button className="group inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-100 rounded-full text-slate-600 font-bold hover:border-pink-200 hover:text-pink-500 hover:shadow-lg transition-all duration-300">
              すべての企画を見る
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}