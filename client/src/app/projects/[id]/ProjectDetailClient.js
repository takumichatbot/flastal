'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import dynamic from 'next/dynamic';

// アイコン
import { FiHeart, FiThumbsUp, FiMessageSquare, FiInfo, FiUser, FiSend, FiCheckCircle, FiCheck, FiUpload, FiPrinter, FiFileText, FiImage, FiCpu, FiBox, FiX, FiRefreshCw, FiArrowUp, FiLock } from 'react-icons/fi';

// コンポーネント群
import VirtualStage from '@/app/components/VirtualStage';
import MoodBoard from '@/app/components/MoodBoard';
import OfficialBadge from '@/app/components/OfficialBadge';
import UpsellAlert from '@/app/components/UpsellAlert';
import FlowerScrollIndicator from '@/app/components/FlowerScrollIndicator';
import { BalanceSheet } from '@/app/components/BalanceSheet';
import PanelPreviewer from '@/app/components/PanelPreviewer';
import GuestPledgeForm from '@/app/components/GuestPledgeForm';
import ImageModal from '../../components/ImageModal';
import MessageForm from '../../components/MessageForm';
import GroupChat from './components/GroupChat';
import CompletionReportModal from './components/CompletionReportModal';
import ReportModal from './components/ReportModal'; 
import VenueRegulationCard from '../../components/VenueRegulationCard';
import DeliveryTracker from '@/app/components/DeliveryTracker';
import FloristDeliveryControl from '@/app/components/FloristDeliveryControl';

