'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import { 
  FiSave, FiTrash2, FiArrowLeft, FiCalendar, FiMapPin, 
  FiInfo, FiCheckCircle, FiUsers, FiExternalLink, FiAlertCircle, FiImage
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const ProjectStatusBadge = ({ status }) => {
    const styles = {
        'PLANNING': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '企画中' },
        'FUNDRAISING': { bg: 'bg-green-100', text: 'text-green-700', label: '募集中' },
        'CLOSED': { bg: 'bg-gray-100', text: 'text-gray-600', label: '終了' },
        'COMPLETED': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '完了' },
    };
    const current = styles[status] || styles['PLANNING'];
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${current.bg} ${current.text}`}>
            {current.label}
        </span>
    );
};

export default function OrganizerEventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState([]);

  const fetchData = useCallback(async () => {
      try {
        const eventRes = await fetch(`${API_URL}/api/events/${id}`);
        if (!eventRes.ok) throw new Error('イベントが見つかりません');
        const eventJson = await eventRes.json();
        
        const dateObj = new Date(eventJson.eventDate);
        const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : '';

        setEventData({
            ...eventJson,
            eventDate: formattedDate
        });

        const venueRes = await fetch(`${API_URL}/api/venues`);
        if (venueRes.ok) setVenues(await venueRes.json());

      } catch (error) {
        console.error(error);
        toast.error('データの読み込みに失敗しました');
        router.push('/organizers/dashboard');
      } finally {
        setLoading(false);
      }
  }, [id, router]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

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

  const handleDelete = async () => {
    if(!window.confirm('本当に削除しますか？この操作は取り消せません。')) return;

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

  if (authLoading || loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
  }

  if (!isAuthenticated || user.role !== 'ORGANIZER') return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
            <Link href="/organizers/dashboard" className="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <FiArrowLeft className="mr-2"/> ダッシュボードへ戻る
            </Link>
            
            <button 
                onClick={handleDelete}
                className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg transition-all text-sm font-bold flex items-center"
            >
                <FiTrash2 className="mr-2"/> イベントを削除
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                        <h1 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <FiInfo className="text-indigo-600"/> イベント情報の編集
                        </h1>
                        <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded font-bold">ID: {id.slice(0, 8)}...</span>
                    </div>

                    <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-6">
                        {/* 画像プレビューセクションを追加 */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <FiImage className="text-indigo-500" /> 現在のメイン画像
                            </label>
                            <div className="aspect-video w-full max-w-md bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
                                {eventData.imageUrl ? (
                                    <img src={eventData.imageUrl} alt="Main" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                        <FiImage size={48} className="mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-widest">No Image Attached</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">イベント名 <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    value={eventData.title}
                                    onChange={(e) => setEventData({...eventData, title: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-bold text-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">開催日 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <FiCalendar className="absolute top-3.5 left-3 text-gray-400 pointer-events-none"/>
                                    <input 
                                        type="date"
                                        value={eventData.eventDate}
                                        onChange={(e) => setEventData({...eventData, eventDate: e.target.value})}
                                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">開催会場</label>
                            <div className="relative">
                                <FiMapPin className="absolute top-3.5 left-3 text-gray-400 pointer-events-none"/>
                                <select 
                                    value={eventData.venueId || ''}
                                    onChange={(e) => setEventData({...eventData, venueId: e.target.value || null})}
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">会場未定 / その他</option>
                                    {venues.map(v => (
                                        <option key={v.id} value={v.id}>{v.venueName}</option>
                                    ))}
                                </select>
                                <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            {eventData.venueId && (
                                <Link href={`/venues/${eventData.venueId}`} target="_blank" className="text-xs text-indigo-600 hover:underline mt-2 inline-flex items-center">
                                    <FiExternalLink className="mr-1"/> 会場ページを確認する
                                </Link>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">イベント概要</label>
                            <textarea 
                                value={eventData.description || ''}
                                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                                placeholder="出演者やタイムテーブルなど、参加者に伝えたい情報を入力してください"
                            />
                        </div>

                        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
                            <h3 className="font-bold text-yellow-800 mb-3 flex items-center">
                                <FiAlertCircle className="mr-2"/> フラスタ受付設定
                            </h3>
                            
                            <label className="flex items-center p-3 bg-white rounded-lg border border-yellow-100 cursor-pointer hover:border-yellow-300 transition-colors mb-4 shadow-sm">
                                <input 
                                    type="checkbox"
                                    checked={eventData.isStandAllowed}
                                    onChange={(e) => setEventData({...eventData, isStandAllowed: e.target.checked})}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 mr-3"
                                />
                                <span className="font-bold text-gray-800">フラワースタンドを受け入れる</span>
                            </label>
                            
                            <label className="block text-xs font-bold text-gray-600 mb-2">レギュレーション・注意事項 (ファン向け)</label>
                            <textarea 
                                value={eventData.regulationNote || ''}
                                onChange={(e) => setEventData({...eventData, regulationNote: e.target.value})}
                                placeholder="【サイズ規定】高さ180cm以下、底辺40cm×40cm以下&#13;&#10;【搬入時間】当日午前中指定&#13;&#10;【回収】必須 (公演終了後〜翌日午前中)"
                                className="w-full p-3 border border-yellow-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex justify-center items-center transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div> 保存中...</>
                                ) : (
                                    <><FiSave className="mr-2 text-xl"/> 変更内容を保存する</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                    <div className="bg-green-50 px-5 py-4 border-b border-green-100">
                        <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
                            <FiCheckCircle className="text-green-600"/> 申請された企画
                        </h2>
                        <p className="text-xs text-green-700 mt-1">
                            このイベントに対して作成されたフラスタ企画の一覧です。
                        </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50/50 min-h-[300px] max-h-[calc(100vh-200px)] overflow-y-auto">
                        {eventData.projects && eventData.projects.length > 0 ? (
                            <div className="space-y-3">
                                {eventData.projects.map(project => (
                                    <Link key={project.id} href={`/projects/${project.id}`} target="_blank" className="block group">
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <ProjectStatusBadge status={project.status || 'PLANNING'} />
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                {project.title}
                                            </h3>
                                            
                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                                                {project.planner?.iconUrl ? (
                                                    <img src={project.planner.iconUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-100"/>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px]"><FiUsers/></div>
                                                )}
                                                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                                    {project.planner?.handleName || '退会ユーザー'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-white">
                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                    <FiUsers size={24} className="text-gray-300"/>
                                </div>
                                <p>まだ企画はありません</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-gray-50 text-center border-t border-gray-200">
                        <span className="text-xs text-gray-500 font-bold">Total: {eventData.projects?.length || 0} 件</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}