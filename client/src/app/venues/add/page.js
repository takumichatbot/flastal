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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleGoogleSearch = () => {
    if (!formData.venueName) return toast.error('会場名を入力してください');
    const query = encodeURIComponent(`${formData.venueName} 公式サイト アクセス`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handleSubmit = async (e) => {
    // ブラウザのデフォルトのバリデーション挙動を完全に停止
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 手動バリデーション
    if (!formData.venueName.trim()) {
        return toast.error('会場名を入力してください');
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const token = getAuthToken();

    // URLの自動補完ロジック (より安全な形式)
    let finalWebsite = (formData.website || '').trim();
    if (finalWebsite && !finalWebsite.toLowerCase().startsWith('http')) {
        finalWebsite = `https://${finalWebsite}`;
    }

    try {
        const payload = {
            venueName: formData.venueName.trim(),
            address: formData.address.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            website: finalWebsite,
            isStandAllowed: formData.isStandAllowed,
            regulations: formData.regulations.trim(),
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

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || '登録に失敗しました。');
        }

        toast.success('会場情報を共有しました！ご協力ありがとうございます🎉');
        
        // 成功後、キャッシュを考慮して少し待ってから遷移
        setTimeout(() => {
            router.push('/venues'); 
        }, 500);

    } catch (error) {
        console.error('Venue Registration Error:', error);
        toast.error(error.message || '通信エラーが発生しました');
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
                <p className="mt-2 text-green-100 text-sm font-medium">
                    あなたが知っている会場の情報を共有してください。
                </p>
            </div>
            
            {/* noValidate でブラウザの正規表現チェックを完全に無効化 */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8" noValidate autoComplete="off">
                
                <section className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <FiInfo className="text-green-500"/> 基本情報
                    </h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            会場名 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                name="venueName"
                                type="text"
                                value={formData.venueName}
                                onChange={handleChange}
                                className="flex-1 appearance-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                placeholder="例：東京ガーデンシアター"
                            />
                            <button 
                                type="button"
                                onClick={handleGoogleSearch}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-xs font-bold flex flex-col items-center justify-center whitespace-nowrap"
                            >
                                <FiSearch size={16}/>
                                <span>検索補助</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">住所</label>
                            <div className="relative">
                                <FiMapPin className="absolute top-3.5 left-3 text-gray-400"/>
                                <input
                                    name="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="pl-10 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="例：東京都江東区有明"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label>
                            <div className="relative">
                                <FiPhone className="absolute top-3.5 left-3 text-gray-400"/>
                                <input
                                    name="phoneNumber"
                                    type="text" 
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="pl-10 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="ハイフンなし"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">公式サイトURL</label>
                        <div className="relative">
                            <FiGlobe className="absolute top-3.5 left-3 text-gray-400"/>
                            <input
                                name="website"
                                type="text" 
                                value={formData.website}
                                onChange={handleChange}
                                className="pl-10 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="example.com"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <FiHelpCircle className="text-green-500"/> レギュレーション情報
                    </h3>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start gap-3">
                        <div className="bg-white p-2 rounded-full text-yellow-500 shadow-sm shrink-0">
                            <FiInfo />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-yellow-800 mb-1">フラスタ受入可否（目安）</p>
                            <div className="flex gap-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, isStandAllowed: true})}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all font-bold text-sm ${formData.isStandAllowed ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-500 border-gray-300'}`}
                                >
                                    <FiCheckCircle /> 受入可 (要確認)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, isStandAllowed: false})}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all font-bold text-sm ${!formData.isStandAllowed ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-gray-500 border-gray-300'}`}
                                >
                                    <FiXCircle /> 全面的に禁止
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            詳細な規定・注意事項
                        </label>
                        <textarea
                            name="regulations"
                            rows="6"
                            value={formData.regulations}
                            onChange={handleChange}
                            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="サイズ規定、搬入時間、回収の有無などをご記入ください"
                        ></textarea>
                    </div>
                </section>

                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                    <Link href="/venues" className="w-full sm:w-1/3 order-2 sm:order-1">
                        <button type="button" className="w-full py-3.5 px-4 border border-gray-300 rounded-xl text-gray-600 bg-white hover:bg-gray-50 font-bold">
                            キャンセル
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-2/3 order-1 sm:order-2 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 transition-all active:scale-95"
                    >
                        {isSubmitting ? (
                            <><FiLoader className="animate-spin mr-2"/> 通信中...</>
                        ) : (
                            <><FiSave className="mr-2"/> 情報を登録する</>
                        )}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}