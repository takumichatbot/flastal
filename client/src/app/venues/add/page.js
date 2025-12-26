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
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    phoneNumber: '',
    website: '',
    isStandAllowed: true,
    regulations: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
        toast.error('ログインが必要です');
        router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldMap = {
        venueName: 'venueName',
        v_addr: 'address',
        v_phone: 'phoneNumber',
        v_web: 'website',
        v_regs: 'regulations'
    };
    const targetField = fieldMap[name] || name;
    setFormData(prev => ({ ...prev, [targetField]: value }));
  };

  const handleGoogleSearch = () => {
    if (!formData.venueName) return toast.error('会場名を入力してください');
    const query = encodeURIComponent(`${formData.venueName} 公式サイト アクセス`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const execSubmit = async () => {
    if (isSubmitting) return;

    const vName = formData.venueName.trim();
    if (!vName) {
        return toast.error('会場名を入力してください');
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    // URLの自動補完
    let finalWebsite = (formData.website || '').trim();
    if (finalWebsite && !finalWebsite.toLowerCase().startsWith('http')) {
        finalWebsite = `https://${finalWebsite}`;
    }

    try {
        const payload = {
            venueName: vName,
            address: (formData.address || '').trim(),
            phoneNumber: (formData.phoneNumber || '').trim(),
            website: finalWebsite,
            isStandAllowed: formData.isStandAllowed,
            regulations: (formData.regulations || '').trim(),
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

        // ★修正ポイント：JSONとして解析する前にステータスをチェックし、中身があるか確認
        let data = {};
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await res.json();
        } else {
            // JSONじゃない場合（HTMLエラーページなど）はテキストとして取得を試みる
            const text = await res.text();
            console.error('Non-JSON response received:', text);
        }

        if (!res.ok) {
            throw new Error(data.message || `サーバーエラーが発生しました (Status: ${res.status})`);
        }

        toast.success('会場情報を共有しました！ご協力ありがとうございます🎉');
        
        // 成功後、一覧へ
        setTimeout(() => {
            router.push('/venues'); 
        }, 800);

    } catch (error) {
        console.error('Submit Error Details:', error);
        // SyntaxError (JSON解析失敗) の場合は、わかりやすいメッセージに変える
        if (error.name === 'SyntaxError') {
            toast.error('サーバーからの応答が正しくありません。しばらく時間をおいて再度お試しください。');
        } else {
            toast.error(error.message || '通信エラーが発生しました');
        }
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
            <Link href="/venues" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
                <FiArrowLeft className="mr-2"/> 会場一覧へ戻る
            </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FiMapPin /> 新しい会場を登録
                </h2>
                <p className="mt-2 text-green-100 text-sm font-medium">情報を共有して推し活を盛り上げましょう</p>
            </div>
            
            <div className="p-8 space-y-8">
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <FiInfo className="text-green-500"/> 基本情報
                    </h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">会場名</label>
                        <div className="flex gap-2">
                            <input
                                name="venueName"
                                type="text"
                                value={formData.venueName}
                                onChange={handleChange}
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 focus:bg-white"
                                placeholder="例：東京ガーデンシアター"
                            />
                            <button type="button" onClick={handleGoogleSearch} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-xs font-bold shrink-0">
                                <FiSearch size={16}/>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">住所</label>
                            <input
                                name="v_addr"
                                type="text"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
                                placeholder="都道府県から入力"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label>
                            <input
                                name="v_phone"
                                type="text" 
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
                                placeholder="例：0312345678"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">公式サイトURL</label>
                        <input
                            name="v_web"
                            type="text" 
                            value={formData.website}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
                            placeholder="example.com"
                        />
                    </div>
                </section>

                <section className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <FiHelpCircle className="text-green-500"/> レギュレーション
                    </h3>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, isStandAllowed: true})}
                            className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${formData.isStandAllowed ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-400 border-gray-300'}`}
                        >
                            <FiCheckCircle /> 受入可
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, isStandAllowed: false})}
                            className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${!formData.isStandAllowed ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-gray-400 border-gray-300'}`}
                        >
                            <FiXCircle /> 禁止
                        </button>
                    </div>
                    <textarea
                        name="v_regs"
                        rows="4"
                        value={formData.regulations}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
                        placeholder="搬入時間、サイズ指定、回収規定など..."
                    ></textarea>
                </section>

                <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
                    <Link href="/venues" className="w-full sm:w-1/3">
                        <button type="button" className="w-full py-4 border border-gray-300 rounded-2xl text-gray-600 font-bold hover:bg-gray-50">
                            キャンセル
                        </button>
                    </Link>
                    <button
                        type="button"
                        onClick={execSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-2/3 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-100 disabled:bg-gray-300 active:scale-95 transition-all flex justify-center items-center"
                    >
                        {isSubmitting ? <FiLoader className="animate-spin mr-2"/> : <><FiSave className="mr-2"/> 情報を登録する</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}