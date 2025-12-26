'use client';

// Next.jsのビルドエラー回避設定
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiCheckCircle, FiInfo, FiSearch, FiEdit2, 
  FiTrash2, FiPlus, FiArrowLeft, FiFilter, FiLoader, FiExternalLink
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function VenuesListInner() {
    const { token, user } = useAuth();
    const router = useRouter();
    
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // 管理者かどうか
    const isAdmin = user?.role === 'ADMIN';

    const fetchVenues = async () => {
        setLoading(true);
        try {
            // 一般ユーザーもアクセス可能なエンドポイント、または管理者はadmin用を叩く
            const endpoint = isAdmin ? `${API_URL}/api/venues/admin` : `${API_URL}/api/venues`;
            const res = await fetch(endpoint, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setVenues(data);
            }
        } catch (error) {
            toast.error('会場データの取得に失敗しました');
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

    // フィルタリング: 一般ユーザーには承認済み(isOfficial)のみ見せる（管理者は全て）
    const filteredVenues = venues.filter(v => {
        const matchesSearch = v.venueName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (isAdmin) return matchesSearch;
        return matchesSearch && v.isOfficial; // 一般ユーザーは承認済みのみ
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pt-24">
            <div className="max-w-6xl mx-auto">
                
                {/* ヘッダーセクション */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                            <FiMapPin className="text-pink-500"/> 会場・施設一覧
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            フラスタの送付先情報をチェックしましょう。
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/venues/add" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                            <FiPlus /> 新しい会場を教える
                        </Link>
                        {isAdmin && (
                            <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center">
                                管理者モード
                            </div>
                        )}
                    </div>
                </div>

                {/* 検索バー */}
                <div className="relative mb-10">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                    <input 
                        type="text" 
                        placeholder="会場名や場所で検索..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50 transition-all font-bold text-lg"
                    />
                </div>

                {/* メインコンテンツ */}
                {loading ? (
                    <div className="py-20 text-center">
                        <FiLoader className="animate-spin text-slate-300 size-10 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Loading Database...</p>
                    </div>
                ) : filteredVenues.length === 0 ? (
                    <div className="bg-white rounded-[3rem] py-20 text-center border-2 border-dashed border-slate-200">
                        <FiInfo className="size-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">該当する会場が見つかりませんでした。</p>
                        <p className="text-slate-300 text-sm mt-1">新しい情報の追加をご検討ください。</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVenues.map(venue => (
                            <div key={venue.id} className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                                
                                {/* 管理用バッジ */}
                                {!venue.isOfficial && isAdmin && (
                                    <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                                        Pending Approval
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-pink-600 transition-colors">
                                        {venue.venueName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-400 mt-2">
                                        <FiMapPin size={14}/>
                                        <span className="text-sm font-bold">{venue.address || '住所未登録'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">フラスタ受入</span>
                                        {venue.isStandAllowed ? (
                                            <span className="text-sm font-black text-green-600 flex items-center gap-1">
                                                <FiCheckCircle /> OK
                                            </span>
                                        ) : (
                                            <span className="text-sm font-black text-slate-400">要確認</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/venues/${venue.id}`} className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl text-center font-bold text-sm hover:bg-pink-50 hover:text-pink-600 transition-all">
                                        詳細を見る
                                    </Link>
                                    
                                    {/* 管理者のみに表示されるボタン */}
                                    {isAdmin && (
                                        <>
                                            <Link href={`/venues/${venue.id}/edit`} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-all" title="編集">
                                                <FiEdit2 size={16} />
                                            </Link>
                                            <button onClick={() => handleDelete(venue.id)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-red-600 transition-all" title="削除">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* 補足メッセージ */}
                <div className="mt-16 text-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        ※会場のレギュレーションはイベント毎に異なる場合があります。<br/>
                        最新情報は必ず各公演の公式サイトをご確認ください。
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VenuesListPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin size-8 text-pink-500" /></div>}>
            <VenuesListInner />
        </Suspense>
    );
}