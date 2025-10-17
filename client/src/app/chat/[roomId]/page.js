'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

// ★★★ 見積書作成モーダルの部品 ★★★
function QuotationModal({ project, onClose, onQuotationSubmitted }) {
  const { user } = useAuth();
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
    try {
      // ★★★ トークンを取得・付与 ★★★
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/api/quotations`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: project.id,
          items: items.filter(item => item.itemName && item.amount),
          // floristIdは不要 (トークンからサーバーが判断する)
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '見積書の作成に失敗しました。');
      }
      alert('見積書を送信しました。');
      onQuotationSubmitted(); // チャットページのデータを再読み込み
      onClose();
    } catch (error) {
      alert(`エラー: ${error.message}`);
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
              <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-2 font-bold text-xl">×</button>
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


// ★★★ チャットページの本体 ★★★
export default function ChatPage() {
  const params = useParams();
  const { roomId } = params;
  const { user, userType } = useAuth();

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatError, setChatError] = useState(''); // ★ エラーメッセージ用のStateを追加

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const fetchChatData = async () => {
    try {
      // ★★★ トークンを取得 ★★★
      const token = localStorage.getItem('authToken'); // useAuthで保存しているトークンキー
      if (!token) throw new Error('認証情報がありません。');
      
      const res = await fetch(`${API_URL}/api/chat-rooms/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` } // ★★★ トークンを付与 ★★★
      });
      if (!res.ok) throw new Error('チャットルームの読み込みに失敗しました。');
      const data = await res.json();
      setRoomInfo(data);
      setMessages(data.messages);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchChatData();

    // ★★★ 接続時に認証トークンを渡す ★★★
    const newSocket = io(API_URL, {
      auth: { token: localStorage.getItem('authToken') }
    });
    setSocket(newSocket);

    // ★★★ イベント名をより具体的に変更 ★★★
    newSocket.emit('joinPrivateChatRoom', roomId);
    newSocket.on('receiveChatMessage', (newMessage) => { // こちらも変更
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // メッセージ送信エラーを受信したときの処理
    newSocket.on('messageError', (errorMessage) => {
      setChatError(errorMessage); // Stateにエラーメッセージをセット
      
      // 5秒後にエラーメッセージを自動で消す
      setTimeout(() => {
        setChatError('');
      }, 5000);
    });
    // ▲▲▲ ここまで追記 ▲▲▲
    newSocket.on('floristMessageDeleted', ({ messageId }) => {
    setMessages(prevMessages => prevMessages.filter(m => m.id !== messageId));
  });

    // コンポーネントがアンマウントされるときにソケット接続をクリーンアップ
    return () => {
      newSocket.off('receiveMessage');
      newSocket.off('messageError');
      newSocket.off('floristMessageDeleted');  // ★ エラーリスナーも忘れずにクリーンアップ
      newSocket.disconnect();
    };
  }, [roomId, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() && user && socket) {
      setChatError('');
      // ★★★ 送信するデータをシンプルに！(ユーザー情報は送らない) ★★★
      socket.emit('sendChatMessage', {
        chatRoomId: roomId,
        content: currentMessage,
      });
      setCurrentMessage('');
    }
  };

  const handleApproveQuotation = async (quotationId) => {
    if (window.confirm("この見積書の内容で支払いを確定します。集まったポイントから合計額が引き落とされます。よろしいですか？")) {
      try {
        // ★★★ トークンを取得・付与 ★★★
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/quotations/${quotationId}/approve`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          // bodyは不要 (トークンからサーバーがユーザーを判断する)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        alert('見積書を承認し、支払いが完了しました！');
        fetchChatData(); // 最新の状態を再取得
      } catch (error) {
        alert(`エラー: ${error.message}`);
      }
    }
  };

  if (!user) {
    return (
      <div className="text-center p-10">
        <p>このページにアクセスするにはログインが必要です。</p>
        <Link href="/login"><span className="text-sky-500 hover:underline">ログインページへ</span></Link>
      </div>
    );
  }
  
  if (loading) return <p className="text-center p-10">チャットを読み込んでいます...</p>;
  if (!roomInfo) return <p className="text-center p-10">チャットルームが見つかりません。</p>;

  const project = roomInfo.offer.project;
  const chatPartnerName = userType === 'USER' ? roomInfo.offer.florist.shopName : project.planner.handleName;
  const isPlanner = userType === 'USER' && user.id === project.plannerId;
  const quotation = project.quotation;

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="bg-white shadow-sm p-4 text-center sticky top-0 z-10">
          <p className="text-sm text-gray-500">企画名: {project.title}</p>
          <h1 className="text-xl font-bold">{chatPartnerName}さんとのチャット</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {quotation && (
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg my-4 text-gray-800">
              <h3 className="font-bold text-yellow-800 text-center">お花屋さんから見積書が届いています</h3>
              <ul className="list-disc list-inside my-2 text-yellow-900">
                {quotation.items.map(item => <li key={item.id}>{item.itemName}: {item.amount.toLocaleString()} pt</li>)}
              </ul>
              <p className="font-bold text-right border-t border-yellow-300 pt-2">合計: {quotation.totalAmount.toLocaleString()} pt</p>
              {isPlanner && !quotation.isApproved && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-yellow-800 mb-2">集まったポイント ({project.collectedAmount.toLocaleString()} pt) から上記合計額が支払われます。</p>
                  <button onClick={() => handleApproveQuotation(quotation.id)} className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600">この内容で承認・支払い確定</button>
                </div>
              )}
              {quotation.isApproved && <p className="text-center font-bold text-green-600 mt-4">✓ 承認済み</p>}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderType === userType ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${msg.senderType === userType ? 'bg-sky-500 text-white' : 'bg-white text-gray-800'}`}>
                {msg.isAutoResponse && <p className="text-xs font-bold mb-1 opacity-80">🤖 AIからの自動応答</p>}
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-white p-4 border-t flex flex-col gap-2">
          {/* ★★★ エラーメッセージの表示UIを追加 ★★★ */}
          {chatError && (
            <div className="w-full p-2 text-sm text-red-700 bg-red-100 rounded-lg text-center">
              {chatError}
            </div>
          )}
          <div className="flex items-center gap-2 w-full">
            {userType === 'FLORIST' && !quotation && (
              <button onClick={() => setIsModalOpen(true)} title="見積書を作成" className="p-3 bg-yellow-400 text-white rounded-full hover:bg-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </button>
            )}
            <form onSubmit={handleSendMessage} className="flex-grow flex gap-2">
              <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="メッセージを入力..." className="flex-1 px-4 py-2 border rounded-full text-gray-900"/>
              <button type="submit" className="px-6 py-2 bg-sky-500 text-white font-semibold rounded-full hover:bg-sky-600">送信</button>
            </form>
          </div>
        </footer>
      </div>
      {isModalOpen && <QuotationModal project={project} onClose={() => setIsModalOpen(false)} onQuotationSubmitted={fetchChatData} />}
    </>
  );
}