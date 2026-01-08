'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; 
import { 
  FiSave, FiTrash2, FiArrowLeft, FiCalendar, FiMapPin, 
  FiInfo, FiCheckCircle, FiUsers, FiExternalLink, FiAlertCircle, 
  FiImage, FiPlus, FiX, FiUpload, FiLoader, FiTwitter, FiInstagram, FiGlobe, FiMega, FiStar, FiEdit3
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
  const { user, isAuthenticated, loading: authLoading, authenticatedFetch } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
      try {
        const eventRes = await fetch(`${API_URL}/api/events/${id}`);
        if (!eventRes.ok) throw new Error('イベントが見つかりません');
        const eventJson = await eventRes.json();
        
        const dateObj = new Date(eventJson.eventDate);
        const formattedDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : '';

        setEventData({
            ...eventJson,
            eventDate: formattedDate,
            imageUrls: eventJson.imageUrls || [],
            twitterUrl: eventJson.twitterUrl || '',
            instagramUrl: eventJson.instagramUrl || '',
            officialWebsite: eventJson.officialWebsite || '',
            announcement: eventJson.announcement || '',
            isIllustratorRecruiting: eventJson.isIllustratorRecruiting || false,
            illustratorRequirements: eventJson.illustratorRequirements || ''
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

  // S3アップロード関数
  const uploadToS3 = async (file) => {
    const res = await authenticatedFetch('/api/tools/s3-upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });
    const { uploadUrl, fileUrl } = await res.json();

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    return new Promise((resolve, reject) => {
      xhr.onload = () => xhr.status === 200 ? resolve(fileUrl) : reject();
      xhr.onerror = () => reject();
      xhr.send(file);
    });
  };

  // 画像追加
  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsUploading(true);
    const toastId = toast.loading('画像をアップロード中...');

    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadToS3(file);
        newUrls.push(url);
      }
      setEventData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...newUrls]
      }));
      toast.success('画像をアップロードしました', { id: toastId });
    } catch (err) {
      toast.error('アップロードに失敗しました', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // 画像削除
  const removeImage = (index) => {
    setEventData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

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
        body: JSON.stringify(eventData), // eventData全体を送信
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
    if(!window.confirm('本当に削除しますか？')) return;
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    try {
        const res = await fetch(`${API_URL}/api/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('削除できませんでした');
        toast.success('イベントを削除しました');
        router.push('/organizers/dashboard');
    } catch (error) { toast.error(error.message); }
  };

  if (authLoading || loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <FiLoader className="animate-spin text-indigo-500" size={40} />
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
            <button onClick={handleDelete} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg transition-all text-sm font-bold flex items-center">
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
                        {/* 画像管理セクション */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FiImage className="text-indigo-500" /> イベント画像ギャラリー
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {eventData.imageUrls?.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 shadow-sm">
                                        <img src={url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ))}
                                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer">
                                    {isUploading ? <FiLoader className="animate-spin text-indigo-500" size={24}/> : <FiPlus className="text-slate-400" size={24} />}
                                    <span className="text-[10px] font-bold text-slate-400 mt-2">追加</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageAdd} className="hidden" disabled={isUploading} />
                                </label>
                            </div>
                        </div>

                        {/* 主催者告知セクション */}
                        <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg">
                            <h3 className="font-bold mb-3 flex items-center gap-2"><FiMega /> 主催者からの最新告知</h3>
                            <textarea 
                                value={eventData.announcement}
                                onChange={(e) => setEventData({...eventData, announcement: e.target.value})}
                                placeholder="例：フラスタの受付時間を変更しました！等、一番上に目立つように表示されます"
                                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 outline-none min-h-[80px] text-sm"
                            />
                        </div>

                        {/* 絵師公募セクション */}
                        <div className="bg-rose-50 rounded-xl border border-rose-200 p-5 shadow-sm">
                            <h3 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                                <FiStar className="text-rose-500" /> イラストレーター公募設定
                            </h3>
                            <label className="flex items-center p-3 bg-white rounded-lg border border-rose-100 cursor-pointer mb-4 shadow-sm hover:border-rose-300 transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={eventData.isIllustratorRecruiting}
                                    onChange={(e) => setEventData({...eventData, isIllustratorRecruiting: e.target.checked})}
                                    className="w-5 h-5 text-rose-500 rounded focus:ring-rose-400 border-gray-300 mr-3"
                                />
                                <span className="font-bold text-rose-900 text-sm">このイベントのイラストレーターを公募する</span>
                            </label>
                            <textarea 
                                value={eventData.illustratorRequirements || ''}
                                onChange={(e) => setEventData({...eventData, illustratorRequirements: e.target.value})}
                                placeholder="【公募条件】例：予算、締切、描いてほしいキャラクターのイメージなど"
                                className="w-full p-3 border border-rose-100 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-rose-300 transition-all bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">イベント名 <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    value={eventData.title}
                                    onChange={(e) => setEventData({...eventData, title: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-lg"
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
                            <select 
                                value={eventData.venueId || ''}
                                onChange={(e) => setEventData({...eventData, venueId: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none bg-white cursor-pointer"
                            >
                                <option value="">会場未定 / その他</option>
                                {venues.map(v => <option key={v.id} value={v.id}>{v.venueName}</option>)}
                            </select>
                        </div>

                        {/* SNS・HPリンク編集セクション */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><FiGlobe /> 公式HP</label>
                                <input 
                                    type="url" 
                                    value={eventData.officialWebsite} 
                                    onChange={(e) => setEventData({...eventData, officialWebsite: e.target.value})} 
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                                    placeholder="https://..." 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><FiTwitter /> X (Twitter)</label>
                                <input 
                                    type="url" 
                                    value={eventData.twitterUrl} 
                                    onChange={(e) => setEventData({...eventData, twitterUrl: e.target.value})} 
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                                    placeholder="https://x.com/..." 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><FiInstagram /> Instagram</label>
                                <input 
                                    type="url" 
                                    value={eventData.instagramUrl} 
                                    onChange={(e) => setEventData({...eventData, instagramUrl: e.target.value})} 
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" 
                                    placeholder="https://instagram.com/..." 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">イベント概要</label>
                            <textarea 
                                value={eventData.description || ''}
                                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                            />
                        </div>

                        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
                            <h3 className="font-bold text-yellow-800 mb-3 flex items-center">
                                <FiAlertCircle className="mr-2"/> フラワースタンド受付設定
                            </h3>
                            <label className="flex items-center p-3 bg-white rounded-lg border border-yellow-100 cursor-pointer mb-4 shadow-sm">
                                <input 
                                    type="checkbox"
                                    checked={eventData.isStandAllowed}
                                    onChange={(e) => setEventData({...eventData, isStandAllowed: e.target.checked})}
                                    className="w-5 h-5 text-indigo-600 rounded mr-3"
                                />
                                <span className="font-bold text-gray-800">フラワースタンドを受け入れる</span>
                            </label>
                            <textarea 
                                value={eventData.regulationNote || ''}
                                onChange={(e) => setEventData({...eventData, regulationNote: e.target.value})}
                                placeholder="【サイズ規定】など注意事項を入力"
                                className="w-full p-3 border border-yellow-200 rounded-xl text-sm min-h-[100px] outline-none bg-white"
                            />
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={saving || isUploading}
                                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all flex justify-center items-center disabled:opacity-70"
                            >
                                {saving ? <FiLoader className="animate-spin mr-2"/> : <FiSave className="mr-2 text-xl"/>}
                                変更内容を保存する
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
                    </div>
                    <div className="p-4 bg-gray-50/50 min-h-[300px]">
                        {eventData.projects && eventData.projects.length > 0 ? (
                            <div className="space-y-3">
                                {eventData.projects.map(project => (
                                    <Link key={project.id} href={`/projects/${project.id}`} className="block">
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
                                            <ProjectStatusBadge status={project.status || 'PLANNING'} />
                                            <h3 className="font-bold text-gray-800 text-sm mt-2 line-clamp-2">{project.title}</h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-12 text-gray-400 text-sm italic">まだ企画はありません</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}