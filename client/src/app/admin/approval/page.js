'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
    FiCheckCircle, FiXCircle, FiClock, FiUsers, FiAward, 
    FiMapPin, FiCalendar, FiLogOut, FiRefreshCw, FiLoader, 
    FiSearch, FiEye, FiX, FiAlertTriangle 
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// --- 詳細確認モーダル ---
function DetailModal({ isOpen, onClose, item, type, onAction }) {
    if (!isOpen || !item) return null;

    const details = [
        { label: 'ID', value: item.id },
        { label: 'メールアドレス', value: item.email },
        { label: '登録日', value: new Date(item.createdAt).toLocaleString() },
        { label: 'ステータス', value: item.status, isBadge: true },
        // タイプ別項目
        ...(type === 'Florist' ? [
            { label: 'ショップ名', value: item.shopName },
            { label: '屋号/活動名', value: item.platformName },
            { label: 'ポートフォリオ', value: item.portfolio, isLink: true },
            { label: '自己紹介', value: item.bio, isLongText: true },
        ] : []),
        ...(type === 'Venue' ? [
            { label: '会場名', value: item.venueName },
            { label: '住所', value: item.address },
            { label: 'キャパシティ', value: item.capacity },
            { label: '搬入ルール', value: item.accessInfo, isLongText: true },
        ] : []),
        ...(type === 'Organizer' ? [
            { label: '主催者名', value: item.name },
            { label: '団体名', value: item.organization },
            { label: '活動実績', value: item.history, isLongText: true },
        ] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase">{type}</span>
                        詳細情報確認
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <FiX size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {details.map((detail, idx) => (
                            detail.value && (
                                <div key={idx} className="border-b border-gray-50 pb-2 last:border-0">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                        {detail.label}
                                    </span>
                                    {detail.isLongText ? (
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {detail.value}
                                        </p>
                                    ) : detail.isLink ? (
                                        <a href={detail.value} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline break-all">
                                            {detail.value}
                                        </a>
                                    ) : detail.isBadge ? (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                                            {detail.value}
                                        </span>
                                    ) : (
                                        <p className="text-sm text-gray-800 font-medium">{detail.value}</p>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                    <button
                        onClick={() => onAction('REJECTED')}
                        className="flex-1 bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <FiXCircle /> 却下する
                    </button>
                    <button
                        onClick={() => onAction('APPROVED')}
                        className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                        <FiCheckCircle /> 承認する
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- 審査カードコンポーネント ---
function ReviewCard({ item, type, onOpenDetail }) {
    const getIcon = () => {
        switch (type) {
            case 'Florist': return <FiAward className="w-5 h-5 text-pink-500"/>;
            case 'Venue': return <FiMapPin className="w-5 h-5 text-blue-500"/>;
            case 'Organizer': return <FiCalendar className="w-5 h-5 text-purple-500"/>;
            default: return <FiUsers className="w-5 h-5 text-gray-500"/>;
        }
    };

    const getDisplayName = () => {
        if (type === 'Florist') return item.platformName || item.shopName || '名称未設定';
        if (type === 'Venue') return item.venueName || '名称未設定';
        if (type === 'Organizer') return item.name || '名称未設定';
        return '不明なアカウント';
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all duration-200 group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                        {getIcon()}
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">{type}</span>
                        <h3 className="text-base font-bold text-gray-900 line-clamp-1">{getDisplayName()}</h3>
                    </div>
                </div>
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded border border-yellow-200 flex items-center gap-1">
                    <FiClock size={10} /> 審査待ち
                </span>
            </div>

            <div className="text-xs text-gray-500 space-y-1 mb-4">
                <p className="flex items-center gap-1 overflow-hidden">
                    <span className="font-semibold min-w-[40px]">Email:</span> 
                    <span className="truncate">{item.email}</span>
                </p>
                <p className="flex items-center gap-1">
                    <span className="font-semibold min-w-[40px]">日付:</span> 
                    {new Date(item.createdAt).toLocaleDateString()}
                </p>
            </div>

            <button
                onClick={() => onOpenDetail(item)}
                className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
                <FiEye className="w-4 h-4" /> 詳細・審査へ
            </button>
        </div>
    );
}

// --- メインページ ---
export default function AdminApprovalPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [pendingData, setPendingData] = useState({ florists: [], venues: [], organizers: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('florists');
    const [searchTerm, setSearchTerm] = useState('');
    
    // モーダル管理用
    const [selectedItem, setSelectedItem] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // データ取得
    const fetchPendingData = useCallback(async () => {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const [floristRes, venueRes, organizerRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/florists/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/venues/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/organizers/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);

            const florists = floristRes.ok ? await floristRes.json() : [];
            const venues = venueRes.ok ? await venueRes.json() : [];
            const organizers = organizerRes.ok ? await organizerRes.json() : [];

            setPendingData({
                florists: Array.isArray(florists) ? florists.filter(f => f.status === 'PENDING') : [],
                venues: Array.isArray(venues) ? venues.filter(v => v.status === 'PENDING') : [],
                organizers: Array.isArray(organizers) ? organizers.filter(o => o.status === 'PENDING') : [],
            });
            
        } catch (error) {
            console.error('Error fetching pending data:', error);
            toast.error('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    }, []);

    // 認証チェック
    useEffect(() => {
        if (!authLoading) {
            if (user?.role !== 'ADMIN') {
                toast.error('アクセス権限がありません');
                router.push('/');
            } else {
                fetchPendingData();
            }
        }
    }, [authLoading, user, router, fetchPendingData]);

    // 審査アクション実行
    const handleAction = async (status) => {
        if (!selectedItem) return;

        setIsProcessing(true);
        const toastId = toast.loading('処理中...');
        const token = getAuthToken();
        
        // APIエンドポイントの決定
        let apiUrl = '';
        let typeLabel = '';
        if (activeTab === 'florists') { apiUrl = `${API_URL}/api/admin/florists/${selectedItem.id}/status`; typeLabel = '花屋'; }
        else if (activeTab === 'venues') { apiUrl = `${API_URL}/api/admin/venues/${selectedItem.id}/status`; typeLabel = '会場'; }
        else if (activeTab === 'organizers') { apiUrl = `${API_URL}/api/admin/organizers/${selectedItem.id}/status`; typeLabel = '主催者'; }

        try {
            const res = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('更新に失敗しました');

            toast.success(`${typeLabel}を${status === 'APPROVED' ? '承認' : '却下'}しました`, { id: toastId });
            
            setSelectedItem(null); // モーダル閉じる
            fetchPendingData();    // リスト更新

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // フィルタリング処理
    const filteredList = useMemo(() => {
        const list = pendingData[activeTab] || [];
        if (!searchTerm) return list;
        const lowerTerm = searchTerm.toLowerCase();
        
        return list.filter(item => 
            (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
            (item.shopName && item.shopName.toLowerCase().includes(lowerTerm)) ||
            (item.venueName && item.venueName.toLowerCase().includes(lowerTerm)) ||
            (item.name && item.name.toLowerCase().includes(lowerTerm))
        );
    }, [pendingData, activeTab, searchTerm]);

    const totalPending = pendingData.florists.length + pendingData.venues.length + pendingData.organizers.length;
    
    // UIタイプ定数
    const TAB_CONFIG = {
        florists: { label: 'お花屋さん', icon: <FiAward />, color: 'text-pink-600', border: 'border-pink-500', typeStr: 'Florist' },
        venues: { label: '会場', icon: <FiMapPin />, color: 'text-blue-600', border: 'border-blue-500', typeStr: 'Venue' },
        organizers: { label: '主催者', icon: <FiCalendar />, color: 'text-purple-600', border: 'border-purple-500', typeStr: 'Organizer' },
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-3xl text-gray-400"/></div>;
    if (user?.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* ヘッダー */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center text-gray-800">
                        <FiAlertTriangle className="mr-2 text-orange-500"/> 審査管理ダッシュボード
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                            未対応: {totalPending}件
                        </div>
                        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 flex items-center transition-colors">
                            <FiLogOut className="mr-1"/> 戻る
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                
                {/* コントロールバー */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
                    {/* タブ */}
                    <nav className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                        {Object.keys(TAB_CONFIG).map((key) => {
                            const isActive = activeTab === key;
                            const config = TAB_CONFIG[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setActiveTab(key); setSearchTerm(''); }}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all
                                        ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                                    `}
                                >
                                    {config.icon}
                                    {config.label}
                                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-gray-100' : 'bg-gray-300 text-white'}`}>
                                        {pendingData[key].length}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* 検索と更新 */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input 
                                type="text"
                                placeholder="名前やメールで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <button 
                            onClick={fetchPendingData} 
                            className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            title="リスト更新"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''}/>
                        </button>
                    </div>
                </div>

                {/* リスト表示エリア */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
                    {filteredList.length > 0 ? (
                        filteredList.map(item => (
                            <ReviewCard 
                                key={item.id} 
                                item={item} 
                                type={TAB_CONFIG[activeTab].typeStr} 
                                onOpenDetail={setSelectedItem}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <FiCheckCircle className="text-3xl text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-600">審査待ちはありません</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchTerm ? '検索条件に一致する申請はありません。' : '現在、このカテゴリの新規申請はすべて処理済みです。'}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* 詳細モーダル */}
            {selectedItem && (
                <DetailModal 
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                    type={TAB_CONFIG[activeTab].typeStr}
                    onAction={handleAction}
                />
            )}
        </div>
    );
}