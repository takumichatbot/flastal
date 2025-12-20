'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; // パスは環境に合わせて調整
import { FiSave, FiTrash2, FiArrowLeft, FiCalendar, FiMapPin, FiInfo, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OrganizerEventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 会場リスト（選択用）
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
        
        // 1. イベント詳細取得 (既存の公開APIを利用、編集画面なので本来は専用APIが良いが今回はこれで)
        const eventRes = await fetch(`${API_URL}/api/events/${id}`);
        if (!eventRes.ok) throw new Error('イベントが見つかりません');
        const eventJson = await eventRes.json();
        
        // 日付を input type="date" 用に変換 (YYYY-MM-DD)
        const dateObj = new Date(eventJson.eventDate);
        const formattedDate = dateObj.toISOString().split('T')[0];

        setEventData({
            ...eventJson,
            eventDate: formattedDate
        });

        // 2. 会場リスト取得
        const venueRes = await fetch(`${API_URL}/api/venues`);
        if (venueRes.ok) setVenues(await venueRes.json());

      } catch (error) {
        console.error(error);
        toast.error('データの読み込みに失敗しました');
        router.push('/organizers/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchData();
  }, [id, isAuthenticated, router]);

  // 更新処理
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: eventData.title,
            description: eventData.description,
            eventDate: eventData.eventDate,
            venueId: eventData.venueId,
            isStandAllowed: eventData.isStandAllowed,
            regulationNote: eventData.regulationNote
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      toast.success('イベント情報を更新しました');
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if(!window.confirm('本当にこのイベントを削除しますか？\n紐づく企画がある場合、削除できないことがあります。')) return;

    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    try {
        const res = await fetch(`${API_URL}/api/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('削除できませんでした');
        
        toast.success('イベントを削除しました');
        router.push('/organizers/dashboard');
    } catch (error) {
        toast.error(error.message);
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center">読み込み中...</div>;
  if (!isAuthenticated || user.role !== 'ORGANIZER') return <div className="p-10 text-center">権限がありません</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/organizers/dashboard" className="flex items-center text-gray-500 hover:text-gray-700 mb-6 w-fit">
            <FiArrowLeft className="mr-2"/> ダッシュボードへ戻る
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
                <h1 className="text-xl font-bold text-indigo-900">イベント詳細・編集</h1>
                <button 
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors flex items-center text-sm"
                >
                    <FiTrash2 className="mr-1"/> 削除する
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 左カラム: 編集フォーム */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <FiInfo className="mr-2"/> 基本情報
                    </h2>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">イベント名</label>
                            <input 
                                type="text"
                                value={eventData.title}
                                onChange={(e) => setEventData({...eventData, title: e.target.value})}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">開催日</label>
                            <input 
                                type="date"
                                value={eventData.eventDate}
                                onChange={(e) => setEventData({...eventData, eventDate: e.target.value})}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">会場</label>
                            <select 
                                value={eventData.venueId || ''}
                                onChange={(e) => setEventData({...eventData, venueId: e.target.value || null})}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="">会場未定 / その他</option>
                                {venues.map(v => (
                                    <option key={v.id} value={v.id}>{v.venueName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">イベント概要</label>
                            <textarea 
                                value={eventData.description || ''}
                                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                                className="w-full p-2 border rounded h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                            <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                <input 
                                    type="checkbox"
                                    checked={eventData.isStandAllowed}
                                    onChange={(e) => setEventData({...eventData, isStandAllowed: e.target.checked})}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="font-bold text-gray-800 text-sm">フラワースタンドを受け入れる</span>
                            </label>
                            
                            <label className="block text-xs font-bold text-gray-600 mb-1">レギュレーション・注意事項</label>
                            <textarea 
                                value={eventData.regulationNote || ''}
                                onChange={(e) => setEventData({...eventData, regulationNote: e.target.value})}
                                placeholder="例: 高さ180cm以下、底辺40cm×40cm以下、回収必須など"
                                className="w-full p-2 border rounded text-sm h-20 focus:ring-2 focus:ring-yellow-500 outline-none"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex justify-center items-center"
                        >
                            {saving ? '保存中...' : <><FiSave className="mr-2"/> 変更を保存</>}
                        </button>
                    </form>
                </div>

                {/* 右カラム: 紐づいている企画リスト */}
                <div className="border-l pl-0 md:pl-8 border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <FiCheckCircle className="mr-2 text-green-500"/> 申請されたフラスタ企画
                    </h2>
                    
                    {eventData.projects && eventData.projects.length > 0 ? (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {eventData.projects.map(project => (
                                <Link key={project.id} href={`/projects/${project.id}`} target="_blank">
                                    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            {project.planner?.iconUrl ? (
                                                <img src={project.planner.iconUrl} alt="" className="w-8 h-8 rounded-full object-cover"/>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                            )}
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                                                    {project.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    主催: {project.planner?.handleName || '退会ユーザー'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-400 text-sm">
                            <p>まだこのイベントに向けた企画はありません。</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}