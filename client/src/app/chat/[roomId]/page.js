'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext'; // Using the main user context
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import Link from 'next/link';
import toast from 'react-hot-toast'; // Import toast

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com'; // Correct URL

// --- Quotation Modal Component ---
function QuotationModal({ project, floristUser, onClose, onQuotationSubmitted }) {
  // Removed useAuth here, assume florist user is passed as prop
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
     if (!floristUser) {
        toast.error("お花屋さん情報が見つかりません。");
        return;
    }
    setIsSubmitting(true);

    const validItems = items.filter(item => item.itemName && item.amount && !isNaN(parseInt(item.amount, 10)));
    if (validItems.length === 0) {
        toast.error("有効な項目を1つ以上入力してください。");
        setIsSubmitting(false);
        return;
    }

    // ★★★ Corrected API call: No token, added floristId ★★★
    const promise = fetch(`${API_URL}/api/quotations`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: project.id, // Ensure this is the correct project ID
        items: validItems,
        floristId: floristUser.id, // Send florist ID
      }),
    }).then(async (res) => { // Added async
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '見積書の作成に失敗しました。');
      }
      return res.json(); // Return data
    });

    toast.promise(promise, {
        loading: '見積書を送信中...',
        success: () => {
            onQuotationSubmitted(); 
            onClose();
            return '見積書を送信しました。';
        },
        error: (err) => err.message,
        finally: () => {
            setIsSubmitting(false);
        }
    });
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


