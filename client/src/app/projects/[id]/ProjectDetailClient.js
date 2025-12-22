'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Markdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';

// Icons
import { 
  FiHeart, FiThumbsUp, FiMessageSquare, FiInfo, FiUser, FiSend, 
  FiCheckCircle, FiCheck, FiUpload, FiPrinter, FiFileText, FiImage, 
  FiCpu, FiBox, FiX, FiRefreshCw, FiArrowUp, FiLock, FiBookOpen, 
  FiTool, FiDollarSign, FiAlertTriangle, FiTrash2 
} from 'react-icons/fi';

// Components
import VenueLogisticsWiki from '@/app/components/VenueLogisticsWiki';
import MoodboardPostForm from '@/app/components/MoodboardPostForm';
import MoodboardDisplay from '@/app/components/MoodboardDisplay';
import OfficialBadge from '@/app/components/OfficialBadge';
import UpsellAlert from '@/app/components/UpsellAlert';
import FlowerScrollIndicator from '@/app/components/FlowerScrollIndicator';
import PanelPreviewer from '@/app/components/PanelPreviewer';
import GuestPledgeForm from '@/app/components/GuestPledgeForm';
import ImageModal from '@/app/components/ImageModal';
import MessageForm from '@/app/components/MessageForm';
import GroupChat from './components/GroupChat';
import CompletionReportModal from './components/CompletionReportModal';
import ReportModal from './components/ReportModal';
import VenueRegulationCard from '@/app/components/VenueRegulationCard';

// 新規モーダル (パスは実際のプロジェクト構成に合わせてください)
import FloristMaterialModal from '@/app/components/project/FloristMaterialModal';
import ProjectCancelModal from '@/app/components/project/ProjectCancelModal';

// Dynamic Import
const ArViewer = dynamic(() => import('@/app/components/ArViewer'), { ssr: false });

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const PROGRESS_STEPS = [
  { key: 'FUNDRAISING', label: '募集中', order: 0 },
  { key: 'OFFER_ACCEPTED', label: 'オファー確定', order: 1 },
  { key: 'DESIGN_FIXED', label: 'デザイン決定', order: 2 },
  { key: 'MATERIAL_PREP', label: '資材手配中', order: 3 },
  { key: 'PRODUCTION_IN_PROGRESS', label: '制作中', order: 4 },
  { key: 'READY_FOR_DELIVERY', label: '配送準備完了', order: 5 },
  { key: 'COMPLETED', label: '完了', order: 6 }
];

// Helper Functions
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

const useIsMounted = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted;
};

// ===========================================
// Sub Components
// ===========================================

