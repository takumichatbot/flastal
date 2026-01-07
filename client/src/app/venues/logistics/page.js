'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiTruck, FiMapPin, FiClock, FiPlus, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueLogisticsPage() {
  const { user, authenticatedFetch } = useAuth();
  const [logistics, setLogistics] = useState([]);
  const [newInfo, setNewInfo] = useState({ title: '', description: '' });

  const fetchLogistics = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/venues/${user.id}/logistics`);
      const data = await res.json();
      setLogistics(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchLogistics(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${user.id}/logistics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInfo)
      });
      if (res.ok) {
        toast.success('情報を追加しました');
        setNewInfo({ title: '', description: '' });
        fetchLogistics();
      }
    } catch (e) { toast.error('追加に失敗しました'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/venues/dashboard" className="flex items-center text-sm font-bold text-slate-500 mb-6 hover:text-indigo-600 transition-colors">
          <FiArrowLeft className="mr-2"/> ダッシュボードに戻る
        </Link>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
             <h1 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
               <FiTruck className="text-indigo-500"/> 搬入・物流設定
             </h1>
             <p className="text-sm text-slate-500 leading-relaxed">
               お花屋さん向けの情報を登録します。搬入口の詳しい場所や、駐車場所などを共有することで当日の混乱を防げます。
             </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">新しい情報の追加</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <input type="text" placeholder="タイトル (例: 裏口搬入口の場所)" value={newInfo.title} onChange={e => setNewInfo({...newInfo, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
                <textarea placeholder="詳細な説明..." value={newInfo.description} onChange={e => setNewInfo({...newInfo, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px] outline-none" required />
                <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                  <FiPlus /> 情報を公開する
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 px-2">登録済みの情報</h3>
              {logistics.map(info => (
                <div key={info.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">{info.title}</h4>
                    <p className="text-sm text-slate-500 whitespace-pre-wrap">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}