// --- Chat Page Component ---
export default function ChatPage() {
  const params = useParams();
  const { roomId } = params;
  const { user } = useAuth(); // Using main AuthContext for user info
  const router = useRouter(); // Initialize router

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // For quotation modal
  const [chatError, setChatError] = useState('');
  const [loggedInFlorist, setLoggedInFlorist] = useState(null); // State for florist login

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Determine user type based on localStorage or AuthContext
  const getCurrentEntityType = () => {
      if (user) return 'USER';
      if (localStorage.getItem('flastal-florist')) return 'FLORIST';
      return null;
  };
  const entityType = getCurrentEntityType();

  // Function to fetch chat data
  const fetchChatData = async () => {
    if (!roomId) return;
    try {
      setLoading(true); // Ensure loading is true at the start
      // ★★★ Corrected API call: No token needed in header ★★★
      const res = await fetch(`${API_URL}/api/chat/${roomId}`); 
      if (!res.ok) throw new Error('チャットルームの読み込みに失敗しました。');
      const data = await res.json();
      setRoomInfo(data);
      setMessages(data.messages || []); // Ensure messages is an array
    } catch (error) {
      toast.error(error.message); // Use toast
      setRoomInfo(null); // Reset room info on error
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect for fetching data and setting up WebSocket
  useEffect(() => {
    if (!roomId) return;

    // Check localStorage for florist login info
     const storedFlorist = localStorage.getItem('flastal-florist');
     if (storedFlorist) {
         try {
             setLoggedInFlorist(JSON.parse(storedFlorist));
         } catch(e) { /* ignore parse error */ }
     }
    
    // Check if either a regular user or a florist is logged in
    const currentUser = user || loggedInFlorist; 
    if (!currentUser) {
        // If neither is logged in after checks, redirect
        if (!loading) { // Avoid redirect during initial loading
             toast.error("ログインが必要です。");
             router.push('/login'); // Redirect to general login
        }
        return; 
    }

    fetchChatData(); // Fetch initial data

    // ★★★ Corrected WebSocket connection: No token auth ★★★
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.emit('joinRoom', roomId); // Use the correct event name 'joinRoom'

    newSocket.on('receiveMessage', (newMessage) => { // Use correct event 'receiveMessage'
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    newSocket.on('messageError', (errorMessage) => {
      setChatError(errorMessage); 
      setTimeout(() => setChatError(''), 5000);
    });

    newSocket.on('floristMessageDeleted', ({ messageId }) => { // Assuming event name is correct
      setMessages(prevMessages => prevMessages.filter(m => m.id !== messageId));
    });

    return () => {
      newSocket.off('receiveMessage');
      newSocket.off('messageError');
      newSocket.off('floristMessageDeleted');
      newSocket.disconnect();
    };
  }, [roomId, user, loading, router]); // Add loading and router to dependencies

  const handleSendMessage = (e) => {
    e.preventDefault();
    const currentUser = user || loggedInFlorist; // Get the currently logged in entity
    const currentEntityType = user ? 'USER' : (loggedInFlorist ? 'FLORIST' : null);

    if (currentMessage.trim() && currentUser && currentEntityType && socket) {
      setChatError('');
      // ★★★ Corrected 'sendMessage' payload ★★★
      socket.emit('sendMessage', {
        roomId: roomId,
        content: currentMessage,
        senderType: currentEntityType, // 'USER' or 'FLORIST'
        userId: currentEntityType === 'USER' ? currentUser.id : null,
        floristId: currentEntityType === 'FLORIST' ? currentUser.id : null,
      });
      setCurrentMessage('');
    } else if (!currentUser || !currentEntityType) {
        toast.error("メッセージ送信にはログインが必要です。");
    }
  };

  const handleApproveQuotation = async (quotationId) => {
    if (!user) { // Only regular users (planners) can approve
        toast.error("見積書の承認には企画者としてログインが必要です。");
        return;
    }
    if (window.confirm("この見積書の内容で支払いを確定します。集まったポイントから合計額が引き落とされます。よろしいですか？")) {
      // ★★★ Corrected API call: No token, added userId ★★★
      const promise = fetch(`${API_URL}/api/quotations/${quotationId}/approve`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }) // Send userId in body
      }).then(async (res) => { // Added async
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        return res.json(); // Return data
      });

      toast.promise(promise, {
          loading: '処理中...',
          success: () => {
              fetchChatData(); // Refresh data
              return '見積書を承認し、支払いが完了しました！';
          },
          error: (err) => err.message,
      });
    }
  };

  // Determine current user/entity type again for rendering logic
  const currentEntityTypeRender = user ? 'USER' : (loggedInFlorist ? 'FLORIST' : null);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <p>チャットを読み込んでいます...</p>
          </div>
      );
  }

   // If loading is finished but still no user/florist AND no roomInfo, show login prompt
   if (!user && !loggedInFlorist && !roomInfo) {
       return (
         <div className="text-center p-10 flex flex-col items-center justify-center min-h-screen">
           <p className="mb-4">このページにアクセスするにはログインが必要です。</p>
           <div className="flex gap-4">
             <Link href="/login"><span className="text-sky-500 hover:underline bg-sky-100 px-4 py-2 rounded">ファンとしてログイン</span></Link>
             <Link href="/florists/login"><span className="text-pink-500 hover:underline bg-pink-100 px-4 py-2 rounded">お花屋さんとしてログイン</span></Link>
           </div>
         </div>
       );
   }

  if (!roomInfo || !roomInfo.offer || !roomInfo.offer.project) {
    return <p className="text-center p-10 text-red-600">チャットルーム情報が見つかりません。</p>;
  }

  const project = roomInfo.offer.project;
  const florist = roomInfo.offer.florist;
  const planner = project.planner;
  
  // Determine chat partner name based on current user type
  const chatPartnerName = currentEntityTypeRender === 'USER' 
      ? florist?.platformName || 'お花屋さん' 
      : planner?.handleName || '企画者';
      
  const isPlanner = currentEntityTypeRender === 'USER' && user?.id === planner?.id;
  const quotation = project.quotation; // Assuming quotation is directly on project

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="bg-white shadow-sm p-4 text-center sticky top-0 z-10 border-b">
          <p className="text-sm text-gray-500">企画名: 
            <Link href={`/projects/${project.id}`} className="text-sky-600 hover:underline ml-1">
                {project.title || '不明な企画'}
            </Link>
          </p>
          <h1 className="text-xl font-bold text-gray-800">{chatPartnerName}さんとのチャット</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
          {quotation && (
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg my-4 text-gray-800 shadow">
              <h3 className="font-bold text-yellow-800 text-center text-lg">見積書</h3>
              <ul className="list-disc list-inside my-3 text-yellow-900 pl-4 space-y-1">
                {(quotation.items || []).map(item => <li key={item.id}>{item.itemName}: {item.amount?.toLocaleString() || 0} pt</li>)}
              </ul>
              <p className="font-bold text-right border-t border-yellow-300 pt-2 text-lg">合計: {quotation.totalAmount?.toLocaleString() || 0} pt</p>
              {isPlanner && !quotation.isApproved && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-yellow-800 mb-2">集まったポイント ({project.collectedAmount?.toLocaleString() || 0} pt) から上記合計額が支払われます。</p>
                  <button 
                    onClick={() => handleApproveQuotation(quotation.id)} 
                    disabled={project.collectedAmount < quotation.totalAmount}
                    className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {project.collectedAmount < quotation.totalAmount ? 'ポイント不足' : '承認・支払い確定'}
                  </button>
                </div>
              )}
              {quotation.isApproved && <p className="text-center font-bold text-green-600 mt-4 text-lg">✓ 承認済み</p>}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderType === currentEntityTypeRender ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${msg.senderType === currentEntityTypeRender ? 'bg-sky-500 text-white' : 'bg-white text-gray-800'}`}>
                {msg.isAutoResponse && <p className="text-xs font-bold mb-1 opacity-80">🤖 AIからの自動応答</p>}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                 <p className="text-xs mt-1 text-right opacity-70">{new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          {/* Dummy div to scroll to */}
          <div ref={messagesEndRef} style={{ height: '1px' }}></div> 
        </main>

        <footer className="bg-white p-4 border-t flex flex-col gap-2 sticky bottom-0">
          {chatError && (
            <div className="w-full p-2 text-sm text-red-700 bg-red-100 rounded-lg text-center animate-pulse">
              {chatError}
            </div>
          )}
          <div className="flex items-center gap-2 w-full">
            {/* Show quotation button only if logged in as florist AND no quotation exists/is approved */}
            {currentEntityTypeRender === 'FLORIST' && (!quotation || !quotation.isApproved) && ( 
              <button onClick={() => setIsModalOpen(true)} title="見積書を作成" className="p-3 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </button>
            )}
            <form onSubmit={handleSendMessage} className="flex-grow flex gap-2">
              <input 
                type="text" 
                value={currentMessage} 
                onChange={(e) => setCurrentMessage(e.target.value)} 
                placeholder="メッセージを入力..." 
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full text-gray-900 focus:border-sky-500 focus:ring-0 transition"
                disabled={!socket || (!user && !loggedInFlorist)} // Disable if not connected or logged in
              />
              <button 
                type="submit" 
                className="px-6 py-2 bg-sky-500 text-white font-semibold rounded-full hover:bg-sky-600 transition-colors disabled:bg-gray-400"
                disabled={!socket || !currentMessage.trim() || (!user && !loggedInFlorist)} // Also disable if no message
              >
                送信
              </button>
            </form>
          </div>
        </footer>
      </div>
      {/* Pass loggedInFlorist to the modal */}
      {isModalOpen && <QuotationModal project={project} floristUser={loggedInFlorist} onClose={() => setIsModalOpen(false)} onQuotationSubmitted={fetchChatData} />} 
    </>
  );
}