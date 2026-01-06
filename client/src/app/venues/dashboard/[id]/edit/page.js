'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiMapPin, FiInfo, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    accessInfo: '',
    isStandAllowed: true,
    isBowlAllowed: true,
    retrievalRequired: true
  });

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/venues/${id}`);
        if (!response.ok) throw new Error('データ取得失敗');
        const data = await response.json();
        setFormData({
          venueName: data.venueName || '',
          address: data.address || '',
          accessInfo: data.accessInfo || '',
          isStandAllowed: data.isStandAllowed ?? true,
          isBowlAllowed: data.isBowlAllowed ?? true,
          retrievalRequired: data.retrievalRequired ?? true
        });
      } catch (error) {
        toast.error('会場情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVenueData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('flastal-token');

    try {
      const response = await fetch(`${API_URL}/api/venues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || '更新に失敗しました');
      }

      toast.success('会場情報を更新しました！');
      router.push(`/venues/dashboard/${id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <Link href={`/venues/dashboard/${id}`} className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6 font-bold transition">
          <FiArrowLeft className="mr-2" /> ダッシュボードへ戻る
        </Link>

        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white">
            <h1 className="text-2xl font-black">会場情報の編集</h1>
            <p className="text-indigo-100 text-sm mt-1">最新のレギュレーションをファンに届けましょう</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">会場名</label>
              <input
                type="text"
                required
                value={formData.venueName}
                onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">住所</label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">搬入・受取に関する補足情報</label>
              <textarea
                rows="4"
                value={formData.accessInfo}
                onChange={(e) => setFormData({...formData, accessInfo: e.target.value})}
                placeholder="例：搬入口は建物北側です。回収は翌日午前中までにお願いします。"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">スタンド花の受入</span>
                <input
                  type="checkbox"
                  checked={formData.isStandAllowed}
                  onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})}
                  className="w-5 h-5 accent-indigo-600"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">楽屋花（籠花）の受入</span>
                <input
                  type="checkbox"
                  checked={formData.isBowlAllowed}
                  onChange={(e) => setFormData({...formData, isBowlAllowed: e.target.checked})}
                  className="w-5 h-5 accent-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${saving ? 'opacity-70' : ''}`}
            >
              {saving ? '保存中...' : <><FiSave /> 設定を保存する</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}