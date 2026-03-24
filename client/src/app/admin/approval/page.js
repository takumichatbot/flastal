'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// lucide-reactに統一
import { 
    CheckCircle2, XCircle, Clock, Users, Award, 
    MapPin, Calendar, LogOut, RefreshCw, Loader2, 
    Search, Eye, X, AlertTriangle, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^["']|["']$/g, '').trim() : null;
};

const GlassCard = ({ children, className }) => (
  <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6", className)}>
    {children}
  </div>
);

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
            { label: '搬入・物流情報', value: item.accessInfo, isLongText: true },
        ] : []),
        ...(type === 'Organizer' ? [
            { label: '主催者・氏名', value: item.name },
            { label: '所属団体', value: item.organization },
            { label: '過去の活動実績', value: item.history, isLongText: true },
        ] : []),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                    <h3 className="text-xl font-black flex items-center gap-2 text-slate-800">
                        <span className="bg-sky-500 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest shadow-sm">
                            {type === 'Florist' ? 'お花屋さん' : type === 'Venue' ? '会場' : '主催者'}
                        </span>
                        申請内容の確認
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white shadow-sm hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-6 bg-white">
                    <div className="grid grid-cols-1 gap-6">
                        {details.map((detail, idx) => (
                            detail.value && (
                                <div key={idx} className="border-b border-slate-50 pb-4 last:border-0">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{detail.label}</span>
                                    {detail.isLongText ? (
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50/80 p-5 rounded-[1.5rem] border border-slate-100 font-bold leading-relaxed">{detail.value}</p>
                                    ) : detail.isLink ? (
                                        <a href={detail.value} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline break-all font-black text-sm">{detail.value}</a>
                                    ) : detail.isBadge ? (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-amber-200">{detail.value}</span>
                                    ) : (
                                        <p className="text-sm text-slate-800 font-black">{detail.value}</p>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>

                <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4">
                    <button onClick={() => onAction('REJECTED')} className="flex-1 bg-white border-2 border-slate-200 text-slate-500 font-black py-4 rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
                        <XCircle size={18}/> 申請を却下
                    </button>
                    <button onClick={() => onAction('APPROVED')} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-sky-500 shadow-xl transition-all flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 size={18}/> 承認して登録
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function ReviewCard({ item, type, onOpenDetail }) {
    const getDisplayName = () => {
        if (type === 'Florist') return item.platformName || item.shopName || '名称未設定';
        if (type === 'Venue') return item.venueName || '名称未設定';
        if (type === 'Organizer') return item.name || '名称未設定';
        return '不明なアカウント';
    };

    return (
        <GlassCard className="!p-8 transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:border-sky-200">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-sky-500 tracking-widest block bg-sky-50 w-fit px-2 py-0.5 rounded-md border border-sky-100">
                        {type === 'Florist' ? 'お花屋さん' : type === 'Venue' ? '会場施設' : '主催者'}
                    </span>
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1">{getDisplayName()}</h3>
                </div>
                <div className="bg-amber-50 text-amber-500 p-2.5 rounded-xl border border-amber-100 shadow-sm shrink-0">
                    <Clock size={18} className="animate-pulse" />
                </div>
            </div>

            <div className="text-xs text-slate-500 space-y-3 mb-8 font-bold bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <p className="truncate flex items-center gap-2"><span className="text-[9px] text-slate-400 uppercase tracking-widest w-10">Email</span> <span className="text-slate-700">{item.email}</span></p>
                <p className="flex items-center gap-2"><span className="text-[9px] text-slate-400 uppercase tracking-widest w-10">Date</span> <span className="text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</span></p>
            </div>

            <button onClick={() => onOpenDetail(item)} className="w-full py-4 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-sky-500 transition-all flex items-center justify-center gap-2 tracking-widest shadow-lg">
                <Eye size={16}/> 内容を確認
            </button>
        </GlassCard>
    );
}

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
            setErrorInfo("認証トークンが見つかりません。再ログインしてください。");
            setLoading(false);
            return;
        }

        try {
            const fetchOptions = { headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' } };
            const [floristRes, venueRes, organizerRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/florists/pending`, fetchOptions),
                fetch(`${API_URL}/api/admin/venues/pending`, fetchOptions),
                fetch(`${API_URL}/api/admin/organizers/pending`, fetchOptions),
            ]);

            if (floristRes.status === 401 || floristRes.status === 403) {
                setErrorInfo("管理者権限エラーです。一度ログアウトし、再ログインしてください。");
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
            setErrorInfo("データの取得に失敗しました。接続を確認してください。");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (user?.role !== 'ADMIN') router.push('/login');
            else fetchPendingData();
        }
    }, [authLoading, user, router, fetchPendingData]);

    const handleAction = async (status) => {
        if (!selectedItem) return;
        const toastId = toast.loading('処理中...');
        const token = getAuthToken();
        
        let apiUrl = '';
        if (activeTab === 'florists') apiUrl = `${API_URL}/api/admin/florists/${selectedItem.id}/status`;
        else if (activeTab === 'venues') apiUrl = `${API_URL}/api/admin/venues/${selectedItem.id}/status`;
        else if (activeTab === 'organizers') apiUrl = `${API_URL}/api/admin/organizers/${selectedItem.id}/status`;

        try {
            const res = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('承認処理に失敗しました。');

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
    
    if (authLoading || (loading && !errorInfo)) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-sky-500 size-12"/></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/50 font-sans text-slate-800 pb-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />

            <header className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl font-black text-xs shadow-lg">FL</div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-2"><ShieldCheck className="text-sky-500" size={20}/> 審査管理</h1>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden md:flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">未処理</span>
                            <span className="text-sm font-black text-amber-700">{totalPending}件</span>
                        </div>
                        <Link href="/admin" className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest flex items-center gap-1.5 bg-white px-4 py-2.5 rounded-full shadow-sm border border-slate-100">
                            <ArrowLeft size={14}/> Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 relative z-10">
                {errorInfo && (
                    <div className="mb-10 bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-rose-500/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-xl"><AlertTriangle size={28} /></div>
                            <div>
                                <p className="font-black text-rose-900 text-lg tracking-tight">アクセスエラー</p>
                                <p className="text-rose-700/80 text-xs font-bold uppercase tracking-widest mt-1">{errorInfo}</p>
                            </div>
                        </div>
                        <button onClick={() => { logout(); router.push('/login'); }} className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase hover:bg-rose-600 transition-all shadow-md active:scale-95">再ログインして修復</button>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6 mb-10">
                    <nav className="flex space-x-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white overflow-x-auto no-scrollbar w-full lg:w-auto">
                        {[
                            { id: 'florists', label: 'お花屋さん', icon: <Award size={16}/> },
                            { id: 'venues', label: '会場施設', icon: <MapPin size={16}/> },
                            { id: 'organizers', label: '主催者', icon: <Calendar size={16}/> }
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                                className={cn("flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-black transition-all uppercase tracking-widest shrink-0", activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50')}
                            >
                                {tab.icon} {tab.label}
                                <span className={cn("ml-1 px-2 py-0.5 rounded-full text-[10px]", activeTab === tab.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400')}>{pendingData[tab.id].length}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-72">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                            <input type="text" placeholder="名前やメールで検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-white rounded-full text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-300 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <button onClick={fetchPendingData} className="w-14 h-14 shrink-0 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-full hover:bg-slate-50 hover:text-sky-600 transition-all shadow-sm active:scale-90">
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={20}/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                    {filteredList.length > 0 ? (
                        filteredList.map(item => <ReviewCard key={item.id} item={item} type={tabTypeToStr(activeTab)} onOpenDetail={setSelectedItem} />)
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white/60 backdrop-blur-md rounded-[3rem] border border-white shadow-sm">
                            <div className="bg-slate-100 size-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">未処理の申請はありません</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">現在、すべての申請が処理済みです🎉</p>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {selectedItem && (
                    <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} type={tabTypeToStr(activeTab)} onAction={handleAction} />
                )}
            </AnimatePresence>
        </div>
    );
}

function tabTypeToStr(tab) {
    if (tab === 'florists') return 'Florist';
    if (tab === 'venues') return 'Venue';
    return 'Organizer';
}