// ARコンポーネント (SSR回避)
const ArViewer = dynamic(() => import('../../components/ArViewer'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// ===========================================
// ヘルパーコンポーネント定義
// ===========================================

const PROGRESS_STEPS = [
  { key: 'FUNDRAISING', label: '募集開始' },
  { key: 'FLORIST_MATCHED', label: '花屋決定' },
  { key: 'DESIGN_FIXED', label: 'デザイン決定' },
  { key: 'PANELS_RECEIVED', label: 'パネル送付' },
  { key: 'PRE_COMPLETION', label: '前日写真' },
  { key: 'COMPLETED', label: '完了' }
];

function InstructionSheetModal({ projectId, onClose }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSheet = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/instruction-sheet`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setText(data.text);
        } else {
          toast.error('指示書の生成に失敗しました');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSheet();
  }, [projectId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>制作指示書</title></head>
        <body style="font-family: monospace; font-size: 16px; padding: 20px;">
          <pre style="white-space: pre-wrap;">${text}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success('クリップボードにコピーしました');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
          <FiFileText className="mr-2"/> 制作指示書 (自動生成)
        </h3>
        {loading ? (
          <div className="flex-grow flex items-center justify-center p-10">読み込み中...</div>
        ) : (
          <textarea 
            readOnly 
            className="flex-grow p-4 border rounded bg-gray-50 font-mono text-sm resize-none mb-4 focus:outline-none" 
            value={text}
            style={{ minHeight: '300px' }}
          />
        )}
        <div className="mt-auto flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">閉じる</button>
          <button onClick={handleCopy} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">コピー</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700">
            <FiPrinter className="mr-2"/> A4印刷
          </button>
        </div>
      </div>
    </div>
  );
}

function PledgeForm({ project, user, onPledgeSubmit, isPledger }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
    defaultValues: {
      pledgeType: 'tier',
      selectedTierId: project.pledgeTiers?.[0]?.id || '',
      pledgeAmount: 0,
      comment: '',
      guestName: '',
      guestEmail: ''
    }
  });
  
  const pledgeType = watch('pledgeType');
  const selectedTierId = watch('selectedTierId');
  const selectedTier = project.pledgeTiers?.find(t => t.id === selectedTierId);
  const finalAmount = pledgeType === 'tier' && selectedTier ? selectedTier.amount : parseInt(watch('pledgeAmount')) || 0;

  const handleGuestSubmit = async (data) => {
    const loadingToast = toast.loading('処理中...');
    try {
      const res = await fetch(`${API_URL}/api/guest/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          amount: finalAmount,
          comment: data.comment,
          tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
          guestName: data.guestName,
          guestEmail: data.guestEmail
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || '支援に失敗しました');
      toast.success('ゲスト支援が完了しました！', { id: loadingToast });
      reset();
      window.location.reload(); 
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const handleUserSubmit = (data) => {
    const submitData = {
        projectId: project.id,
        userId: user.id,
        comment: data.comment,
        tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
        amount: pledgeType === 'free' ? parseInt(data.pledgeAmount) : finalAmount, 
    };
    onPledgeSubmit(submitData);
    reset();
  };

  const onSubmit = (data) => {
    if (user) { handleUserSubmit(data); } else { handleGuestSubmit(data); }
  };

  if (isPledger) {
      return (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-xl font-bold text-blue-700 mb-2">🤝 支援済み</h3>
              <p className="text-gray-700">この企画を既に支援しています。ご協力ありがとうございます！</p>
              <div className="mt-4">
                <Link href={`#message-form`} className="block w-full text-center py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors">
                  メッセージを投稿する
                </Link>
              </div>
          </div>
      );
  }

  if (project.status !== 'FUNDRAISING') {
    return (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-2">❌ 支援受付終了</h3>
            <p className="text-gray-600">この企画は現在、支援を募集していません。</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
      <h3 className="text-2xl font-extrabold text-gray-900 mb-6">この企画を支援する</h3>
      {!user && (
        <div className="mb-6 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
            現在、<strong>ゲストモード</strong>で表示しています。<br/>
            ログインすると、ポイント利用や履歴管理が可能になります。
            <Link href="/login" className="text-sky-600 font-bold underline ml-2">ログインする</Link>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <label className={`flex-1 text-center py-2 cursor-pointer rounded-lg transition-colors ${pledgeType === 'tier' ? 'bg-white shadow-md text-sky-700 font-semibold' : 'text-gray-600'}`}>
            <input type="radio" {...register('pledgeType')} value="tier" className="hidden" />
            コースから選ぶ
          </label>
          <label className={`flex-1 text-center py-2 cursor-pointer rounded-lg transition-colors ${pledgeType === 'free' ? 'bg-white shadow-md text-sky-700 font-semibold' : 'text-gray-600'}`}>
            <input type="radio" {...register('pledgeType')} value="free" className="hidden" />
            自由入力
          </label>
        </div>
        {pledgeType === 'tier' && project.pledgeTiers && (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {project.pledgeTiers.map(tier => (
              <label key={tier.id} className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTierId === tier.id ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:border-pink-300'}`}>
                <input type="radio" {...register('selectedTierId', { required: pledgeType === 'tier' })} value={tier.id} className="hidden" />
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg text-gray-800">{tier.amount.toLocaleString()} <span className="text-xs">{user ? 'pt' : '円'}</span></span>
                  <span className="text-sm font-semibold text-pink-600">{tier.title}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
              </label>
            ))}
          </div>
        )}
        {pledgeType === 'free' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支援金額 ({user ? 'pt' : '円'})</label>
            <input type="number" {...register('pledgeAmount', { required: true, min: 1 })} min="1" className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">応援メッセージ (任意)</label>
          <textarea rows="2" {...register('comment')} placeholder="企画者へ一言！" className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"></textarea>
        </div>
        {!user && (
            <div className="pt-4 border-t border-dashed border-gray-300 space-y-4">
                <p className="text-sm font-bold text-gray-700">ゲスト情報入力</p>
                <div>
                    <label className="block text-xs font-medium text-gray-500">お名前 (ニックネーム可)</label>
                    <input type="text" {...register('guestName', { required: !user })} className="w-full p-2 border rounded" placeholder="フラスタ 太郎"/>
                    {errors.guestName && <p className="text-xs text-red-500">必須です</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500">メールアドレス</label>
                    <input type="email" {...register('guestEmail', { required: !user })} className="w-full p-2 border rounded" placeholder="taro@example.com"/>
                    <p className="text-[10px] text-gray-400">完了メールをお送りします</p>
                    {errors.guestEmail && <p className="text-xs text-red-500">必須です</p>}
                </div>
            </div>
        )}
        <div className="border-t pt-4">
            <p className="text-lg font-bold mb-2">支払い額: {finalAmount.toLocaleString()} {user ? 'pt' : '円'}</p>
            <button type="submit" disabled={isSubmitting || finalAmount <= 0} className="w-full py-3 font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg">
                {isSubmitting ? '処理中...' : user ? 'ポイントで支援する' : 'ゲストとして支援する'}
            </button>
            {!user && <p className="text-xs text-center text-gray-400 mt-2">※実際はStripe決済画面へ遷移します(今回は省略)</p>}
        </div>
      </form>
    </div>
  );
}

function TargetAmountModal({ project, user, onClose, onUpdate }) {
  const [newAmount, setNewAmount] = useState(project.targetAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("ログインが必要です。");
    setIsSubmitting(true);
    const token = getAuthToken();
    const promise = fetch(`${API_URL}/api/projects/${project.id}/target-amount`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ newTargetAmount: parseInt(newAmount, 10), userId: user.id }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    });
    toast.promise(promise, {
      loading: '更新中...',
      success: () => { onUpdate(); onClose(); return '目標金額を更新しました！'; },
      error: (err) => err.message,
      finally: () => setIsSubmitting(false)
    });
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">目標金額の変更</h2>
          <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} min={project.collectedAmount} required className="w-full p-2 border rounded-md text-gray-900" />
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md">{isSubmitting ? '更新中...' : '更新する'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// ★★★ メインコンポーネント (ProjectDetailClient) ★★★
// ===========================================
export default function ProjectDetailClient() {
  const params = useParams();
  const { id } = params;
  const [showGuestPledgeModal, setShowGuestPledgeModal] = useState(false);
  const { user, isAuthenticated } = useAuth(); 
  const componentRef = useRef();

  const [project, setProject] = useState(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `収支報告書_${project?.title || '企画'}`,
  });
  
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isTargetAmountModalOpen, setIsTargetAmountModalOpen] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [isArModalOpen, setIsArModalOpen] = useState(false);

  // ★★★ AR用ステート ★★★
  const [arImageFile, setArImageFile] = useState(null);
  const [arHeight, setArHeight] = useState(180);
  const [arSrc, setArSrc] = useState(null);
  const [arGenLoading, setArGenLoading] = useState(false);

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignedUserId, setNewTaskAssignedUserId] = useState('');

  const [recommendations, setRecommendations] = useState(null); 
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects/${id}`); 
      if (!response.ok) throw new Error('企画が見つかりません');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]); 

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useEffect(() => {
    if (!user || !id) return;
    const token = getAuthToken();
    const newSocket = io(API_URL, { transports: ['polling'], auth: { token: `Bearer ${token}` } });
    setSocket(newSocket);
    newSocket.emit('joinProjectRoom', id);
    newSocket.on('receiveGroupChatMessage', (msg) => setProject(prev => prev ? { ...prev, groupChatMessages: [...(prev.groupChatMessages || []), msg] } : null));
    newSocket.on('messageError', (msg) => toast.error(msg));
    return () => newSocket.disconnect();
  }, [id, user]);

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const toastId = toast.loading('アップロード中...');
    try {
        const formData = new FormData();
        formData.append('image', file);
        const token = getAuthToken();
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!uploadRes.ok) throw new Error('画像のアップロードに失敗');
        const { url } = await uploadRes.json();

        const updateData = {};
        if (type === 'illustration') updateData.illustrationPanelUrls = [...(project.illustrationPanelUrls || []), url];
        if (type === 'message') updateData.messagePanelUrls = [...(project.messagePanelUrls || []), url];
        if (type === 'sponsor') updateData.sponsorPanelUrls = [...(project.sponsorPanelUrls || []), url];
        if (type === 'pre_photo') {
            updateData.preEventPhotoUrls = [...(project.preEventPhotoUrls || []), url];
            updateData.productionStatus = 'PRE_COMPLETION';
        }

        const res = await fetch(`${API_URL}/api/projects/${project.id}/production`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updateData)
        });
        if (!res.ok) throw new Error('更新に失敗しました');
        toast.success('アップロードしました', { id: toastId });
        fetchProject();

    } catch (err) {
        toast.error(err.message, { id: toastId });
    }
  };

  // ★★★ URL画像をファイルに変換してARセットする関数 ★★★
  const handleSelectCompletedImage = async (url) => {
    const toastId = toast.loading('画像を準備中...');
    try {
        // 画像をフェッチしてBlobに変換
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Fileオブジェクトを作成
        const file = new File([blob], "completed-flower.jpg", { type: blob.type });
        
        setArImageFile(file);
        setArHeight(180); // デフォルト高さ
        toast.success('画像をセットしました！下部の「ARモデルを生成する」ボタンを押してください', { id: toastId });
        
    } catch (e) {
        console.error(e);
        toast.error('画像の読み込みに失敗しました', { id: toastId });
    }
  };

  // ★★★ ARモデル生成ハンドラー ★★★
  const handleGenerateAr = async () => {
    if (!arImageFile) return toast.error('画像を選択してください');
    
    setArGenLoading(true);
    const toastId = toast.loading('ARデータを生成中...');

    try {
      const formData = new FormData();
      formData.append('image', arImageFile);
      formData.append('height', arHeight);

      const res = await fetch(`${API_URL}/api/ar/create-panel`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('生成に失敗しました');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setArSrc(url);
      
      toast.success('AR生成完了！カメラを床に向けてください', { id: toastId });

    } catch (e) {
      console.error(e);
      toast.error('エラーが発生しました', { id: toastId });
    } finally {
      setArGenLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!project) return;
    setLoadingRecommendations(true);
    const token = getAuthToken();
    try {
        const res = await fetch(`${API_URL}/api/ai/match-florists`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                designDetails: project.designDetails || '', 
                flowerTypes: project.flowerTypes || '' 
            })
        });
        if (res.ok) {
            setRecommendations(await res.json());
        }
    } catch (e) {
        console.error(e);
        toast.error('マッチングに失敗しました');
    } finally {
        setLoadingRecommendations(false);
    }
  };

  const currentStatus = project?.productionStatus || project?.status || 'ACCEPTED';
  const isAssignedFlorist = user && user.role === 'FLORIST' && project?.offer?.floristId === user.id;
  const isPledger = user && (project?.pledges || []).some(p => p.userId === user.id);
  const isPlanner = user && user.id === project?.planner?.id;

  const handleStatusChange = (newStatus) => {
    setProject(prev => ({ 
      ...prev, 
      productionStatus: newStatus, 
      status: newStatus 
    }));
  };

  const handleStatusUpdate = async (newStatus) => {
      if(!window.confirm('ステータスを更新しますか？')) return;
      const token = getAuthToken();
      await fetch(`${API_URL}/api/projects/${project.id}/production`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ productionStatus: newStatus })
      });
      fetchProject();
      toast.success('ステータスを更新しました');
  };

  const handleLikeToggle = async (reviewId) => {
    if (!user) return toast.error('ログインが必要です。');
    const token = getAuthToken();
    await fetch(`${API_URL}/api/reviews/${reviewId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId: user.id }) });
    fetchProject();
  };

  const onPledgeSubmit = (data) => {
    if (!user) return toast.error('ログインが必要です。');
    const token = getAuthToken();
    const promise = fetch(`${API_URL}/api/pledges`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) }).then(res => { if(!res.ok) throw new Error('失敗'); return res.json(); });
    toast.promise(promise, { loading: '処理中...', success: () => { fetchProject(); return '支援完了！'; }, error: '失敗しました' });
  };

  const handleCancelProject = () => {
    if (!user || !window.confirm("本当に中止しますか？")) return;
    const token = getAuthToken();
    const promise = fetch(`${API_URL}/api/projects/${project.id}/cancel`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId: user.id }) });
    toast.promise(promise, { loading: '処理中...', success: (d) => { fetchProject(); return '中止しました'; }, error: '失敗しました' });
  };

  const handleAnnouncementSubmit = (e) => {
    e.preventDefault();
    if (!user) return;
    const token = getAuthToken();
    const promise = fetch(`${API_URL}/api/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: announcementTitle, content: announcementContent, projectId: id }) });
    toast.promise(promise, { loading: '投稿中...', success: () => { setAnnouncementTitle(''); setAnnouncementContent(''); setShowAnnouncementForm(false); fetchProject(); return '投稿しました'; }, error: '失敗' });
  };

  const handleAddTask = (e) => { e.preventDefault(); const token = getAuthToken(); fetch(`${API_URL}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: newTaskTitle, projectId: id, assignedUserId: newTaskAssignedUserId || null }) }).then(()=>{ setNewTaskTitle(''); fetchProject(); }); };
  const handleToggleTask = (tid, stat) => { const token = getAuthToken(); fetch(`${API_URL}/api/tasks/${tid}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ isCompleted: !stat }) }).then(()=>fetchProject()); };
  const handleDeleteTask = (tid) => { if(confirm('削除？')){ const token = getAuthToken(); fetch(`${API_URL}/api/tasks/${tid}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(()=>fetchProject()); }};
  const handleAddExpense = (e) => { e.preventDefault(); const token = getAuthToken(); fetch(`${API_URL}/api/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ itemName: expenseName, amount: parseInt(expenseAmount), projectId: id }) }).then(()=>{ setExpenseName(''); setExpenseAmount(''); fetchProject(); }); };
  const handleDeleteExpense = (eid) => { if(confirm('削除？')){ const token = getAuthToken(); fetch(`${API_URL}/api/expenses/${eid}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(()=>fetchProject()); }};
  const handleCopyMessages = () => { if(project.messages?.length){ const t = project.messages.map(m=>`${m.cardName}\n${m.content}`).join('\n---\n'); navigator.clipboard.writeText(t); toast.success('コピーしました'); }};

  if (loading) return <div className="text-center mt-10">読み込み中...</div>;
  if (!project) return <div className="text-center mt-10">企画が見つかりませんでした。</div>;

  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;
  const hasPostedMessage = project.messages?.some(m => m.userId === user?.id);

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        
        {/* 1. 進捗ステータスバー */}
        <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4 overflow-x-auto">
                <div className="flex items-center min-w-max">
                    {PROGRESS_STEPS.map((step, index) => {
                        const isCompleted = index <= activeIndex;
                        const isCurrent = index === activeIndex;
                        return (
                            <div key={step.key} className="flex items-center">
                                <div className={`flex flex-col items-center mx-2 ${isCompleted ? 'text-pink-600' : 'text-gray-300'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs ${isCompleted ? 'bg-pink-50 border-pink-500' : 'bg-white border-gray-300'}`}>
                                        {isCompleted ? <FiCheck /> : index + 1}
                                    </div>
                                    <span className={`text-xs mt-1 font-semibold ${isCurrent ? 'text-pink-600' : 'text-gray-500'}`}>{step.label}</span>
                                </div>
                                {index < PROGRESS_STEPS.length - 1 && (
                                    <div className={`w-10 h-0.5 mx-1 ${index < activeIndex ? 'bg-pink-300' : 'bg-gray-200'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden h-fit">
            
            {/* メイン画像 */}
            {project.status !== 'COMPLETED' && project.imageUrl && (
              <div className="h-96 bg-gray-200 relative group cursor-pointer" onClick={() => { setModalImageSrc(project.imageUrl); setIsImageModalOpen(true); }}>
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover"/>
              </div>
            )}

            {/* 完了報告 */}
            {project.status === 'COMPLETED' && (
                <div className="p-6 bg-orange-50 border-b border-orange-200">
                    <h2 className="text-2xl font-bold text-center text-orange-800 mb-4">🎉 企画完了 🎉</h2>
                    {project.completionImageUrls?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {project.completionImageUrls.map((url, i) => <img key={i} src={url} className="w-full h-auto rounded shadow aspect-square object-cover" />)}
                        </div>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">{project.completionComment}</p>
                </div>
            )}

            <div className="p-8">

              <div className="mb-2">
                  <OfficialBadge projectId={project.id} isPlanner={isPlanner} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>

              <p className="text-gray-600 mb-6">企画者: {project.planner?.handleName}</p>
              
              {/* 会場情報 */}
              {project.venue && <div className="mb-8"><VenueRegulationCard venue={project.venue} /></div>}

              <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />

              <div className="mb-8">
                <Link href={`/projects/${id}/board`} className="block group">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 shadow-lg border border-slate-700 text-center">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="relative z-10">
                            <span className="text-xs font-bold text-yellow-400 tracking-widest uppercase mb-1 block">Special Contents</span>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">
                                ✨ デジタル・ネームボードを見る
                            </h3>
                            <p className="text-slate-400 text-sm">
                                支援者全員の名前が刻まれた、Web限定の記念プレートです。
                            </p>
                        </div>
                    </div>
                </Link>
              </div>

              {/* ★★★ AIマッチング (お花屋さんレコメンド) ★★★ */}
              {isPlanner && !project.offer && (project.status === 'FUNDRAISING' || project.status === 'SUCCESSFUL') && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 mb-8">
                    <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                        <FiCpu className="mr-2 text-indigo-500 text-2xl"/> お花屋さん AIマッチング
                    </h2>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-indigo-800 font-bold mb-2">あなたの希望に合うお花屋さんを探します</p>
                        <p className="text-xs text-indigo-600 mb-3">デザインの雰囲気やお花の種類から、AIがおすすめを提案します。</p>
                        
                        {!recommendations ? (
                            <button 
                                onClick={handleGetRecommendations}
                                disabled={loadingRecommendations}
                                className="w-full py-2 bg-white border border-indigo-300 text-indigo-600 rounded-md text-sm font-bold hover:bg-indigo-100 flex items-center justify-center transition-colors"
                            >
                                {loadingRecommendations ? 'AIが検索中...' : 'おすすめのお花屋さんを表示'}
                            </button>
                        ) : (
                            <div className="space-y-3 animate-fadeIn">
                                <div className="flex flex-wrap gap-1 mb-3">
                                    <span className="text-xs text-gray-500 mr-2">抽出されたタグ:</span>
                                    {recommendations.tags.map(t => <span key={t} className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">{t}</span>)}
                                </div>
                                {recommendations.recommendedFlorists.length > 0 ? (
                                    <div className="grid gap-3">
                                        {recommendations.recommendedFlorists.map(f => (
                                            <div key={f.id} className="bg-white p-3 rounded border flex items-center justify-between hover:shadow-sm transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    {f.iconUrl ? <img src={f.iconUrl} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">No Img</div>}
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{f.platformName}</p>
                                                        <div className="flex gap-1 mt-1">
                                                            {f.specialties?.slice(0, 2).map(s => <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">{s}</span>)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/florists/${f.id}`} target="_blank" className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50">詳細</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-2">条件に合うお花屋さんが見つかりませんでした。<br/>条件を変えて試してみてください。</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              )}

              {/* ▼ 配送トラッカー (全員に表示) ▼ */}
              <div className="mb-8">
                <DeliveryTracker status={currentStatus} />
              </div>

              {/* ▼ お花屋さん専用操作パネル (担当花屋のみ表示) ▼ */}
              {isAssignedFlorist && (
                <div className="mb-8">
                  <FloristDeliveryControl 
                    projectId={project.id} 
                    currentStatus={currentStatus} 
                    onStatusChange={handleStatusChange} 
                  />
                </div>
              )}

              {/* 2. パネルデータ管理 */}
              {(isPlanner || isFlorist) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-pink-100 mb-8">
                    <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                        <FiImage className="mr-2 text-pink-500"/> パネル・装飾データ提出
                    </h2>
                    <div className="mb-8">
                        <PanelPreviewer onImageSelected={(file) => {
                            const dummyEvent = { target: { files: [file] } };
                            handleUpload(dummyEvent, 'illustration');
                        }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* イラストパネル */}
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-2">イラストパネル</p>
                            <div className="flex flex-wrap gap-2">
                                {project.illustrationPanelUrls?.map((url, i) => (
                                    <img key={i} src={url} className="w-20 h-20 object-cover rounded border cursor-pointer" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}} />
                                ))}
                                <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                                    <FiUpload className="text-gray-400"/>
                                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'illustration')} />
                                </label>
                            </div>
                        </div>
                        {/* 宛名・祝パネル */}
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-2">祝パネル（札）</p>
                            <div className="flex flex-wrap gap-2">
                                {project.messagePanelUrls?.map((url, i) => (
                                    <img key={i} src={url} className="w-20 h-20 object-cover rounded border cursor-pointer" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}} />
                                ))}
                                <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                                    <FiUpload className="text-gray-400"/>
                                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'message')} />
                                </label>
                            </div>
                        </div>
                        {/* 協賛パネル */}
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-2">協賛パネル</p>
                            <div className="flex flex-wrap gap-2">
                                {project.sponsorPanelUrls?.map((url, i) => (
                                    <img key={i} src={url} className="w-20 h-20 object-cover rounded border cursor-pointer" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}} />
                                ))}
                                <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                                    <FiUpload className="text-gray-400"/>
                                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'sponsor')} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* 3. 前日写真エリア */}
              {((isPlanner || isFlorist) || project.productionStatus === 'PRE_COMPLETION') && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 mb-8">
                    <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                        <FiImage className="mr-2 text-indigo-500"/> 仕上がり確認 (前日写真)
                    </h2>
                    {project.preEventPhotoUrls?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {project.preEventPhotoUrls.map((url, i) => (
                                <img key={i} src={url} className="w-32 h-32 object-cover rounded border cursor-pointer" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">まだ写真はアップロードされていません。</p>
                    )}
                    
                    {isFlorist && (
                        <div className="mt-4">
                            <label className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded cursor-pointer hover:bg-indigo-600 shadow">
                                <FiUpload className="mr-2"/> 前日写真をアップロード
                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'pre_photo')} />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">※アップロードするとステータスが「前日写真」に進みます</p>
                        </div>
                    )}
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center justify-between">
                  <span>詳細</span>
                  {/* ★★★ ARサイズ確認ボタン (ここに追加) ★★★ */}
                  <button 
                    onClick={() => setIsArModalOpen(true)}
                    className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-gray-800 flex items-center shadow-md transition-transform active:scale-95"
                  >
                    <FiBox className="mr-1"/> ARでサイズ確認
                  </button>
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>

              {/* チャットエリア */}
              {(isPlanner || isPledger || isFlorist) && (
                <div className="border-t my-8 pt-6">
                  <GroupChat project={project} user={user} isPlanner={isPlanner} isPledger={isPledger} socket={socket} />
                </div>
              )}

              {/* デザイン詳細 */}
              {(project.designDetails || project.size) && (
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">デザインの希望</h2>
                  <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                    {project.designDetails && <div><strong>雰囲気:</strong> <p className="text-gray-700 whitespace-pre-wrap">{project.designDetails}</p></div>}
                    {project.size && <div><strong>希望サイズ:</strong> <p className="text-gray-700">{project.size}</p></div>}
                    {project.flowerTypes && <div><strong>お花:</strong> <p className="text-gray-700">{project.flowerTypes}</p></div>}
                  </div>
                </div>
              )}

              {(isPlanner || isPledger || isFlorist) && (
                <div className="mt-8 mb-8">
                   <MoodBoard projectId={project.id} user={user} />
                </div>
              )}
              <div className="mt-12 mb-8">
                <VirtualStage projectId={project.id} />
              </div>

              {/* ToDo */}
              {isPlanner && (
                <div className="border-t my-8 pt-6">
                  <h2 className="text-xl font-semibold mb-4">スケジュール管理</h2>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                      <input type="text" value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} placeholder="タスク追加" className="p-2 border rounded flex-grow"/>
                      <button type="submit" className="p-2 bg-sky-500 text-white rounded"><FiSend/></button>
                    </form>
                    <div className="space-y-2">
                        {project.tasks?.map(t=>(
                            <div key={t.id} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={t.isCompleted} onChange={()=>handleToggleTask(t.id, t.isCompleted)}/>
                                    <span className={t.isCompleted?'line-through text-gray-400':''}>{t.title}</span>
                                </div>
                                <button onClick={()=>handleDeleteTask(t.id)} className="text-red-500 text-xs">削除</button>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 収支報告 */}
              <div className="border-t my-8 pt-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">収支報告</h2>
                    {/* ★★★ PDF発行ボタン (企画者または支援者に見せる) ★★★ */}
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
                    >
                        <FiPrinter /> 報告書をPDF発行
                    </button>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-2">
                   <div className="flex justify-between"><span>収入:</span><span>{project.collectedAmount.toLocaleString()} pt</span></div>
                   <div className="flex justify-between text-red-600"><span>支出:</span><span>- {totalExpense.toLocaleString()} pt</span></div>
                   <div className="flex justify-between font-bold border-t pt-2"><span>残高:</span><span>{balance.toLocaleString()} pt</span></div>
                 </div>
                 {isPlanner && (
                    <form onSubmit={handleAddExpense} className="flex gap-2 mt-4">
                        <input type="text" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} placeholder="項目名" className="p-2 border rounded flex-grow"/>
                        <input type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="金額" className="p-2 border rounded w-24"/>
                        <button type="submit" className="p-2 bg-sky-500 text-white rounded">追加</button>
                    </form>
                 )}
                 <div className="mt-4 space-y-1">
                    {project.expenses?.map(e=>(
                        <div key={e.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{e.itemName}</span>
                            <span>{e.amount.toLocaleString()} pt {isPlanner && <button onClick={()=>handleDeleteExpense(e.id)} className="text-red-500 ml-2">×</button>}</span>
                        </div>
                    ))}
                 </div>
                 {/* ★★★ 印刷用コンポーネント (画面には表示しない) ★★★ */}
                 <div style={{ display: "none" }}>
                    <BalanceSheet 
                        ref={componentRef} 
                        project={project} 
                        totalExpense={totalExpense} 
                        balance={balance} 
                    />
                  </div>
              </div>

              {/* お知らせ */}
              {isPlanner && (
                <div className="border-t my-8 pt-6">
                  <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="w-full p-2 bg-indigo-500 text-white rounded">お知らせを投稿</button>
                  {showAnnouncementForm && (
                    <form onSubmit={handleAnnouncementSubmit} className="mt-4 p-4 bg-gray-100 rounded space-y-2">
                        <input value={announcementTitle} onChange={(e)=>setAnnouncementTitle(e.target.value)} placeholder="タイトル" className="w-full p-2 border rounded"/>
                        <textarea value={announcementContent} onChange={(e)=>setAnnouncementContent(e.target.value)} placeholder="内容" className="w-full p-2 border rounded"/>
                        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">投稿</button>
                    </form>
                  )}
                </div>
              )}
              {project.announcements?.length > 0 && (
                  <div className="mt-6 space-y-4">
                      {project.announcements.map(a=>(
                          <div key={a.id} className="bg-slate-50 p-4 rounded">
                              <p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                              <h3 className="font-bold">{a.title}</h3>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{a.content}</p>
                          </div>
                      ))}
                  </div>
              )}

              {/* メッセージ・レビュー */}
              <div className="border-t my-8 pt-6">
                <h2 className="text-xl font-semibold mb-4">メッセージ ({project.messages?.length || 0})</h2>
                {isPlanner && project.messages?.length > 0 && <button onClick={handleCopyMessages} className="text-blue-500 text-sm mb-2">すべてコピー</button>}
                {isPledger && !isPlanner && !hasPostedMessage && <MessageForm projectId={id} onMessagePosted={fetchProject} />}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {project.messages?.map(m=>(
                        <div key={m.id} className="bg-white p-3 border rounded shadow-sm">
                            <p className="font-bold text-sm">{m.cardName}</p>
                            <p className="text-sm text-gray-700">{m.content}</p>
                        </div>
                    ))}
                </div>
              </div>

            </div>
          </div>

          {/* 右カラム (サイドバー) */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
                {/* ★ 2. ここを修正: ログイン状態によって表示を変える */}
                {user ? (
                    // ログイン済みなら、通常の支援フォームを表示
                    <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
                ) : (
                    // 未ログインなら、「ログインして支援」または「ゲストとして支援」を選ばせるボタンを表示
                    <div className="text-center">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">この企画を支援する</h3>
                        <p className="text-sm text-gray-500 mb-6">ログインするとポイントが貯まります。</p>
                        
                        <button 
                            onClick={() => window.location.href = `/login?redirect=/projects/${id}`}
                            className="w-full bg-sky-500 text-white font-bold py-3 rounded-xl hover:bg-sky-600 mb-3 transition-colors shadow-md"
                        >
                            ログインして支援する
                        </button>
                        
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">or</span></div>
                        </div>

                        <button 
                            onClick={() => setShowGuestPledgeModal(true)} 
                            className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            <FiUser /> ゲストとして支援する
                        </button>
                        <p className="text-xs text-gray-400 mt-2">※会員登録なしで支援できます</p>
                    </div>
                )}
                
                {/* 企画管理メニュー (企画者) */}
                {isPlanner && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-bold text-gray-700 mb-2">企画者メニュー</h3>
                        <button onClick={()=>setIsTargetAmountModalOpen(true)} className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm text-sky-600">目標金額の変更</button>
                        <Link href={`/projects/edit/${id}`} className="block w-full text-left p-2 hover:bg-gray-50 rounded text-sm text-sky-600">企画内容の編集</Link>
                        <Link href={`/florists?projectId=${id}`} className="block w-full text-left p-2 hover:bg-gray-50 rounded text-sm text-pink-500">お花屋さんを探す</Link>
                        {project.status==='SUCCESSFUL' && <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-2 bg-green-500 text-white p-2 rounded font-bold">完了報告する</button>}
                        <button onClick={handleCancelProject} className="w-full mt-4 text-red-500 text-xs text-center hover:underline">企画を中止する</button>
                    </div>
                )}

                {/* 4. 花屋専用メニュー (指示書作成など) */}
                {isFlorist && (
                    <div className="mt-6 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-1 rounded">お花屋さん専用</span>
                        <div className="mt-3 space-y-3">
                            <button 
                                onClick={() => setIsInstructionModalOpen(true)}
                                className="w-full py-2 bg-white border border-indigo-300 text-indigo-700 font-bold rounded shadow-sm hover:bg-indigo-50 flex items-center justify-center"
                            >
                                <FiFileText className="mr-2"/> 指示書作成
                            </button>
                            <div>
                                <label className="text-xs font-bold text-gray-600">ステータス変更</label>
                                <select 
                                    value={project.productionStatus} 
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className="w-full mt-1 p-2 border rounded text-sm"
                                >
                                    {PROGRESS_STEPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>
      
      {/* モーダル群 */}
      {isImageModalOpen && <ImageModal src={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
      {isReportModalOpen && <ReportModal projectId={id} user={user} onClose={() => setReportModalOpen(false)} />}
      {isCompletionModalOpen && <CompletionReportModal project={project} user={user} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
      {isTargetAmountModalOpen && <TargetAmountModal project={project} user={user} onClose={() => setIsTargetAmountModalOpen(false)} onUpdate={fetchProject} />}
      {isInstructionModalOpen && <InstructionSheetModal projectId={id} onClose={() => setIsInstructionModalOpen(false)} />}
      
      {/* ★★★ 修正: ARモーダル (画像アップロード機能付き) ★★★ */}
      {isArModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800 flex items-center">
                    <FiBox className="mr-2"/> ARでサイズ確認 (2Dパネル)
                </h3>
                <button onClick={() => setIsArModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                  <FiX />
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!arSrc ? (
                  /* 生成前：フォーム表示 */
                  <div className="space-y-6">
                      
                      {/* ★★★ 支援者向け: 完成写真の選択機能 ★★★ */}
                      {project.status === 'COMPLETED' && (isPledger || isPlanner || isFlorist) && project.completionImageUrls?.length > 0 && (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                             <h4 className="font-bold text-green-800 mb-2 flex items-center">
                               <FiCheckCircle className="mr-2"/> 完成したフラスタをARで見る
                             </h4>
                             <p className="text-xs text-green-700 mb-3">現地に行けない方も、実際の仕上がりをARで確認できます。</p>
                             <div className="flex gap-2 overflow-x-auto pb-2">
                                {project.completionImageUrls.map((url, i) => (
                                    <div key={i} className="flex-shrink-0 cursor-pointer group" onClick={() => handleSelectCompletedImage(url)}>
                                        <img src={url} className="w-24 h-24 object-cover rounded border-2 border-transparent group-hover:border-green-500 transition-colors" />
                                        <p className="text-[10px] text-center mt-1 text-green-700 group-hover:font-bold">これを選択</p>
                                    </div>
                                ))}
                             </div>
                          </div>
                      )}

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-800">
                              <FiInfo className="inline mr-1"/>
                              持っているフラスタの画像をアップロードして、ARで部屋に置いてみましょう。<br/>
                              高さを指定すると、実寸大で表示されます。
                          </p>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">1. 画像を選択</label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  {arImageFile ? (
                                      <div className="text-center">
                                          <p className="text-sm font-bold text-green-600 mb-1"><FiCheck className="inline"/> {arImageFile.name}</p>
                                          <p className="text-xs text-gray-500">クリックして変更</p>
                                      </div>
                                  ) : (
                                      <>
                                          <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                                          <p className="text-sm text-gray-500">クリックして画像をアップロード</p>
                                      </>
                                  )}
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setArImageFile(e.target.files[0])} />
                          </label>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">2. 高さを指定 (cm)</label>
                          <div className="relative">
                              <FiArrowUp className="absolute left-3 top-3 text-gray-400"/>
                              <input 
                                  type="number" 
                                  value={arHeight} 
                                  onChange={(e) => setArHeight(e.target.value)} 
                                  className="pl-10 w-full p-2 border rounded-lg"
                                  placeholder="例: 180"
                              />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">※一般的なフラスタの高さは 180cm〜200cm です。</p>
                      </div>

                      <button 
                          onClick={handleGenerateAr}
                          disabled={arGenLoading || !arImageFile}
                          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-colors shadow-md flex justify-center items-center"
                      >
                          {arGenLoading ? 'ARデータを生成中...' : 'ARモデルを生成する'}
                      </button>
                  </div>
              ) : (
                  /* 生成後：ARビューワー表示 */
                  <div className="flex flex-col items-center">
                      <p className="text-sm text-center text-gray-600 mb-4">
                        スマホのカメラをかざすと、<br/>高さ <strong>{arHeight}cm</strong> のパネルが表示されます。
                      </p>
                      
                      <ArViewer 
                        src={arSrc} 
                        // iOS用usdzは生成していないため省略(Android/WebXRで動作)
                        alt="フラスタARパネル"
                      />

                      <button 
                        onClick={() => { setArSrc(null); setArImageFile(null); }}
                        className="mt-6 text-sm text-gray-500 flex items-center hover:text-indigo-600"
                      >
                        <FiRefreshCw className="mr-1"/> 別の画像で試す
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* ★ 3. ゲスト支援モーダルを追加 (JSXの最後の方、</>の直前) */}
      {showGuestPledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* モーダルヘッダー */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">ゲスト支援</h3>
              <button onClick={() => setShowGuestPledgeModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                ✕
              </button>
            </div>
            
            {/* モーダルコンテンツ (スクロール可能) */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <GuestPledgeForm 
                projectId={project.id}
                projectTitle={project.title}
                onCancel={() => setShowGuestPledgeModal(false)}
                onSuccess={() => {
                  setShowGuestPledgeModal(false);
                  fetchProject(); // 支援完了後にデータを再取得して表示を更新
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ★★★ ここに追加: スクロール追従プログレスバー ★★★ */}
      <FlowerScrollIndicator 
          collected={project.collectedAmount} 
          target={project.targetAmount} 
      />

    </>
  );
}