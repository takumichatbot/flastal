'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ImageModal from '../../components/ImageModal';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

// ★★★ 寄せ書きメッセージ投稿フォームの部品 ★★★
function MessageForm({ projectId, userId, onMessagePosted }) {
  const [content, setContent] = useState('');
  const [cardName, setCardName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !cardName.trim()) {
      alert('印刷するお名前とメッセージの両方を入力してください。');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, cardName, projectId, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('メッセージを投稿しました！ご参加ありがとうございます！');
      onMessagePosted();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">カードに印刷するお名前</label>
        <input
          id="cardName"
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          required
          className="w-full mt-1 p-2 border rounded-md text-gray-900"
          placeholder="例：〇〇企画有志一同、田中太郎"
        />
      </div>
      <div>
        <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700">お祝いメッセージ (50字程度推奨)</label>
        <textarea
          id="messageContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows="4"
          className="w-full mt-1 p-2 border rounded-md text-gray-900"
          placeholder="例：ご出演おめでとうございます！"
        ></textarea>
      </div>
      <button type="submit" className="w-full p-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600">
        この内容でメッセージを投稿する
      </button>
    </form>
  );
}

// ★★★ アンケート作成モーダル ★★★
function PollCreationModal({ projectId, userId, onClose, onPollCreated }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (question.trim() === '' || options.some(o => o.trim() === '')) {
      alert('質問と全ての選択肢を入力してください。');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/group-chat/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          question,
          options: options.filter(o => o.trim() !== ''),
        }),
      });
      if (!res.ok) throw new Error('アンケートの作成に失敗しました。');
      alert('アンケートを作成しました！');
      onPollCreated();
      onClose();
    } catch (error) { alert(`エラー: ${error.message}`); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">アンケートを作成</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">質問</label>
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} required className="w-full mt-1 p-2 border rounded-md text-gray-900"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">選択肢</label>
              {options.map((option, index) => (
                <input key={index} type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} required placeholder={`選択肢 ${index + 1}`} className="w-full mt-1 p-2 border rounded-md text-gray-900"/>
              ))}
              {options.length < 5 && <button type="button" onClick={addOption} className="text-sm text-sky-600 hover:underline mt-2">+ 選択肢を追加</button>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">閉じる</button>
            <button type="submit" className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600">作成する</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ★★★ グループチャットとアンケート機能を持つコンポーネント ★★★
function GroupChat({ project, user, isPlanner, isPledger, onUpdate, socket }) {
  const [templates, setTemplates] = useState([]);
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  
  const [customInputModal, setCustomInputModal] = useState({
    isOpen: false,
    template: null,
    text: '',
  });

  const [freeText, setFreeText] = useState('');

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

  const formatMessage = (msg) => {
    if (!msg.templateId && msg.content) {
      return msg.content;
    }
    const template = templates.find(t => t.id === msg.templateId);
    if (!template) return '不明なメッセージ';
    if (template.hasCustomInput && msg.content) {
      return template.text.replace('...', `"${msg.content}"`);
    }
    return template.text;
  };

  const templatesByCategory = templates.reduce((acc, t) => {
    acc[t.category] = [...(acc[t.category] || []), t];
    return acc;
  }, {});
  
  const handleTemplateClick = (template) => {
    if (template.hasCustomInput) {
      setCustomInputModal({ isOpen: true, template: template, text: '' });
    } else {
      handleSendMessage(template.id, null);
    }
  };
  
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInputModal.template && customInputModal.text.trim()) {
      handleSendMessage(customInputModal.template.id, customInputModal.text);
      setCustomInputModal({ isOpen: false, template: null, text: '' });
    }
  };

  const handleFreeTextSubmit = (e) => {
    e.preventDefault();
    if (freeText.trim()) {
      handleSendMessage(null, freeText);
      setFreeText('');
    }
  };

  const handleSendMessage = (templateId, content) => {
    if (!socket) {
      alert('チャットサーバーに接続していません。');
      return;
    }
    socket.emit('sendGroupChatMessage', {
      projectId: project.id,
      userId: user.id,
      templateId,
      content
    });
  };
  
  const handleVote = async (optionIndex) => {
    if (!project.activePoll) return;
    try {
      const res = await fetch(`${API_URL}/api/group-chat/polls/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: project.activePoll.id, userId: user.id, optionIndex }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      onUpdate();
    } catch (error) { alert(`エラー: ${error.message}`); }
  };
  
  const activePoll = project.activePoll;
  const userVote = activePoll?.votes.find(v => v.userId === user.id);
  const totalVotes = activePoll?.votes.length || 0;

  return (
    <>
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-orange-800 mb-2">参加者グループチャット</h3>
        
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
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-purple-400 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleVote(index)} 
                        disabled={!isPledger}
                        className="w-full text-left p-2 border rounded-md text-gray-800 hover:bg-purple-100 disabled:bg-gray-100 disabled:cursor-not-allowed">
                        {option}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
             {!userVote && !isPledger && <p className="text-xs text-red-500 mt-2">※アンケートへの投票は、この企画の支援者のみ可能です。</p>}
          </div>
        )}

        <div className="h-64 overflow-y-auto bg-white rounded-lg p-3 space-y-3 mb-4 border">
          {(project.groupChatMessages || []).length > 0 ? (
            (project.groupChatMessages || []).map(msg => (
              <div key={msg.id}>
                <p className="text-xs text-gray-500">{msg.user.handleName}</p>
                <div className={`inline-block rounded-lg px-3 py-1 mt-1 ${!msg.templateId ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{formatMessage(msg)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center pt-4">まだメッセージはありません。</p>
          )}
        </div>

        <div>
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category} className="mb-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">{category}</p>
              <div className="flex flex-wrap gap-2">
                {templates.map(template => (
                  <button key={template.id} onClick={() => handleTemplateClick(template)} className="px-3 py-1 text-sm bg-white border text-gray-800 rounded-full hover:bg-orange-200 transition-colors">
                    {template.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="border-t mt-4 pt-3">
             <p className="text-xs font-semibold text-gray-600 mb-1">その他 (自由記述)</p>
             <form onSubmit={handleFreeTextSubmit} className="flex gap-2">
               <input
                 type="text"
                 value={freeText}
                 onChange={(e) => setFreeText(e.target.value)}
                 placeholder="メッセージを入力..."
                 className="p-2 border rounded-md text-gray-900 flex-grow"
               />
               <button type="submit" className="p-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">送信</button>
             </form>
          </div>
          
          {isPlanner && (
            <button onClick={() => setPollModalOpen(true)} className="w-full mt-4 p-2 text-sm font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              💡 新しいアンケートを作成する
            </button>
          )}
        </div>
      </div>
      
      {customInputModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <form onSubmit={handleCustomSubmit}>
              <p className="text-sm text-gray-600">テンプレート:</p>
              <p className="mb-4 font-semibold text-lg">{customInputModal.template.text.replace('...', `「${customInputModal.text || '...'}」`)}</p>
              <input
                type="text"
                value={customInputModal.text}
                onChange={(e) => setCustomInputModal({ ...customInputModal, text: e.target.value })}
                placeholder={customInputModal.template.placeholder}
                required
                autoFocus
                className="w-full mt-1 p-2 border rounded-md text-gray-900"
              />
              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setCustomInputModal({ isOpen: false, template: null, text: '' })} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">閉じる</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600">送信する</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isPollModalOpen && <PollCreationModal projectId={project.id} userId={user.id} onClose={() => setPollModalOpen(false)} onPollCreated={onUpdate} />}
    </>
  );
}

// ★★★【新規】完成報告フォームのモーダル ★★★
function CompletionReportModal({ project, userId, onClose, onReportSubmitted }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error('アップロードに失敗しました');
        uploadedUrls.push(data.url);
      } catch (error) {
        alert(`エラー: ${error.message}`);
        setIsUploading(false);
        return;
      }
    }
    setImageUrls(prev => [...prev, ...uploadedUrls]);
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageUrls.length === 0) {
      alert('少なくとも1枚は写真をアップロードしてください。');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          completionImageUrls: imageUrls,
          completionComment: comment,
        }),
      });
      if (!res.ok) throw new Error('完了報告の投稿に失敗しました。');
      alert('企画の完了報告を投稿しました！参加者の皆様、お疲れ様でした！');
      onReportSubmitted();
      onClose();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">🎉 企画完了報告</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">完成写真のアップロード</label>
              <div className="mt-2 p-4 border-2 border-dashed rounded-lg">
                <div className="flex flex-wrap gap-4">
                  {imageUrls.map((url, index) => (
                    <img key={index} src={url} className="h-24 w-24 object-cover rounded-md" alt={`Uploaded image ${index + 1}`} />
                  ))}
                  {isUploading && <div className="h-24 w-24 flex items-center justify-center bg-gray-100 rounded-md">...</div>}
                </div>
                <button type="button" onClick={() => fileInputRef.current.click()} className="mt-4 px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200">
                  {isUploading ? 'アップロード中...' : '画像を選択'}
                </button>
                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              </div>
            </div>
            <div>
              <label htmlFor="completion-comment" className="block text-sm font-medium text-gray-700">参加者へのメッセージ</label>
              <textarea
                id="completion-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full mt-1 p-2 border rounded-md text-gray-900"
                placeholder="企画へのご参加ありがとうございました！皆様のおかげで、最高のフラスタを贈ることができました。"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
            <button type="submit" disabled={isUploading || isSubmitting} className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-gray-400">
              {isSubmitting ? '投稿中...' : '完了を報告する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ★★★ 企画通報モーダル ★★★
function ReportModal({ projectId, reporterId, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { key: 'SPAM', text: 'スパムや詐欺、誤解を招く内容' },
    { key: 'INAPPROPRIATE', text: '不適切なコンテンツ（暴力的、差別的など）' },
    { key: 'COPYRIGHT', text: '著作権やその他の権利の侵害' },
    { key: 'OTHER', text: 'その他' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert('通報理由を選択してください。');
      return;
    }
    if (reason === 'OTHER' && !details.trim()) {
      alert('「その他」を選択した場合は、詳細を記入してください。');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reporterId, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(data.message);
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
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">この企画の問題を報告</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-sm">通報理由を選択してください</p>
              {reportReasons.map((r) => (
                <div key={r.key} className="flex items-center">
                  <input
                    type="radio"
                    id={`reason-${r.key}`}
                    name="reason"
                    value={r.key}
                    checked={reason === r.key}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-4 w-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                  />
                  <label htmlFor={`reason-${r.key}`} className="ml-3 block text-sm text-gray-900">{r.text}</label>
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">詳細 (任意)</label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows="3"
                className="w-full mt-1 p-2 border rounded-md text-gray-900"
                placeholder="問題のある箇所など、具体的な情報をご記入ください。"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">キャンセル</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 font-bold text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-gray-400">
              {isSubmitting ? '送信中...' : '報告する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ★★★ 企画詳細ページの本体 ★★★
export default function ProjectDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [chatError, setChatError] = useState('');
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [comment, setComment] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchProject = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}`);
      if (!response.ok) throw new Error('企画の読み込みに失敗しました。');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    fetchProject();

    const newSocket = io(`${API_URL}`);
    setSocket(newSocket);
    
    newSocket.emit('joinProjectRoom', id);

    newSocket.on('receiveGroupChatMessage', (newMessage) => {
      setProject(prevProject => {
        if (!prevProject) return null;
        const newMessages = [...prevProject.groupChatMessages, newMessage];
        return {
          ...prevProject,
          groupChatMessages: newMessages
        };
      });
    });

    newSocket.on('messageError', (errorMessage) => {
      setChatError(errorMessage);
      setTimeout(() => setChatError(''), 5000);
    });

    return () => {
      newSocket.off('receiveGroupChatMessage');
      newSocket.off('messageError');
      newSocket.disconnect();
    };
  }, [id, user]);

  const handlePledgeSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('支援するにはログインが必要です。');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          userId: user.id,
          amount: pledgeAmount,
          comment: comment,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('支援ありがとうございます！');
      setPledgeAmount('');
      setComment('');
      fetchProject();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle,
          content: announcementContent,
          projectId: id,
          userId: user.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('お知らせを投稿しました！');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setShowAnnouncementForm(false);
      fetchProject();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: expenseName,
          amount: expenseAmount,
          projectId: id,
          userId: user.id,
        }),
      });
      if (!res.ok) throw new Error('支出の追加に失敗しました。');
      alert('支出項目を追加しました。');
      setExpenseName('');
      setExpenseAmount('');
      fetchProject();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('この支出項目を削除しますか？')) {
      try {
        const res = await fetch(`${API_URL}/api/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!res.ok) throw new Error('支出の削除に失敗しました。');
        alert('支出項目を削除しました。');
        fetchProject();
      } catch (error) {
        alert(`エラー: ${error.message}`);
      }
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, projectId: id, userId: user.id }),
      });
      if (!res.ok) throw new Error('タスクの追加に失敗しました。');
      setNewTaskTitle('');
      fetchProject();
    } catch (error) { alert(`エラー: ${error.message}`); }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentStatus, userId: user.id }),
      });
      if (!res.ok) throw new Error('タスクの更新に失敗しました。');
      fetchProject();
    } catch (error) { alert(`エラー: ${error.message}`); }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('このタスクを削除しますか？')) {
      try {
        const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!res.ok) throw new Error('タスクの削除に失敗しました。');
        fetchProject();
      } catch (error) { alert(`エラー: ${error.message}`); }
    }
  };

  const handleCopyMessages = () => {
    if (!project || !project.messages || project.messages.length === 0) return;
    const textToCopy = project.messages
      .map(msg => `${msg.cardName}\n${msg.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => alert('全メッセージをクリップボードにコピーしました！'))
      .catch(err => alert('コピーに失敗しました。'));
  };
  
  const handleCancelProject = async () => {
    if (!window.confirm("本当にこの企画を中止しますか？\n集まったポイントはすべて支援者に返金され、この操作は元に戻せません。")) {
      return;
    }
    if (!window.confirm("最終確認です。参加者への説明は済みましたか？中止を実行します。")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(data.message);
      fetchProject();
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (loading) return <div className="text-center mt-10">読み込み中...</div>;
  if (!project) return <div className="text-center mt-10">企画が見つかりませんでした。</div>;

  const deliveryDate = new Date(project.deliveryDateTime).toLocaleString('ja-JP');
  const totalPledged = (project.pledges || []).reduce((sum, pledge) => sum + pledge.amount, 0);
  const progressPercentage = project.targetAmount > 0 ? (totalPledged / project.targetAmount) * 100 : 0;
  const pageUrl = `http://localhost:3000/projects/${id}`;
  const shareText = `【${project.title}】を支援しよう！ #FLASTAL`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
  const isPlanner = user && user.id === project.planner?.id;
  const isPledger = user && (project.pledges || []).some(p => p.userId === user.id);
  const totalExpense = (project.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = project.collectedAmount - totalExpense;
  const hasPostedMessage = user && (project.messages || []).some(msg => msg.userId === user.id);

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
            {project.status === 'COMPLETED' && project.completionImageUrls?.length > 0 && (
              <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-100">
                <h2 className="text-2xl font-bold text-center text-yellow-800 mb-4">🎉 企画完了報告 🎉</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {project.completionImageUrls.map((url, index) => (
                    <img 
                      key={index} 
                      src={url} 
                      alt={`完成写真 ${index + 1}`} 
                      className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
                {project.completionComment && (
                  <div className="mt-6 bg-white/70 backdrop-blur-sm p-4 rounded-lg">
                    <p className="font-semibold text-gray-800">企画者からのメッセージ:</p>
                    <p className="text-gray-700 whitespace-pre-wrap mt-2">{project.completionComment}</p>
                  </div>
                )}
              </div>
            )}
            
            {project.status !== 'COMPLETED' && project.imageUrl && (
              <div className="h-80 bg-gray-200 relative group cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-contain"/>
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/40 flex items-center justify-center transition-colors duration-300">
                    <svg className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                    project={project} 
                    user={user} 
                    isPlanner={isPlanner} 
                    isPledger={isPledger} 
                    onUpdate={fetchProject}
                    socket={socket} 
                  />
                  {chatError && <p className="text-center text-red-500 text-sm mt-2">{chatError}</p>}
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
                        <MessageForm projectId={id} userId={user.id} onMessagePosted={fetchProject} />
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
            <div className="mb-4">
              <span className={`px-3 py-1 text-sm font-bold text-white rounded-full 
                ${project.status === 'COMPLETED' ? 'bg-yellow-500' : 
                  project.status === 'SUCCESSFUL' ? 'bg-green-500' : 
                  project.status === 'CANCELED' ? 'bg-red-500' : 'bg-blue-500'}`}>
                {
                  {
                    'FUNDRAISING': '募集中',
                    'SUCCESSFUL': '🎉 達成！',
                    'COMPLETED': '💐 完了！',
                    'CANCELED': '中止'
                  }[project.status]
                }
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">支援状況</h2>
            <div>
              <p className="text-3xl font-bold text-blue-600">{totalPledged.toLocaleString()} pt</p>
              <p className="text-sm text-gray-500">目標: {project.targetAmount.toLocaleString()} pt</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
            </div>
            <p className="text-right font-bold">{Math.floor(progressPercentage)}%</p>
            
            {project.status === 'FUNDRAISING' ? (
              <>
                <div className="border-t my-6"></div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">この企画を支援する</h2>
                <form onSubmit={handlePledgeSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="pledgeAmount" className="block text-sm font-medium text-gray-700">支援ポイント</label>
                    <input type="number" id="pledgeAmount" value={pledgeAmount} onChange={(e) => setPledgeAmount(e.target.value)} required className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">応援コメント（任意）</label>
                    <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="3" className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"></textarea>
                  </div>
                  <button type="submit" className="w-full px-4 py-3 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600">
                    支援を確定する
                  </button>
                </form>
              </>
            ) : project.status === 'CANCELED' ? (
              <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
                <p className="font-bold">この企画は中止されました。</p>
                <p className="text-sm mt-1">ご支援いただいたポイントは、すべて返金済みです。</p>
              </div>
            ) : (
               <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
                 この企画は目標を達成しました！たくさんのご支援、ありがとうございました！
               </div>
            )}

            {isPlanner && project.status !== 'COMPLETED' && project.status !== 'CANCELED' && (
              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold text-gray-800 mb-2">企画の管理</h3>
                <p className="text-xs text-gray-500 mb-3">中止する際は、必ず事前にお知らせ機能で参加者に理由を説明してください。</p>
                <button 
                  onClick={handleCancelProject}
                  className="w-full px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  企画を中止する
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isImageModalOpen && <ImageModal src={project.imageUrl} onClose={() => setIsImageModalOpen(false)} />}
      {isReportModalOpen && <ReportModal projectId={project.id} reporterId={user.id} onClose={() => setReportModalOpen(false)} />}
      {isCompletionModalOpen && <CompletionReportModal project={project} userId={user.id} onClose={() => setIsCompletionModalOpen(false)} onReportSubmitted={fetchProject} />}
    </>
  );
}