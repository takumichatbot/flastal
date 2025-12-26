'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiCheckCircle, FiInfo, FiSearch, FiEdit2, 
  FiTrash2, FiPlus, FiArrowLeft, FiLoader, FiClock, FiShield
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function VenuesListInner() {
    const { token, user } = useAuth();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const isAdmin = user?.role === 'ADMIN';

    const fetchVenues = async () => {
        setLoading(true);
        try {
            // 【重要】未承認データを含めて取得するため、ログイン時は admin エンドポイントを試行
            // 管理者でなくても、自分の投稿を確認するために全件取得（またはバックエンド側で制御）を試みます
            const endpoint = token ? `${API_URL}/api/venues/admin` : `${API_URL}/api/venues`;
            
            const res = await fetch(endpoint, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (res.ok) {
                const data = await res.json();
                setVenues(data);
            } else if (res.status === 403 || res.status === 401) {
                // adminエンドポイントが拒否された場合は、通常のエンドポイントへフォールバック
                const fallbackRes = await fetch(`${API_URL}/api/venues`);
                const fallbackData = await fallbackRes.json();
                setVenues(fallbackData);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('データの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVenues();
    }, [token, user]);

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm('この会場情報を削除しますか？')) return;
        try {
            const res = await fetch(`${API_URL}/api/venues/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('削除しました');
                fetchVenues();
            }
        } catch (error) {
            toast.error('削除に失敗しました');
        }
    };

    // フィルタリングロジックの強化
    const filteredVenues = venues.filter(v => {
        const matchesSearch = v.venueName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (isAdmin) return matchesSearch;

        // 一般ユーザーの表示条件:
        // 1. 承認済み(isOfficial === true)
        // 2. または、自分が投稿したもの(submittedBy === user.id)
        const isMySubmission = user && v.submittedBy === user.id;
        return matchesSearch && (v.isOfficial || isMySubmission);
    });

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 font-sans pt-28">
            <div className="max-w-6xl mx-auto">
                
                {/* ヘッダー */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 px-2">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-px w-8 bg-pink-500"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">Venue Directory</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            会場・施設一覧
                        </h1>
                        <p className="text-slate-400 mt-4 font-bold text-sm md:text-base leading-relaxed">
                            推しへ想いを届けるための、全国の会場データベース。
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/venues/add" className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-2 hover:bg-pink-600 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.1)] active:scale-95">
                            <FiPlus /> 新しい会場を教える
                        </Link>
                    </div>
                </div>

                {/* 検索セクション */}
                <div className="relative mb-12 group">
                    <div className="absolute inset-0 bg-pink-500/5 blur-2xl rounded-[3rem] group-focus-within:bg-pink-500/10 transition-all"></div>
                    <div className="relative">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 size-6" />
                        <input 
                            type="text" 
                            placeholder="会場名、または所在地で絞り込む..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-sm outline-none focus:border-pink-200 transition-all font-bold text-xl placeholder:text-slate-200"
                        />
                    </div>
                </div>

                {/* リスト表示 */}
                {loading ? (
                    <div className="py-32 text-center">
                        <FiLoader className="animate-spin text-pink-500 size-12 mx-auto mb-6" />
                        <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Accessing Database...</p>
                    </div>
                ) : filteredVenues.length === 0 ? (
                    <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100 px-6">
                        <div className="bg-slate-50 size-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiMapPin className="size-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black text-lg">該当する会場が見つかりませんでした</p>
                        <p className="text-slate-300 text-sm mt-2 font-bold">キーワードを変えて検索するか、新しく登録してください。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredVenues.map(venue => (
                            <div key={venue.id} className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all group relative overflow-hidden flex flex-col">
                                
                                {/* ステータスバッジ */}
                                {!venue.isOfficial ? (
                                    <div className="absolute top-0 right-0 bg-amber-400 text-white px-6 py-2 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                        <FiClock className="animate-pulse" /> 承認待ち
                                    </div>
                                ) : (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-6 py-2 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                        <FiShield /> 公式
                                    </div>
                                )}

                                <div className="mb-8 flex-1">
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-pink-600 transition-colors">
                                        {venue.venueName}
                                    </h3>
                                    <div className="flex items-start gap-2 text-slate-400 mt-4">
                                        <FiMapPin className="mt-1 shrink-0 text-pink-500/40" size={16}/>
                                        <span className="text-sm font-bold leading-relaxed">{venue.address || '所在地情報なし'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">フラスタ受入</span>
                                        {venue.isStandAllowed ? (
                                            <span className="text-sm font-black text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                                <FiCheckCircle /> 許可実績あり
                                            </span>
                                        ) : (
                                            <span className="text-sm font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                                                要確認
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <Link href={`/venues/${venue.id}`} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-center font-black text-sm hover:bg-pink-600 transition-all shadow-lg shadow-slate-100 active:scale-95">
                                        詳細データ
                                    </Link>
                                    
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <Link href={`/venues/${venue.id}/edit`} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-teal-500 hover:text-white transition-all" title="編集">
                                                <FiEdit2 size={18} />
                                            </Link>
                                            <button onClick={() => handleDelete(venue.id)} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all" title="削除">
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                body { background-color: #fafafa; }
            `}</style>
        </div>
    );
}

export default function VenuesListPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin size-10 text-pink-500" /></div>}>
            <VenuesListInner />
        </Suspense>
    );
}