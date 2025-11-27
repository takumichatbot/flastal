'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext'; // パス階層を調整

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EditFloristProfile() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // フォームの状態
  const [formData, setFormData] = useState({
    shopName: '',
    platformName: '',
    contactName: '',
    address: '',
    phoneNumber: '',
    website: '',
    portfolio: '',
    laruBotApiKey: '',
    businessHours: '',
    iconUrl: '',
  });

  // 画像アップロード用
  const [iconFile, setIconFile] = useState(null);
  const [previewIcon, setPreviewIcon] = useState(null);

  // 1. データの初期読み込み
  useEffect(() => {
    // 認証情報のロード待ち
    if (authLoading) return;

    // 未ログインまたはお花屋さんでない場合
    if (!user || user.role !== 'FLORIST') {
      toast.error('お花屋さんとしてログインしてください');
      router.push('/florists/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        // ダッシュボードと同じAPIから情報を取得してフォームを埋める
        const res = await fetch(`${API_URL}/api/florists/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('プロフィールの取得に失敗しました');
        
        const data = await res.json();
        const florist = data.florist;

        setFormData({
          shopName: florist.shopName || '',
          platformName: florist.platformName || '',
          contactName: florist.contactName || '',
          address: florist.address || '',
          phoneNumber: florist.phoneNumber || '',
          website: florist.website || '',
          portfolio: florist.portfolio || '',
          laruBotApiKey: florist.laruBotApiKey || '',
          businessHours: florist.businessHours || '',
          iconUrl: florist.iconUrl || '',
        });
        
        if (florist.iconUrl) setPreviewIcon(florist.iconUrl);

      } catch (error) {
        console.error(error);
        toast.error('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, token, authLoading, router]);

  // 2. 入力ハンドラ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. 画像選択ハンドラ
  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      setPreviewIcon(URL.createObjectURL(file));
    }
  };

  // 4. 送信ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let currentIconUrl = formData.iconUrl;

      // 画像が新しく選択されていればアップロード
      if (iconFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', iconFile);

        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData,
        });

        if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');
        const uploadData = await uploadRes.json();
        currentIconUrl = uploadData.url;
      }

      // プロフィール更新リクエスト
      const updateRes = await fetch(`${API_URL}/api/florists/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          iconUrl: currentIconUrl
        }),
      });

      if (!updateRes.ok) throw new Error('プロフィールの更新に失敗しました');
      
      const updatedData = await updateRes.json(); // 更新後のデータを取得 (パスワードなどは除外されているはず)

      // AuthContext内のユーザー情報を更新する (トークンはそのまま)
      // login関数を使ってユーザー情報を上書き更新
      const updatedUser = {
        ...updatedData,
        role: 'FLORIST' // role情報を付与
      };
      await login(token, updatedUser);

      toast.success('プロフィールを更新しました！');
      router.push('/florists/dashboard');

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              プロフィール編集
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link href="/florists/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
              キャンセル
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white p-8 shadow rounded-lg">
          
          {/* 基本情報 */}
          <div className="space-y-6 sm:space-y-5">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">基本情報</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                お客様に公開される情報です。
              </p>
            </div>

            <div className="space-y-6 sm:space-y-5">
              
              {/* アイコン画像 */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center sm:border-t sm:border-gray-200 sm:pt-5">
                <label className="block text-sm font-medium text-gray-700">
                  アイコン画像
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2 flex items-center">
                  <span className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 relative border border-gray-300">
                    {previewIcon ? (
                      <Image src={previewIcon} alt="Profile Preview" fill className="object-cover" />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                  <label htmlFor="icon-upload" className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer">
                    <span>変更する</span>
                    <input id="icon-upload" type="file" className="sr-only" accept="image/*" onChange={handleIconChange} />
                  </label>
                </div>
              </div>

              {/* 店舗名 (Shop Name) */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  店舗名 (正式名称)
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="text" name="shopName" id="shopName" required value={formData.shopName} onChange={handleChange} className="max-w-lg block w-full shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>

              {/* 活動名 (Platform Name) */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="platformName" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  FLASTALでの表示名
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="text" name="platformName" id="platformName" required value={formData.platformName} onChange={handleChange} className="max-w-lg block w-full shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md p-2 border" />
                  <p className="mt-2 text-sm text-gray-500">ユーザーに表示される名前です。</p>
                </div>
              </div>

              {/* 担当者名 */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  担当者名 (非公開)
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="text" name="contactName" id="contactName" required value={formData.contactName} onChange={handleChange} className="max-w-lg block w-full shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>

              {/* 住所 */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  住所
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="block w-full max-w-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>

              {/* 電話番号 */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  電話番号
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="max-w-lg block w-full shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>

              {/* Webサイト */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  Webサイト URL
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className="block w-full max-w-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="https://..." />
                </div>
              </div>

              {/* ポートフォリオ/自己紹介 */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  自己紹介・得意なスタイル
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <textarea id="portfolio" name="portfolio" rows={5} value={formData.portfolio} onChange={handleChange} className="max-w-lg shadow-sm block w-full focus:ring-pink-500 focus:border-pink-500 sm:text-sm border border-gray-300 rounded-md p-2" />
                  <p className="mt-2 text-sm text-gray-500">これまでの実績や、得意なお花のアレンジについて記入してください。</p>
                </div>
              </div>

              {/* 営業時間 */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  営業時間
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <textarea id="businessHours" name="businessHours" rows={2} value={formData.businessHours} onChange={handleChange} className="max-w-lg shadow-sm block w-full focus:ring-pink-500 focus:border-pink-500 sm:text-sm border border-gray-300 rounded-md p-2" />
                </div>
              </div>

              {/* LARUbot API Key */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="laruBotApiKey" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                  LARUbot API Key
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input type="password" name="laruBotApiKey" id="laruBotApiKey" value={formData.laruBotApiKey} onChange={handleChange} className="max-w-lg block w-full shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md p-2 border" />
                  <p className="mt-2 text-sm text-gray-500">AIチャットボットを利用する場合に入力してください。</p>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <Link href="/florists/dashboard" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}