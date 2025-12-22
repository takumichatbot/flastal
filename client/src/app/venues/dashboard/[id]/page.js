'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext'; // パスは環境に合わせて調整
import ApprovalPendingCard from '@/components/dashboard/ApprovalPendingCard';

import { 
  FiMapPin, 
  FiFileText, 
  FiSave, 
  FiLogOut, 
  FiHome,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function VenueDashboardPage() {
  const params = useParams();
  const id = params.id; // URLからIDを取得
  const router = useRouter();
  
  const { user, loading: authLoading, logout, isPending, isApproved } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // profile | schedule
  const [loading, setLoading] = useState(true);
  
  // フォームデータ
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    regulations: '',
    phone: '', // 追加: 連絡先電話番号などがあると便利
    accessInfo: '' // 追加: アクセス情報
  });

  // データ取得
  const fetchVenue = useCallback(async () => {
    // 審査待ち/却下の場合はAPIコールをスキップ
    if (isPending || !isApproved) {
        setLoading(false);
        return;
    }
      
    if (!user || user.role !== 'VENUE') return;
    
    // URLのIDとログインユーザーのIDが不一致の場合のガード（必要に応じて）
    if (user.uid !== id && user.id !== id) {
       // 管理者でない限り、他人のダッシュボードは見れないようにする
       // router.push('/venues/login'); 
       // return;
    }

    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
        
      if (!res.ok) throw new Error('データ読み込みに失敗しました');
      
      const data = await res.json();
      
      // null値を空文字に変換してフォームにセット
      setFormData({
        venueName: data.venueName || '',
        address: data.address || '',
        regulations: data.regulations || '',
        phone: data.phone || '',
        accessInfo: data.accessInfo || ''
      });

    } catch (error) { 
      console.error(error);
      toast.error('データの取得に失敗しました');
    } finally { 
      setLoading(false);
    }
  }, [id, user, isPending, isApproved]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'VENUE') {
        toast.error('アクセス権限がありません。');
        router.push('/venues/login');
        return;
    }
      
    fetchVenue();
  }, [authLoading, user, router, fetchVenue]);

  // 入力ハンドラ
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 更新ハンドラ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPending || !isApproved) {
        return toast.error('審査完了まで情報は更新できません。');
    }
      
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
    const toastId = toast.loading('更新中...');

    try {
      const res = await fetch(`${API_URL}/api/venues/profile`, { 
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('更新に失敗しました。');
      
      const updatedData = await res.json();
      setFormData(prev => ({...prev, ...updatedData}));
      toast.success('会場情報を更新しました！', { id: toastId });
      
    } catch (err) {
      toast.error(err.message || '更新に失敗しました', { id: toastId });
    }
  };

  const handleLogout = () => {
    logout(); 
    toast.success('ログアウトしました。');
    router.push('/venues/login');
  };

  // --- レンダリング ---

  if (authLoading || (loading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // 審査ステータス表示
  if (isPending || !isApproved) {
      return <ApprovalPendingCard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <FiHome size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">会場管理ダッシュボード</h1>
              <p className="text-xs text-gray-500">{formData.venueName || '会場名未設定'} 様</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
            <FiLogOut /> ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        
        {/* ステータス・概要カード */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div>
             <h2 className="text-lg font-bold text-gray-800 mb-1">現在の登録状況</h2>
             <p className="text-sm text-gray-500">ユーザーに対して公開されている情報です。</p>
           </div>
           <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                 <FiCheckCircle /> 公開中
              </span>
              <Link href={`/venues/${id}`} target="_blank" className="text-sm text-green-600 hover:text-green-700 underline underline-offset-2">
                プレビューを確認
              </Link>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* サイドナビ / タブ */}
            <div className="md:col-span-1 space-y-2">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-slate-100'}`}
                >
                  <FiFileText /> 施設情報・規定
                </button>
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'schedule' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-slate-100'}`}
                >
                  <FiCalendar /> 搬入予定リスト
                </button>
            </div>

            {/* メインコンテンツエリア */}
            <div className="md:col-span-3">
                
                {/* 1. プロフィール編集タブ */}
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2">
                         <FiFileText className="text-green-600"/> 登録情報の編集
                       </h3>
                       <p className="text-xs text-gray-500 mt-1">
                         ※ フラワースタンドの搬入に関する規定は、トラブル防止のため詳細にご記入ください。
                       </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        {/* 基本情報 */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">会場名 <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            name="venueName" 
                            required 
                            value={formData.venueName} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                            placeholder="例: 東京お祝いホール"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">住所 <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <FiMapPin className="absolute top-3.5 left-4 text-gray-400" />
                            <input 
                              type="text" 
                              name="address" 
                              required 
                              value={formData.address} 
                              onChange={handleChange} 
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                              placeholder="例: 東京都新宿区..."
                            />
                          </div>
                        </div>

                        {/* フラスタ規定（重要） */}
                        <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-100">
                          <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <FiAlertCircle className="text-yellow-600"/> フラスタ受入規定・注意事項
                          </label>
                          <p className="text-xs text-gray-600 mb-3">
                            サイズ制限、搬入可能時間、回収の要否、パネルの装飾ルールなどを明記してください。<br/>
                            ここに入力された内容は、企画作成時にユーザーに提示されます。
                          </p>
                          <textarea 
                            name="regulations" 
                            rows="12" 
                            value={formData.regulations} 
                            onChange={handleChange} 
                            placeholder="【例】&#13;&#10;・高さ180cm、底辺40cm×40cm以内のものに限ります。&#13;&#10;・搬入時間は公演当日の午前9時〜11時指定です。&#13;&#10;・公演終了後、翌日午前中までの回収が必須となります。回収手配のないものはお受け取りできません。&#13;&#10;・ラメや砂など、床を汚損する可能性のある装飾は禁止です。" 
                            className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none text-sm leading-relaxed"
                          ></textarea>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button 
                          type="submit" 
                          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 hover:shadow-lg transform active:scale-95 transition-all"
                        >
                          <FiSave /> 情報を更新する
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. 搬入予定リスト（プレースホルダー） */}
                {activeTab === 'schedule' && (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                    <div className="bg-green-50 p-4 rounded-full inline-block mb-4">
                      <FiCalendar className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">搬入予定リスト</h3>
                    <p className="text-gray-500 text-sm">
                      現在、フラワースタンドの搬入予定はありません。<br/>
                      イベントとフラスタのマッチングが成立すると、ここに搬入スケジュールが表示されます。
                    </p>
                  </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}