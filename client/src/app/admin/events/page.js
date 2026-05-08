'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, RefreshCw, Trash2, Calendar, Edit3, X, CheckCircle2 
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

// 🌟 イベント編集モーダル
function EventEditModal({ event, isOpen, onClose, onSuccess, authenticatedFetch }) {
    const [formData, setFormData] = useState({ title: '', eventDate: '', status: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (event && isOpen) {
            setFormData({
                title: event.title || '',
                eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
                status: event.status || 'OPEN',
            });
        }
    }, [event, isOpen]);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const tid = toast.loading('保存中...');
        try {
            // 管理者用APIを試し、無ければ一般用APIにフォールバック
            let res = await authenticatedFetch(`${API_URL}/api/admin/events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.status === 404) {
                res = await authenticatedFetch(`${API_URL}/api/events/${event.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
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
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100">
                <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit3 className="text-pink-500"/> イベントの編集</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">イベント名</label>
                        <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">開催日</label>
                        <input type="date" required value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl">キャンセル</button>
                        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-pink-600 flex items-center gap-2">
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

            // 🌟 1. まず /api/admin/events を試す
            let res = await fetch(`${API_URL}/api/admin/events?t=${Date.now()}`, { headers });
            
            // 🌟 2. 404エラー（存在しない）なら、一般用の /api/events を試す
            if (res.status === 404) {
                res = await fetch(`${API_URL}/api/events?t=${Date.now()}`, { headers });
            }

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            
            // HTMLエラーでクラッシュしないように、まずはテキストとして取得
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("サーバーから不正なデータが返されました");
            }
            
            // オブジェクト形式でも配列形式でも確実に抽出
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
            // こちらもフォールバック対応
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
                                <th className="px-6 py-4">開催日</th>
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
                                            <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {ev.id.substring(0,8)}...</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                                            {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : '未設定'}
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