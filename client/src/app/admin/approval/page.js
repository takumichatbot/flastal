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

// 認証トークンを確実に取得する関数（修正ポイント）
const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    // 前後の引用符を確実に削除
    return rawToken ? rawToken.replace(/^"|"$/g, '').trim() : null;
};

// --- 詳細確認モーダル ---
function DetailModal({ isOpen, onClose, item, type, onAction }) {
    if (!isOpen || !item) return null;

    const details = [
        { label: 'ID', value: item.id },
        { label: 'メールアドレス', value: item.email },
        { label: '登録日', value: new Date(item.createdAt).toLocaleString() },
        { label: 'ステータス', value: item.status, isBadge: true },
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs uppercase">{type}</span>
                        申請情報の確認
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <FiX size={24} className="text-gray-500" />
                    </button>
                </div>

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

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                    <button
                        onClick={() => onAction('REJECTED')}
                        className="flex-1 bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <FiXCircle /> 却下する
                    </button>
                    <button
                        onClick={() => onAction('APPROVED')}
                        className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <FiCheckCircle /> 承認する
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- 審査カード ---
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
        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all group">
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
                <p className="truncate"><span className="font-semibold">Email:</span> {item.email}</p>
                <p><span className="font-semibold">日付:</span> {new Date(item.createdAt).toLocaleDateString()}</p>
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
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [pendingData, setPendingData] = useState({ florists: [], venues: [], organizers: [] });
    const [loading, setLoading] = useState(true);
    const [errorInfo, setErrorInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('florists');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchPendingData = useCallback(async () => {
        setLoading(true);
        setErrorInfo(null);
        const token = getAuthToken();
        if (!token) {
            setErrorInfo("認証トークンが見つかりません。");
            setLoading(false);
            return;
        }

        try {
            const fetchOptions = { headers: { 'Authorization': `Bearer ${token}` } };
            const [floristRes, venueRes, organizerRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/florists/pending`, fetchOptions),
                fetch(`${API_URL}/api/admin/venues/pending`, fetchOptions),
                fetch(`${API_URL}/api/admin/organizers/pending`, fetchOptions),
            ]);

            // 認証エラーのチェック
            if (floristRes.status === 401 || floristRes.status === 403) {
                setErrorInfo("管理者権限が確認できませんでした。再ログインしてください。");
                return;
            }

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
            setErrorInfo("データの取得に失敗しました。サーバーの接続を確認してください。");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (user?.role !== 'ADMIN') {
                router.push('/login');
            } else {
                fetchPendingData();
            }
        }
    }, [authLoading, user, router, fetchPendingData]);

    const handleAction = async (status) => {
        if (!selectedItem) return;
        const toastId = toast.loading('処理を実行中...');
        const token = getAuthToken();
        
        let apiUrl = '';
        let typeLabel = '';
        if (activeTab === 'florists') { apiUrl = `${API_URL}/api/admin/florists/${selectedItem.id}/status`; typeLabel = 'お花屋さん'; }
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

            if (!res.ok) throw new Error('更新に失敗しました。権限を確認してください。');

            toast.success(`${typeLabel}を${status === 'APPROVED' ? '承認' : '却下'}しました`, { id: toastId });
            setSelectedItem(null);
            fetchPendingData();

        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

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
    
    const TAB_CONFIG = {
        florists: { label: 'お花屋さん', icon: <FiAward />, typeStr: 'Florist' },
        venues: { label: '会場', icon: <FiMapPin />, typeStr: 'Venue' },
        organizers: { label: '主催者', icon: <FiCalendar />, typeStr: 'Organizer' },
    };

    if (authLoading || loading && !errorInfo) return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-3xl text-gray-400"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pt-24">
            <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center text-gray-800 italic">
                        <FiAlertTriangle className="mr-2 text-orange-500"/> APPROVAL SYSTEM
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-black bg-orange-500 text-white px-3 py-1 rounded-full animate-pulse">
                            未対応: {totalPending}件
                        </div>
                        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-800 flex items-center font-bold">
                            <FiLogOut className="mr-1"/> 戻る
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4">
                {errorInfo && (
                    <div className="mb-10 bg-rose-50 border-2 border-rose-100 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-rose-500 text-white p-3 rounded-2xl shadow-lg"><FiAlertTriangle size={24} /></div>
                            <div>
                                <p className="font-black text-rose-900">アクセス権限エラー</p>
                                <p className="text-rose-700/70 text-sm font-bold">{errorInfo}</p>
                            </div>
                        </div>
                        <button onClick={() => { logout(); router.push('/login'); }} className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">
                            再ログインして解決
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
                    <nav className="flex space-x-1 bg-gray-200 p-1 rounded-xl">
                        {Object.keys(TAB_CONFIG).map((key) => {
                            const isActive = activeTab === key;
                            const config = TAB_CONFIG[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setActiveTab(key); setSearchTerm(''); }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black transition-all ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {config.icon} {config.label}
                                    <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-orange-500 text-white' : 'bg-gray-300 text-white'}`}>
                                        {pendingData[key].length}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500"/>
                            <input 
                                type="text"
                                placeholder="名前やメールで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                            />
                        </div>
                        <button onClick={fetchPendingData} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-pink-500 transition-all shadow-sm">
                            <FiRefreshCw className={loading ? 'animate-spin' : ''}/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <FiCheckCircle className="text-5xl text-gray-100 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-gray-400 italic uppercase">All Cleared</h3>
                            <p className="text-gray-300 text-sm mt-2 font-bold">現在、承認待ちの申請はありません</p>
                        </div>
                    )}
                </div>
            </main>

            {selectedItem && (
                <DetailModal 
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                    type={TAB_CONFIG[activeTab].typeStr}
                    onAction={handleAction}
                />
            )}
            <style jsx global>{` body { background-color: #f9fafb; } `}</style>
        </div>
    );
}