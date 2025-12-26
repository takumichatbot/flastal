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

// APIのURLを確実に固定
const BACKEND_API_URL = 'https://flastal-backend.onrender.com/api/venues';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  if (!rawToken) return null;
  return rawToken.replace(/^"|"$/g, '');
};

export default function AddVenuePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  // ブラウザのバリデーションを避けるため個別のStateで管理
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

  // ★重要：FormのSubmitイベントを使わず、独立した非同期関数として定義
  const handleFinalAction = async () => {
    if (isSubmitting) return;

    const cleanName = vName.trim();
    if (!cleanName) {
        toast.error('会場名を入力してください');
        return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    // URLの自動補完
    let finalWebsite = (vWeb || '').trim();
    if (finalWebsite && !finalWebsite.toLowerCase().startsWith('http')) {
        finalWebsite = `https://${finalWebsite}`;
    }

    const payload = {
        venueName: cleanName,
        address: vAddr.trim(),
        phoneNumber: vPhone.trim(),
        website: finalWebsite,
        isStandAllowed: isStandAllowed,
        regulations: vRegs.trim(),
        submittedBy: user?.id 
    };

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        // 成功判定 (200, 201)
        if (response.ok || response.status === 201 || response.status === 200) {
            toast.success('会場情報を登録しました！');
            // キャッシュを無視して一覧へ強制遷移
            window.location.assign('/venues');
            return;
        }

        if (response.status === 401) {
            toast.error('セッションが切れました。ログインし直してください。');
            if (logout) logout();
            router.push('/login');
            return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `エラー (${response.status})`);

    } catch (error) {
        console.error('Final Submission Error:', error);
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
            <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-all">
                <FiArrowLeft className="mr-2"/> 戻る
            </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-10 text-white relative">
                <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter italic uppercase">
                    <FiMapPin className="text-green-400" /> New Venue
                </h2>
                <p className="mt-2 text-slate-400 text-xs font-bold tracking-widest">Registering Venue Data</p>
            </div>
            
            {/* FORMタグを使用せず、独立した入力フィールドの集合として構成 */}
            <div className="p-8 md:p-12 space-y-10">
                <section className="space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">会場名 *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={vName}
                                    onChange={(e) => setVName(e.target.value)}
                                    className="flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-lg"
                                    placeholder="例：東京ガーデンシアター"
                                />
                                <button type="button" onClick={handleGoogleSearch} className="px-6 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 shrink-0">
                                    <FiSearch size={22}/>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">所在地</label>
                                <input
                                    type="text"
                                    value={vAddr}
                                    onChange={(e) => setVAddr(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 focus:bg-white focus:border-green-500 outline-none transition-all font-bold"
                                    placeholder="都道府県から入力"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">電話番号</label>
                                <input
                                    type="text" 
                                    value={vPhone}
                                    onChange={(e) => setVPhone(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 focus:bg-white focus:border-green-500 outline-none transition-all font-bold"
                                    placeholder="0300000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">公式サイトURL</label>
                            <input
                                type="text" 
                                value={vWeb}
                                onChange={(e) => setVWeb(e.target.value)}
                                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 focus:bg-white focus:border-green-500 outline-none transition-all font-bold"
                                placeholder="example.com"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-green-500 pl-4">規約目安</h3>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsStandAllowed(true)}
                            className={`flex-1 py-5 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${isStandAllowed ? 'bg-green-600 border-green-600 text-white shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-300'}`}
                        >
                            <FiCheckCircle size={20}/> OK
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsStandAllowed(false)}
                            className={`flex-1 py-5 rounded-2xl border-2 flex items-center justify-center gap-3 font-black transition-all ${!isStandAllowed ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-white border-slate-100 text-slate-300'}`}
                        >
                            <FiXCircle size={20}/> NG
                        </button>
                    </div>
                    <textarea
                        rows="5"
                        value={vRegs}
                        onChange={(e) => setVRegs(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 focus:bg-white focus:border-green-500 outline-none transition-all font-bold"
                        placeholder="搬入ルールなど"
                    ></textarea>
                </section>

                <div className="pt-10 border-t">
                    <button
                        type="button"
                        onClick={handleFinalAction}
                        disabled={isSubmitting}
                        className="w-full py-6 bg-green-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-green-200 disabled:bg-slate-200 active:scale-95 transition-all flex justify-center items-center"
                    >
                        {isSubmitting ? <FiLoader className="animate-spin mr-3"/> : <><FiSave className="mr-3"/> 会場を登録する</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}