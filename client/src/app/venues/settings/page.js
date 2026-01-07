'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiInfo, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueSettingsPage() {
  const { user, isAuthenticated, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    isStandAllowed: true,
    isBowlAllowed: true,
    standRegulation: '',
    bowlRegulation: '',
    retrievalRequired: true
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'VENUE') return;
    
    // 自分の会場情報を取得
    fetch(`${API_URL}/api/venues/${user.id}`)
      .then(res => res.json())
      .then(data => setFormData(data))
      .catch(() => toast.error('情報の読み込みに失敗しました'));
  }, [user, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`${API_URL}/api/venues/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('設定を保存しました');
        router.push('/venues/dashboard');
      }
    } catch (error) {
      toast.error('保存に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/venues/dashboard" className="flex items-center text-sm font-bold text-slate-500 mb-6 hover:text-indigo-600 transition-colors">
          <FiArrowLeft className="mr-2"/> ダッシュボードに戻る
        </Link>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-2xl font-black text-slate-800">会場設定・レギュレーション</h1>
            <p className="text-sm text-slate-500 mt-2">ファンやお花屋さんが参照する公式ルールを設定します。</p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={formData.isStandAllowed} onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})} className="w-5 h-5 mr-3 text-indigo-600 rounded" />
                <span className="font-bold text-slate-700">スタンド花 受入許可</span>
              </label>
              <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={formData.isBowlAllowed} onChange={(e) => setFormData({...formData, isBowlAllowed: e.target.checked})} className="w-5 h-5 mr-3 text-indigo-600 rounded" />
                <span className="font-bold text-slate-700">楽屋花 受入許可</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">スタンド花の規定 (サイズ・時間など)</label>
              <textarea value={formData.standRegulation} onChange={(e) => setFormData({...formData, standRegulation: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500" placeholder="例: 高さ180cmまで、当日10時〜12時着指定" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">回収ルール</label>
              <select value={formData.retrievalRequired} onChange={(e) => setFormData({...formData, retrievalRequired: e.target.value === 'true'})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="true">回収必須 (お花屋さんが持ち帰る)</option>
                <option value="false">会場側で処分可能</option>
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
              <FiSave /> 設定を保存する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}