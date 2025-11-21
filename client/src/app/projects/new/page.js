'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiDownload, FiInfo, FiLayers } from 'react-icons/fi';
import SuccessTemplateModal from '../../components/SuccessTemplateModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm();
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  // 企画作成に必要なデータはここに含まれます
  const watchedDeliveryAddress = watch('deliveryAddress');
  const watchedVenueId = watch('venueId');

  // ★ 既存の会場リストとレギュレーションを取得
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (!res.ok) throw new Error('会場リストの取得に失敗しました。');
        setVenues(await res.json());
      } catch (error) {
        toast.error('会場リストの読み込み中にエラーが発生しました。');
        setVenues([]);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
  }, []);

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('ログインが必要です。');
      return;
    }
    
    // 納品日時をISO形式に変換
    const deliveryDateTime = new Date(`${data.deliveryDate}T${data.deliveryTime}`).toISOString();
    
    // 企画の公開審査は運営側に任せるため、ステータスは自動でPENDING_APPROVAL
    const projectData = {
      ...data,
      deliveryDateTime: deliveryDateTime,
      plannerId: user.id, 
      targetAmount: parseInt(data.targetAmount, 10),
      // image: data.image[0] (実際にはCloudinaryへのアップロード処理が必要)
    };
    
    // Cloudinaryアップロードをスキップし、一旦ダミーURLを使用
    projectData.imageUrl = "https://picsum.photos/800/600"; 
    delete projectData.deliveryDate;
    delete projectData.deliveryTime;

    const promise = fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    }).then(async res => {
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || '企画の作成に失敗しました。');
      }
      return result;
    });

    toast.promise(promise, {
      loading: '企画を作成中...',
      success: (result) => {
        router.push(`/projects/${result.project.id}`);
        return '企画の作成申請が完了しました！運営の審査をお待ちください。';
      },
      error: (err) => err.message,
    });
  };

  // ★★★ テンプレート適用ロジック ★★★
  const handleTemplateSelect = (template) => {
    // フォームに値をセット
    setValue('title', template.title + ' (参考)');
    setValue('description', `【テンプレート引用】\n\n目標金額: ${template.totalTarget.toLocaleString()} pt\nデザイン詳細:\n${template.designSummary}\n\n${template.designDetails}`);
    setValue('targetAmount', template.totalTarget);
    setValue('designDetails', template.designDetails);
    setValue('flowerTypes', template.flowerTypes);
    
    toast.success('テンプレートを適用しました！');
    setIsTemplateModalOpen(false);
  };
  // ★★★ ここまで ★★★

  // ★★★ 会場レギュレーション表示ロジック ★★★
  const selectedVenue = venues.find(v => v.id === watchedVenueId);
  const currentRegulations = selectedVenue ? selectedVenue.regulations : null;


  if (!user) {
    return <div className="text-center mt-10 p-8">企画を作成するには<Link href="/login" className="text-pink-600 hover:underline">ログイン</Link>が必要です。</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <FiLayers className="w-8 h-8 mr-2 text-sky-600" />
        新しいフラスタ企画を作成
      </h1>
      
      {/* テンプレートボタン */}
      <button 
        onClick={() => setIsTemplateModalOpen(true)} 
        type="button" 
        className="mb-6 w-full py-3 px-4 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-lg flex items-center justify-center"
      >
        <FiDownload className="w-5 h-5 mr-2" />
        成功企画テンプレートから始める
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        
        {/* 1. 企画の基本情報 */}
        <section className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-3 text-sky-600">基本情報</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">タイトル</label>
            <input type="text" {...register('title', { required: 'タイトルは必須です' })} className="mt-1 w-full p-2 border rounded-md" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mt-4">説明文</label>
            <textarea rows="4" {...register('description', { required: '説明文は必須です' })} className="mt-1 w-full p-2 border rounded-md" />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mt-4">目標金額 (pt)</label>
            <input type="number" {...register('targetAmount', { required: '目標金額は必須です', min: { value: 1000, message: '目標金額は1,000pt以上である必要があります' } })} className="mt-1 w-full p-2 border rounded-md" />
            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
          </div>
        </section>

        {/* 2. 納品場所/日時 */}
        <section className="border-b pb-4">
          <h2 className="text-xl font-semibold mb-3 text-sky-600">納品情報</h2>
          
          {/* 会場ID選択フィールド */}
          <div>
            <label className="block text-sm font-medium text-gray-700">会場 (任意)</label>
            <select {...register('venueId')} className="mt-1 w-full p-2 border rounded-md" disabled={loadingVenues}>
              <option value="">-- 会場を選択してください --</option>
              {loadingVenues ? (
                <option disabled>読み込み中...</option>
              ) : (
                venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.venueName} ({venue.address})</option>
                ))
              )}
            </select>
          </div>

          {/* 会場レギュレーション表示エリア */}
          {currentRegulations && (
             <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                 <h3 className="font-bold text-yellow-800 flex items-center mb-1">
                    <FiInfo className="w-4 h-4 mr-1"/> 選択された会場の規制
                 </h3>
                 <p className="text-sm text-yellow-800 whitespace-pre-wrap">{currentRegulations}</p>
             </div>
          )}


          <div>
            <label className="block text-sm font-medium text-gray-700 mt-4">納品先住所 (会場名・住所)</label>
            <input 
              type="text" 
              {...register('deliveryAddress', { required: '納品先住所は必須です' })} 
              className="mt-1 w-full p-2 border rounded-md" 
              placeholder={selectedVenue ? selectedVenue.address : "例: 東京ドーム"}
              disabled={!!selectedVenue} // 会場が選択されている場合は無効化
            />
            {errors.deliveryAddress && <p className="text-red-500 text-xs mt-1">{errors.deliveryAddress.message}</p>}
            {selectedVenue && <p className="text-xs text-gray-500 mt-1">※会場が選択されたため、住所は自動入力されています。</p>}
          </div>
          
          <div className="flex space-x-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">納品希望日</label>
              <input type="date" {...register('deliveryDate', { required: '納品日は必須です' })} className="mt-1 w-full p-2 border rounded-md" />
              {errors.deliveryDate && <p className="text-red-500 text-xs mt-1">{errors.deliveryDate.message}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">納品希望時間</label>
              <input type="time" {...register('deliveryTime', { required: '納品時間は必須です' })} className="mt-1 w-full p-2 border rounded-md" />
              {errors.deliveryTime && <p className="text-red-500 text-xs mt-1">{errors.deliveryTime.message}</p>}
            </div>
          </div>
        </section>

        {/* 3. デザイン詳細 */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-sky-600">デザインの希望 (お花屋さん向け)</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700">使いたいお花/色味</label>
            <input type="text" {...register('flowerTypes')} className="mt-1 w-full p-2 border rounded-md" placeholder="例: ピンクのバラ、白いカスミソウなど" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mt-4">希望サイズ</label>
            <input type="text" {...register('size')} className="mt-1 w-full p-2 border rounded-md" placeholder="例: 高さ180cm、横幅150cm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mt-4">具体的なデザイン詳細・雰囲気</label>
            <textarea rows="4" {...register('designDetails')} className="mt-1 w-full p-2 border rounded-md" placeholder="イメージ画像へのリンク、パネルの設置場所、全体の雰囲気など、具体的にお花屋さんに伝えましょう。" />
          </div>
        </section>

        {/* 4. サムネイル画像は一旦省略 */}
        {/* <section>...</section> */}

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full py-3 font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center shadow-lg"
        >
          {isSubmitting ? '申請を送信中...' : <>
            <FiCheckCircle className="w-5 h-5 mr-2" />
            企画の作成申請を行う
          </>}
        </button>
        <p className="text-xs text-gray-500 text-center">※企画は運営による審査後、公開されます。</p>
      </form>

      {/* ★★★ テンプレートモーダル ★★★ */}
      {isTemplateModalOpen && (
        <SuccessTemplateModal 
          onClose={() => setIsTemplateModalOpen(false)} 
          onSelect={handleTemplateSelect} 
        />
      )}
    </div>
  );
}