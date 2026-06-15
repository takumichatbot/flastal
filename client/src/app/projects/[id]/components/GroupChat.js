'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import { Globe, Loader2, User, Send, ImageIcon, Smile, AlertTriangle, X, FileText, Cpu, RefreshCw, Copy, MessageSquare } from 'lucide-react';

import PollCreationModal from './PollCreationModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const AVAILABLE_EMOJIS = ['👍', '❤️', '🙌', '😂', '🌸', '✨'];

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
            // ★ 修正: 正しいAPIエンドポイントに変更
            const res = await fetch(`${API_URL}/api/project-details/group-chat/${messageId}/report`, {
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
                throw new Error('送信に失敗しました');
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
                    <X size={16} />
                </button>
                
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={24}/>
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-2">発言を通報する</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                    不快な発言や規約違反の内容を通報してください。<br/>
                    ※相手に通知されることはありません。
                </p>
                
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-[16px] h-28 mb-4 focus:ring-4 focus:ring-rose-100 focus:border-rose-400 outline-none resize-none transition-all font-medium"
                        placeholder="通報の理由を入力（例: 暴言、勧誘行為など）"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                            キャンセル
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-rose-500 text-white text-sm font-black rounded-xl hover:bg-rose-600 disabled:opacity-50 shadow-md shadow-rose-200 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : null}
                            通報する
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
                className={`ml-2 text-slate-400 transition-all p-2 rounded-full ${isEnabled ? 'hover:bg-slate-100 hover:text-slate-700' : 'cursor-not-allowed opacity-50'}`}
                title="リアクションを追加"
            >
                <Smile size={18} />
            </button>
            
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-3 bg-white border border-slate-100 rounded-2xl shadow-xl p-2.5 z-50 whitespace-nowrap animate-in fade-in zoom-in duration-200">
                    <div className="flex gap-2">
                        {AVAILABLE_EMOJIS.map(emoji => (
                            <button 
                                key={emoji} 
                                type="button" 
                                onClick={() => { onSelect(emoji); setIsOpen(false); }}
                                className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-transform transform hover:scale-110 active:scale-95"
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
// サブコンポーネント: 個別メッセージ（バブルデザイン）
// ===============================================
const ChatMessage = ({ msg, user, isPlanner, isPledger, onReaction, onReport, templates }) => {
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // ★ 修正: お花屋さんの判定
    const isFloristMsg = !!msg.floristId || msg.user?.role === 'FLORIST' || msg.florist != null;
    const isOwn = user && (msg.userId === user.id || msg.floristId === user.id);

    // ★ 修正: Unknownを排除する強力な名前フォールバック
    const senderName = 
        msg.florist?.platformName || 
        msg.florist?.shopName || 
        msg.user?.handleName || 
        msg.user?.name || 
        (isFloristMsg ? 'お花屋さん' : '参加者');

    const iconUrl = msg.florist?.iconUrl || msg.user?.iconUrl;

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
            // ★ 修正: 正しいAPIエンドポイントに変更 (/api/tools/translate)
            const res = await fetch(`${API_URL}/api/tools/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ text: contentText })
            });
            if (res.ok) {
                const data = await res.json();
                setTranslatedText(data.translatedText);
            } else {
                toast.error('翻訳に失敗しました');
            }
        } catch (e) {
            toast.error('翻訳エラー');
        } finally {
            setIsTranslating(false);
        }
    };

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
        <div className={`flex items-end gap-3 mb-6 group ${isOwn ? 'flex-row-reverse' : ''}`}>
            
            {/* アイコン */}
            <div className="flex-shrink-0 mb-1">
                {iconUrl ? (
                    <img src={iconUrl} alt={senderName} className="h-9 w-9 rounded-full object-cover shadow-sm border border-slate-100" />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-500 flex items-center justify-center font-bold shadow-sm">
                        <User size={16}/>
                    </div>
                )}
            </div>

            {/* メッセージ本文エリア */}
            <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                
                {/* ユーザー名と時間（自分以外の時のみ表示） */}
                {!isOwn && (
                    <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                        <span className="text-xs text-slate-700 font-bold">{senderName}</span>
                        {isFloristMsg && (
                            <span className="text-[9px] bg-gradient-to-r from-sky-400 to-indigo-400 text-white px-1.5 py-0.5 rounded shadow-sm font-bold tracking-wider">
                                お花屋さん
                            </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                )}

                <div className="relative">
                    {/* 吹き出し */}
                    <div className={`
                        px-4 py-2.5 rounded-2xl relative text-sm leading-relaxed whitespace-pre-wrap break-words font-medium
                        ${isOwn 
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm shadow-md shadow-pink-200/50' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm'
                        }
                    `}>
                        {msg.messageType === 'IMAGE' ? (
                            <img src={msg.fileUrl} alt="画像" className="max-w-full h-auto rounded-xl my-1 cursor-zoom-in hover:opacity-90 transition-opacity border border-black/5"/>
                        ) : msg.messageType === 'FILE' ? (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 font-bold hover:underline p-2 rounded-xl ${isOwn ? 'bg-black/10' : 'bg-slate-50 text-sky-600'}`}>
                                📎 {msg.fileName || 'ファイルを表示'}
                            </a>
                        ) : (
                            <p>{contentText}</p>
                        )}

                        {/* 翻訳結果 */}
                        {translatedText && (
                            <div className={`mt-2 pt-2 border-t text-[11px] font-bold flex items-start gap-1.5 ${isOwn ? 'border-white/30 text-pink-50' : 'border-slate-100 text-slate-500'}`}>
                                <Globe className="mt-0.5 shrink-0"/>
                                <span>{translatedText}</span>
                            </div>
                        )}
                    </div>

                    {/* 自分のメッセージの送信時間 */}
                    {isOwn && (
                        <span className="absolute bottom-1 right-full mr-2 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}

                    {/* ホバーアクションメニュー（翻訳/リアクション/通報） */}
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${isOwn ? 'right-full mr-12' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-md rounded-full px-2 py-1 shadow-md border border-slate-100`}>
                        
                        {!isOwn && (msg.messageType === 'TEXT' || msg.templateId) && (
                            <button onClick={handleTranslate} disabled={isTranslating} className="text-slate-400 hover:text-indigo-500 p-1.5 transition-colors" title="翻訳する">
                                {isTranslating ? <Loader2 className="animate-spin"/> : <Globe/>}
                            </button>
                        )}

                        <ReactionPicker onSelect={(emoji) => onReaction(msg.id, emoji)} isEnabled={isPledger && !!user} />

                        {!isOwn && (
                            <button onClick={() => onReport(msg.id)} className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors" title="通報する">
                                <AlertTriangle size={16} />
                            </button>
                        )}
                    </div>

                    {/* リアクションバッジ */}
                    {hasReactions && (
                        <div className={`absolute -bottom-3 flex gap-1 ${isOwn ? 'right-2' : 'left-2'} z-10`}>
                            <div className="flex items-center bg-white border border-slate-100 rounded-full px-1.5 py-0.5 shadow-sm">
                                {Object.entries(groupedReactions).map(([emoji, data]) => (
                                    <button 
                                        key={emoji}
                                        onClick={() => isPledger && onReaction(msg.id, emoji)}
                                        title={`${data.users.join(', ')}`}
                                        className={`flex items-center text-[11px] px-1.5 py-0.5 rounded-full hover:bg-slate-50 transition-colors ${data.isReactedByMe ? 'bg-pink-50 border border-pink-100' : ''}`}
                                    >
                                        <span className="mr-1">{emoji}</span>
                                        <span className={data.isReactedByMe ? 'font-black text-pink-600' : 'font-bold text-slate-500'}>{data.count}</span>
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
export default function GroupChat({ project, user, isPlanner, isPledger, isFlorist, onUpdate, socket, onSummaryUpdate, summary }) {
  const [templates, setTemplates] = useState([]);
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false); 

  const [messages, setMessages] = useState(project.groupChatMessages || []);
  const chatBottomRef = useRef(null); 
  
  useEffect(() => { setMessages(project.groupChatMessages || []); }, [project.groupChatMessages]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (newMessage) => setMessages(prev => [...prev, newMessage]);
    
    const handleReactionAdded = (newReaction) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === newReaction.messageId) {
                const existing = (msg.reactions || []).find(r => r.userId === newReaction.userId && r.emoji === newReaction.emoji);
                if (existing) return msg;
                return { ...msg, reactions: [...(msg.reactions || []), newReaction] };
            }
            return msg;
        }));
    };

    const handleReactionRemoved = ({ messageId, userId, emoji }) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, reactions: (msg.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) };
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
  
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [customInputModal, setCustomInputModal] = useState({ isOpen: false, template: null, text: '' });
  const [freeText, setFreeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // ★ 修正: 正しいAPIエンドポイントに変更
        const res = await fetch(`${API_URL}/api/project-details/chat-templates`);
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
    const toastId = toast.loading('画像を送信中...');
    
    try {
      const token = getAuthToken();
      
      // 1. S3のアップロード用URLを取得
      const urlRes = await fetch(`${API_URL}/api/tools/s3-upload-url`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      
      if (!urlRes.ok) throw new Error('アップロードURLの取得に失敗しました');
      const { uploadUrl, fileUrl } = await urlRes.json();

      // 2. 取得したURLを使って、S3へ直接ファイルを送信
      await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.onload = () => {
              if (xhr.status === 200) resolve(fileUrl);
              else reject(new Error('S3へのアップロードに失敗しました'));
          };
          xhr.onerror = () => reject(new Error('ネットワークエラーが発生しました'));
          xhr.send(file);
      });
      
      // 3. アップロード成功後、チャットにメッセージとして送信
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      handleSendMessage(null, null, messageType, fileUrl, file.name);
      
      toast.success('送信しました', { id: toastId });
    } catch (error) {
        toast.error(`送信失敗: ${error.message}`, { id: toastId });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const onReaction = (messageId, emoji) => {
    if (!isPledger && !isPlanner && !isFlorist) {
      return toast.error('リアクションする権限がありません');
    }
    socket.emit('handleReaction', { messageId, emoji, userId: user.id });
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    if (!user) return toast.error("ログインが必要です");

    setIsSummarizing(true);
    const toastId = toast.loading('AIが会話を分析中...');
    const token = getAuthToken();
    try {
        // ★ 修正: 正しいAPIエンドポイントに変更
        const res = await fetch(`${API_URL}/api/project-details/group-chat/${project.id}/summarize`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('AI要約に失敗しました');
        const data = await res.json();
        if (onSummaryUpdate) onSummaryUpdate(data.summary); 
        toast.success('要約完了！', { id: toastId });
    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsSummarizing(false);
    }
  };
    
  const hasPermission = isPlanner || isPledger || isFlorist;

  return (
    <>
      <div className="bg-[#f8f9fa] rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[650px] relative w-full">
        
        {/* ヘッダー (Glassmorphism) */}
        <div className="p-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0 shadow-sm">
            <div>
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base">
                    <Smile className="text-pink-500" size={18} /> 参加者グループチャット
                </h3>
                <p className="text-[10px] text-slate-500 font-bold tracking-wide mt-0.5">企画者・支援者・お花屋さんが参加中</p>
            </div>
            {hasPermission && (
                <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="text-[10px] md:text-xs bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors flex items-center font-black border border-indigo-200 active:scale-95 disabled:opacity-50"
                >
                    {isSummarizing ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5 mr-1.5" />}
                    AIで要約
                </button>
            )}
        </div>

        {/* チャットエリア */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300">
          
          {/* AI要約 (Sticky) */}
          {summary && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl mb-6 shadow-sm relative">
                  <div className="flex justify-between items-start mb-3 border-b border-amber-200/50 pb-2">
                      <h3 className="font-black text-amber-800 flex items-center text-xs">
                          <FileText className="mr-1.5 text-amber-500"/> AI 決定事項まとめ
                      </h3>
                      <button onClick={() => { navigator.clipboard.writeText(summary); toast.success('コピーしました'); }} className="text-[10px] text-amber-700 hover:text-amber-900 bg-white/50 px-2.5 py-1 rounded-md font-bold transition-colors">
                          コピー
                      </button>
                  </div>
                  <div className="text-xs text-slate-700 font-medium leading-relaxed max-h-32 overflow-y-auto pr-2 prose prose-sm prose-amber">
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><MessageSquare size={24} className="text-slate-300"/></div>
                <p className="text-sm font-bold text-center leading-relaxed">
                    まだメッセージはありません。<br/>
                    {isFlorist ? 'お花屋さんとして挨拶してみましょう！🌸' : '挨拶して企画を盛り上げましょう！'}
                </p>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* 入力エリア (iMessageライク) */}
        <div className="p-3 md:p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          
          {/* テンプレート (横スクロール) */}
          {templates.length > 0 && (
             <div className="mb-3 flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
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
                    className="whitespace-nowrap px-4 py-2.5 text-xs font-black bg-slate-50 border border-slate-200 text-slate-600 rounded-full hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors disabled:opacity-50"
                  >
                    {template.text}
                  </button>
                ))}
             </div>
          )}

          <div className="flex items-end gap-2 bg-slate-100 p-1.5 rounded-3xl border border-slate-200 focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50 transition-all">
             <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                disabled={isUploading || !hasPermission}
                className="p-3 bg-white text-slate-500 hover:text-pink-500 rounded-full shadow-sm hover:shadow transition-all flex-shrink-0 disabled:opacity-50"
              >
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading || !hasPermission} />
             
             <div className="flex-grow pl-2">
               <textarea
                 value={freeText}
                 onChange={(e) => setFreeText(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFreeTextSubmit(e);
                    }
                 }}
                 placeholder={isUploading ? "送信中..." : (hasPermission ? "メッセージを入力..." : "参加者のみ書き込めます")} 
                 disabled={isUploading || !hasPermission} 
                 rows="1"
                 className="w-full bg-transparent border-0 px-2 py-3.5 focus:ring-0 outline-none resize-none text-[16px] font-medium max-h-32 disabled:opacity-50 placeholder:text-slate-400 placeholder:font-bold"
                 style={{ minHeight: '48px' }}
               />
             </div>

             <button 
               onClick={handleFreeTextSubmit}
               disabled={isUploading || !freeText.trim() || !hasPermission} 
               className={`p-3.5 rounded-full text-white shadow-md transition-all flex-shrink-0 flex items-center justify-center ${
                 (!freeText.trim() || isUploading || !hasPermission)
                   ? 'bg-slate-300 cursor-not-allowed' 
                   : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 active:scale-95'
               }`}
             >
               <Send size={18} className="ml-0.5" />
             </button>
          </div>

          {isPlanner && (
            <button onClick={() => setPollModalOpen(true)} className="w-full mt-3 py-2.5 text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center border border-indigo-100 flex items-center justify-center gap-2">
                📊 みんなにアンケートをとる
            </button>
          )}
        </div>
      </div>

      {/* カスタム入力モーダル */}
      {customInputModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md">
            <h3 className="font-black text-slate-800 text-lg mb-4">メッセージを入力</h3>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-600 font-bold mb-6 text-sm border border-slate-100">
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
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[16px] text-slate-800 font-bold focus:ring-4 focus:ring-pink-100 focus:border-pink-400 outline-none mb-6 transition-all"
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setCustomInputModal({ isOpen: false, template: null, text: '' })} className="px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors">キャンセル</button>
                    <button type="submit" className="px-6 py-3 font-black text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-md text-sm transition-all active:scale-95">送信する</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {isPollModalOpen && <PollCreationModal projectId={project.id} onClose={() => setPollModalOpen(false)} onPollCreated={onUpdate} />}
      
      {reportTargetId && (
        <ChatReportModal messageId={reportTargetId} onClose={() => setReportTargetId(null)} />
      )}
    </>
  );
}