// src/app/admin/approval/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiClock, FiUsers, FiAward, FiMapPin, FiCalendar, FiLogOut, FiRefreshCw, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// --- 審査カードコンポーネント ---
function ReviewCard({ item, type, onUpdate }) {
    const [isProcessing, setIsProcessing] = useState(false);
    
    // バックエンドの審査 API に合わせて URL を決定
    const getApiUrl = (itemId) => {
        switch (type) {
            case 'Florist': return `${API_URL}/api/admin/florists/${itemId}/status`;
            case 'Venue': return `${API_URL}/api/admin/venues/${itemId}/status`;
            case 'Organizer': return `${API_URL}/api/admin/organizers/${itemId}/status`;
            default: return '';
        }
    };
    
    const handleAction = async (status) => {
        if (!window.confirm(`${type} ${item.email} を ${status === 'APPROVED' ? '承認' : '却下'} しますか？`)) {
            return;
        }

        setIsProcessing(true);
        const toastId = toast.loading(`${type}を審査中...`);
        const token = getAuthToken();
        const apiUrl = getApiUrl(item.id);

        if (!apiUrl) {
            toast.error('無効なアカウントタイプです。', { id: toastId });
            setIsProcessing(false);
            return;
        }

        try {
            const res = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || '審査の更新に失敗しました。');
            }

            toast.success(`${type}アカウントを${status === 'APPROVED' ? '承認' : '却下'}しました。`, { id: toastId });
            onUpdate(); // 親コンポーネントのリストを更新
            
        } catch (error) {
            console.error('Admin Review Error:', error);
            toast.error(error.message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'Florist': return <FiAward className="w-6 h-6 text-pink-600"/>;
            case 'Venue': return <FiMapPin className="w-6 h-6 text-blue-600"/>;
            case 'Organizer': return <FiCalendar className="w-6 h-6 text-purple-600"/>;
            default: return <FiUsers className="w-6 h-6 text-gray-600"/>;
        }
    };

    const getDisplayName = () => {
        if (type === 'Florist') return item.platformName || item.shopName || '名称未設定';
        if (type === 'Venue') return item.venueName || '名称未設定';
        if (type === 'Organizer') return item.name || '名称未設定';
        return '不明なアカウント';
    };
    
    // アイテムのプロパティの有無を確認
    const hasPortfolio = item.portfolio && item.portfolio.length > 0;
    const hasAddress = item.address && item.address.length > 0;

    return (
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-3 border-b pb-3">
                    {getIcon()}
                    <div>
                        <span className="text-xs font-semibold uppercase text-gray-500">{type}アカウント</span>
                        <h3 className="text-lg font-bold text-gray-900">{getDisplayName()}</h3>
                    </div>
                </div>

                <div className="text-sm space-y-2 mb-4">
                    <p><strong>メール:</strong> {item.email}</p>
                    {item.shopName && <p><strong>実店舗名:</strong> {item.shopName}</p>}
                    <p><strong>住所:</strong> {hasAddress ? item.address : '未登録'}</p>
                    {type === 'Florist' && (
                        <p className={`line-clamp-2 ${hasPortfolio ? '' : 'text-red-500'}`}>
                            <strong>ポートフォリオ:</strong> {hasPortfolio ? item.portfolio : 'ポートフォリオ情報が不足しています'}
                        </p>
                    )}
                    <p className="text-xs text-gray-400">申請日時: {new Date(item.createdAt).toLocaleString()}</p>
                </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
                <button
                    onClick={() => handleAction('APPROVED')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400"
                >
                    <FiCheckCircle size={18}/> 承認
                </button>
                <button
                    onClick={() => handleAction('REJECTED')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400"
                >
                    <FiXCircle size={18}/> 却下
                </button>
            </div>
        </div>
    );
}

// --- Main Approval Component ---
export default function AdminApprovalPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [pendingData, setPendingData] = useState({
        florists: [],
        venues: [],
        organizers: [],
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('florists');

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
                florists: florists.filter(f => f.status === 'PENDING'),
                venues: venues.filter(v => v.status === 'PENDING'),
                organizers: organizers.filter(o => o.status === 'PENDING'),
            });
            
        } catch (error) {
            console.error('Error fetching pending data:', error);
            toast.error('審査待ちデータの取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (user?.role !== 'ADMIN') {
                toast.error('管理者権限がありません。');
                router.push('/');
            } else {
                fetchPendingData();
            }
        }
    }, [authLoading, user, router, fetchPendingData]);

    const totalPending = pendingData.florists.length + pendingData.venues.length + pendingData.organizers.length;
    
    // ロード中UI
    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <FiLoader className="animate-spin w-8 h-8 text-pink-500" />
            </div>
        );
    }
    
    // 最終認証チェック
    if (user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-gray-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold flex items-center">
                        <FiClock className="mr-3 text-yellow-400"/> アカウント審査管理
                    </h1>
                    <Link href="/admin" className="text-sm font-medium text-gray-300 hover:text-white flex items-center">
                        <FiLogOut className="mr-2"/> ダッシュボードに戻る
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                
                <div className="mb-8 flex justify-between items-center bg-white p-5 rounded-xl shadow-md border border-orange-100">
                    <h2 className="text-2xl font-bold text-gray-800">
                        🚨 審査待ちアカウント ({totalPending} 件)
                    </h2>
                    <button onClick={fetchPendingData} disabled={loading} className="flex items-center gap-2 text-sm text-pink-600 font-semibold hover:underline disabled:text-gray-400">
                        {loading ? <FiRefreshCw className="animate-spin"/> : <FiRefreshCw />}
                        リストを更新
                    </button>
                </div>
                
                {/* タブナビゲーション */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        <TabButton 
                            title={`お花屋さん (${pendingData.florists.length})`} 
                            active={activeTab === 'florists'} 
                            onClick={() => setActiveTab('florists')}
                        />
                         <TabButton 
                            title={`会場 (${pendingData.venues.length})`} 
                            active={activeTab === 'venues'} 
                            onClick={() => setActiveTab('venues')}
                        />
                         <TabButton 
                            title={`主催者 (${pendingData.organizers.length})`} 
                            active={activeTab === 'organizers'} 
                            onClick={() => setActiveTab('organizers')}
                        />
                    </nav>
                </div>

                {/* 審査待ちリスト表示 */}
                <div className="space-y-10">
                    {/* お花屋さん (Florist) 審査 */}
                    {activeTab === 'florists' && (
                        <ReviewSection data={pendingData.florists} type="Florist" onUpdate={fetchPendingData} />
                    )}

                    {/* 会場 (Venue) 審査 */}
                    {activeTab === 'venues' && (
                        <ReviewSection data={pendingData.venues} type="Venue" onUpdate={fetchPendingData} />
                    )}

                    {/* 主催者 (Organizer) 審査 */}
                    {activeTab === 'organizers' && (
                        <ReviewSection data={pendingData.organizers} type="Organizer" onUpdate={fetchPendingData} />
                    )}
                    
                    {totalPending === 0 && (
                        <div className="text-center py-20 bg-green-50 rounded-xl border border-green-200 text-green-800 font-bold">
                            <FiCheckCircle className="w-10 h-10 mx-auto mb-4"/>
                            現在、対応すべき審査待ちアカウントはありません。
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// ヘルパーコンポーネント: タブボタン
const TabButton = ({ title, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium transition-colors ${active ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
        {title}
    </button>
);

// ヘルパーコンポーネント: 審査リストセクション
const ReviewSection = ({ data, type, onUpdate }) => {
    if (data.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">{type} の新規審査待ちアカウントはありません。</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map(item => (
                <ReviewCard 
                    key={item.id} 
                    item={item} 
                    type={type} 
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
};