'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import PollCreationModal from './PollCreationModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const AVAILABLE_EMOJIS = ['👍', '❤️', '🙌', '😂', '🔥', '🤔'];

// ===============================================
// ★★★ ヘルパーコンポーネント: リアクションピッカー ★★★
// ===============================================
const ReactionPicker = ({ onSelect, isEnabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);

    // モーダルの外側をクリックしたら閉じる
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmojiClick = (emoji) => {
        onSelect(emoji);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={pickerRef}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                disabled={!isEnabled}
                className={`ml-2 text-gray-400 transition-colors p-1 rounded-full ${isEnabled ? 'hover:text-gray-600' : 'cursor-not-allowed'}`}
                title="リアクションを追加"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M11 16h2"></path></svg>
            </button>
            
            {isOpen && (
                <div className="absolute top-0 right-8 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-10 whitespace-nowrap">
                    <div className="flex gap-1">
                        {AVAILABLE_EMOJIS.map(emoji => (
                            <button 
                                key={emoji} 
                                type="button" 
                                onClick={() => handleEmojiClick(emoji)}
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
// ★★★ ヘルパーコンポーネント: リアクション表示 ★★★
// ===============================================
const ReactionDisplay = ({ msg, user, handleReaction, isPledger }) => {
    // リアクションの集計
    const groupedReactions = (msg.reactions || []).reduce((acc, reaction) => {
        const emoji = reaction.emoji;
        acc[emoji] = acc[emoji] || { count: 0, users: [], isReactedByMe: false };
        acc[emoji].count += 1;
        // ユーザー名が取得できていれば追加（Socketから来るデータには user が含まれているはず）
        if (reaction.user?.handleName) {
             acc[emoji].users.push(reaction.user.handleName);
        } else if (reaction.userId === user?.id) {
             // 自分のリアクションの場合は自分の名前を fallback として表示 (稀なケース)
             acc[emoji].users.push(user.handleName || 'あなた');
        }
        
        if (reaction.userId === user?.id) {
            acc[emoji].isReactedByMe = true;
        }
        return acc;
    }, {});

    const hasReactions = Object.keys(groupedReactions).length > 0;

    return (
        <>
            {/* 既存リアクションの表示エリア (メッセージの右下) */}
            {hasReactions && (
                <div className="absolute -bottom-3 right-0 flex items-center bg-white border border-gray-300 rounded-full pl-1 pr-1 py-0.5 shadow-md z-10">
                    {Object.entries(groupedReactions).map(([emoji, data]) => (
                        <div 
                            key={emoji} 
                            // titleはユーザー名のリスト
                            title={`${data.users.length > 0 ? data.users.join(', ') : '複数人'}が${emoji}をつけました`}
                            onClick={() => isPledger && handleReaction(msg.id, emoji)} // 支援者のみクリックでトグル可能
                            className={`flex items-center text-xs p-1 rounded-full transition-colors ${data.isReactedByMe ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'} ${isPledger ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <span className="mr-1">{emoji}</span>
                            <span className="font-semibold">{data.count}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* リアクション追加ボタン（メッセージの右上） */}
            <div className="absolute -top-1 right-0 transform translate-x-full">
                <ReactionPicker 
                    onSelect={(emoji) => handleReaction(msg.id, emoji)}
                    isEnabled={isPledger && !!user} // 支援者かつログイン済みなら有効
                />
            </div>
        </>
    );
};


// ===============================================
// ★★★ メインコンポーネント: GroupChat ★★★
// ===============================================

export default function GroupChat({ project, user, isPlanner, isPledger, onUpdate, socket }) {
  const [templates, setTemplates] = useState([]);
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  
  // ★ 1. ローカルメッセージ State の導入と同期
  const [messages, setMessages] = useState(project.groupChatMessages || []);
  const chatBottomRef = useRef(null); 
  
  useEffect(() => {
    // project.groupChatMessages が親から更新されたらローカル State を同期
    setMessages(project.groupChatMessages || []);
  }, [project.groupChatMessages]);
  
  // ★ 2. Socket.IO リスナーの追加 (リアルタイムリアクション対応)
  useEffect(() => {
    if (!socket) return;
    
    // a. 新規メッセージ受信 (既存処理の再実装)
    const handleReceiveMessage = (newMessage) => {
        setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    // b. リアクション追加
    const handleReactionAdded = (newReaction) => {
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === newReaction.messageId) {
                // 既に自分のリアクションがあるかチェック（万が一重複ブロードキャストした場合のため）
                const existingReaction = (msg.reactions || []).find(
                    r => r.userId === newReaction.userId && r.emoji === newReaction.emoji
                );
                if (existingReaction) return msg;

                const updatedReactions = [...(msg.reactions || []), newReaction];
                return { ...msg, reactions: updatedReactions };
            }
            return msg;
        }));
    };

    // c. リアクション削除
    const handleReactionRemoved = ({ messageId, userId, emoji }) => {
        setMessages(prevMessages => prevMessages.map(msg => {
            if (msg.id === messageId) {
                // 削除対象を除外してリアクション配列を更新
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
  
  // ★ 3. メッセージが追加されたらスクロール
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

  const formatTemplateMessage = (msg) => {
    if (!msg.templateId) return msg.content;
    const template = templates.find(t => t.id === msg.templateId);
    if (!template) return '不明なメッセージ';
    if (template.hasCustomInput && msg.content) return template.text.replace('...', `"${msg.content}"`);
    return template.text;
  };

  const templatesByCategory = templates.reduce((acc, t) => {
    acc[t.category] = [...(acc[t.category] || []), t];
    return acc;
  }, {});
  
  const handleTemplateClick = (template) => {
    if (!isPledger && !isPlanner) {
      toast.error('このチャットは支援者と企画者のみ参加できます。');
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

    if (!user || !socket || (!isPledger && !isPlanner)) {
      return toast.error('チャットに参加する権限がありません。');
    }

    setIsUploading(true);
    const toastId = toast.loading('ファイルをアップロード中...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file); // APIは 'image' というキーを期待

    try {
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: uploadFormData });
      if (!res.ok) throw new Error('アップロードに失敗');
      const data = await res.json();
      
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';

      handleSendMessage(null, null, messageType, data.url, file.name);

      toast.success('ファイルを送信しました！', { id: toastId });

    } catch (error) {
        toast.error(`送信に失敗しました: ${error.message}`, { id: toastId });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }
  };


  const handleSendMessage = (templateId, content, messageType, fileUrl, fileName) => {
    if (!socket) {
      toast.error('チャットサーバーに接続していません。');
      return;
    }
    if (!user) {
      toast.error('チャットの送信にはログインが必要です。');
      return;
    }
    if (!isPledger && !isPlanner) {
      toast.error('チャットの送信には企画への支援が必要です。');
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
  
  // ★★★【新規】リアクション操作関数 ★★★
  const handleReaction = (messageId, emoji) => {
    if (!isPledger) {
      toast.error('リアクションは支援者のみ可能です。');
      return;
    }
    if (!socket || !user) {
        toast.error('リアクションの操作にはログインと接続が必要です。');
        return;
    }

    socket.emit('handleReaction', {
        messageId: messageId,
        emoji: emoji,
        userId: user.id
    });
  };
  
  const handleVote = (optionIndex) => {
    if (!project.activePoll || !user || !isPledger) {
      toast.error('投票するにはこの企画の支援者である必要があります。');
      return;
    }
    const promise = fetch(`${API_URL}/api/group-chat/polls/vote`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
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
        {activePoll && (
          <div className="bg-white border-2 border-purple-300 rounded-lg p-3 mb-4">
            {/* ... (アンケート表示ロジックは変更なし) ... */}
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
        
        {/* ★★★ メッセージ表示欄を修正 (messages Stateを使用) ★★★ */}
        <div className="h-64 overflow-y-auto bg-white rounded-lg p-3 space-y-3 mb-4 border">
          {messages.length > 0 ? (
            messages.map(msg => (
              <div key={msg.id} className="flex items-start gap-2">
                {/* アイコン */}
                {msg.user.iconUrl ? (
                  <img src={msg.user.iconUrl} alt={msg.user.handleName} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"/></svg>
                  </div>
                )}
                {/* 名前とメッセージ本体 */}
                <div>
                  <p className="text-xs text-gray-500">{msg.user.handleName}</p>
                  
                  {/* ★★★ リアクション表示のための relative ラッパー ★★★ */}
                  <div className="relative inline-block"> 
                    <div className={`inline-block rounded-lg px-3 py-1 mt-1 ${!msg.templateId ? 'bg-green-100' : 'bg-orange-100'}`}>
                      
                      {msg.messageType === 'IMAGE' ? (
                        <img src={msg.fileUrl} alt={msg.fileName || '送信された画像'} className="max-w-xs h-auto rounded-md"/>
                      ) : msg.messageType === 'FILE' ? (
                        <a 
                          href={msg.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-semibold text-sky-600 hover:underline"
                        >
                          📎 {msg.fileName || 'ファイルを表示'}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{formatTemplateMessage(msg)}</p>
                      )}

                    </div>
                    {/* ★★★ リアクション表示コンポーネントの配置 ★★★ */}
                    <ReactionDisplay msg={msg} user={user} handleReaction={handleReaction} isPledger={isPledger} />
                  </div>
                  {/* ★★★ リアクション表示の終了 ★★★ */}

                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center pt-4">まだメッセージはありません。</p>
          )}
          <div ref={chatBottomRef} />
        </div>
        {/* ★★★ メッセージ表示欄の修正ここまで ★★★ */}

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
               {/* ファイル添付ボタン */}
               <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={isUploading || !socket || !user || (!isPledger && !isPlanner)}
                  title="ファイル/画像を添付" 
                  className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-shrink-0 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  disabled={isUploading}
                />
               
               {/* テキスト入力 */}
               <input type="text" value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder={isUploading ? "アップロード中..." : "メッセージを入力..."} required={!isUploading} disabled={isUploading || (!isPledger && !isPlanner)} className="p-2 border rounded-md text-gray-900 flex-grow" />
               <button type="submit" disabled={isUploading || !freeText.trim() || (!isPledger && !isPlanner)} className="p-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-400">送信</button>
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