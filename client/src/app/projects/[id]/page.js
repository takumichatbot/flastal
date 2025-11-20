'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ★ アイコンのインポートを追加 (いいねボタン用)
import { FiHeart, FiThumbsUp, FiMessageSquare } from 'react-icons/fi'; 

import ImageModal from '../../components/ImageModal';
import MessageForm from '../../components/MessageForm';
import PollCreationModal from './components/PollCreationModal';
import GroupChat from './components/GroupChat';
import CompletionReportModal from './components/CompletionReportModal';
import ReportModal from '../../../components/ReportModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ★★★ 目標金額変更モーダル (そのまま) ★★★
function TargetAmountModal({ project, user, onClose, onUpdate }) {
  const [newAmount, setNewAmount] = useState(project.targetAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        toast.error("ログインが必要です。");
        return;
    }
    const parsedNewAmount = parseInt(newAmount, 10);
     if (isNaN(parsedNewAmount)) {
        toast.error("有効な金額を入力してください。");
        return;
    }
    setIsSubmitting(true);
    const promise = fetch(`${API_URL}/api/projects/${project.id}/target-amount`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newTargetAmount: parsedNewAmount,
        userId: user.id
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    });

    toast.promise(promise, {
      loading: '更新中...',
      success: () => {
        onUpdate();
        onClose();
        return '目標金額を更新しました！';
      },
      error: (err) => err.message,
      finally: () => setIsSubmitting(false)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">目標金額の変更</h2>
          <p className="text-sm text-gray-600 mb-4">
            お花屋さんとの相談の結果、当初の目標金額を変更する必要がある場合に利用します。
          </p>
          <div>
            <label htmlFor="newTargetAmount" className="block text-sm font-medium text-gray-700">新しい目標金額 (pt)</label>
            <input
              id="newTargetAmount"
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              min={project.collectedAmount}
              required
              className="w-full mt-1 p-2 border rounded-md text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              ※現在集まっている <strong className="text-sky-600">{project.collectedAmount.toLocaleString()} pt</strong> 以上の金額を設定してください。
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-slate-400">
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isTargetAmountModalOpen, setIsTargetAmountModalOpen] = useState(false);

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { register: registerPledge, handleSubmit: handleSubmitPledge, formState: { errors: pledgeErrors }, reset: resetPledge } = useForm();

  // (A) 企画データを取得するためのuseEffect
  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects/${id}`);
      if (!response.ok) {
        throw new Error('企画が見つからないか、読み込みに失敗しました。');
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast.error(error.message);
      setProject(null); 
    } finally {
      setLoading(false);
    }
  }, [id]); 

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // (B) WebSocket接続を管理するためのuseEffect
  useEffect(() => {
    if (!user || !id) return;

    const newSocket = io(API_URL, {
      transports: ['polling'] 
    });
    setSocket(newSocket);
    
    newSocket.emit('joinProjectRoom', id);
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error('チャットサーバーへの接続に失敗しました。');
    });

    newSocket.on('receiveGroupChatMessage', (newMessage) => {
      setProject(prev => prev ? { ...prev, groupChatMessages: [...(prev.groupChatMessages || []), newMessage] } : null);
    });

    newSocket.on('messageError', (errorMessage) => {
      toast.error(errorMessage);
    });

    return () => {
      newSocket.off('connect_error');
      newSocket.off('receiveGroupChatMessage');
      newSocket.off('messageError');
      newSocket.disconnect();
    };
  }, [id, user]); 

  // ★★★【新規】いいねトグル処理 ★★★
  const handleLikeToggle = async (reviewId) => {
    if (!user) {
      toast.error('いいねするにはログインが必要です。');
      return;
    }

    const promise = fetch(`${API_URL}/api/reviews/${reviewId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    }).then(async (res) => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'いいねの処理に失敗しました。');
      }
      // いいね数、状態を更新するためにデータを再取得
      fetchProject();
      return res.json();
    });

    toast.promise(promise, {
      loading: '処理中...',
      success: (data) => (data.liked ? 'いいねしました！' : 'いいねを解除しました。'),
      error: (err) => err.message,
    });
  };

  // --- (既存のハンドラ関数は変更なし) ---
  const onPledgeSubmit = (data) => {
    if (!user) {
      toast.error('支援するにはログインが必要です。');
      return;
    }
    
    const promise = fetch(`${API_URL}/api/pledges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: id,
        userId: user.id,
        amount: parseInt(data.pledgeAmount),
        comment: data.comment,
      }),
    }).then(async res => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '支援に失敗しました。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '処理中...',
      success: () => {
        resetPledge(); 
        fetchProject();
        return '支援ありがとうございます！';
      },
      error: (err) => err.message,
    });
  };

  const handleAnnouncementSubmit = (e) => {
    e.preventDefault();
    if (!user) return;
    const promise = fetch(`${API_URL}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: announcementTitle,
        content: announcementContent,
        projectId: id,
        userId: user.id,
      }),
    }).then(res => {
      if (!res.ok) throw new Error('お知らせの投稿に失敗しました。');
      return res.json();
    });

    toast.promise(promise, {
      loading: '投稿中...',
      success: () => {
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setShowAnnouncementForm(false);
        fetchProject();
        return 'お知らせを投稿しました！';
      },
      error: (err) => err.message,
    });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!user) return;
    const promise = fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            itemName: expenseName,
            amount: parseInt(expenseAmount),
            projectId: id,
            userId: user.id,
        }),
    }).then(res => {
        if (!res.ok) throw new Error('支出の追加に失敗しました。');
        return res.json();
    });

    toast.promise(promise, {
        loading: '追加中...',
        success: () => {
            setExpenseName('');
            setExpenseAmount('');
            fetchProject();
            return '支出項目を追加しました。';
        },
        error: (err) => err.message,
    });
  };

  const handleDeleteExpense = (expenseId) => {
    if (window.confirm('この支出項目を削除しますか？')) {
      const promise = fetch(`${API_URL}/api/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
      }).then(res => { if (!res.ok) throw new Error('支出の削除に失敗しました。'); });

      toast.promise(promise, {
          loading: '削除中...',
          success: () => { fetchProject(); return '支出項目を削除しました。'; },
          error: (err) => err.message,
      });
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;
    const promise = fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTaskTitle, 
          projectId: id,
          userId: user.id
        }),
    }).then(res => { if (!res.ok) throw new Error('タスクの追加に失敗しました。'); });

    toast.promise(promise, {
        loading: '追加中...',
        success: () => { setNewTaskTitle(''); fetchProject(); return 'タスクを追加しました。'; },
        error: (err) => err.message,
    });
  };

  const handleToggleTask = (taskId, currentStatus) => {
    if (!user) return;
    const promise = fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isCompleted: !currentStatus,
          userId: user.id
        }),
    }).then(res => { if (!res.ok) throw new Error('タスクの更新に失敗しました。'); });

    toast.promise(promise, {
        loading: '更新中...',
        success: () => { fetchProject(); return 'タスクを更新しました。'; },
        error: (err) => err.message,
    });
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('このタスクを削除しますか？')) {
      const promise = fetch(`${API_URL}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
      }).then(res => { if (!res.ok) throw new Error('タスクの削除に失敗しました。'); });

      toast.promise(promise, {
          loading: '削除中...',
          success: () => { fetchProject(); return 'タスクを削除しました。'; },
          error: (err) => err.message,
      });
    }
  };

  const handleCopyMessages = () => {
    if (!project || !project.messages || project.messages.length === 0) return;
    const textToCopy = project.messages.map(msg => `${msg.cardName}\n${msg.content}`).join('\n\n---\n\n');
    document.execCommand('copy');
    toast.success('全メッセージをクリップボードにコピーしました！')
  };

  const handleCancelProject = () => {
    if (!user) return;
    if (!window.confirm("本当にこの企画を中止しますか？\n集まったポイントはすべて支援者に返金され、この操作は元に戻せません。")) return;
    if (!window.confirm("最終確認です。参加者への説明は済みましたか？中止を実行します。")) return;

    const promise = fetch(`${API_URL}/api/projects/${project.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
    }).then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || '企画の中止に失敗しました。');
        return data.message;
    });

    toast.promise(promise, {
        loading: '処理中...',
        success: (message) => { fetchProject(); return message; },
        error: (err) => err.message,
    });
  };


  // --- ローディングとエラー表示 ---
  if (loading) return <div className="text-center mt-10">読み込み中...</div>;
  if (!project) return <div className="text-center mt-10">企画が見つかりませんでした。</div>;

  // --- 変数定義 ---
  const deliveryDate = new Date(project.deliveryDateTime).toLocaleString('ja-JP');
  const progressPercentage = project.targetAmount > 0 ? (project.collectedAmount / project.targetAmount) * 100 : 0;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `【${project.title}】を支援しよう！ #FLASTAL`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
  const isPlanner = user && user.id === project.planner?.id;
  const isPledger = user && (project.pledges || []).some(p => p.userId === user.id);
  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;
  const hasPostedMessage = user && (project.messages || []).some(msg => msg.userId === user.id);
  const canMakeOffer = isPlanner && (project.status === 'FUNDRAISING' || project.status === 'SUCCESSFUL');

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
            
            {/* ★★★ サムネイル表示エリア ★★★ */}
            {project.status !== 'COMPLETED' && project.imageUrl && (
              <div className="h-96 bg-gray-200 relative group cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/40 flex items-center justify-center transition-colors duration-300">
                    <svg className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>
            )}
            {/* 完了報告セクション */}
            {project.status === 'COMPLETED' && (
                <div className="p-6 md:p-8 bg-gradient-to-br from-yellow-50 to-orange-100 border-b border-orange-200">
                    <h2 className="text-2xl font-bold text-center text-yellow-800 mb-4">🎉 企画完了報告 🎉</h2>
                    {project.completionImageUrls?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {project.completionImageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`完成写真 ${index + 1}`} className="w-full h-auto object-cover rounded-lg shadow-md aspect-square" />
                            ))}
                          </div>
                    )}
                    {project.completionComment && (
                        <div className="mb-6 bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-orange-100">
                            <p className="font-semibold text-gray-800">企画者からのメッセージ:</p>
                            <p className="text-gray-700 whitespace-pre-wrap mt-2">{project.completionComment}</p>
                        </div>
                    )}
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-orange-100">
                         <h3 className="font-semibold text-gray-800 mb-2">最終収支</h3>
                         <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">収入 (支援総額):</span> <span className="font-medium">{project.collectedAmount.toLocaleString()} pt</span></div>
                            <div className="flex justify-between text-red-600"><span className="text-gray-600">支出合計:</span> <span className="font-medium">- {(project.expenses?.reduce((s,e)=>s+e.amount,0) || 0).toLocaleString()} pt</span></div>
                            <div className="flex justify-between font-bold border-t pt-1 mt-1"><span className="text-gray-800">最終残高 (余剰金):</span> <span>{project.finalBalance?.toLocaleString() ?? '未計算'} pt</span></div>
                         </div>
                         {project.surplusUsageDescription && (
                             <div className="mt-3 border-t pt-2">
                                <p className="font-semibold text-gray-800 text-sm">余剰金の使い道:</p>
                                <p className="text-gray-700 whitespace-pre-wrap mt-1 text-sm">{project.surplusUsageDescription}</p>
                             </div>
                         )}
                    </div>
                 </div>
            )}
            
            {/* 企画管理セクション */}
             {isPlanner && (
              <div className="border-t my-8 pt-6 px-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">企画管理</h2>
                <div className="bg-slate-50 p-4 rounded-lg space-y-6 border border-slate-200">
                  
                  {/* 1. 目標金額の変更 */}
                  <div>
                    <h3 className="font-semibold text-gray-700">目標金額の変更</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      お花屋さんとの相談で見積もり額が変わった場合などに、目標金額を更新できます。
                    </p>
                    <button
                      onClick={() => setIsTargetAmountModalOpen(true)}
                      disabled={project.status === 'COMPLETED' || project.status === 'CANCELED'}
                      className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      目標金額を変更する
                    </button>
                  </div>

                  {/* 2. 企画内容の編集 */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-700">企画内容の編集</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-3">
                      企画のタイトル、説明文、メイン画像、デザイン詳細などを編集します。
                    </p>
                    <Link 
                      href={`/projects/edit/${project.id}`}
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      企画内容を編集する
                    </Link>
                  </div>

                  {/* 3. お花屋さんへのオファー */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-700">お花屋さんへオファー</h3>
                    {canMakeOffer ? (
                      project.offer ? (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            この企画は <strong>{project.offer.florist.platformName}</strong> さんにオファー済みです。
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ステータス: {
                              {
                                'PENDING': 'お花屋さんの返信待ち',
                                'ACCEPTED': '承認されました',
                                'REJECTED': '辞退されました'
                              }[project.offer.status]
                            }
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mt-1 mb-3">
                            この企画を実現してくれるお花屋さんを探し、オファーを送信しましょう。
                          </p>
                          <Link 
                            href={`/florists?projectId=${project.id}`} 
                            className="px-4 py-2 text-sm font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors"
                          >
                            お花屋さんを探す
                          </Link>
                        </>
                      )
                    ) : (
                      <p className="text-sm text-gray-600 mt-1 mb-3">
                        {(project.status === 'PENDING_APPROVAL' || project.status === 'REJECTED') && '企画が承認されると、お花屋さんにオファーできます。'}
                        {(project.status === 'COMPLETED' || project.status === 'CANCELED') && 'この企画は完了または中止されたため、オファーできません。'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{project.title}</h1>
              <div className="flex justify-between items-center mb-6">
                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                  Xでシェア
                </a>
                
                {user && !isPlanner && (
                  <button onClick={() => setReportModalOpen(true)} className="text-xs text-gray-500 hover:text-red-600 hover:underline">
                    この企画を報告する
                  </button>
                )}
              </div>
              <p className="text-lg text-gray-600 mb-6">企画者: {project.planner?.handleName || '...'}</p>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">企画の詳細</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">お届け情報</h3>
                <p className="text-gray-700"><strong>場所:</strong> {project.deliveryAddress}</p>
                <p className="text-gray-700"><strong>日時:</strong> {deliveryDate}</p>
              </div>

              {(project.designDetails || project.size || project.flowerTypes) && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">デザインの希望</h2>
                  <div className="bg-slate-50 p-6 rounded-lg space-y-3">
                    {project.designDetails && <div><strong>雰囲気:</strong> <p className="text-gray-700 whitespace-pre-wrap">{project.designDetails}</p></div>}
                    {project.size && <div><strong>希望サイズ:</strong> <p className="text-gray-700">{project.size}</p></div>}
                    {project.flowerTypes && <div><strong>使いたいお花:</strong> <p className="text-gray-700">{project.flowerTypes}</p></div>}
                  </div>
                </div>
              )}

              {isPlanner && project.status === 'SUCCESSFUL' && (
                <div className="border-t my-8 pt-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">企画を完了する</h2>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-green-800 mb-4">目標達成おめでとうございます！<br/>完成したお花の写真と参加者へのメッセージを投稿し、企画を完了させましょう。</p>
                    <button 
                      onClick={() => setIsCompletionModalOpen(true)}
                      className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 shadow-lg"
                    >
                      🎉 完成を報告する
                    </button>
                  </div>
                </div>
              )}

              {(isPledger || isPlanner) && (
                <div className="border-t my-8 pt-6">
                  <GroupChat
                    project={project} user={user} isPlanner={isPlanner}
                    isPledger={isPledger} onUpdate={fetchProject} socket={socket}
                  />
                </div>
              )}

              <div className="border-t my-8 pt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">寄せ書きメッセージ</h2>
                {isPledger && !isPlanner && (
                  <div className="bg-pink-50 p-4 rounded-lg">
                    {hasPostedMessage ? (
                      <div>
                        <p className="font-bold text-pink-800">メッセージ投稿ありがとうございます！</p>
                        <p className="text-sm text-gray-600 mt-2">企画者の方がメッセージをとりまとめて、お花屋さんに渡してくれます。</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-pink-800">フラスタに添えるメッセージを投稿しませんか？</p>
                        <p className="text-sm text-gray-600 mt-2">あなたの名前とお祝いの言葉が、カードになってお花と一緒に飾られます。</p>
                        <MessageForm projectId={id} onMessagePosted={fetchProject} />
                      </div>
                    )}
                  </div>
                )}
                {isPlanner && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-blue-800">集まったメッセージ一覧 ({(project.messages || []).length}件)</h3>
                      {(project.messages && project.messages.length > 0) && (
                        <button onClick={handleCopyMessages} className="px-3 py-1 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600">すべてコピー</button>
                      )}
                    </div>
                    {(project.messages && project.messages.length > 0) ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {(project.messages || []).map(msg => (
                          <div key={msg.id} className="bg-white p-3 rounded-md shadow-sm">
                            <p className="font-semibold text-gray-800">{msg.cardName}</p>
                            <p className="text-gray-700 mt-1 whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs text-right text-gray-400 mt-2">from: {msg.user.handleName}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">まだメッセージは投稿されていません。</p>
                    )}
                  </div>
                )}
                {!isPledger && !isPlanner && user && (
                   <p className="text-center text-gray-500 bg-gray-50 p-4 rounded-lg">この企画を支援すると、お花に添えるメッセージを投稿できます。</p>
                )}
              </div>

              {isPlanner && (
                <div className="border-t my-8 pt-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">スケジュール管理 (To-Do)</h2>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                      <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="新しいタスクを追加" required className="p-2 border rounded-md text-gray-900 flex-grow"/>
                      <button type="submit" className="p-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600">追加</button>
                    </form>
                    <div className="space-y-2">
                      {(project.tasks || []).map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={task.isCompleted} onChange={() => handleToggleTask(task.id, task.isCompleted)} className="h-5 w-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"/>
                            <span className={task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}>{task.title}</span>
                          </div>
                          <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">削除</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t my-8 pt-6">
                 <h2 className="text-2xl font-semibold text-gray-800 mb-4">収支報告</h2>
                 <div className="space-y-2 text-gray-700 bg-slate-50 p-4 rounded-lg">
                   <div className="flex justify-between"><p>収入 (集まったポイント):</p><p className="font-semibold">{project.collectedAmount.toLocaleString()} pt</p></div>
                   <div className="flex justify-between text-red-600"><p>支出合計:</p><p className="font-semibold">- {totalExpense.toLocaleString()} pt</p></div>
                   <div className="flex justify-between font-bold border-t pt-2 mt-2"><p>残額:</p><p>{balance.toLocaleString()} pt</p></div>
                 </div>
                 <div className="mt-4 space-y-2">
                  {(project.expenses || []).map(exp => (
                     <div key={exp.id} className="text-sm flex justify-between items-center bg-gray-50 p-2 rounded-md">
                       <p className="text-gray-800">{exp.itemName}: {exp.amount.toLocaleString()} pt</p>
                       {isPlanner && <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">削除</button>}
                     </div>
                   ))}
                 </div>
              </div>

              {isPlanner && (
                <div className="border-t my-8 pt-6">
                  <h3 className="font-semibold text-gray-800 mb-2 text-lg">支出項目を追加</h3>
                  <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2 mt-4 p-4 bg-gray-50 rounded-lg">
                    <input type="text" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} placeholder="項目名 (例: イラストパネル代)" required className="p-2 border rounded-md text-gray-900 flex-grow"/>
                    <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="金額(pt)" required className="p-2 border rounded-md text-gray-900 w-full sm:w-32"/>
                    <button type="submit" className="p-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600">追加</button>
                  </form>
                </div>
              )}

              {isPlanner && (
                <div className="border-t my-8 pt-6">
                  <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="w-full p-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600">
                    {showAnnouncementForm ? '投稿フォームを閉じる' : '参加者へお知らせを投稿する'}
                  </button>
                  {showAnnouncementForm && (
                    <form onSubmit={handleAnnouncementSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                      <div>
                        <label htmlFor="announcementTitle" className="block text-sm font-medium text-gray-700">タイトル</label>
                        <input type="text" id="announcementTitle" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} required className="w-full mt-1 p-2 border rounded-md text-gray-900"/>
                      </div>
                      <div>
                        <label htmlFor="announcementContent" className="block text-sm font-medium text-gray-700">内容</label>
                        <textarea id="announcementContent" value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} required rows="5" className="w-full mt-1 p-2 border rounded-md text-gray-900"></textarea>
                      </div>
                      <button type="submit" className="w-full p-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">投稿する</button>
                    </form>
                  )}
                </div>
              )}
              <div className="border-t my-8 pt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">主催者からのお知らせ</h2>
                <div className="space-y-6">
                  {(project.announcements && project.announcements.length > 0) ? (
                    project.announcements.map(announcement => (
                      <div key={announcement.id} className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{new Date(announcement.createdAt).toLocaleString('ja-JP')}</p>
                        <h3 className="font-bold text-gray-800 mt-1">{announcement.title}</h3>
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">まだお知らせはありません。</p>
                  )}
                </div>
              </div>

              {/* ★★★ 応援している人たち (レビュー表示) セクションを修正 ★★★ */}
              <div className="border-t my-8 pt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">レビュー</h2>
                <div className="space-y-4">
                    {/* ★ 投稿ボタンの場所をここに表示 (ユーザーが支援者かつ未投稿の場合) */}
                    {/* (現在、ユーザーが支援者かつ未投稿の場合のロジックが欠けているため、ここでは一旦レビューリストのみ表示) */}
                    
                    {(project.review || []).length > 0 ? (
                        project.review.map(review => {
                            // ユーザーがこのレビューに「いいね」しているかチェック
                            const hasLiked = user && (review.likes || []).some(like => like.userId === user.id);
                            
                            return (
                                <div key={review.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {/* 投稿者のアイコンと名前 */}
                                            {review.user?.iconUrl ? (
                                              <img src={review.user.iconUrl} alt="icon" className="h-8 w-8 rounded-full object-cover" />
                                            ) : (
                                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">👤</div>
                                            )}
                                            <p className="font-bold text-gray-800">{review.user?.handleName || '匿名ユーザー'}</p>
                                        </div>

                                        {/* いいねボタンと数 */}
                                        <button 
                                            onClick={() => handleLikeToggle(review.id)}
                                            disabled={!user}
                                            className={`flex items-center gap-1 p-1 rounded-full transition-colors disabled:opacity-50 ${
                                                hasLiked ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        >
                                            <FiThumbsUp className="w-4 h-4" />
                                            <span className="text-sm font-semibold">
                                                {(review.likes || []).length}
                                            </span>
                                        </button>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap pl-2 border-l-2 border-gray-200">
                                        {review.comment}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2 text-right">
                                        {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                                    </p>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-center py-4">まだレビューは投稿されていません。</p>
                    )}
                </div>
                {/* ★ レビュー投稿ボタン (ここがフォームのトリガーになるはず) */}
                {/* <div className="mt-8 text-center">
                    <button onClick={() => {}} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600">
                        レビューを投稿する
                    </button>
                </div>
                */}
              </div>


              {/* 応援している人たち */}
              <div className="border-t my-8 pt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">応援している人たち</h2>
                <div className="space-y-4">
                  {(project.pledges && project.pledges.length > 0) ? (
                    project.pledges.map(pledge => (
                      <div key={pledge.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-gray-800">{pledge.user.handleName}</p>
                          <p className="font-semibold text-blue-600">{pledge.amount.toLocaleString()} pt</p>
                        </div>
                        {pledge.comment && <p className="text-gray-600 pl-2 border-l-2 border-gray-200">{pledge.comment}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">この企画にはまだ支援がありません。最初の支援者になりましょう！</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-8 h-fit sticky top-8">
             {/* ... (サイドバーは変更なし) ... */}
          </div>
        </div>
      </div>
      
      {isImageModalOpen && <ImageModal src={project.imageUrl} onClose={() => setIsImageModalOpen(false)} />}
      {isReportModalOpen && <ReportModal projectId={id} user={user} onClose={() => setReportModalOpen(false)} />}
      {isCompletionModalOpen && <CompletionReportModal project={project} user={user} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
      {isTargetAmountModalOpen && (
        <TargetAmountModal
          project={project}
          user={user}
          onClose={() => setIsTargetAmountModalOpen(false)}
          onUpdate={fetchProject}
        />
      )}
    </>
  );
}