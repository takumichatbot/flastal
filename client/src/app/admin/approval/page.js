'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
    FiCheckCircle, FiXCircle, FiClock, FiUsers, FiAward, 
    FiMapPin, FiCalendar, FiLogOut, FiRefreshCw, FiLoader, 
    FiSearch, FiEye, FiX, FiAlertTriangle, FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 認証トークンを確実に取得する関数
const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    if (!rawToken) return null;
    return rawToken.replace(/^"|"$/g, '').trim();
};

// --- 詳細確認モーダル ---
function DetailModal({ isOpen, onClose, item, type, onAction }) {
    if (!isOpen || !item) return null;

    const details = [
        { label: '登録ID', value: item.id },
        { label: 'メールアドレス', value: item.email },
        { label: '申請日時', value: new Date(item.createdAt).toLocaleString() },
        { label: '現在の状態', value: item.status, isBadge: true },
        ...(type === 'Florist' ? [
            { label: '店舗名', value: item.shopName },
            { label: '屋号・活動名', value: item.platformName },
            { label: 'ポートフォリオURL', value: item.portfolio, isLink: true },
            { label: '紹介文', value: item.bio, isLongText: true },
        ] : []),
        ...(type === 'Venue' ? [
            { label: '会場名', value: item.venueName },
            { label: '所在地', value: item.address },
            { label: '収容人数', value: item.capacity },
            { label: '搬入・物流情報', value: item.accessInfo, isLongText: true },
        ] : []),
        ...(type === 'Organizer' ? [
            { label: '主催者・氏名', value: item.name },
            { label: '所属団体', value: item.organization },
            { label: '過去の活動実績', value: item.history, isLongText: true },
        ] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 italic">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest">
                            {type === 'Florist' ? '花屋' : type === 'Venue' ? '会場' : '主催者'}
                        </span>
                        申請内容の確認
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {details.map((detail, idx) => (
                            detail.value && (
                                <div key={idx} className="border-b border-gray-50 pb-4 last:border-0">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                                        {detail.label}
                                    </span>
                                    {detail.isLongText ? (
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium leading-relaxed">
                                            {detail.value}
                                        </p>
                                    ) : detail.isLink ? (
                                        <a href={detail.value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all font-bold text-sm">
                                            {detail.value}
                                        </a>
                                    ) : detail.isBadge ? (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                            {detail.value}
                                        </span>
                                    ) : (
                                        <p className="text-sm text-gray-900 font-bold">{detail.value}</p>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
                    <button
                        onClick={() => onAction('REJECTED')}
                        className="flex-1 bg-white border-2 border-gray-200 text-gray-500 font-black py-4 rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <FiXCircle /> 却下
                    </button>
                    <button
                        onClick={() => onAction('APPROVED')}
                        className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-pink-600 shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <FiCheckCircle /> 承認して登録
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- リストカード ---
function ReviewCard({ item, type, onOpenDetail }) {
    const getDisplayName = () => {
        if (type === 'Florist') return item.platformName || item.shopName || '名称未設定';
        if (type === 'Venue') return item.venueName || '名称未設定';
        if (type === 'Organizer') return item.name || '名称未設定';
        return '不明なアカウント';
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1 text-slate-800">
                    <span className="text-[10px] font-black uppercase text-pink-500 tracking-widest block">
                        {type === 'Florist' ? 'お花屋さん' : type === 'Venue' ? '会場施設' : '主催者'}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 line-clamp-1 italic">{getDisplayName()}</h3>
                </div>
                <div className="bg-orange-50 text-orange-500 p-2 rounded-xl">
                    <FiClock size={18} className="animate-pulse" />
                </div>
            </div>

            <div className="text-[11px] text-gray-400 space-y-2 mb-6 font-bold">
                <p className="truncate flex items-center gap-2"><span className="text-gray-200 uppercase">Email</span> {item.email}</p>
                <p className="flex items-center gap-2"><span className="text-gray-200 uppercase">Date</span> {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>

            <button
                onClick={() => onOpenDetail(item)}
                className="w-full py-4 bg-gray-50 text-gray-900 text-xs font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 border border-gray-100 uppercase tracking-widest"
            >
                <FiEye /> 詳細を確認
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
            setErrorInfo("セッションが見つかりません。");
            setLoading(false);
            return;
        }

        try {
            const fetchOptions = { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                } 
            };
            const [floristRes, venueRes, organizerRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/florists/pending`, fetchOptions),
                fetch(`${API_URL}/api/admin/venues/pending`, fetchOptions),
                fetch(`${API_URL}/api/admin/organizers/pending`, fetchOptions),
            ]);

            if (floristRes.status === 401 || floristRes.status === 403) {
                setErrorInfo("管理者権限が確認できません。再ログインしてください。");
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
            setErrorInfo("データの取得に失敗しました。");
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
        if (activeTab === 'florists') apiUrl = `${API_URL}/api/admin/florists/${selectedItem.id}/status`;
        else if (activeTab === 'venues') apiUrl = `${API_URL}/api/admin/venues/${selectedItem.id}/status`;
        else if (activeTab === 'organizers') apiUrl = `${API_URL}/api/admin/organizers/${selectedItem.id}/status`;

        try {
            const res = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('更新に失敗しました。');

            toast.success(`申請を${status === 'APPROVED' ? '承認' : '却下'}しました`, { id: toastId });
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
    
    if (authLoading || (loading && !errorInfo)) return <div className="min-h-screen bg-white flex items-center justify-center font-sans"><FiLoader className="animate-spin text-pink-500 size-12"/></div>;

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 pt-28">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 w-full z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center text-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white p-2 rounded-xl italic font-black text-xs shadow-lg">FL</div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">Admin Approval</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">未処理</span>
                            <span className="text-sm font-black text-orange-600">{totalPending}件</span>
                        </div>
                        <Link href="/admin" className="text-xs font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest flex items-center gap-2">
                            <FiArrowLeft /> 戻る
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-12 px-6">
                {errorInfo && (
                    <div className="mb-12 bg-rose-50 border-2 border-rose-100 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-rose-500/5 text-slate-800">
                        <div className="flex items-center gap-6">
                            <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-xl"><FiAlertTriangle size={32} /></div>
                            <div className="space-y-1">
                                <p className="font-black text-rose-900 text-xl tracking-tight italic">権限エラー</p>
                                <p className="text-rose-700/60 text-sm font-bold uppercase tracking-widest">{errorInfo}</p>
                            </div>
                        </div>
                        <button onClick={() => { logout(); router.push('/login'); }} className="px-10 py-5 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95">再ログインして修復</button>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-8 mb-12">
                    <nav className="flex space-x-2 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 text-slate-800">
                        {[
                            { id: 'florists', label: 'お花屋さん', icon: <FiAward /> },
                            { id: 'venues', label: '会場施設', icon: <FiMapPin /> },
                            { id: 'organizers', label: 'イベント主催者', icon: <FiCalendar /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {tab.icon} {tab.label}
                                <span className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {pendingData[tab.id].length}
                                </span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80 group text-slate-800">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-colors" size={20}/>
                            <input 
                                type="text"
                                placeholder="名前やメールで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-200 text-slate-800"
                            />
                        </div>
                        <button onClick={fetchPendingData} className="p-5 bg-slate-900 text-white rounded-[1.5rem] hover:bg-pink-600 transition-all shadow-xl active:scale-90">
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={22}/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredList.length > 0 ? (
                        filteredList.map(item => (
                            <ReviewCard 
                                key={item.id} 
                                item={item} 
                                type={tabTypeToStr(activeTab)} 
                                onOpenDetail={setSelectedItem}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                            <div className="bg-slate-50 size-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                                <FiCheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-widest text-slate-800">All Cleared</h3>
                            <p className="text-slate-300 text-sm mt-3 font-bold uppercase tracking-widest">現在、承認待ちの申請はありません</p>
                        </div>
                    )}
                </div>
            </main>

            {selectedItem && (
                <DetailModal 
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                    type={tabTypeToStr(activeTab)}
                    onAction={handleAction}
                />
            )}
            <style jsx global>{` body { background-color: #fafafa; } `}</style>
        </div>
    );
}

function tabTypeToStr(tab) {
    if (tab === 'florists') return 'Florist';
    if (tab === 'venues') return 'Venue';
    return 'Organizer';
}