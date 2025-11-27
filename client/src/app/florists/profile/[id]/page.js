'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext'; // パス階層を調整

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditFloristProfilePage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    shopName: '',
    platformName: '',
    contactName: '',
    address: '',
    phoneNumber: '',
    website: '',
    portfolio: '',
    laruBotApiKey: '', 
    portfolioImages: [], 
    businessHours: '',
    iconUrl: '', 
  });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const [isIconUploading, setIsIconUploading] = useState(false);
  
  const portfolioFileInputRef = useRef(null);
  const iconFileInputRef = useRef(null);

  // 1. データの初期読み込み
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'FLORIST') {
      toast.error("お花屋さんとしてログインしてください");
      router.push('/florists/login');
      return;
    }

    const fetchFloristData = async () => {
      try {
        // IDを指定せず、トークンを使って自分の情報を取得
        const res = await fetch(`${API_URL}/api/florists/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('プロフィール情報の読み込みに失敗しました');
        
        const data = await res.json();
        const floristData = data.florist;
        
        setFormData({
          shopName: floristData.shopName || '',
          platformName: floristData.platformName || '',
          contactName: floristData.contactName || '',
          address: floristData.address || '',
          phoneNumber: floristData.phoneNumber || '',
          website: floristData.website || '',
          portfolio: floristData.portfolio || '',
          laruBotApiKey: floristData.laruBotApiKey || '', 
          portfolioImages: floristData.portfolioImages || [], 
          businessHours: floristData.businessHours || '',
          iconUrl: floristData.iconUrl || '',
        });

      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
        fetchFloristData();
    }
  }, [user, token, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // アイコン画像アップロード
  const handleIconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsIconUploading(true);
    const toastId = toast.loading('アイコンをアップロード中...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
    try {
        const res = await fetch(`${API_URL}/api/upload`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}` }, // ★トークン必須
            body: uploadFormData 
        });
        
        if (!res.ok) throw new Error('アップロードに失敗');
        const data = await res.json();
        
        setFormData(prev => ({ ...prev, iconUrl: data.url }));
        toast.success('アイコンをアップロードしました！', { id: toastId });

    } catch (error) {
        toast.error('アップロードに失敗しました。', { id: toastId });
    } finally {
        setIsIconUploading(false);
        if(iconFileInputRef.current) iconFileInputRef.current.value = '';
    }
  };

  // ポートフォリオ画像アップロード
  const handlePortfolioImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (formData.portfolioImages.length + files.length > 3) {
      return toast.error('写真は3枚までアップロードできます。');
    }
    
    setIsUploading(true);
    const toastId = toast.loading(`画像をアップロード中...`);
    
    const uploadedUrls = [];
    for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        try {
            const res = await fetch(`${API_URL}/api/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }, // ★トークン必須
                body: uploadFormData 
            });
            if (!res.ok) throw new Error('アップロードに失敗');
            const data = await res.json();
            uploadedUrls.push(data.url);
        } catch (error) {
            toast.error('アップロードに失敗しました。', { id: toastId });
            setIsUploading(false);
            return;
        }
    }
    
    setFormData(prev => ({ ...prev, portfolioImages: [...prev.portfolioImages, ...uploadedUrls] }));
    toast.success('アップロード完了！', { id: toastId });
    setIsUploading(false);
    if(portfolioFileInputRef.current) portfolioFileInputRef.current.value = '';
  };
  
  const handleRemovePortfolioImage = (index) => {
      setFormData(prev => ({
          ...prev,
          portfolioImages: prev.portfolioImages.filter((_, i) => i !== index)
      }));
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const res = await fetch(`${API_URL}/api/florists/profile`, { // ★自分自身を更新するエンドポイント
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ★トークン必須
            },
            body: JSON.stringify(formData), 
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || '更新に失敗しました。');
        }
        
        const updatedFlorist = await res.json();

        // AuthContext内の情報を更新 (roleを付与して保存)
        await login(token, { ...updatedFlorist, role: 'FLORIST' });

        toast.success('プロフィールが更新されました！');
        
        // 少し待ってからダッシュボードへ戻る
        setTimeout(() => {
            router.push('/florists/dashboard');
        }, 1000);

    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">プロフィール編集</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* アイコン画像 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">プロフィールアイコン</label>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                {formData.iconUrl ? (
                  <Image src={formData.iconUrl} alt="Icon" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => iconFileInputRef.current.click()} 
                disabled={isIconUploading} 
                className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                {isIconUploading ? 'アップロード中...' : '画像を変更'}
              </button>
              <input type="file" accept="image/*" ref={iconFileInputRef} onChange={handleIconUpload} className="hidden" />
            </div>
          </div>

          {/* テキスト入力フィールド群 */}
          <div className="grid grid-cols-1 gap-6">
            <div>
                <label htmlFor="shopName" className="block text-sm font-bold text-slate-700 mb-1">店舗名 (正式名称・非公開)</label>
                <input type="text" name="shopName" id="shopName" required value={formData.shopName} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" />
            </div>
            
            <div>
                <label htmlFor="platformName" className="block text-sm font-bold text-slate-700 mb-1">活動名 (ユーザーに公開される名前)</label>
                <input type="text" name="platformName" id="platformName" required value={formData.platformName} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" />
            </div>

            <div>
                <label htmlFor="contactName" className="block text-sm font-bold text-slate-700 mb-1">担当者名 (非公開)</label>
                <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-bold text-slate-700 mb-1">電話番号</label>
                    <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" />
                </div>
                <div>
                    <label htmlFor="website" className="block text-sm font-bold text-slate-700 mb-1">Webサイト URL</label>
                    <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="https://..." />
                </div>
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-bold text-slate-700 mb-1">住所</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" />
            </div>

            <div>
                <label htmlFor="businessHours" className="block text-sm font-bold text-slate-700 mb-1">営業時間・定休日</label>
                <textarea name="businessHours" id="businessHours" rows="2" value={formData.businessHours} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="例：10:00〜19:00 (火曜定休)"></textarea>
            </div>

            <div>
                <label htmlFor="portfolio" className="block text-sm font-bold text-slate-700 mb-1">自己紹介・得意なスタイル</label>
                <textarea name="portfolio" id="portfolio" rows="5" value={formData.portfolio} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="これまでの実績や、得意なアレンジについて記入してください。"></textarea>
            </div>
          </div>

          {/* ポートフォリオ画像 */}
          <div className="border-t border-slate-200 pt-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">ポートフォリオ写真 (最大3枚)</label>
            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                <div className="flex flex-wrap gap-4">
                    {formData.portfolioImages.map((url, index) => (
                        <div key={index} className="relative w-32 h-32 group">
                            <Image src={url} alt={`Portfolio ${index + 1}`} fill className="object-cover rounded-lg shadow-sm" />
                            <button 
                                type="button" 
                                onClick={() => handleRemovePortfolioImage(index)} 
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    {formData.portfolioImages.length < 3 && (
                        <button 
                            type="button" 
                            onClick={() => portfolioFileInputRef.current.click()} 
                            disabled={isUploading} 
                            className="w-32 h-32 flex flex-col items-center justify-center bg-white border border-slate-300 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-pink-500 hover:border-pink-300 transition-all"
                        >
                            <span className="text-2xl mb-1">+</span>
                            <span className="text-xs font-bold">{isUploading ? '...' : '写真を追加'}</span>
                        </button>
                    )}
                </div>
                <input type="file" multiple accept="image/*" ref={portfolioFileInputRef} onChange={handlePortfolioImageUpload} className="hidden" />
            </div>
          </div>

          {/* LARUbot API Key */}
          <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">AIチャット連携 (任意)</h3>
            <p className="text-sm text-slate-600 mb-4">
              LARUbotと連携すると、ファンからの問い合わせにAIが自動応答します。
              <a href="https://larubot.tokyo" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-bold ml-1">公式サイト</a>でAPIキーを取得してください。
            </p>
            <label htmlFor="laruBotApiKey" className="block text-sm font-bold text-slate-700 mb-1">LARUbot API Key</label>
            <input type="password" name="laruBotApiKey" id="laruBotApiKey" value={formData.laruBotApiKey} onChange={handleChange} className="w-full p-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition bg-white" placeholder="sk-..." />
          </div>

          {/* ボタンエリア */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
             <Link href="/florists/dashboard" className="flex-1 text-center py-3 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                キャンセルして戻る
            </Link>
            <button 
                type="submit" 
                disabled={isSubmitting || isUploading || isIconUploading} 
                className="flex-1 py-3 font-bold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting ? '保存中...' : '変更を保存する'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}