function InstructionSheetModal({ project, onClose }) {
  const [loading, setLoading] = useState(false);
  
  const images = [
    project.designImageUrls?.[0] || project.imageUrl, 
    project.designImageUrls?.[1], 
    project.designImageUrls?.[2]
  ].filter(url => url); 
    
  const generateContentHTML = () => {
    const instructionText = `
      <h1>【FLASTAL 制作指示書】</h1>
      <h2>企画名: ${project.title}</h2>
      <p><strong>企画者:</strong> ${project.planner?.handleName}</p>
      <p><strong>納品日時:</strong> ${new Date(project.deliveryDate).toLocaleString()}</p>
      <p><strong>会場:</strong> ${project.venue?.venueName || '未定'} / ${project.venue?.address || '未定'}</p>
      <hr/>
      <h3>デザイン詳細:</h3>
      <p>${project.designDetails || 'なし'}</p>
      <p><strong>希望サイズ:</strong> ${project.size || '不明'}</p>
      <p><strong>花材・色:</strong> ${project.flowerTypes || '不明'}</p>
      <hr/>
      <h3>会場レギュレーション（重要）:</h3>
      <pre>${project.venue?.regulations || 'レギュレーション情報なし'}</pre>
    `;

    const imageHtml = images.length > 0 ? `
        <div style="margin-bottom: 20px; page-break-before: auto;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">デザイン参考画像</h3>
            
            <div style="margin-bottom: 15px; border: 1px solid #ccc; padding: 5px;">
                <img 
                    src="${images[0]}" 
                    alt="メインデザイン" 
                    style="width: 100%; max-height: 500px; object-fit: contain; display: block;"
                />
                <p style="text-align: center; font-size: 12px; margin-top: 5px;">[画像 1/3 - メイン参考]</p>
            </div>
            
            ${images[1] || images[2] ? `
                <div style="display: flex; gap: 10px;">
                    ${images[1] ? `
                        <div style="flex: 1; border: 1px solid #ccc; padding: 5px;">
                            <img 
                                src="${images[1]}" 
                                alt="サブ画像 2" 
                                style="width: 100%; height: 150px; object-fit: cover; display: block;"
                            />
                            <p style="text-align: center; font-size: 12px; margin-top: 5px;">[画像 2/3]</p>
                        </div>
                    ` : ''}
                    ${images[2] ? `
                        <div style="flex: 1; border: 1px solid #ccc; padding: 5px;">
                            <img 
                                src="${images[2]}" 
                                alt="サブ画像 3" 
                                style="width: 100%; height: 150px; object-fit: cover; display: block;"
                            />
                            <p style="text-align: center; font-size: 12px; margin-top: 5px;">[画像 3/3]</p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    ` : '';
    
    return imageHtml + instructionText;
  };
  
  const contentHtml = generateContentHTML();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>制作指示書: ${project.title}</title>
          <style>
            body { font-family: 'Hiragino Kaku Gothic Pro', 'Meiryo', sans-serif; font-size: 14px; padding: 20px; color: #333; }
            h1 { font-size: 24px; color: #E91E63; border-bottom: 2px solid #E91E63; padding-bottom: 5px; }
            h2 { font-size: 18px; margin-top: 20px; color: #555; }
            h3 { font-size: 16px; margin-top: 15px; color: #333; }
            hr { margin: 20px 0; border: none; border-top: 1px dashed #ccc; }
            pre { background: #f4f4f4; padding: 10px; border: 1px solid #ddd; white-space: pre-wrap; }
            img { max-width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopy = () => {
    const textToCopy = `制作指示書 - ${project.title}\n\n企画者: ${project.planner?.handleName}\n納品日時: ${new Date(project.deliveryDate).toLocaleString()}\n会場: ${project.venue?.venueName || '未定'}\n\nデザイン詳細:\n${project.designDetails || 'なし'}\n希望サイズ: ${project.size || '不明'}\n花材・色: ${project.flowerTypes || '不明'}\n\n会場レギュレーション:\n${project.venue?.regulations || 'レギュレーション情報なし'}\n\n画像URL:\n${images.join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('指示書のテキストをクリップボードにコピーしました');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
          <FiFileText className="mr-2"/> 制作指示書プレビュー
        </h3>
        
        <div className="flex-grow p-4 border rounded bg-gray-50 text-sm mb-4 overflow-y-auto">
          {loading ? (
            <div className="flex-grow flex items-center justify-center p-10">読み込み中...</div>
          ) : (
             <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          )}
        </div>
        
        <div className="mt-auto flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition-colors">閉じる</button>
          <button onClick={handleCopy} className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">テキストコピー</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700 transition-colors">
            <FiPrinter className="mr-2"/> 印刷 / PDF
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
    if (finalAmount <= 0) {
      toast.error('支援金額は1円以上である必要があります。');
      return;
    }
    
    const loadingToast = toast.loading('Stripe決済ページへ移動中...');
    try {
      const res = await fetch(`${API_URL}/api/checkout/create-guest-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          amount: finalAmount,
          comment: data.comment,
          tierId: pledgeType === 'tier' ? data.selectedTierId : undefined,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          successUrl: `${window.location.origin}/projects/${project.id}?payment=success`, 
          cancelUrl: `${window.location.origin}/projects/${project.id}?payment=cancelled`,
        })
      });
      
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || '決済セッションの作成に失敗しました');
      }
      
      const { sessionUrl } = result;
      if (!sessionUrl) {
        throw new Error('リダイレクトURLが取得できませんでした');
      }

      toast.dismiss(loadingToast);
      window.location.href = sessionUrl; 

    } catch (error) {
      console.error('Guest Pledge Error:', error);
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
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
                  <FiCheckCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">支援済みです</h3>
              <p className="text-gray-600 text-sm">この企画を支援しています。ご協力ありがとうございます！</p>
              <div className="mt-4">
                <Link href={`#message-form`} className="block w-full text-center py-2.5 bg-white text-blue-600 font-bold border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                  メッセージを投稿する
                </Link>
              </div>
          </div>
      );
  }

  if (project.status !== 'FUNDRAISING') {
    return (
        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 text-center">
            <h3 className="text-xl font-bold text-gray-600 mb-2">受付終了</h3>
            <p className="text-gray-500 text-sm">この企画は現在、支援を募集していません。</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-fadeIn">
      <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">この企画を支援する</h3>
      {!user && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-900 text-sm rounded-lg border border-amber-200 flex items-start gap-2">
            <FiInfo className="mt-0.5 shrink-0 text-amber-600"/>
            <div>
                現在、<strong>ゲストモード</strong>で表示しています。<br/>
                ログインすると、ポイント利用や履歴管理が可能になります。
                <Link href="/login" className="text-amber-700 font-bold underline ml-1 hover:text-amber-800">ログインする</Link>
            </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <label className={`flex-1 text-center py-2 rounded-md cursor-pointer text-sm font-bold transition-all ${pledgeType === 'tier' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <input type="radio" {...register('pledgeType')} value="tier" className="hidden" />
            コースから選ぶ
          </label>
          <label className={`flex-1 text-center py-2 rounded-md cursor-pointer text-sm font-bold transition-all ${pledgeType === 'free' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <input type="radio" {...register('pledgeType')} value="free" className="hidden" />
            金額を指定
          </label>
        </div>

        {pledgeType === 'tier' && project.pledgeTiers && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
            {project.pledgeTiers.map(tier => (
              <label key={tier.id} className={`block p-4 border-2 rounded-xl cursor-pointer transition-all group ${selectedTierId === tier.id ? 'border-pink-500 bg-pink-50 shadow-md ring-1 ring-pink-200' : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'}`}>
                <input type="radio" {...register('selectedTierId', { required: pledgeType === 'tier' })} value={tier.id} className="hidden" />
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg text-gray-800">{tier.amount.toLocaleString()} <span className="text-xs font-normal text-gray-500">{user ? 'pt' : '円'}</span></span>
                  {selectedTierId === tier.id && <FiCheckCircle className="text-pink-500"/>}
                </div>
                <span className="text-sm font-bold text-pink-600 block mb-1">{tier.title}</span>
                <p className="text-xs text-gray-600 leading-relaxed">{tier.description}</p>
              </label>
            ))}
          </div>
        )}

        {pledgeType === 'free' && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">支援金額 ({user ? 'pt' : '円'})</label>
            <div className="relative">
                <input 
                    type="number" 
                    {...register('pledgeAmount', { required: true, min: 1 })} 
                    min="1" 
                    className="w-full p-3 pl-4 pr-12 border border-gray-300 rounded-lg text-lg font-bold text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all" 
                    placeholder="1000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{user ? 'pt' : '円'}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">応援メッセージ (任意)</label>
          <textarea 
            rows="3" 
            {...register('comment')} 
            placeholder="企画者さんへメッセージを送りましょう！" 
            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all resize-none"
          ></textarea>
        </div>

        {!user && (
            <div className="pt-4 border-t border-dashed border-gray-300 space-y-4">
              <p className="text-sm font-bold text-gray-700 flex items-center"><FiUser className="mr-1"/> ゲスト情報入力</p>
              <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">お名前 (ニックネーム可)</label>
                    <input type="text" {...register('guestName', { required: !user })} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-pink-500 outline-none" placeholder="フラスタ 太郎"/>
                    {errors.guestName && <p className="text-xs text-red-500 mt-1">必須です</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
                    <input type="email" {...register('guestEmail', { required: !user })} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-pink-500 outline-none" placeholder="taro@example.com"/>
                    <p className="text-[10px] text-gray-400 mt-1">完了メールをお送りします</p>
                    {errors.guestEmail && <p className="text-xs text-red-500 mt-1">必須です</p>}
                  </div>
              </div>
            </div>
        )}

        <div className="border-t pt-4">
            <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-gray-500">お支払い合計</span>
                <span className="text-2xl font-black text-gray-900">{finalAmount.toLocaleString()} <span className="text-sm font-normal text-gray-500">{user ? 'pt' : '円'}</span></span>
            </div>
            <button 
                type="submit" 
                disabled={isSubmitting || finalAmount <= 0} 
                className="w-full py-4 font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:shadow-lg hover:scale-[1.02] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none transition-all shadow-md flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> 処理中...</>
                ) : (
                    user ? 'ポイントで支援する' : 'ゲストとして支援する'
                )}
            </button>
            {!user && <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center"><FiLock className="mr-1"/> 決済にはStripeを利用し、外部ページへ移動します</p>}
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4 text-gray-800">目標金額の変更</h2>
          <p className="text-sm text-gray-500 mb-4">現在の支援総額（{project.collectedAmount.toLocaleString()}pt）を下回ることはできません。</p>
          <div className="relative">
              <input 
                type="number" 
                value={newAmount} 
                onChange={(e) => setNewAmount(e.target.value)} 
                min={project.collectedAmount} 
                required 
                className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 font-bold text-lg focus:ring-2 focus:ring-pink-500 outline-none" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">pt</span>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-200 transition-colors">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 font-bold text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition-colors shadow-md disabled:bg-gray-300">
                {isSubmitting ? '更新中...' : '変更を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// Progress Tracker Component
// ===========================================
const ProgressTracker = ({ project, isAssignedFlorist, fetchProject }) => {
    const token = getAuthToken();
    
    const currentStatusKey = project?.status;
    const currentStatus = PROGRESS_STEPS.find(s => s.key === currentStatusKey);
    const currentOrder = currentStatus ? currentStatus.order : 0;

    const handleStatusUpdate = async (newStatusKey) => {
        if(!window.confirm(`ステータスを「${PROGRESS_STEPS.find(s => s.key === newStatusKey)?.label}」に更新しますか？`)) return;
        
        const toastId = toast.loading('ステータスを更新中...');
        try {
            const res = await fetch(`${API_URL}/api/projects/${project.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatusKey })
            });

            if (!res.ok) {
                const errorDetail = await res.json();
                throw new Error(errorDetail.message || 'ステータス更新に失敗しました');
            }
            
            toast.success('進捗を更新しました！', { id: toastId });
            fetchProject();
            
        } catch (error) {
            console.error('Status Update Error:', error);
            toast.error(error.message, { id: toastId });
        }
    };
    
    const stepsToDisplay = PROGRESS_STEPS.filter(s => s.order > 0);

    if (!isAssignedFlorist && currentOrder < 1 && project.status !== 'SUCCESSFUL' && project.status !== 'COMPLETED') {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 mb-8 overflow-hidden relative">
            {/* 装飾 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-purple-300"></div>

            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <FiTool className="mr-2 text-pink-500"/> 制作進捗状況
            </h2>
            
            <div className="relative px-2">
                {/* プログレスバー背景 */}
                <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 rounded-full -z-10"></div>
                {/* アクティブバー */}
                <div 
                    className="absolute top-4 left-0 h-1 bg-pink-500 rounded-full transition-all duration-700 ease-out -z-10" 
                    style={{ width: `${(currentOrder / (PROGRESS_STEPS.length - 1)) * 100}%` }}
                ></div>

                <div className="flex justify-between items-start">
                    {stepsToDisplay.map((step, index) => {
                        const stepIndex = index + 1;
                        const isCompleted = step.order <= currentOrder;
                        const isCurrent = step.order === currentOrder;
                        
                        return (
                            <div key={step.key} className="flex flex-col items-center w-16 group">
                                <div 
                                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-xs shadow-sm transition-all duration-300 ${
                                        isCompleted 
                                            ? 'bg-pink-500 border-pink-500 text-white' 
                                            : 'bg-white border-gray-200 text-gray-400'
                                    } ${isCurrent ? 'ring-4 ring-pink-100 scale-110' : ''}`}
                                >
                                    {isCompleted ? <FiCheck size={16} /> : stepIndex}
                                </div>
                                <span className={`text-[10px] mt-2 text-center font-bold transition-colors ${isCompleted ? 'text-pink-600' : 'text-gray-400'} ${isCurrent ? 'scale-105' : ''}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {isAssignedFlorist && currentStatusKey !== 'COMPLETED' && (
                <div className="border-t border-dashed border-gray-200 pt-4 mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <span className="text-xs font-bold text-gray-500">次のステップへ更新:</span>
                        <div className="flex flex-wrap gap-2">
                            {stepsToDisplay
                                .filter(s => s.order > currentOrder && s.key !== 'COMPLETED') 
                                .slice(0, 2) 
                                .map(nextStep => (
                                    <button 
                                        key={nextStep.key}
                                        onClick={() => handleStatusUpdate(nextStep.key)}
                                        className="px-4 py-2 text-xs font-bold bg-white border border-indigo-200 text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-sm"
                                    >
                                        → {nextStep.label}
                                    </button>
                                ))
                            }
                            {currentOrder >= (PROGRESS_STEPS.find(s => s.key === 'READY_FOR_DELIVERY')?.order || 5) && 
                                <button
                                    onClick={() => handleStatusUpdate('COMPLETED')}
                                    className="px-5 py-2 text-xs font-bold bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                                >
                                    納品完了にする
                                </button>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// Main Component: ProjectDetailClient
// ===========================================
export default function ProjectDetailClient() {
  const params = useParams();
  const { id } = params;
  const [activeTab, setActiveTab] = useState('overview'); 
  const [aiSummary, setAiSummary] = useState(null);
  const [showGuestPledgeModal, setShowGuestPledgeModal] = useState(false);
  const { user } = useAuth(); 
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

  // 新規モーダルのState
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // AR States
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

    // Payment Callback Logic
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('payment') === 'success') {
            toast.success("決済が完了しました！ご支援ありがとうございます。", { duration: 6000 });
            history.replaceState(null, '', `${window.location.pathname}`);
        } else if (urlParams.get('payment') === 'cancelled') {
            toast.error("決済がキャンセルされました。再度お試しください。");
            history.replaceState(null, '', `${window.location.pathname}`);
        }
    }, []);

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

  useEffect(() => { 
     fetchProject(); 
  }, [fetchProject]);

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

  const handleSelectCompletedImage = async (url) => {
    const toastId = toast.loading('画像を準備中...');
    try {
        const response = await fetch(url);
        const blob = await response.blob(); 
        const file = new File([blob], "completed-flower.jpg", { type: blob.type });
        
        setArImageFile(file);
        setArHeight(180);
        toast.success('画像をセットしました！下部の「ARモデルを生成する」ボタンを押してください', { id: toastId });
        
    } catch (e) {
        console.error(e);
        toast.error('画像の読み込みに失敗しました', { id: toastId });
    }
  };

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

  const isAssignedFlorist = user && user.role === 'FLORIST' && project?.offer?.floristId === user.id;
  const isFlorist = user && user.role === 'FLORIST'; 
  const isPledger = user && (project?.pledges || []).some(p => p.userId === user.id);
  const isPlanner = user && user.id === project?.planner?.id;

  const onPledgeSubmit = (data) => {
    if (!user) return toast.error('ログインが必要です。');
    const token = getAuthToken();
    const promise = fetch(`${API_URL}/api/pledges`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) }).then(res => { if(!res.ok) throw new Error('失敗'); return res.json(); });
    toast.promise(promise, { loading: '処理中...', success: () => { fetchProject(); return '支援完了！'; }, error: '失敗しました' });
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

  const isMounted = useIsMounted();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;
  if (!project) return <div className="text-center mt-20 text-gray-500 font-bold text-lg">企画が見つかりませんでした。</div>;

  if (!isMounted) {
      return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;
  }

  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;
  const hasPostedMessage = project.messages?.some(m => m.userId === user?.id);

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
        
        {/* Progress Tracker (Sticky) */}
        {(isAssignedFlorist || project.status === 'SUCCESSFUL' || project.status === 'COMPLETED' || project.status === 'FUNDRAISING') && (
          <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <ProgressTracker 
                project={project} 
                isAssignedFlorist={isAssignedFlorist}
                fetchProject={fetchProject}
              />
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Main Image */}
            {project.status !== 'COMPLETED' && project.imageUrl && (
              <div className="h-80 md:h-96 bg-gray-200 relative group cursor-pointer" onClick={() => { setModalImageSrc(project.imageUrl); setIsImageModalOpen(true); }}>
                <Image 
                  src={project.imageUrl} 
                  alt={project.title} 
                  fill 
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
              </div>
            )}

            {/* Completion Report Header */}
            {project.status === 'COMPLETED' && (
                <div className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100">
                    <div className="text-center mb-6">
                        <span className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-bold mb-2">PROJECT COMPLETED</span>
                        <h2 className="text-3xl font-extrabold text-orange-800">🎉 企画完了 🎉</h2>
                    </div>
                    {project.completionImageUrls?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {project.completionImageUrls.map((url, i) => (
                              <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setModalImageSrc(url); setIsImageModalOpen(true); }}>
                                <Image 
                                  src={url} 
                                  alt={`完了写真 ${i}`} 
                                  fill 
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            ))}
                        </div>
                    )}
                    <div className="bg-white/60 p-6 rounded-2xl backdrop-blur-sm border border-orange-100">
                        <h4 className="font-bold text-orange-800 mb-2">企画者からのメッセージ</h4>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.completionComment}</p>
                    </div>
                </div>
            )}

            <div className="p-6 md:p-10">

              <div className="mb-4">
                  <OfficialBadge projectId={project.id} isPlanner={isPlanner} />
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">{project.title}</h1>

              <div className="flex items-center gap-3 text-gray-500 mb-8">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {project.planner?.iconUrl ? <Image src={project.planner.iconUrl} width={32} height={32} alt=""/> : <FiUser />}
                  </div>
                  <span className="font-medium">企画者: {project.planner?.handleName}</span>
              </div>
              
              <UpsellAlert target={project.targetAmount} collected={project.collectedAmount} />

              {/* Digital Nameboard Link */}
              <div className="my-8">
                <Link href={`/projects/${id}/board`} className="block group">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 shadow-xl border border-slate-700 text-center transform transition-all hover:scale-[1.01]">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                        <div className="relative z-10">
                            <span className="text-xs font-bold text-yellow-400 tracking-widest uppercase mb-2 block">Special Contents</span>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors flex items-center justify-center gap-2">
                                <FiAward className="text-yellow-400"/> デジタル・ネームボードを見る
                            </h3>
                            <p className="text-slate-400 text-sm">
                                支援者全員の名前が刻まれた、Web限定の記念プレートです。
                            </p>
                        </div>
                    </div>
                </Link>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-100 mb-8">
                <nav className="flex space-x-8 overflow-x-auto pb-1">
                    {[
                        { id: 'overview', label: '概要', icon: FiBookOpen },
                        { id: 'collaboration', label: '共同作業・デザイン', icon: FiTool },
                        { id: 'finance', label: '収支・報告', icon: FiDollarSign }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-2 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 ${
                                activeTab === tab.id 
                                ? 'border-pink-500 text-pink-600' 
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                            }`}
                        >
                            <tab.icon size={16}/> {tab.label}
                        </button>
                    ))}
                </nav>
              </div>
              
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                  <div className="space-y-8 animate-fadeIn">
                      
                      {project.venue && (
                          <VenueRegulationCard venue={project.venue} />
                      )}
                      
                      {project.venueId && (
                          <VenueLogisticsWiki 
                              venueId={project.venueId} 
                              venueName={project.venue?.venueName} 
                              isFloristView={isAssignedFlorist}
                          />
                      )}
                      
                      <div>
                          <h2 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-pink-500 pl-3">詳細</h2>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {project.description}
                          </div>
                      </div>

                      {(project.designDetails || project.size || project.flowerTypes) && (
                          <div>
                              <h2 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-pink-500 pl-3">デザインの希望</h2>
                              <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-4 shadow-sm">
                                  {project.designDetails && <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">雰囲気</span><p className="text-gray-800">{project.designDetails}</p></div>}
                                  {project.size && <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">希望サイズ</span><p className="text-gray-800">{project.size}</p></div>}
                                  {project.flowerTypes && <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">お花</span><p className="text-gray-800">{project.flowerTypes}</p></div>}
                              </div>
                          </div>
                      )}

                      {(project.announcements?.length > 0 || isPlanner) && (
                          <div>
                              <div className="flex justify-between items-center mb-4">
                                  <h2 className="text-lg font-bold text-gray-800 border-l-4 border-pink-500 pl-3">お知らせ・活動報告</h2>
                                  {isPlanner && (
                                      <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition-colors">
                                          + 投稿する
                                      </button>
                                  )}
                              </div>
                              
                              {isPlanner && showAnnouncementForm && (
                                  <form onSubmit={handleAnnouncementSubmit} className="mb-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 animate-fadeIn">
                                      <input value={announcementTitle} onChange={(e)=>setAnnouncementTitle(e.target.value)} placeholder="タイトル" className="w-full p-3 mb-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"/>
                                      <textarea value={announcementContent} onChange={(e)=>setAnnouncementContent(e.target.value)} placeholder="内容" rows="3" className="w-full p-3 mb-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none"/>
                                      <div className="flex justify-end gap-2">
                                          <button type="button" onClick={() => setShowAnnouncementForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg font-bold">キャンセル</button>
                                          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-md">投稿</button>
                                      </div>
                                  </form>
                              )}

                              {project.announcements?.length > 0 ? (
                                  <div className="space-y-4">
                                      {project.announcements.map(a=>(
                                          <div key={a.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                              <p className="text-xs text-gray-400 font-bold mb-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                                              <h3 className="font-bold text-gray-800 text-lg mb-2">{a.title}</h3>
                                              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-gray-400 text-sm text-center py-4 bg-slate-50 rounded-xl border border-dashed border-gray-200">まだお知らせはありません。</p>
                              )}
                          </div>
                      )}
                  </div>
              )}

              {/* Tab: Collaboration */}
              {activeTab === 'collaboration' && (
                <div className="space-y-10 animate-fadeIn">

                    {aiSummary && (
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-200 shadow-sm">
                            <h2 className="text-lg font-bold text-yellow-800 mb-3 flex items-center">
                                <FiCpu className="mr-2"/> AIまとめ (最新の決定事項)
                            </h2>
                            <div className="text-sm text-gray-800 prose prose-sm max-w-none">
                                <Markdown>{aiSummary}</Markdown> 
                            </div>
                        </div>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiImage className="text-pink-500"/> ムードボード (アイデア共有)
                            </h2>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <MoodboardPostForm projectId={project.id} onPostSuccess={fetchProject} /> 
                                <div className="mt-6">
                                    <MoodboardDisplay projectId={project.id} />
                                </div>
                            </div>
                        </div>
                    )}

                    {(isPlanner || isPledger || isFlorist) && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiMessageSquare className="text-sky-500"/> 企画チャット
                            </h2>
                            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <GroupChat 
                                    project={project} 
                                    user={user} 
                                    isPlanner={isPlanner} 
                                    isPledger={isPledger} 
                                    socket={socket} 
                                    onSummaryUpdate={setAiSummary} 
                                    summary={aiSummary} 
                                />
                            </div>
                        </div>
                    )}

                    {isPlanner && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-4">タスク管理</h2>
                            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                                <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
                                    <input type="text" value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} placeholder="新しいタスクを入力" className="p-3 border border-gray-200 rounded-xl flex-grow bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-200 outline-none transition-all"/>
                                    <button type="submit" className="px-4 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors shadow-md"><FiPlus/></button>
                                </form>
                                <div className="space-y-2">
                                    {project.tasks?.map(t=>(
                                        <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-sky-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={t.isCompleted} onChange={()=>handleToggleTask(t.id, t.isCompleted)} className="w-5 h-5 text-sky-500 rounded focus:ring-sky-500 border-gray-300"/>
                                                <span className={`text-sm font-medium ${t.isCompleted?'line-through text-gray-400':'text-gray-700'}`}>{t.title}</span>
                                            </div>
                                            <button onClick={()=>handleDeleteTask(t.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"><FiTrash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {(!project.tasks || project.tasks.length === 0) && <p className="text-center text-gray-400 text-sm py-4">タスクはありません</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">確認ツール</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2 flex items-center"><FiBox className="mr-2"/> ARシミュレーター</h3>
                                    <p className="text-xs text-gray-500 mb-4">パネルやフラスタのサイズ感をARで確認できます。</p>
                                </div>
                                <button 
                                    onClick={() => setIsArModalOpen(true)}
                                    className="w-full py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md"
                                >
                                    ARを起動する
                                </button>
                            </div>
                            
                            {(isPlanner || isFlorist) && (
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                    <h3 className="font-bold text-gray-700 mb-2 flex items-center"><FiUpload className="mr-2"/> データ提出</h3>
                                    <div className="mt-2">
                                        <PanelPreviewer onImageSelected={(file) => {
                                            const dummyEvent = { target: { files: [file] } };
                                            handleUpload(dummyEvent, 'illustration');
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {((isPlanner || isFlorist) || project.productionStatus === 'PRE_COMPLETION') && (
                            <div className="mt-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <h3 className="font-bold text-indigo-900 mb-4 flex items-center"><FiCheckCircle className="mr-2"/> 仕上がり確認 (前日写真)</h3>
                                {project.preEventPhotoUrls?.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {project.preEventPhotoUrls.map((url, i) => (
                                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={()=>{setModalImageSrc(url); setIsImageModalOpen(true)}}>
                                                <Image src={url} alt={`前日写真 ${i}`} fill style={{ objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-indigo-400 bg-white/50 p-3 rounded-lg border border-indigo-100">まだ写真はアップロードされていません。</p>
                                )}
                                {isFlorist && (
                                    <div className="mt-4">
                                        <label className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-indigo-700 shadow-md transition-colors">
                                            <FiUpload className="mr-2"/> 写真をアップロード
                                            <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'pre_photo')} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div> 
              )}


              {/* Tab: Finance */}
              {activeTab === 'finance' && (
                <div className="space-y-8 animate-fadeIn">
                    
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center"><FiDollarSign className="mr-2"/> 収支報告</h2>
                            <button 
                                onClick={handlePrint}
                                className="flex items-center gap-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full transition-colors"
                            >
                                <FiPrinter /> PDF発行
                            </button>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl text-sm space-y-3 border border-slate-100">
                            <div className="flex justify-between">
                                <span className="text-gray-500">収入 (支援総額)</span>
                                <span className="font-bold text-gray-800">{project.collectedAmount.toLocaleString()} pt</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>支出合計</span>
                                <span>- {totalExpense.toLocaleString()} pt</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>残高 (余剰金)</span>
                                <span className="text-indigo-600">{balance.toLocaleString()} pt</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-700 mb-4">支出詳細</h3>
                        {isPlanner && (
                            <form onSubmit={handleAddExpense} className="flex gap-2 mb-6 bg-gray-50 p-3 rounded-xl">
                                <input type="text" value={expenseName} onChange={(e)=>setExpenseName(e.target.value)} placeholder="項目名 (例: パネル印刷費)" className="p-2 border border-gray-200 rounded-lg flex-grow text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"/>
                                <input type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="金額" className="p-2 border border-gray-200 rounded-lg w-24 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"/>
                                <button type="submit" className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm text-sm font-bold px-4">追加</button>
                            </form>
                        )}
                        <div className="space-y-2">
                            {project.expenses?.map(e=>(
                                <div key={e.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="font-medium text-gray-700">{e.itemName}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">{e.amount.toLocaleString()} pt</span>
                                        {isPlanner && <button onClick={()=>handleDeleteExpense(e.id)} className="text-gray-400 hover:text-red-500 transition-colors"><FiTrash2/></button>}
                                    </div>
                                </div>
                            ))}
                            {(!project.expenses || project.expenses.length === 0) && <p className="text-center text-gray-400 text-sm py-4">支出は登録されていません</p>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">支援者メッセージ ({project.messages?.length || 0})</h2>
                            {isPlanner && project.messages?.length > 0 && <button onClick={handleCopyMessages} className="text-blue-500 text-xs font-bold hover:underline">すべてコピー</button>}
                        </div>
                        
                        {isPledger && !isPlanner && !hasPostedMessage && (
                            <div className="mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">
                                <MessageForm projectId={id} onMessagePosted={fetchProject} />
                            </div>
                        )}
                        
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                            {project.messages?.map(m=>(
                                <div key={m.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="font-bold text-sm text-gray-800 mb-1">{m.cardName} <span className="text-xs font-normal text-gray-400 ml-2">{new Date(m.createdAt).toLocaleDateString()}</span></p>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{m.content}</p>
                                </div>
                            ))}
                            {(!project.messages || project.messages.length === 0) && <p className="text-center text-gray-400 text-sm py-4">メッセージはまだありません</p>}
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">完了報告</h3>
                        {project.status === 'COMPLETED' ? (
                            <div className="bg-green-50 p-5 rounded-xl border border-green-200 text-green-800 font-bold flex items-center justify-center">
                                <FiCheckCircle className="mr-2 text-xl"/> 報告書提出済みです
                            </div>
                        ) : (
                            isPlanner && project.status === 'SUCCESSFUL' && (
                                <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-2 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-md transition-transform hover:scale-[1.01]">
                                    完了報告を作成する
                                </button>
                            )
                        )}
                    </div>

                </div>
              )}

            </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24 border border-gray-100">
                {user ? (
                    <PledgeForm project={project} user={user} onPledgeSubmit={onPledgeSubmit} isPledger={isPledger} />
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500 shadow-sm">
                            <FiHeart size={32} fill="currentColor" />
                        </div>
                        <h3 className="text-xl font-extrabold mb-3 text-gray-900">この企画を支援する</h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            ログインして支援すると、<br/>ポイントが貯まり履歴が残ります。
                        </p>
                        
                        <button 
                            onClick={() => window.location.href = `/login?redirect=/projects/${id}`}
                            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all mb-4 shadow-md"
                        >
                            ログインして支援する
                        </button>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest"><span className="bg-white px-3 text-gray-400">OR</span></div>
                        </div>

                        <button 
                            onClick={() => setShowGuestPledgeModal(true)} 
                            className="w-full bg-white border-2 border-pink-100 text-pink-600 font-bold py-3.5 rounded-xl hover:bg-pink-50 hover:border-pink-200 transition-all flex items-center justify-center gap-2"
                        >
                            <FiUser /> ゲストとして支援する
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2">※ 会員登録なしで今すぐ支援できます</p>
                    </div>
                )}
                
                {isPlanner && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Planner Menu</h3>
                        <div className="space-y-2">
                            <button onClick={()=>setIsTargetAmountModalOpen(true)} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition-colors flex items-center"><FiDollarSign className="mr-2 text-gray-400"/> 目標金額の変更</button>
                            <Link href={`/projects/edit/${id}`} className="block w-full text-left p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition-colors flex items-center"><FiTool className="mr-2 text-gray-400"/> 企画内容の編集</Link>
                            <Link href={`/florists?projectId=${id}`} className="block w-full text-left p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-pink-600 transition-colors flex items-center"><FiSearch className="mr-2"/> お花屋さんを探す</Link>
                            {project.status==='SUCCESSFUL' && <button onClick={()=>setIsCompletionModalOpen(true)} className="w-full mt-2 bg-green-500 text-white p-3 rounded-xl font-bold shadow-md hover:bg-green-600 transition-colors">完了報告する</button>}
                            
                            {project.status !== 'CANCELED' && project.status !== 'COMPLETED' && (
                                <button onClick={() => setIsCancelModalOpen(true)} className="w-full mt-4 text-red-400 text-xs text-center hover:text-red-600 hover:underline py-2">
                                    企画を中止する...
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {isAssignedFlorist && (
                    <div className="mt-8 bg-indigo-50 p-5 rounded-2xl border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none"><FiTool size={80}/></div>
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded-full mb-3 inline-block">FLORIST ONLY</span>
                        <h3 className="font-bold text-indigo-900 mb-4">お花屋さんメニュー</h3>
                        <div className="space-y-3 relative z-10">
                            <button 
                                onClick={() => setIsInstructionModalOpen(true)}
                                className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-xl shadow-sm hover:bg-indigo-50 flex items-center justify-center transition-all"
                            >
                                <FiFileText className="mr-2"/> 指示書作成
                            </button>
                            
                            <button 
                                onClick={() => setIsMaterialModalOpen(true)}
                                className="w-full py-2.5 bg-white border border-yellow-300 text-yellow-700 font-bold rounded-xl shadow-sm hover:bg-yellow-50 flex items-center justify-center transition-all"
                            >
                                <FiDollarSign className="mr-2"/> 資材費・実費の報告
                            </button>
                            {project.materialCost > 0 && (
                                <p className="text-xs text-indigo-400 text-center font-bold">
                                    報告済み: {project.materialCost.toLocaleString()}円
                                </p>
                            )}
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div> 
      
      {/* Modals */}
      {isImageModalOpen && <ImageModal src={modalImageSrc} onClose={() => setIsImageModalOpen(false)} />}
      {isReportModalOpen && <ReportModal projectId={id} user={user} onClose={() => setReportModalOpen(false)} />}
      {isCompletionModalOpen && <CompletionReportModal project={project} user={user} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
      {isTargetAmountModalOpen && <TargetAmountModal project={project} user={user} onClose={() => setIsTargetAmountModalOpen(false)} onUpdate={fetchProject} />}
      {isInstructionModalOpen && <InstructionSheetModal project={project} onClose={() => setIsInstructionModalOpen(false)} />}
      
      <FloristMaterialModal 
        isOpen={isMaterialModalOpen} 
        onClose={() => setIsMaterialModalOpen(false)} 
        project={project} 
        onUpdate={setProject} 
      />
      <ProjectCancelModal 
        isOpen={isCancelModalOpen} 
        onClose={() => setIsCancelModalOpen(false)} 
        project={project} 
        onCancelComplete={() => {
            fetchProject();
            router.push('/mypage'); 
        }} 
      />

      {/* AR Modal */}
      {isArModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800 flex items-center">
                    <FiBox className="mr-2 text-indigo-600"/> ARシミュレーター
                </h3>
                <button onClick={() => setIsArModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors">
                  <FiX />
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!arSrc ? (
                  <div className="space-y-8">
                      <div className="text-center">
                          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                              お持ちの画像や完了写真をアップロードして、<br/>
                              実際のサイズ感で部屋に配置してみましょう。
                          </p>
                      
                          {project.status === 'COMPLETED' && (isPledger || isPlanner || isFlorist) && project.completionImageUrls?.length > 0 && (
                              <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6 text-left">
                                <h4 className="font-bold text-green-800 mb-2 flex items-center text-sm">
                                   <FiCheckCircle className="mr-2"/> 完成写真から作成
                                </h4>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {project.completionImageUrls.map((url, i) => (
                                        <div key={i} className="flex-shrink-0 cursor-pointer group relative w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all" onClick={() => handleSelectCompletedImage(url)}>
                                            <Image src={url} alt="" fill style={{ objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                              </div>
                          )}
                      </div>

                      <div className="space-y-4">
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors text-center cursor-pointer relative" onClick={() => document.getElementById('ar-upload').click()}>
                              {arImageFile ? (
                                  <div>
                                      <p className="text-sm font-bold text-green-600 mb-1 flex items-center justify-center"><FiCheck className="mr-1"/> 選択済み</p>
                                      <p className="text-xs text-gray-500">{arImageFile.name}</p>
                                  </div>
                              ) : (
                                  <div className="py-4">
                                      <FiUpload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                      <p className="text-sm font-bold text-gray-600">画像をアップロード</p>
                                      <p className="text-xs text-gray-400">またはドラッグ＆ドロップ</p>
                                  </div>
                              )}
                              <input id="ar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setArImageFile(e.target.files[0])} />
                          </div>

                          <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
                              <span className="text-sm font-bold text-gray-700 whitespace-nowrap">高さ (cm)</span>
                              <input 
                                  type="number" 
                                  value={arHeight} 
                                  onChange={(e) => setArHeight(e.target.value)} 
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>
                      </div>

                      <button 
                          onClick={handleGenerateAr}
                          disabled={arGenLoading || !arImageFile}
                          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center"
                      >
                          {arGenLoading ? <><FiLoader className="animate-spin mr-2"/> 生成中...</> : 'ARモデルを生成する'}
                      </button>
                  </div>
              ) : (
                  <div className="flex flex-col items-center">
                      <p className="text-sm text-center text-gray-600 mb-6 font-medium">
                        カメラを起動して、平らな床に向けてください。<br/>
                        高さ <strong>{arHeight}cm</strong> のパネルが表示されます。
                      </p>
                      
                      <div className="w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                          <ArViewer src={arSrc} alt="AR" />
                      </div>

                      <button 
                        onClick={() => { setArSrc(null); setArImageFile(null); }}
                        className="mt-6 text-sm font-bold text-gray-500 flex items-center hover:text-indigo-600 transition-colors"
                      >
                        <FiRefreshCw className="mr-2"/> 別の画像で試す
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Guest Pledge Modal */}
      {showGuestPledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <FiUser className="text-pink-500"/> ゲスト支援
              </h3>
              <button onClick={() => setShowGuestPledgeModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <GuestPledgeForm 
                projectId={project.id}
                projectTitle={project.title}
                onCancel={() => setShowGuestPledgeModal(false)}
                onSuccess={() => {
                  setShowGuestPledgeModal(false);
                  fetchProject();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll Indicator */}
      <FlowerScrollIndicator 
          collected={project.collectedAmount} 
          target={project.targetAmount} 
      />

    </>
  );
}