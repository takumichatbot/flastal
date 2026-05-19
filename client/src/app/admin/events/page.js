'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, RefreshCw, Trash2, Calendar, Edit3, X, CheckCircle2, FileText 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// 🌟 日付データを input type="datetime-local" 用にフォーマットする関数
const formatForDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 🌟 イベント編集モーダル
function EventEditModal({ event, isOpen, onClose, onSuccess, authenticatedFetch }) {
    // 🌟 修正: データベースの正しいカラム名（regulationNote, isStandAllowed）に修正
    const [formData, setFormData] = useState({ 
        title: '', 
        eventDate: '', 
        status: '',
        regulationNote: '',
        isStandAllowed: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (event && isOpen) {
            setFormData({
                title: event.title || '',
                eventDate: formatForDateTimeLocal(event.eventDate),
                status: event.status || 'OPEN',
                regulationNote: event.regulationNote || '',
                isStandAllowed: event.isStandAllowed !== false, // デフォルトで true (受け入れ可)
            });
        }
    }, [event, isOpen]);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const tid = toast.loading('保存中...');

        const payload = {
            ...formData,
            eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null
        };

        try {
            let res = await authenticatedFetch(`${API_URL}/api/admin/events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 404) {
                res = await authenticatedFetch(`${API_URL}/api/events/${event.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) throw new Error('保存失敗');
            toast.success('イベントを更新しました', { id: tid });
            onSuccess();
        } catch (error) {
            toast.error('エラーが発生しました', { id: tid });
        } finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit3 className="text-pink-500"/> イベントの編集</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">イベント名</label>
                        <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-pink-300 transition-all font-bold" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">開催日時</label>
                        <input type="datetime-local" required value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-pink-300 transition-all font-bold" />
                    </div>
                    
                    {/* 🌟 修正: データベースの名前 (isStandAllowed) と連動 */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">お祝い花 受け入れ状況</label>
                        <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-white transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.isStandAllowed} 
                                onChange={(e) => setFormData({...formData, isStandAllowed: e.target.checked})}
                                className="w-5 h-5 text-pink-500 rounded border-slate-300 focus:ring-pink-500"
                            />
                            <span className={cn("text-sm font-bold", formData.isStandAllowed ? "text-slate-800" : "text-rose-500")}>
                                {formData.isStandAllowed ? '受け入れ可能 (OK)' : '受け入れ不可 (NG・辞退)'}
                            </span>
                        </label>
                    </div>

                    {/* 🌟 修正: データベースの名前 (regulationNote) と連動 */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <FileText size={14}/> レギュレーション (搬入ルール等)
                        </label>
                        <textarea 
                            rows="4"
                            value={formData.regulationNote} 
                            onChange={(e) => setFormData({...formData, regulationNote: e.target.value})} 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-pink-300 transition-all font-bold text-sm resize-none"
                            placeholder="サイズ規定、搬入時間の指定、回収の必須有無などを記載してください..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors">キャンセル</button>
                        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-md">
                            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} 保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminEventsPage() {
    const { user, isAuthenticated, loading, authenticatedFetch } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingEvent, setEditingEvent] = useState(null);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const headers = { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            };

            let res = await fetch(`${API_URL}/api/admin/events?t=${Date.now()}`, { headers });
            
            if (res.status === 404) {
                res = await fetch(`${API_URL}/api/events?t=${Date.now()}`, { headers });
            }

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("サーバーから不正なデータが返されました");
            }
            
            const eventsArray = Array.isArray(data) ? data : (data.events || data.data || Object.values(data).find(val => Array.isArray(val)) || []);
            setEvents(eventsArray);

        } catch (error) { 
            console.error("Fetch Events Error:", error);
            toast.error(`イベント取得失敗: ${error.message}`); 
        } finally { 
            setIsLoading(false); 
        }
    };

    useEffect(() => { 
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/login');
            return;
        }
        fetchEvents(); 
    }, [isAuthenticated, user, loading, router]);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`「${title}」を完全に削除しますか？`)) return;
        const tid = toast.loading('削除中...');
        try {
            let res = await authenticatedFetch(`${API_URL}/api/admin/events/${id}`, { method: 'DELETE' });
            if (res.status === 404) {
                res = await authenticatedFetch(`${API_URL}/api/events/${id}`, { method: 'DELETE' });
            }

            if (!res.ok) throw new Error();
            toast.success('削除しました', { id: tid });
            fetchEvents();
        } catch (e) { 
            toast.error('削除に失敗しました', { id: tid }); 
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-sky-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Calendar className="text-pink-500" size={24} /> 全イベント管理</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Event Management Console</p>
                        </div>
                    </div>
                    <button onClick={fetchEvents} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shadow-sm">
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""}/>
                    </button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">イベント情報</th>
                                <th className="px-6 py-4">開催日時</th>
                                <th className="px-6 py-4 text-right">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-20 text-center text-slate-400">
                                        <RefreshCw className="animate-spin text-pink-500 mx-auto mb-3" size={32}/>
                                        <p className="font-bold text-sm">データを読み込み中...</p>
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-20 text-center text-slate-400">
                                        <Calendar className="text-slate-300 mx-auto mb-3" size={32}/>
                                        <p className="font-bold text-sm">登録されているイベントがありません</p>
                                    </td>
                                </tr>
                            ) : (
                                events.map(ev => (
                                    <tr key={ev.id} className="hover:bg-pink-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 text-sm md:text-base group-hover:text-pink-600 transition-colors">{ev.title}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <p className="text-[10px] text-slate-400 font-mono">ID: {ev.id.substring(0,8)}...</p>
                                                {/* 🌟 修正: データベースの名前 (isStandAllowed) と連動 */}
                                                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider", ev.isStandAllowed !== false ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                                    {ev.isStandAllowed !== false ? '受入OK' : '受入NG'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                            {ev.eventDate ? new Date(ev.eventDate).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) : '未設定'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setEditingEvent(ev)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 rounded-lg transition-all text-xs font-bold shadow-sm">
                                                    <Edit3 size={14} /> <span className="hidden sm:inline">編集</span>
                                                </button>
                                                <button onClick={() => handleDelete(ev.id, ev.title)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 rounded-lg transition-all text-xs font-bold shadow-sm">
                                                    <Trash2 size={14} /> <span className="hidden sm:inline">削除</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <EventEditModal 
                event={editingEvent} 
                isOpen={!!editingEvent} 
                onClose={() => setEditingEvent(null)} 
                onSuccess={() => { setEditingEvent(null); fetchEvents(); }} 
                authenticatedFetch={authenticatedFetch} 
            />
        </div>
    );
}