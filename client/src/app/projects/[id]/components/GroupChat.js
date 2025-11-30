'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // パスを確認してください
import toast from 'react-hot-toast';
import PollCreationModal from './PollCreationModal';
import { FiGlobe, FiLoader, FiUser } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const AVAILABLE_EMOJIS = ['👍', '❤️', '🙌', '😂', '🔥', '🤔'];

// トークン取得ヘルパー
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

// ===============================================
// ★★★ ヘルパー: リアクションピッカー ★★★
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M11 16h2"></path></svg>
            </button>
            
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-50 whitespace-nowrap">
                    <div className="flex gap-1">
                        {AVAILABLE_EMOJIS.map(emoji => (
                            <button 
                                key={emoji} 
                                type="button" 
                                onClick={() => { onSelect(emoji); setIsOpen(false); }}
                                className="text-xl p-1 rounded-md hover:bg-gray-100 transition-colors"
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
// ★★★ コンポーネント: 個別メッセージ (翻訳＆リアクション統合版) ★★★
// ===============================================
const ChatMessage = ({ msg, user, isPlanner, isPledger, onReaction, templates }) => {
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const isOwn = user && msg.userId === user.id;

    // テンプレートメッセージのフォーマット
    const getMessageContent = () => {
        if (!msg.templateId) return msg.content;
        const template = templates.find(t => t.id === msg.templateId);
        if (!template) return msg.content || '不明なメッセージ';
        if (template.hasCustomInput && msg.content) return template.text.replace('...', `"${msg.content}"`);
        return template.text;
    };

    const contentText = getMessageContent();

    // 翻訳ハンドラ
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
                body: JSON.stringify({ text: contentText }) // 表示されているテキストを翻訳
            });
            if (res.ok) {
                const data = await res.json();
                setTranslatedText(data.translatedText);
            } else {
                toast.error('翻訳に失敗しました');
            }
        } catch (e) {
            console.error(e);
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
                    <img src={msg.user.iconUrl} alt={msg.user.handleName} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <FiUser />
                    </div>
                )}
            </div>

            {/* メッセージ本文エリア */}
            <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600 font-bold">{msg.user.handleName}</span>
                    <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                <div className="relative">
                    {/* 吹き出し */}
                    <div className={`px-4 py-2 rounded-2xl relative ${isOwn ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                        
                        {/* コンテンツ表示 */}
                        {msg.messageType === 'IMAGE' ? (
                            <img src={msg.fileUrl} alt="画像" className="max-w-full h-auto rounded-lg my-1 cursor-pointer hover:opacity-90"/>
                        ) : msg.messageType === 'FILE' ? (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-600 font-semibold hover:underline bg-white/80 p-2 rounded">
                                📎 {msg.fileName || 'ファイルを表示'}
                            </a>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{contentText}</p>
                        )}

                        {/* 翻訳結果 */}
                        {translatedText && (
                            <div className={`mt-2 pt-2 border-t text-sm italic flex items-start gap-1 ${isOwn ? 'border-white/30 text-sky-100' : 'border-gray-200 text-gray-600'}`}>
                                <FiGlobe className="mt-1 shrink-0"/>
                                <span>{translatedText}</span>
                            </div>
                        )}
                    </div>

                    {/* アクションボタン (翻訳 & リアクション追加) */}
                    <div className={`absolute top-0 flex items-center ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {/* 翻訳ボタン (テキストのみ) */}
                        {!translatedText && (msg.messageType === 'TEXT' || msg.templateId) && (
                            <button 
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                className="text-gray-400 hover:text-sky-500 p-1"
                                title="翻訳する"
                            >
                                {isTranslating ? <FiLoader className="animate-spin"/> : <FiGlobe/>}
                            </button>
                        )}
                        {/* リアクションピッカー */}
                        <ReactionPicker 
                            onSelect={(emoji) => onReaction(msg.id, emoji)}
                            isEnabled={isPledger && !!user} 
                        />
                    </div>

                    {/* リアクション表示バッジ (吹き出しの下) */}
                    {hasReactions && (
                        <div className={`absolute -bottom-3 flex gap-1 ${isOwn ? 'right-0' : 'left-0'} z-10`}>
                            <div className="flex items-center bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-sm">
                                {Object.entries(groupedReactions).map(([emoji, data]) => (
                                    <button 
                                        key={emoji}
                                        onClick={() => isPledger && onReaction(msg.id, emoji)}
                                        title={`${data.users.join(', ')}`}
                                        className={`flex items-center text-xs px-1 rounded-full hover:bg-gray-100 ${data.isReactedByMe ? 'bg-blue-100' : ''}`}
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
// ★★★ メインコンポーネント: GroupChat ★★★
// ===============================================

export default function GroupChat({ project, user, isPlanner, isPledger, onUpdate, socket }) {
  const [templates, setTemplates] = useState([]);
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  
  // ローカルメッセージ State
  const [messages, setMessages] = useState(project.groupChatMessages || []);
  const chatBottomRef = useRef(null); 
  
  useEffect(() => {
    setMessages(project.groupChatMessages || []);
  }, [project.groupChatMessages]);
  
  // Socket.IO リスナー
  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (newMessage) => {
        setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    const handleReactionAdded = (newReaction) => {
        setMessages(prevMessages => prevMessages.map(msg => {
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
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === messageId) {
                const updatedReactions = (msg.reactions || []).filter(
                    r => !(r.userId === userId && r.emoji === emoji)
                );
                return { ...msg, reactions: updatedReactions };
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


  const [customInputModal, setCustomInputModal] = useState({
    isOpen: false,
    template: null,
    text: '',
  });
  const [freeText, setFreeText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat-templates`);
        if (!res.ok) throw new Error('テンプレート取得失敗');
        setTemplates(await res.json());
      } catch (error) { console.error(error); }
    };
    fetchTemplates();
  }, []);

  const templatesByCategory = templates.reduce((acc, t) => {
    acc[t.category] = [...(acc[t.category] || []), t];
    return acc;
  }, {});
  
  const handleTemplateClick = (template) => {
    if (!isPledger && !isPlanner && !(user && project.offer?.floristId === user.id)) {
      toast.error('権限がありません。');
      return;
    }
    if (template.hasCustomInput) {
      setCustomInputModal({ isOpen: true, template: template, text: '' });
    } else {
      handleSendMessage(template.id, null, 'TEXT', null, null);
    }
  };
  
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInputModal.template && customInputModal.text.trim()) {
      handleSendMessage(customInputModal.template.id, customInputModal.text, 'TEXT', null, null);
      setCustomInputModal({ isOpen: false, template: null, text: '' });
    }
  };

  const handleFreeTextSubmit = (e) => {
    e.preventDefault();
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
      const token = getAuthToken(); // APIルートによってはTokenが必要な場合があるため
      const res = await fetch(`${API_URL}/api/upload`, { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData 
      });
      if (!res.ok) throw new Error('アップロードに失敗');
      const data = await res.json();
      
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      handleSendMessage(null, null, messageType, data.url, file.name);
      toast.success('ファイルを送信しました！', { id: toastId });

    } catch (error) {
        toast.error(`送信に失敗しました: ${error.message}`, { id: toastId });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = (templateId, content, messageType, fileUrl, fileName) => {
    if (!socket || !user) {
      toast.error('接続エラー');
      return;
    }
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
  
  // リアクション送信
  const onReaction = (messageId, emoji) => {
    if (!isPledger && !isPlanner && !(user && project.offer?.floristId === user.id)) {
      toast.error('リアクションできる権限がありません。');
      return;
    }
    socket.emit('handleReaction', {
        messageId: messageId,
        emoji: emoji,
        userId: user.id
    });
  };
  
  // 投票
  const handleVote = (optionIndex) => {
    if (!project.activePoll || !user || !isPledger) {
      toast.error('投票するにはこの企画の支援者である必要があります。');
      return;
    }
    const token = getAuthToken();
    const promise = fetch(`${API_URL}/api/group-chat/polls/vote`, {
      method: 'POST', 
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        pollId: project.activePoll.id,
        userId: user.id,
        optionIndex 
      }),
    }).then(async res => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '投票に失敗しました。');
      }
    });
    toast.promise(promise, {
      loading: '投票中...',
      success: () => { onUpdate(); return '投票しました！'; },
      error: (err) => err.message,
    });
  };
  
  const activePoll = project.activePoll;
  const userVote = activePoll?.votes.find(v => v.userId === user?.id);
  const totalVotes = activePoll?.votes.length || 0;

  return (
    <>
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-orange-800 mb-2">参加者グループチャット</h3>
        
        {/* アンケートエリア */}
        {activePoll && (
          <div className="bg-white border-2 border-purple-300 rounded-lg p-3 mb-4">
            <p className="font-bold text-gray-800 mb-3">💡 アンケート実施中: {activePoll.question}</p>
            <div className="space-y-2">
              {activePoll.options.map((option, index) => {
                const voteCount = activePoll.votes.filter(v => v.optionIndex === index).length;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const didUserVoteForThis = userVote?.optionIndex === index;
                return (
                  <div key={index}>
                    {userVote ? (
                      <div title={`${voteCount} / ${totalVotes} 票`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-semibold ${didUserVoteForThis ? 'text-purple-600' : 'text-gray-700'}`}>{option} {didUserVoteForThis ? ' (あなたが投票)' : ''}</span>
                          <span className="text-gray-500">{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-purple-400 h-4 rounded-full" style={{ width: `${percentage}%` }}></div></div>
                      </div>
                    ) : (
                      <button onClick={() => handleVote(index)} disabled={!isPledger} className="w-full text-left p-2 border rounded-md text-gray-800 hover:bg-purple-100 disabled:bg-gray-100 disabled:cursor-not-allowed">{option}</button>
                    )}
                  </div>
                );
              })}
            </div>
            {!userVote && !isPledger && <p className="text-xs text-red-500 mt-2">※アンケートへの投票は、この企画の支援者のみ可能です。</p>}
          </div>
        )}
        
        {/* チャットメッセージ一覧 */}
        <div className="h-80 overflow-y-auto bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-inner">
          {messages.length > 0 ? (
            messages.map(msg => (
                <ChatMessage 
                    key={msg.id} 
                    msg={msg} 
                    user={user}
                    isPlanner={isPlanner}
                    isPledger={isPledger}
                    onReaction={onReaction}
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

        {/* テンプレート・入力エリア */}
        <div>
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category} className="mb-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">{category}</p>
              <div className="flex flex-wrap gap-2">
                {templates.map(template => (
                  <button key={template.id} onClick={() => handleTemplateClick(template)} disabled={!isPledger && !isPlanner} className="px-3 py-1 text-sm bg-white border text-gray-800 rounded-full hover:bg-orange-200 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed">{template.text}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t mt-4 pt-3">
             <p className="text-xs font-semibold text-gray-600 mb-1">その他 (自由記述・ファイル添付)</p>
             <form onSubmit={handleFreeTextSubmit} className="flex gap-2">
               <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={isUploading || !socket || !user}
                  title="ファイル/画像を添付" 
                  className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-shrink-0 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isUploading} />
               
               <input type="text" value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder={isUploading ? "アップロード中..." : "メッセージを入力..."} required={!isUploading} disabled={isUploading} className="p-2 border rounded-md text-gray-900 flex-grow" />
               <button type="submit" disabled={isUploading || !freeText.trim()} className="p-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-400">送信</button>
             </form>
          </div>

          {isPlanner && (
            <button onClick={() => setPollModalOpen(true)} className="w-full mt-4 p-2 text-sm font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600">💡 新しいアンケートを作成する</button>
          )}
        </div>
      </div>

      {customInputModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <form onSubmit={handleCustomSubmit}>
              <p className="text-sm text-gray-600">テンプレート:</p>
              <p className="mb-4 font-semibold text-lg">{customInputModal.template.text.replace('...', `「${customInputModal.text || '...'}」`)}</p>
              <input type="text" value={customInputModal.text} onChange={(e) => setCustomInputModal({ ...customInputModal, text: e.target.value })} placeholder={customInputModal.template.placeholder} required autoFocus className="w-full mt-1 p-2 border rounded-md text-gray-900"/>
              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setCustomInputModal({ isOpen: false, template: null, text: '' })} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">閉じる</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600">送信する</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isPollModalOpen && <PollCreationModal projectId={project.id} onClose={() => setPollModalOpen(false)} onPollCreated={onUpdate} />}
    </>
  );
}