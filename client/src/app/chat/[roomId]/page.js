'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// --- 見積書作成モーダル ---
function QuotationModal({ project, floristUser, onClose, onQuotationSubmitted, token }) {
  const [items, setItems] = useState([{ itemName: '', amount: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleItemChange = (index, event) => {
    const values = [...items];
    values[index][event.target.name] = event.target.value;
    setItems(values);
  };
  const handleAddItem = () => setItems([...items, { itemName: '', amount: '' }]);
  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const values = [...items];
      values.splice(index, 1);
      setItems(values);
    }
  };
  const totalAmount = items.reduce((sum, item) => sum + (parseInt(item.amount, 10) || 0), 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const validItems = items.filter(item => item.itemName && item.amount && !isNaN(parseInt(item.amount, 10)));
    
    if (validItems.length === 0) {
        toast.error("有効な項目を1つ以上入力してください。");
        setIsSubmitting(false);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/quotations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ★トークン必須
            },
            body: JSON.stringify({
                projectId: project.id,
                items: validItems.map(item => ({...item, amount: parseInt(item.amount, 10)})),
                // floristId はトークンから取得されるので不要
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || '見積書の作成に失敗しました。');
        }

        toast.success('見積書を送信しました。');
        onQuotationSubmitted();
        onClose();
    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">見積書作成</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input type="text" name="itemName" placeholder="項目名 (例: フラスタ本体)" value={item.itemName} onChange={e => handleItemChange(index, e)} className="p-2 border rounded-md text-gray-900 flex-grow"/>
              <input type="number" name="amount" placeholder="金額(pt)" value={item.amount} onChange={e => handleItemChange(index, e)} className="p-2 border rounded-md text-gray-900 w-32"/>
              <button onClick={() => handleRemoveItem(index)} disabled={items.length <= 1} className="text-red-500 hover:text-red-700 p-2 font-bold text-xl disabled:text-gray-300 disabled:cursor-not-allowed">×</button>
            </div>
          ))}
        </div>
        <button onClick={handleAddItem} className="text-sm text-sky-600 hover:underline mt-2">+ 項目を追加</button>
        <div className="border-t my-4 pt-4 text-right">
          <p className="text-lg font-bold text-gray-800">合計: {totalAmount.toLocaleString()} pt</p>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">閉じる</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-slate-400">
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- チャットページ本体 ---
export default function ChatPage() {
  const { roomId } = useParams();
  const { user, token, loading: authLoading } = useAuth(); // AuthContextからトークンを取得
  const router = useRouter();

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  // 1. データ取得 (HTTP)
  const fetchChatData = useCallback(async () => {
    if (!roomId || !token) return;
    try {
      setLoadingData(true);
      const res = await fetch(`${API_URL}/api/chat/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` } // ★トークン必須
      });
      
      if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
              toast.error('権限がありません');
              router.push('/');
              return;
          }
          throw new Error('チャットルームの読み込みに失敗しました。');
      }
      
      const data = await res.json();
      setRoomInfo(data);
      setMessages(data.messages || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingData(false);
    }
  }, [roomId, token, router]);

  useEffect(() => {
    if (!authLoading && token) {
        fetchChatData();
    }
  }, [authLoading, token, fetchChatData]);

  // 2. WebSocket接続
  useEffect(() => {
    if (!roomId || !token) return;
    
    // ★認証トークンをつけて接続
    const newSocket = io(API_URL, {
      auth: { token: `Bearer ${token}` }, 
      transports: ['polling', 'websocket'] 
    });

    newSocket.on('connect', () => {
        console.log('Connected to socket');
        newSocket.emit('joinRoom', roomId);
    });

    newSocket.on('receiveMessage', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    newSocket.on('messageError', (errorMessage) => {
      toast.error(errorMessage);
    });

    newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, token]);

  // メッセージ送信
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() && socket) {
      // サーバー側でトークンからユーザーを特定するため、送信情報は最小限でOK
      socket.emit('sendMessage', {
        roomId: roomId,
        messageType: 'TEXT',
        content: currentMessage,
      });
      setCurrentMessage('');
    }
  };
  
  // ファイルアップロード
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!token) return toast.error('ログインが必要です。');

    setIsUploading(true);
    const toastId = toast.loading('ファイルをアップロード中...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
    try {
      const res = await fetch(`${API_URL}/api/upload`, { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` }, // ★トークン必須
          body: uploadFormData 
      });
      
      if (!res.ok) throw new Error('アップロードに失敗');
      const data = await res.json();
      
      const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      
      socket.emit('sendMessage', {
        roomId: roomId,
        messageType: messageType,
        fileUrl: data.url,
        fileName: file.name,
        content: null,
      });
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

  // 見積もり承認
  const handleApproveQuotation = async (quotationId) => {
    if (user?.role !== 'USER') {
        toast.error("見積書の承認には企画者としてログインが必要です。");
        return;
    }
    if (window.confirm("この見積書の内容で支払いを確定します。集まったポイントから合計額が引き落とされます。よろしいですか？")) {
      const promise = fetch(`${API_URL}/api/quotations/${quotationId}/approve`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ★トークン必須
        },
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || '承認処理に失敗しました。');
        }
        return res.json();
      });
      
      toast.promise(promise, {
          loading: '処理中...',
          success: () => {
              fetchChatData(); // データ更新
              return '見積書を承認し、支払いが完了しました！';
          },
          error: (err) => err.message,
      });
    }
  };

  if (authLoading || loadingData || !roomInfo) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
      );
  }

  const project = roomInfo.offer.project;
  const florist = roomInfo.offer.florist;
  const planner = project.planner;
  
  // 現在のユーザーがお花屋さんかユーザーかで相手の名前を切り替え
  const isMeFlorist = user?.role === 'FLORIST';
  const chatPartnerName = isMeFlorist ? planner?.handleName : florist?.platformName;
  const myIcon = isMeFlorist ? florist.iconUrl : user?.iconUrl; 
  const partnerIcon = isMeFlorist ? planner.iconUrl : florist.iconUrl;

  const isPlanner = user?.role === 'USER' && user?.id === planner?.id;
  const quotation = project.quotation;
  const hasEnoughPoints = quotation ? project.collectedAmount >= quotation.totalAmount : false;

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b flex items-center justify-between">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <div className="text-center">
                <h1 className="text-lg font-bold text-gray-800">{chatPartnerName}</h1>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{project.title}</p>
            </div>
            <div className="w-6"></div> {/* スペーサー */}
        </header>

        {/* メッセージエリア */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 見積書表示エリア */}
          {quotation && (
            <div className="mx-auto max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-gray-800 shadow-sm">
              <h3 className="font-bold text-yellow-800 text-center mb-2">🧾 見積書が届いています</h3>
              <ul className="text-sm space-y-1 mb-3 border-b border-yellow-200 pb-2">
                {(quotation.items || []).map(item => (
                    <li key={item.id} className="flex justify-between">
                        <span>{item.itemName}</span>
                        <span>{item.amount?.toLocaleString()} pt</span>
                    </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold text-lg text-yellow-900 mb-4">
                  <span>合計</span>
                  <span>{quotation.totalAmount?.toLocaleString()} pt</span>
              </div>
              
              {isPlanner && !quotation.isApproved && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">現在の支援総額: {project.collectedAmount?.toLocaleString()} pt</p>
                  <button
                    onClick={() => handleApproveQuotation(quotation.id)}
                    disabled={!hasEnoughPoints} 
                    className="w-full py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {hasEnoughPoints ? '承認して支払う' : 'ポイント不足'}
                  </button>
                </div>
              )}
              {quotation.isApproved && (
                  <div className="bg-green-100 text-green-700 text-center py-1 rounded text-sm font-bold">
                      ✓ 承認・支払い完了
                  </div>
              )}
            </div>
          )}

          {messages.map((msg) => {
            if (!msg || !msg.id) return null;
            
            // 送信者の判定 (サーバーからの senderType と自分の role を比較)
            const isMyMessage = (isMeFlorist && msg.senderType === 'FLORIST') || (!isMeFlorist && msg.senderType === 'USER');
            
            return (
              <div key={msg.id} className={`flex gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                {!isMyMessage && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {partnerIcon ? <img src={partnerIcon} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs">相</span>}
                    </div>
                )}
                
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm ${
                    isMyMessage 
                    ? 'bg-sky-500 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                }`}>
                  {msg.isAutoResponse && <p className="text-[10px] font-bold mb-1 opacity-80 flex items-center gap-1">🤖 自動応答</p>}
                  
                  {msg.messageType === 'IMAGE' ? (
                    <img src={msg.fileUrl} alt="画像" className="max-w-full h-auto rounded-lg" />
                  ) : msg.messageType === 'FILE' ? (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">
                      📎 {msg.fileName || 'ファイル'}
                    </a>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  <p className={`text-[10px] mt-1 text-right ${isMyMessage ? 'text-sky-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* 入力エリア */}
        <footer className="bg-white p-3 border-t sticky bottom-0">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* お花屋さん用: 見積もりボタン */}
            {isMeFlorist && (!quotation || !quotation.isApproved) && (
              <button onClick={() => setIsModalOpen(true)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors" title="見積書を作成">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </button>
            )}

            {/* 画像アップロードボタン */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()} 
              disabled={isUploading}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />

            {/* メッセージ入力フォーム */}
            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                disabled={!socket || isUploading}
              />
              <button
                type="submit"
                disabled={!currentMessage.trim() || !socket}
                className="bg-sky-500 text-white p-2 rounded-full hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform -rotate-45 translate-x-0.5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </form>
          </div>
        </footer>
      </div>
      
      {/* 見積書モーダル */}
      {isModalOpen && isMeFlorist && (
        <QuotationModal 
            project={project} 
            floristUser={florist} // userではなくflorist情報を渡す
            token={token} // ★トークンを渡す
            onClose={() => setIsModalOpen(false)} 
            onQuotationSubmitted={fetchChatData} 
        />
      )}
    </>
  );
}