'use client';

// Next.jsのビルドエラー（Prerenderエラー）を回避するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiCheckCircle, FiXCircle, FiSearch, FiEdit2, 
  FiTrash2, FiPlus, FiArrowLeft, FiFilter, FiLoader
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- [ロジックとデザインの本体] ---
function VenuesAdminInner() {
    const { token, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, APPROVED, PENDING

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/venues/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
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
        if (token) fetchVenues();
    }, [token]);

    const handleDelete = async (id) => {
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

    const filteredVenues = venues.filter(v => {
        const matchesSearch = v.venueName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             v.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || 
                             (filterStatus === 'APPROVED' && v.isOfficial) || 
                             (filterStatus === 'PENDING' && !v.isOfficial);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* ヘッダー */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FiMapPin className="text-teal-600"/> 会場・施設管理
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">登録されている会場の承認・編集・削除を行います。</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/venues/add" className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-md">
                            <FiPlus /> 新規会場登録
                        </Link>
                        <Link href="/admin" className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <FiArrowLeft /> 戻る
                        </Link>
                    </div>
                </div>

                {/* フィルター・検索 */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-3 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="会場名や住所で検索..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FiFilter className="text-slate-400" />
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                        >
                            <option value="ALL">全てのステータス</option>
                            <option value="APPROVED">公式（承認済み）</option>
                            <option value="PENDING">未承認</option>
                        </select>
                    </div>
                </div>

                {/* リスト表示 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">会場名 / 住所</th>
                                <th className="px-6 py-4 font-bold">ステータス</th>
                                <th className="px-6 py-4 font-bold text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400">
                                        <FiLoader className="animate-spin inline mr-2" /> 読み込み中...
                                    </td>
                                </tr>
                            ) : filteredVenues.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400">該当する会場が見つかりません。</td>
                                </tr>
                            ) : (
                                filteredVenues.map(venue => (
                                    <tr key={venue.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{venue.venueName}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{venue.address}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {venue.isOfficial ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                    <FiCheckCircle /> OFFICIAL
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                    <FiXCircle /> PENDING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <Link href={`/venues/${venue.id}/edit`} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="編集">
                                                    <FiEdit2 size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(venue.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="削除">
                                                    <FiTrash2 size={18} />
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
        </div>
    );
}

// --- [メインエクスポート] ---
export default function AdminVenuesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <FiLoader className="animate-spin text-3xl" />
                    <p className="text-sm font-medium">管理画面を読み込み中...</p>
                </div>
            </div>
        }>
            <VenuesAdminInner />
        </Suspense>
    );
}