'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditFloristProfilePage({ params }) {
  const { id } = params;
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
    iconUrl: '', // ★ アイコンURL用の state を追加
  });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // ポートフォリオ画像用
  const [isIconUploading, setIsIconUploading] = useState(false); // ★ アイコン画像用
  const portfolioFileInputRef = useRef(null); // ポートフォリオ用
  const iconFileInputRef = useRef(null); // ★ アイコン用
  
  const [florist, setFlorist] = useState(null); 

  useEffect(() => {
    
    // 1. 認証チェックを先に実行
    const storedFlorist = localStorage.getItem('flastal-florist');
    if (!storedFlorist) {
      toast.error("ログインが必要です。");
      router.push('/florists/login');
      return;
    }

    let floristInfo;
    try {
      floristInfo = JSON.parse(storedFlorist);
    } catch (e) {
      localStorage.removeItem('flastal-florist');
      router.push('/florists/login');
      return;
    }

    // 2. IDの不一致をチェック
    if (floristInfo.id !== id) {
      toast.error("アクセス権がありません。");
      router.push('/florists/dashboard');
      return;
    }

    // 3. 認証OK。stateに保存
    setFlorist(floristInfo); 

    // 4. 認証が通ったので、フォーム用のデータをAPIから取得
    const fetchFloristData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/florists/${id}`);
        if (!res.ok) throw new Error('プロフィール情報の読み込みに失敗しました');
        const data = await res.json();
        
        // フォームデータ用の新しいオブジェクトを作成 (nullを空文字に変換)
        const newFormData = {
          shopName: data.shopName || '',
          platformName: data.platformName || '',
          contactName: data.contactName || '',
          address: data.address || '',
          phoneNumber: data.phoneNumber || '',
          website: data.website || '',
          portfolio: data.portfolio || '',
          laruBotApiKey: data.laruBotApiKey || '', 
          portfolioImages: data.portfolioImages || [], 
          businessHours: data.businessHours || '',
          iconUrl: data.iconUrl || '', // ★ アイコンURLもセット
        };
        
        setFormData(newFormData);

      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFloristData();

  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // ★★★ アイコン画像アップロード処理 ★★★
  const handleIconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsIconUploading(true);
    const toastId = toast.loading('アイコンをアップロード中...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    try {
        const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: uploadFormData });
        if (!res.ok) throw new Error('アップロードに失敗');
        const data = await res.json();
        
        // フォームの iconUrl を更新
        setFormData(prev => ({ ...prev, iconUrl: data.url }));
        toast.success('アイコンをアップロードしました！', { id: toastId });

    } catch (error) {
        toast.error('アップロードに失敗しました。', { id: toastId });
    } finally {
        setIsIconUploading(false);
    }
  };

  // ★★★ ポートフォリオ画像アップロード処理 ★★★
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
            const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: uploadFormData });
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
  };
  
  const handleRemovePortfolioImage = (index) => {
      setFormData(prev => ({
          ...prev,
          portfolioImages: prev.portfolioImages.filter((_, i) => i !== index)
      }));
  };

  // ★★★ フォーム送信処理 ★★★
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!florist) return; 

    // formData には iconUrl も含まれている
    const promise = fetch(`${API_URL}/api/florists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData), 
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新に失敗しました。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: (updatedFlorist) => {
        // localStorage を更新
        localStorage.setItem('flastal-florist', JSON.stringify(updatedFlorist));
        
        // フォームデータもAPIからの返り値で最新化
        const newFormData = {
          shopName: updatedFlorist.shopName || '',
          platformName: updatedFlorist.platformName || '',
          contactName: updatedFlorist.contactName || '',
          address: updatedFlorist.address || '',
          phoneNumber: updatedFlorist.phoneNumber || '',
          website: updatedFlorist.website || '',
          portfolio: updatedFlorist.portfolio || '',
          laruBotApiKey: updatedFlorist.laruBotApiKey || '', 
          portfolioImages: updatedFlorist.portfolioImages || [], 
          businessHours: updatedFlorist.businessHours || '',
          iconUrl: updatedFlorist.iconUrl || '', // ★ iconUrl も更新
        };
        setFormData(newFormData);

        return 'プロフィールが更新されました！';
      },
      error: (err) => err.message,
    });
  };

  if (loading || !florist) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <p>読み込み中...</p>
        </div>
    );
  }

  // --- JSX (フォームのUI) ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-2xl mx-auto p-8 space-y-6 bg-white rounded-xl shadow-lg h-fit">
        <h2 className="text-3xl font-bold text-center text-gray-900">プロフィール編集</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ★★★【新規】アイコンアップロードUI ★★★ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">プロフィールアイコン</label>
            <div className="mt-2 flex items-center gap-4">
              {/* 画像プレビュー */}
              {formData.iconUrl ? (
                <img src={formData.iconUrl} alt="Icon preview" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
                </div>
              )}
              {/* アップロードボタン */}
              <button type="button" onClick={() => iconFileInputRef.current.click()} disabled={isIconUploading} className="px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 disabled:bg-slate-200">
                {isIconUploading ? 'アップロード中...' : '画像を選択'}
              </button>
              <input type="file" accept="image/*" ref={iconFileInputRef} onChange={handleIconUpload} className="hidden" />
            </div>
          </div>

          {/* ポートフォリオ画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ポートフォリオ写真 (3枚まで)</label>
            <div className="mt-2 p-4 border-2 border-dashed rounded-lg">
                <div className="flex flex-wrap gap-4">
                    {formData.portfolioImages.map((url, index) => (
                        <div key={index} className="relative h-24 w-24">
                            <img src={url} className="h-full w-full object-cover rounded-md" alt={`Portfolio ${index + 1}`} />
                            <button type="button" onClick={() => handleRemovePortfolioImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">&times;</button>
                        </div>
                    ))}
                    {isUploading && <div className="h-24 w-24 flex items-center justify-center bg-gray-100 rounded-md">...</div>}
                </div>
                {formData.portfolioImages.length < 3 && (
                    <button type="button" onClick={() => portfolioFileInputRef.current.click()} disabled={isUploading} className="mt-4 px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 disabled:bg-slate-200">
                    {isUploading ? 'アップロード中...' : '画像を選択'}
                    </button>
                )}
                <input type="file" multiple accept="image/*" ref={portfolioFileInputRef} onChange={handlePortfolioImageUpload} className="hidden" />
            </div>
          </div>

          {/* 営業時間 */}
          <div>
            <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700">営業時間・定休日など</label>
            <textarea name="businessHours" id="businessHours" rows="3" value={formData.businessHours} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition" placeholder="例：10:00〜19:00 (火曜定休)"></textarea>
          </div>
          {/* Form fields */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">店舗名（正式名称・非公開）</label>
            <input type="text" name="shopName" id="shopName" required value={formData.shopName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
           {/* Add platformName field */}
           <div>
            <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">活動名（公開）</Lgabel>
            <input type="text" name="platformName" id="platformName" required value={formData.platformName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">担当者名</label>
            <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">住所</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">電話番号</label>
            <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">ウェブサイトURL</label>
            <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div>
            <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">ポートフォリオ・自己紹介</label>
            <textarea name="portfolio" id="portfolio" rows="5" value={formData.portfolio} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"></textarea>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800">AIチャット連携</h3>
            <p className="text-sm text-gray-500 mt-1 mb-2">
              LARUbotと連携すると、ファンからの最初の問い合わせにAIが自動で応答します。<br/>
              <a href="https://larubot.tokyo" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">LARUbot公式サイト</a>でAPIキーを取得してください。
            </p>
            <label htmlFor="laruBotApiKey" className="block text-sm font-medium text-gray-700">LARUbot APIキー</label>
            <input type="text" name="laruBotApiKey" id="laruBotApiKey" value={formData.laruBotApiKey} onChange={handleChange} className="w-full mt-1 p-2 text-gray-900 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition"/>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
             {/* Use Link component for navigation */}
             <Link href={`/florists/dashboard`} className="w-full">
              <span className="block text-center w-full px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                ダッシュボードに戻る
              </span>
            </Link>
            <button type="submit" disabled={isSubmitting || isUploading || isIconUploading} className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:bg-gray-400">
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}