'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, Suspense } from 'react';
import toast from 'react-hot-toast';
import { 
  FiSave, FiSettings, FiMail, FiPercent, FiRefreshCw, 
  FiArrowLeft, FiAlertTriangle, FiLoader, FiEdit3
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('authToken')?.replace(/^"|"$/g, '') || '';
};

// --- サブコンポーネント (修正済み) ---
const EmailTemplateManager = () => {
    const router = useRouter(); // routerを使えるようにする

    return (
        <div className="bg-white p-8 rounded-b-xl shadow-sm border border-gray-200 border-t-0 text-center py-20 animate-fadeIn">
            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiMail className="text-4xl text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">メールテンプレート管理機能</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                承認メールや却下メールなど、システムから送信される自動メールの文面を編集・カスタマイズできます。
            </p>
            {/* ★ onClickを追加し、テンプレート一覧ページへ飛ばす */}
            <button 
                onClick={() => router.push('/admin/email-templates')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
                <FiEdit3 /> テンプレートエディタを開く
            </button>
        </div>
    );
};

/**
 * 管理者設定のメインロジック
 */
function AdminSettingsInner() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('general');
    const [generalSettings, setGeneralSettings] = useState(null);
    const [loadingGeneral, setLoadingGeneral] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [displayFeeRate, setDisplayFeeRate] = useState(''); 

    const fetchGeneralSettings = useCallback(async () => {
        if (!isAuthenticated || user?.role !== 'ADMIN') return;
        setLoadingGeneral(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/settings`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!res.ok) throw new Error('設定データの取得に失敗しました');
            const data = await res.json();
            setGeneralSettings(data);
            if (data.platformFeeRate !== undefined) {
                setDisplayFeeRate((data.platformFeeRate * 100).toFixed(1).replace(/\.0$/, ''));
            } else {
                setDisplayFeeRate('10');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoadingGeneral(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません。');
            router.push('/admin');
            return;
        }
        fetchGeneralSettings();
    }, [authLoading, isAuthenticated, user, router, fetchGeneralSettings]);

    const handleSaveGeneral = async (e) => {
        e.preventDefault();
        const rateFloat = parseFloat(displayFeeRate);
        if (isNaN(rateFloat) || rateFloat < 0 || rateFloat > 100) {
            toast.error('手数料率は 0% ～ 100% の間で設定してください');
            return;
        }
        setSavingGeneral(true);
        const toastId = toast.loading('設定を保存中...');
        try {
            const token = getAuthToken();
            const payload = { platformFeeRate: rateFloat / 100 };
            const res = await fetch(`${API_URL}/api/admin/settings`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('保存に失敗しました');
            const updated = await res.json();
            setGeneralSettings(updated);
            toast.success('全体設定を保存しました', { id: toastId });
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setSavingGeneral(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FiRefreshCw className="animate-spin text-3xl text-gray-400"/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-700">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-gray-500 shadow-sm">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiSettings className="text-gray-600"/> システム設定
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">手数料率やメールの管理を行います。</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-0 overflow-x-auto">
                    <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl border-b-0 relative top-[1px] z-10 transition-all ${activeTab === 'general' ? 'bg-white text-pink-600 border border-gray-200 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        <FiPercent /> 手数料・基本設定
                    </button>
                    <button onClick={() => setActiveTab('email')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl border-b-0 relative top-[1px] z-10 transition-all ${activeTab === 'email' ? 'bg-white text-indigo-600 border border-gray-200 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        <FiMail /> メールテンプレート
                    </button>
                </div>

                {activeTab === 'general' && (
                    <div className="bg-white p-8 rounded-b-xl rounded-tr-xl shadow-sm border border-gray-200 animate-fadeIn">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b">手数料設定</h2>
                        {loadingGeneral ? (
                            <div className="py-20 text-center text-gray-400">読み込み中...</div>
                        ) : (
                            <form onSubmit={handleSaveGeneral} className="max-w-2xl">
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">プラットフォーム手数料率</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-40">
                                            <input 
                                                type="number" 
                                                value={displayFeeRate}
                                                onChange={(e) => setDisplayFeeRate(e.target.value)}
                                                className="w-full p-3 border rounded-lg text-2xl font-bold text-right pr-10 outline-none focus:ring-2 focus:ring-pink-500/50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="mt-8 flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                                    {savingGeneral ? <FiRefreshCw className="animate-spin"/> : <FiSave />} 保存する
                                </button>
                            </form>
                        )}
                    </div>
                )}
                {activeTab === 'email' && <EmailTemplateManager />}
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <FiLoader className="animate-spin text-indigo-500 text-3xl" />
            </div>
        }>
            <AdminSettingsInner />
        </Suspense>
    );
}