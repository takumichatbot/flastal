// src/app/admin/florists/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    FiAward, FiDollarSign, FiEdit, FiRefreshCw, FiSearch, 
    FiFilter, FiTrendingUp, FiUsers, FiAlertCircle 
} from 'react-icons/fi';
import FloristFeeModal from '../components/FloristFeeModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

export default function AdminFloristsPage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [florists, setFlorists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetFloristId, setTargetFloristId] = useState(null);

    // フィルター & ソート用ステート
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, APPROVED, PENDING, REJECTED
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // データ取得
    const fetchFlorists = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoading(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/florists/all`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!res.ok) throw new Error('花屋リストの取得に失敗しました。');
            
            const data = await res.json();
            // 配列チェック
            setFlorists(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message);
            setFlorists([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません。');
            router.push('/admin');
            return;
        }
        fetchFlorists();
    }, [authLoading, isAuthenticated, user, router, fetchFlorists]);

    // モーダル更新後の処理
    const handleFeeUpdated = () => {
        setTargetFloristId(null);
        fetchFlorists(); 
    };

    // フィルタリングとソートのロジック
    const processedFlorists = useMemo(() => {
        let data = [...florists];

        // 1. ステータスフィルター
        if (statusFilter !== 'ALL') {
            data = data.filter(f => f.status === statusFilter);
        }

        // 2. キーワード検索
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(f => 
                (f.platformName && f.platformName.toLowerCase().includes(lowerTerm)) ||
                (f.shopName && f.shopName.toLowerCase().includes(lowerTerm)) ||
                (f.email && f.email.toLowerCase().includes(lowerTerm))
            );
        }

        // 3. ソート
        data.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // 手数料率のソート特例 (nullの場合は0扱いまたは無限大扱いなど)
            if (sortConfig.key === 'customFeeRate') {
                aValue = a.customFeeRate ?? -1; // -1は未設定
                bValue = b.customFeeRate ?? -1;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [florists, searchTerm, statusFilter, sortConfig]);

    // 統計データ
    const stats = useMemo(() => {
        return {
            total: florists.length,
            approved: florists.filter(f => f.status === 'APPROVED').length,
            customFee: florists.filter(f => f.customFeeRate !== null).length,
        };
    }, [florists]);

    // ソート切り替えハンドラ
    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><FiRefreshCw className="animate-spin text-3xl text-gray-400"/></div>;
    if (!isAuthenticated || user?.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ヘッダーエリア */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiAward className="text-pink-600"/> お花屋さん管理・手数料設定
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">登録されている花屋のステータス管理および手数料率の個別設定を行います。</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin" className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50">
                            ダッシュボードへ戻る
                        </Link>
                        <button onClick={fetchFlorists} disabled={loading} className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700 flex items-center gap-2 transition-colors">
                            <FiRefreshCw className={loading ? "animate-spin" : ""}/>
                            データ更新
                        </button>
                    </div>
                </div>

                {/* 統計カード (KPI) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard icon={<FiUsers/>} label="登録花屋総数" value={`${stats.total}件`} color="blue" />
                    <StatCard icon={<FiAward/>} label="承認済みアカウント" value={`${stats.approved}件`} color="green" />
                    <StatCard icon={<FiDollarSign/>} label="個別手数料 適用中" value={`${stats.customFee}件`} color="pink" />
                </div>

                {/* フィルター & 検索バー */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* タブフィルター */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        {['ALL', 'APPROVED', 'PENDING'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                                    statusFilter === status 
                                    ? 'bg-white text-gray-800 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {status === 'ALL' ? 'すべて' : status === 'APPROVED' ? '承認済み' : '審査待ち'}
                            </button>
                        ))}
                    </div>

                    {/* 検索ボックス */}
                    <div className="relative w-full md:w-80">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="名前、店舗名、メールで検索..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                        />
                    </div>
                </div>

                {/* データテーブル */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <SortableTh label="花屋情報" sortKey="platformName" currentSort={sortConfig} onSort={handleSort} />
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">連絡先</th>
                                    <SortableTh label="ステータス" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableTh label="適用手数料率" sortKey="customFeeRate" currentSort={sortConfig} onSort={handleSort} align="right" />
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">設定</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            読み込み中...
                                        </td>
                                    </tr>
                                ) : processedFlorists.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            該当する花屋が見つかりません。
                                        </td>
                                    </tr>
                                ) : (
                                    processedFlorists.map((florist) => (
                                        <tr key={florist.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-pink-500 font-bold">
                                                        {florist.platformName?.[0] || 'F'}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900">{florist.platformName || '名称未設定'}</div>
                                                        <div className="text-xs text-gray-500">ID: {florist.id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{florist.email}</div>
                                                <div className="text-xs text-gray-500">{florist.shopName || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={florist.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {florist.customFeeRate !== null ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                                        <FiDollarSign className="mr-1" size={14}/>
                                                        {(florist.customFeeRate * 100).toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400 font-medium">
                                                        全体設定 (標準)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => setTargetFloristId(florist.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                                >
                                                    <FiEdit size={14}/> 手数料設定
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* 件数表示フッター */}
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                        <span>全 {florists.length} 件中 {processedFlorists.length} 件を表示</span>
                        {/* ページネーションが必要ならここに配置 */}
                    </div>
                </div>

                {/* モーダル表示 */}
                {targetFloristId && (
                    <FloristFeeModal 
                        floristId={targetFloristId} 
                        onClose={() => setTargetFloristId(null)} 
                        onFeeUpdated={handleFeeUpdated}
                    />
                )}
            </div>
        </div>
    );
}

// サブコンポーネント: 統計カード
const StatCard = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        pink: 'bg-pink-50 text-pink-600 border-pink-100',
    };
    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} flex items-center gap-4 shadow-sm`}>
            <div className={`p-3 rounded-full bg-white shadow-sm text-xl`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold">{value}</p>
            </div>
        </div>
    );
};

// サブコンポーネント: ソート可能なヘッダー
const SortableTh = ({ label, sortKey, currentSort, onSort, align = 'left' }) => (
    <th 
        className={`px-6 py-3 text-${align} text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none group`}
        onClick={() => onSort(sortKey)}
    >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
            {label}
            <div className="flex flex-col text-[10px] text-gray-400">
                <span className={currentSort.key === sortKey && currentSort.direction === 'asc' ? 'text-gray-800' : ''}>▲</span>
                <span className={currentSort.key === sortKey && currentSort.direction === 'desc' ? 'text-gray-800' : ''}>▼</span>
            </div>
        </div>
    </th>
);

// サブコンポーネント: ステータスバッジ
const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: 'bg-green-100 text-green-700 border-green-200',
        PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        REJECTED: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = {
        APPROVED: '承認済み',
        PENDING: '審査待ち',
        REJECTED: '却下/停止',
    };

    return (
        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
            {labels[status] || status}
        </span>
    );
};