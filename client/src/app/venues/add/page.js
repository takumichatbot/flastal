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

// APIのベースURLを確実に定義
const BASE_API_URL = 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  // トークンのクォートを除去
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function AddVenuePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  
  // 入力データ
  const [vName, setVName] = useState('');
  const [vAddr, setVAddr] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vWeb, setVWeb] = useState('');
  const [vRegs, setVRegs] = useState('');
  const [isStandAllowed, setIsStandAllowed] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 認証チェック
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

  // 【重要】ブラウザの「フォームバリデーション」を一切介さず、ボタンから直接実行
  const handleFinalSubmit = async (e) => {
    // もしイベントが渡されていれば停止
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    if (isSubmitting) return;

    // 最小限のバリデーション
    const cleanName = vName.trim();
    if (!cleanName) {
        return toast.error('会場名を入力してください');
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
        // fetchの宛先を確実にフルパスで指定
        const response = await fetch(`${BASE_API_URL}/api/venues`, {
            method: 'POST',
            mode: 'cors', // CORSを明示
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        // 401（未認証）エラー
        if (response.status === 401) {
            toast.error('セッションが切れました。ログインし直してください。');
            if (logout) logout();
            router.push('/login');
            return;
        }

        // 404（エンドポイント不在）またはその他のエラー
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error Response:', errorText);
            throw new Error(`サーバーエラー (${response.status})`);
        }

        const data = await response.json();
        toast.success('会場情報を登録しました！ご協力ありがとうございます🎉');
        
        // 成功したら一覧へ
        router.push('/venues');

    } catch (error) {
        console.error('Final Submission Error:', error);
        toast.error(error.message || '登録中に通信エラーが発生しました');
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
            <Link href="/venues" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-all">
                <FiArrowLeft className="mr-2"/> 会場一覧へ戻る
            </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10"><FiMapPin size={100}/></div>
                <h2 className="text-2xl font-bold flex items-center gap-2 relative z-10">
                    <FiMapPin className="text-green-400" /> 会場情報を登録
                </h2>
                <p className="mt-2 text-slate-400 text-xs font-bold uppercase tracking-widest relative z-10">Register Venue Data</p>
            </div>
            
            {/* ★ formタグを使わないことでSafariのバリデーションバグを物理的に封印 */}
            <div className="p-8 space-y-10">
                
                <section className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <FiInfo /> Information
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">会場名 <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={vName}
                                    onChange={(e) => setVName(e.target.value)}
                                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold"
                                    placeholder="例：東京ガーデンシアター"
                                />
                                <button type="button" onClick={handleGoogleSearch} className="px-5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                                    <FiSearch size={20}/>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">住所</label>
                                <input
                                    type="text"
                                    value={vAddr}
                                    onChange={(e) => setVAddr(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold"
                                    placeholder="都道府県から入力"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">電話番号</label>
                                <input
                                    type="text" 
                                    value={vPhone}
                                    onChange={(e) => setVPhone(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold"
                                    placeholder="例：0300000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">公式サイトURL</label>
                            <input
                                type="text" 
                                value={vWeb}
                                onChange={(e) => setVWeb(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold"
                                placeholder="example.com"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <FiHelpCircle /> Regulation
                    </h3>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsStandAllowed(true)}
                            className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black transition-all ${isStandAllowed ? 'bg-green-600 border-green-600 text-white shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-300 hover:bg-slate-50'}`}
                        >
                            <FiCheckCircle /> 受入可 (目安)
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsStandAllowed(false)}
                            className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black transition-all ${!isStandAllowed ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-white border-slate-100 text-slate-300 hover:bg-slate-50'}`}
                        >
                            <FiXCircle /> 全面的に禁止
                        </button>
                    </div>
                    <textarea
                        rows="5"
                        value={vRegs}
                        onChange={(e) => setVRegs(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 focus:bg-white focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold"
                        placeholder="サイズ規定、回収の要否などを入力してください"
                    ></textarea>
                </section>

                <div className="pt-8 border-t flex flex-col sm:flex-row gap-4">
                    <button 
                        type="button" 
                        onClick={() => router.back()}
                        className="w-full sm:w-1/3 py-5 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-2/3 py-5 bg-green-600 text-white rounded-2xl font-black shadow-2xl shadow-green-200 disabled:bg-slate-200 active:scale-95 transition-all flex justify-center items-center"
                    >
                        {isSubmitting ? (
                            <><FiLoader className="animate-spin mr-2"/> 送信中...</>
                        ) : (
                            <><FiSave className="mr-2"/> 会場を登録する</>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}