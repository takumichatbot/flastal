'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateProjectPage() {
  const { user, userType } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deliveryAddress: '',
    deliveryDateTime: '',
    designDetails: '',
    visibility: 'PUBLIC',
    size: '',
    flowerTypes: '',
    imageUrl: '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => {
    if (!user || userType !== 'USER') {
      alert('この機能を利用するには、ファンとしてログインする必要があります。');
      router.push('/login');
    }
    const fetchVenues = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/venues');
        if (!res.ok) throw new Error('会場リストの取得に失敗しました。');
        const data = await res.json();
        setVenues(data);
      } catch (error) {
        alert(error.message);
      }
    };
    fetchVenues();
  }, [user, userType, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVenueChange = (e) => {
    const venueId = e.target.value;
    const venue = venues.find(v => v.id === venueId);
    setSelectedVenue(venue);
    setFormData(prevState => ({ ...prevState, deliveryAddress: venue ? venue.venueName : '' }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      alert('画像ファイルを選択してください。');
      return;
    }
    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', imageFile);
    try {
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      if (!res.ok) throw new Error('アップロードに失敗しました。');
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      alert('画像のアップロードが完了しました！');
      nextStep();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const projectData = {
      ...formData,
      plannerId: user.id,
    };
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '企画の作成に失敗しました。');
      }
      alert('企画の作成に成功しました！');
      router.push('/projects');
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };
  
  if (!user || userType !== 'USER') {
    return <div className="text-center p-10">リダイレクト中...</div>;
  }
  
  const ProgressBar = () => {
      const steps = ['基本情報', 'お届け情報', '画像設定', 'デザイン詳細', '最終確認'];
      return (
          <div className="w-full mb-8">
              <div className="flex justify-between">
                  {steps.map((name, index) => (
                      <div key={index} className="flex-1 text-center">
                          <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${step > index ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {step > index ? '✓' : index + 1}
                          </div>
                          <p className={`mt-2 text-sm ${step > index ? 'text-sky-600 font-semibold' : 'text-slate-500'}`}>{name}</p>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-2xl shadow-xl h-fit">
        <ProgressBar />
        <div className="border-t pt-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">1. 企画の基本情報を入力</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">公開設定</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="visibility" value="PUBLIC" checked={formData.visibility === 'PUBLIC'} onChange={handleChange} className="w-4 h-4 text-sky-600"/>
                    <span className="text-gray-800">全体に公開</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="visibility" value="UNLISTED" checked={formData.visibility === 'UNLISTED'} onChange={handleChange} className="w-4 h-4 text-sky-600"/>
                    <span className="text-gray-800">限定公開</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.visibility === 'PUBLIC'
                    ? '企画一覧ページに表示され、誰でも見ることができます。'
                    : 'URLを知っている人だけがアクセスできます。'
                  }
                </p>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">企画タイトル</label>
                <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">企画の詳細</label>
                <textarea name="description" id="description" rows="4" required value={formData.description} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"></textarea>
              </div>
              <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700">目標金額（ポイント）</label>
                <input type="number" name="targetAmount" id="targetAmount" required value={formData.targetAmount} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
              </div>
              <div className="flex justify-end">
                <button onClick={nextStep} className="px-6 py-2 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600">次へ</button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">2. お届け情報を入力</h2>
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700">会場を選択</label>
                <select id="venue" onChange={handleVenueChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md">
                    <option value="">-- 会場を選んでください --</option>
                    {venues.map(venue => (<option key={venue.id} value={venue.id}>{venue.venueName}</option>))}
                </select>
              </div>
              {selectedVenue && selectedVenue.regulations && (
                <div className="p-4 bg-gray-50 border rounded-md">
                  <h3 className="font-bold text-gray-800">{selectedVenue.venueName} のフラスタ規定</h3>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{selectedVenue.regulations}</p>
                </div>
              )}
              <div>
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700">納品場所</label>
                <input type="text" name="deliveryAddress" id="deliveryAddress" required value={formData.deliveryAddress} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label htmlFor="deliveryDateTime" className="block text-sm font-medium text-gray-700">納品希望日時</label>
                <input type="datetime-local" name="deliveryDateTime" id="deliveryDateTime" required value={formData.deliveryDateTime} onChange={handleChange} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
              </div>
              <div className="flex justify-between">
                <button onClick={prevStep} className="px-6 py-2 font-semibold text-gray-700 bg-slate-200 rounded-lg hover:bg-slate-300">戻る</button>
                <button onClick={nextStep} className="px-6 py-2 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600">次へ</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">3. メイン画像の設定</h2>
              <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">企画のイメージ画像</label>
                <div className="mt-2 flex items-center gap-4">
                  <input id="image-upload" name="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                </div>
              </div>
              {imageFile && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">プレビュー</p>
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-60 rounded-md mx-auto"/>
                </div>
              )}
              <div className="flex justify-between">
                <button onClick={prevStep} className="px-6 py-2 font-semibold text-gray-700 bg-slate-200 rounded-lg hover:bg-slate-300">戻る</button>
                <button onClick={handleImageUpload} disabled={isUploading || !imageFile} className="px-6 py-2 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-slate-400">
                  {isUploading ? 'アップロード中...' : 'アップロードして次へ'}
                </button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">4. デザインの詳細を入力</h2>
              <div>
                <label htmlFor="designDetails" className="block text-sm font-medium text-gray-700">デザインのイメージ（任意）</label>
                <textarea name="designDetails" id="designDetails" rows="5" value={formData.designDetails} onChange={handleChange} placeholder="色合い、雰囲気、入れてほしいモチーフなど、お花屋さんに伝えたいことを自由に書いてください。" className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"></textarea>
              </div>
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">希望サイズ（任意）</label>
                <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} placeholder="例：高さ180cm x 幅100cm" className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label htmlFor="flowerTypes" className="block text-sm font-medium text-gray-700">使いたいお花（任意）</label>
                <input type="text" name="flowerTypes" id="flowerTypes" value={formData.flowerTypes} onChange={handleChange} placeholder="例：バラ、ユリ、カスミソウなど" className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
              </div>
              <div className="flex justify-between">
                <button onClick={prevStep} className="px-6 py-2 font-semibold text-gray-700 bg-slate-200 rounded-lg hover:bg-slate-300">戻る</button>
                <button onClick={nextStep} className="px-6 py-2 font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600">最終確認へ</button>
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900">5. 最終確認</h2>
              {/* ★★★ 文字色を text-slate-800 に修正 ★★★ */}
              <div className="space-y-4 p-4 border rounded-lg bg-slate-50 text-slate-800">
                {formData.imageUrl && <div className="mb-4"><p className="text-sm text-slate-500">メイン画像</p><img src={formData.imageUrl} alt="Project" className="rounded-md max-h-40"/></div>}
                <div><p className="text-sm text-slate-500">企画タイトル</p><p className="font-semibold">{formData.title}</p></div>
                <div><p className="text-sm text-slate-500">目標金額</p><p className="font-semibold">{Number(formData.targetAmount).toLocaleString()} pt</p></div>
                <div><p className="text-sm text-slate-500">納品場所</p><p className="font-semibold">{formData.deliveryAddress}</p></div>
                <div><p className="text-sm text-slate-500">納品日時</p><p className="font-semibold">{formData.deliveryDateTime ? new Date(formData.deliveryDateTime).toLocaleString('ja-JP') : ''}</p></div>
                <div><p className="text-sm text-slate-500">企画の詳細</p><p className="whitespace-pre-wrap">{formData.description}</p></div>
                {formData.designDetails && <div><p className="text-sm text-slate-500">デザイン</p><p className="whitespace-pre-wrap">{formData.designDetails}</p></div>}
              </div>
              <p className="text-sm text-slate-600">この内容で企画を作成します。よろしいですか？</p>
              <div className="flex justify-between">
                <button onClick={prevStep} className="px-6 py-2 font-semibold text-gray-700 bg-slate-200 rounded-lg hover:bg-slate-300">戻る</button>
                <button onClick={handleSubmit} className="px-6 py-2 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600">この内容で作成する</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}