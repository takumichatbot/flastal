"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { FiActivity, FiGift, FiTruck, FiCheckCircle, FiTrendingUp, FiInfo } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const INITIAL_LOGS = [
  { id: 'init-1', type: 'info', text: 'FLASTALへようこそ！推しにフラスタを贈ろう💐', href: '/projects' },
  { id: 'init-2', type: 'new', text: '現在、多数の企画が進行中です✨', href: '/projects' },
];

export default function LiveTicker() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      console.log('Ticker connected to socket');
    });

    socket.on('publicTickerUpdate', (newLog) => {
      setLogs((prevLogs) => {
        const updated = [newLog, ...prevLogs].slice(0, 20);
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (logs.length === 0) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % logs.length);
        setIsAnimating(false);
      }, 500); 
    }, 5000); 

    return () => clearInterval(interval);
  }, [logs.length]);

  const currentLog = logs[currentIndex] || logs[0];

  const getLogStyle = (type) => {
    switch(type) {
      case 'pledge': return { icon: <FiGift />, color: 'text-pink-400', label: '支援' };
      case 'goal': return { icon: <FiTrendingUp />, color: 'text-orange-400', label: '達成' };
      case 'production': return { icon: <FiCheckCircle />, color: 'text-green-400', label: '進捗' };
      case 'delivery': return { icon: <FiTruck />, color: 'text-sky-400', label: '納品' };
      case 'new': return { icon: <FiActivity />, color: 'text-yellow-400', label: '新着' };
      default: return { icon: <FiInfo />, color: 'text-gray-400', label: '情報' };
    }
  };

  const style = getLogStyle(currentLog?.type);

  return (
    // ★ 変更点: fixed top-0 left-0 right-0 z-[110] を追加し、一番上に固定
    <div className="fixed top-0 left-0 right-0 z-[110] bg-slate-900 border-b border-slate-800 h-10 w-full overflow-hidden shadow-sm m-0 p-0 block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        <div className="flex items-center gap-4 flex-1 min-w-0 h-full">
          <div className="flex items-center gap-2 shrink-0 bg-slate-800 py-1 px-2 rounded-full h-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-300 leading-none">LIVE</span>
          </div>

          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <Link 
                href={currentLog?.href || '#'}
                className={`flex items-center gap-3 text-xs sm:text-sm text-slate-200 hover:text-white hover:underline transition-all duration-500 transform w-full truncate cursor-pointer ${
                    isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
            >
                <span className={`flex items-center gap-1 font-bold ${style.color} shrink-0`}>
                    {style.icon}
                    <span className="hidden sm:inline text-[10px] border border-current px-1 rounded uppercase opacity-80">{style.label}</span>
                </span>
                <span className="truncate">{currentLog?.text}</span>
            </Link>
          </div>
        </div>

        <div className="hidden md:flex shrink-0 ml-4 border-l border-slate-700 pl-4 h-4 items-center">
            <Link href="/projects" className="text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                View All <FiTrendingUp />
            </Link>
        </div>

      </div>
    </div>
  );
}