'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { 
  FiMapPin, FiInfo, FiGlobe, FiPhone, FiSave, FiArrowLeft, 
  FiCheckCircle, FiXCircle, FiHelpCircle, FiSearch, FiLoader 
} from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function AddVenuePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  // ブラウザの自動補完やバリデーションを避けるため、内部ステートと入力欄の名前を完全に切り離します
  const [vName, setVName] = useState('');
  const [vAddr, setVAddr] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vWeb, setVWeb] = useState('');
  const [vRegs, setVRegs] = useState('');
  const [isStandAllowed, setIsStandAllowed] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
        toast.error('ログインが必要です');
        router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleGoogleSearch = () => {
    if (!vName) return toast.error('会場名を入力してください');
    const query = encodeURIComponent(`${vName} 公式サイト アクセス`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  // ボタンから直接呼び出す「純粋なJavaScript」としての送信処理
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    if (!vName || !vName.trim()) {
        return toast.error('会場名を入力してください');
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    // URLの自動補完
    let finalWebsite = (vWeb || '').trim();
    if (finalWebsite && !finalWebsite.toLowerCase().startsWith('http')) {
        finalWebsite = `https://${finalWebsite}`;
    }

    try {
        const payload = {
            venueName: vName.trim(),
            address: vAddr.trim(),
            phoneNumber: vPhone.trim(),
            website: finalWebsite,
            isStandAllowed: isStandAllowed,
            regulations: vRegs.trim(),
            submittedBy: user?.id 
        };

        const res = await fetch(`${API_URL}/api/venues`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        // 通信レベルのチェック
        if (res.status === 401) {
            toast.error('ログイン期限が切れました。再ログインしてください。');
            logout();
            router.push('/login');
            return;
        }

        // 成功・失敗の判定
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(responseData.message || `登録に失敗しました (Status: ${res.status})`);
        }

        toast.success('会場情報を登録しました！');
        
        // リダイレクト
        setTimeout(() => {
            window.location.href = '/venues';
        }, 500);

    } catch (error) {
        console.error('Submission error:', error);
        toast.error(error.message || '通信エラーが発生しました。');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
            <Link href="/venues" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600">
                <FiArrowLeft className="mr-2"/> 会場一覧へ戻る
            </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-8 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
                    <FiMapPin className="text-green-400" /> 会場情報を登録
                </h2>
                <p className="mt-2 text-slate-400 text-xs font-bold uppercase tracking-widest">Register New Venue</p>
            </div>
            
            {/* FORMタグを使わず、DIVで構成することでブラウザの「期待されるパターン」機能を完全に無力化します */}
            <div className="p-8 space-y-10">
                
                {/* 1. 基本情報 */}
                <section className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <FiInfo /> Information
                    </h3>
                    
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">会場名</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={vName}
                                onChange={(e) => setVName(e.target.value)}
                                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all"
                                placeholder="例：東京ガーデンシアター"
                                autoComplete="off"
                            />
                            <button type="button" onClick={handleGoogleSearch} className="px-5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                                <FiSearch size={20}/>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">住所</label>
                            <input
                                type="text"
                                value={vAddr}
                                onChange={(e) => setVAddr(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all"
                                placeholder="都道府県から入力"
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2">電話番号</label>
                            <input
                                type="text" 
                                value={vPhone}
                                onChange={(e) => setVPhone(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all"
                                placeholder="例：0300000000"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2">公式サイトURL</label>
                        <input
                            type="text" 
                            value={vWeb}
                            onChange={(e) => setVWeb(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all"
                            placeholder="example.com"
                            autoComplete="off"
                        />
                    </div>
                </section>

                {/* 2. レギュレーション */}
                <section className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <FiHelpCircle /> Regulation
                    </h3>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsStandAllowed(true)}
                            className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black transition-all ${isStandAllowed ? 'bg-green-600 border-green-600 text-white shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-300'}`}
                        >
                            <FiCheckCircle /> 受入可
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsStandAllowed(false)}
                            className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black transition-all ${!isStandAllowed ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-white border-slate-100 text-slate-300'}`}
                        >
                            <FiXCircle /> 禁止
                        </button>
                    </div>
                    <textarea
                        rows="5"
                        value={vRegs}
                        onChange={(e) => setVRegs(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all"
                        placeholder="搬入時間、サイズ規定、回収の要否などを入力してください"
                    ></textarea>
                </section>

                <div className="pt-8 border-t flex flex-col sm:flex-row gap-4">
                    <button 
                        type="button" 
                        onClick={() => router.back()}
                        className="w-full sm:w-1/3 py-5 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-2/3 py-5 bg-green-600 text-white rounded-2xl font-black shadow-2xl shadow-green-200 disabled:bg-slate-200 active:scale-95 transition-all flex justify-center items-center"
                    >
                        {isSubmitting ? <FiLoader className="animate-spin mr-2"/> : <><FiSave className="mr-2"/> 会場を登録する</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}