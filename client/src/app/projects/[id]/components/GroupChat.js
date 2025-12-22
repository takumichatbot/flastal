'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
// ★ アイコンを追加
import { 
  FiGlobe, FiLoader, FiUser, FiSend, FiImage, FiSmile, 
  FiAlertTriangle, FiX, FiFileText, FiCpu, FiRefreshCw, FiCopy 
} from 'react-icons/fi';

import PollCreationModal from './PollCreationModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const AVAILABLE_EMOJIS = ['👍', '❤️', '🙌', '😂', '🔥', '🤔'];

// トークン取得ヘルパー
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// ===============================================
// サブコンポーネント: 通報モーダル
// ===============================================
const ChatReportModal = ({ messageId, onClose }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return toast.error('理由を入力してください');
        
        setIsSubmitting(true);
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/group-chat/${messageId}/report`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                toast.success('通報しました。運営が確認します。');
                onClose();
            } else {
                const data = await res.json();
                throw new Error(data.message || '送信に失敗しました');
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <FiX size={20} />
                </button>
                
                <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                    <FiAlertTriangle /> 発言を通報する
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                    不快な発言、スパム、規約違反の内容を通報してください。<br/>
                    相手には通知されません。
                </p>
                
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full p-3 border rounded-lg bg-gray-50 text-sm h-24 mb-4 focus:ring-2 focus:ring-red-200 outline-none resize-none"
                        placeholder="通報の理由を入力（例: 暴言、勧誘行為など）"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                            キャンセル
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                            {isSubmitting ? '送信中...' : '通報する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===============================================
// サブコンポーネント: リアクションピッカー
// ===============================================
const ReactionPicker = ({ onSelect, isEnabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={pickerRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                disabled={!isEnabled}
                className={`ml-2 text-gray-400 transition-colors p-1 rounded-full ${isEnabled ? 'hover:text-gray-600' : 'cursor-not-allowed opacity-50'}`}
                title="リアクションを追加"
            >
                <FiSmile size={16} />
            </button>
            
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-50 whitespace-nowrap animate-fadeIn">
                    <div className="flex gap-1">
                        {AVAILABLE_EMOJIS.map(emoji => (
                            <button 
                                key={emoji} 
                                type="button" 
                                onClick={() => { onSelect(emoji); setIsOpen(false); }}
                                className="text-xl p-1 rounded-md hover:bg-gray-100 transition-colors transform hover:scale-125"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ===============================================
// サブコンポーネント: 個別メッセージ
// ===============================================
const ChatMessage = ({ msg, user, isPlanner, isPledger, onReaction, onReport, templates }) => {
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const isOwn = user && msg.userId === user.id;

    // テンプレートメッセージの解決
    const getMessageContent = () => {
        if (!msg.templateId) return msg.content;
        const template = templates.find(t => t.id === msg.templateId); 
        if (!template) return msg.content || '不明なメッセージ';
        if (template.hasCustomInput && msg.content) return template.text.replace('...', `"${msg.content}"`);
        return template.text;
    };

    const contentText = getMessageContent();

    const handleTranslate = async () => {
        if (translatedText) {
            setTranslatedText(null);
            return;
        }
        if (!contentText) return;

        setIsTranslating(true);
        const token = getAuthToken();
        try {
            const res = await fetch(`${API_URL}/api/translate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: contentText })
            });
            if (res.ok) {
                const data = await res.json();
                setTranslatedText(data.translatedText);
            } else {
                toast.error('翻訳に失敗しました');
            }
        } catch (e) {
            console.error(e);
            toast.error('翻訳エラー');
        } finally {
            setIsTranslating(false);
        }
    };

    // リアクション集計
    const groupedReactions = (msg.reactions || []).reduce((acc, reaction) => {
        const emoji = reaction.emoji;
        acc[emoji] = acc[emoji] || { count: 0, users: [], isReactedByMe: false };
        acc[emoji].count += 1;
        if (reaction.user?.handleName) acc[emoji].users.push(reaction.user.handleName);
        if (reaction.userId === user?.id) acc[emoji].isReactedByMe = true;
        return acc;
    }, {});
    const hasReactions = Object.keys(groupedReactions).length > 0;

    return (
        <div className={`flex items-start gap-3 mb-4 group ${isOwn ? 'flex-row-reverse' : ''}`}>
            {/* アイコン */}
            <div className="flex-shrink-0">
                {msg.user?.iconUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={msg.user.iconUrl} alt={msg.user.handleName} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold">
                        <FiUser />
                    </div>
                )}
            </div>

            {/* メッセージ本文エリア */}
            <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600 font-bold">{msg.user?.handleName}</span>
                    <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="relative">
                    {/* 吹き出し */}
                    <div className={`px-4 py-2 rounded-2xl relative shadow-sm text-sm ${isOwn ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                        
                        {msg.messageType === 'IMAGE' ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={msg.fileUrl} alt="画像" className="max-w-full h-auto rounded-lg my-1 cursor-pointer hover:opacity-90 transition-opacity"/>
                        ) : msg.messageType === 'FILE' ? (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-600 font-semibold hover:underline bg-white/80 p-2 rounded">
                                📎 {msg.fileName || 'ファイルを表示'}
                            </a>
                        ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{contentText}</p>
                        )}

                        {/* 翻訳結果 */}
                        {translatedText && (
                            <div className={`mt-2 pt-2 border-t text-xs italic flex items-start gap-1 animate-fadeIn ${isOwn ? 'border-white/30 text-sky-100' : 'border-gray-200 text-gray-500'}`}>
                                <FiGlobe className="mt-0.5 shrink-0"/>
                                <span>{translatedText}</span>
                            </div>
                        )}
                    </div>

                    {/* アクションボタン群 */}
                    <div className={`absolute top-0 flex items-center gap-1 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm`}>
                        
                        {!isOwn && (msg.messageType === 'TEXT' || msg.templateId) && (
                            <button 
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                className="text-gray-400 hover:text-indigo-500 p-1 transition-colors"
                                title={translatedText ? "原文に戻す" : "翻訳する"}
                            >
                                {isTranslating ? <FiLoader className="animate-spin"/> : <FiGlobe/>}
                            </button>
                        )}

                        <ReactionPicker 
                            onSelect={(emoji) => onReaction(msg.id, emoji)}
                            isEnabled={isPledger && !!user} 
                        />

                        {/* 通報ボタン */}
                        {!isOwn && (
                            <button 
                                onClick={() => onReport(msg.id)}
                                className="ml-2 text-gray-400 hover:text-red-500 p-1 transition-colors"
                                title="通報する"
                            >
                                <FiAlertTriangle size={16} />
                            </button>
                        )}
                    </div>

                    {/* リアクション表示 */}
                    {hasReactions && (
                        <div className={`absolute -bottom-3 flex gap-1 ${isOwn ? 'right-0' : 'left-0'} z-10`}>
                            <div className="flex items-center bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-sm">
                                {Object.entries(groupedReactions).map(([emoji, data]) => (
                                    <button 
                                        key={emoji}
                                        onClick={() => isPledger && onReaction(msg.id, emoji)}
                                        title={`${data.users.join(', ')}`}
                                        className={`flex items-center text-xs px-1 rounded-full hover:bg-gray-100 transition-colors ${data.isReactedByMe ? 'bg-blue-50 border border-blue-100' : ''}`}
                                    >
                                        <span className="mr-0.5">{emoji}</span>
                                        <span className="font-bold text-gray-600">{data.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ===============================================
// メインコンポーネント: GroupChat
// ===============================================
export default function GroupChat({ project, user, isPlanner, isPledger, onUpdate, socket, onSummaryUpdate, summary }) {
  const [templates, setTemplates] = useState([]);
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false); 

  const [messages, setMessages] = useState(project.groupChatMessages || []);
  const chatBottomRef = useRef(null); 
  
  // 初期化とSocket更新
  useEffect(() => {
    setMessages(project.groupChatMessages || []);
  }, [project.groupChatMessages]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
    };

    const handleReactionAdded = (newReaction) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === newReaction.messageId) {
                const existingReaction = (msg.reactions || []).find(
                    r => r.userId === newReaction.userId && r.emoji === newReaction.emoji
                );
                if (existingReaction) return msg;
                return { ...msg, reactions: [...(msg.reactions || []), newReaction] };
            }
            return msg;
        }));
    };

    const handleReactionRemoved = ({ messageId, userId, emoji }) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return { 
                    ...msg, 
                    reactions: (msg.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) 
                };
            }
            return msg;
        }));
    };
    
    socket.on('receiveGroupChatMessage', handleReceiveMessage);
    socket.on('reactionAdded', handleReactionAdded);
    socket.on('reactionRemoved', handleReactionRemoved);
    
    return () => {
        socket.off('receiveGroupChatMessage', handleReceiveMessage);
        socket.off('reactionAdded', handleReactionAdded);
        socket.off('reactionRemoved', handleReactionRemoved);
    };
  }, [socket]);
  
  // オートスクロール
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 入力関連
  const [customInputModal, setCustomInputModal] = useState({ isOpen: false, template: null, text: '' });
  const [freeText, setFreeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat-templates`);
        if (res.ok) setTemplates(await res.json());
      } catch (error) { console.error(error); }
    };
    fetchTemplates();
  }, []);

  const handleSendMessage = (templateId, content, messageType, fileUrl, fileName) => {
    if (!socket || !user) return toast.error('接続エラー');
    socket.emit('sendGroupChatMessage', {
      projectId: project.id,
      userId: user.id,
      templateId,
      content,
      messageType,
      fileUrl,
      fileName
    });
  };

  const handleFreeTextSubmit = (e) => {
    e?.preventDefault();
    if (freeText.trim()) {
      handleSendMessage(null, freeText, 'TEXT', null, null);
      setFreeText('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!user || !socket) return toast.error('権限がありません。');

    setIsUploading(true);
    const toastId = toast.loading('ファイルをアップロード中...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/upload`, { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData 
      });
      if (!res.ok) throw new Error('アップロード失敗');
      const data = await res.json();
      
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      handleSendMessage(null, null, messageType, data.url, file.name);
      toast.success('送信しました', { id: toastId });

    } catch (error) {
        toast.error(`送信失敗: ${error.message}`, { id: toastId });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const onReaction = (messageId, emoji) => {
    if (!isPledger && !isPlanner && !(user && project.offer?.floristId === user.id)) {
      return toast.error('権限がありません');
    }
    socket.emit('handleReaction', { messageId, emoji, userId: user.id });
  };

  // AI要約
  const handleSummarize = async () => {
    if (isSummarizing) return;
    if (!user) return toast.error("ログインが必要です");

    setIsSummarizing(true);
    const toastId = toast.loading('チャット履歴をAIが分析中...');
    const token = getAuthToken();
    
    try {
        const res = await fetch(`${API_URL}/api/group-chat/${project.id}/summarize`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('AI要約の実行に失敗しました');
        const data = await res.json();
        
        if (onSummaryUpdate) onSummaryUpdate(data.summary); 
        toast.success('要約完了！', { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error(error.message, { id: toastId });
    } finally {
        setIsSummarizing(false);
    }
  };
    
  const handleCopySummary = () => {
    if (summary) {
        navigator.clipboard.writeText(summary);
        toast.success('コピーしました');
    }
  };
  
  const hasPermission = isPlanner || isPledger;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px] relative">
        {/* ヘッダー */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center z-10">
            <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiSmile className="text-pink-500" /> 参加者グループチャット
                </h3>
                <p className="text-xs text-gray-500">企画者と支援者のみが見れます</p>
            </div>
            {hasPermission && (
                <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full hover:bg-indigo-600 disabled:bg-gray-300 transition-colors flex items-center shadow-sm font-bold"
                >
                    {isSummarizing ? <FiRefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <FiCpu className="w-3 h-3 mr-1" />}
                    AIで要約
                </button>
            )}
        </div>

        {/* チャットエリア */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-gray-300">
          
          {/* AI要約 (Sticky) */}
          {summary && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-4 animate-fadeIn sticky top-0 z-10 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-yellow-800 flex items-center text-sm">
                          <FiFileText className="mr-1"/> AI要約 (最新の決定事項)
                      </h3>
                      <button onClick={handleCopySummary} className="text-xs text-yellow-800 hover:text-yellow-900 flex items-center bg-yellow-100 px-2 py-1 rounded">
                          <FiCopy className="w-3 h-3 mr-1"/> コピー
                      </button>
                  </div>
                  <div className="text-sm text-gray-800 leading-relaxed max-h-32 overflow-y-auto">
                      <Markdown>{summary}</Markdown>
                  </div>
              </div>
          )}
          
          {/* メッセージ一覧 */}
          {messages.length > 0 ? (
            messages.map(msg => (
                <ChatMessage 
                    key={msg.id} 
                    msg={msg} 
                    user={user}
                    isPlanner={isPlanner}
                    isPledger={isPledger}
                    onReaction={onReaction}
                    onReport={(id) => setReportTargetId(id)}
                    templates={templates}
                />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <p>まだメッセージはありません。<br/>挨拶してみましょう！</p>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* 入力エリア */}
        <div className="p-3 bg-white border-t z-10">
          {/* テンプレート (横スクロール) */}
          {templates.length > 0 && (
             <div className="mb-3 flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {templates.map(template => (
                  <button 
                    key={template.id} 
                    onClick={() => {
                        if (template.hasCustomInput) {
                            setCustomInputModal({ isOpen: true, template: template, text: '' });
                        } else {
                            handleSendMessage(template.id, null, 'TEXT', null, null);
                        }
                    }} 
                    disabled={!hasPermission} 
                    className="whitespace-nowrap px-3 py-1 text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors disabled:opacity-50"
                  >
                    {template.text}
                  </button>
                ))}
             </div>
          )}

          <div className="flex gap-2 items-end">
             <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                disabled={isUploading || !socket || !user}
                className="p-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <FiImage size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} />
             
             <div className="flex-grow">
               <textarea
                 value={freeText}
                 onChange={(e) => setFreeText(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFreeTextSubmit(e);
                    }
                 }}
                 placeholder={isUploading ? "アップロード中..." : "メッセージを入力..."} 
                 disabled={isUploading} 
                 rows="1"
                 className="w-full bg-gray-100 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all resize-none text-sm max-h-32 shadow-inner"
                 style={{ minHeight: '44px' }}
               />
             </div>

             <button 
               onClick={handleFreeTextSubmit}
               disabled={isUploading || !freeText.trim()} 
               className={`p-3 rounded-full text-white shadow-md transition-all ${
                 !freeText.trim() || isUploading 
                   ? 'bg-gray-300 cursor-not-allowed' 
                   : 'bg-sky-500 hover:bg-sky-600 active:scale-95'
               }`}
             >
               <FiSend size={20} />
             </button>
          </div>

          {isPlanner && (
            <button onClick={() => setPollModalOpen(true)} className="w-full mt-2 py-2 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center border border-purple-100">
                📊 アンケートを作成する
            </button>
          )}
        </div>
      </div>

      {/* カスタム入力モーダル */}
      {customInputModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="font-bold text-gray-800 mb-4">メッセージを入力</h3>
            <p className="text-sm text-gray-500 mb-2">テンプレート:</p>
            <div className="bg-gray-100 p-3 rounded-lg text-gray-700 font-medium mb-4 text-sm">
                {customInputModal.template.text.replace('...', `「 ... 」`)}
            </div>
            
            <form onSubmit={(e) => {
                e.preventDefault();
                if (customInputModal.text.trim()) {
                    handleSendMessage(customInputModal.template.id, customInputModal.text, 'TEXT', null, null);
                    setCustomInputModal({ isOpen: false, template: null, text: '' });
                }
            }}>
                <input 
                    type="text" 
                    value={customInputModal.text} 
                    onChange={(e) => setCustomInputModal({ ...customInputModal, text: e.target.value })} 
                    placeholder={customInputModal.template.placeholder || "ここに入力..."} 
                    required autoFocus 
                    className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none mb-6"
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setCustomInputModal({ isOpen: false, template: null, text: '' })} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold text-sm">閉じる</button>
                    <button type="submit" className="px-6 py-2 font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-md text-sm">送信</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {isPollModalOpen && <PollCreationModal projectId={project.id} onClose={() => setPollModalOpen(false)} onPollCreated={onUpdate} />}
      
      {reportTargetId && (
        <ChatReportModal 
            messageId={reportTargetId} 
            onClose={() => setReportTargetId(null)} 
        />
      )}
    </>
  );
}