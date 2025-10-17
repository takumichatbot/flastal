'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PollCreationModal from './PollCreationModal'; // 同じフォルダ内のコンポーネントをインポート

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function GroupChat({ project, user, isPlanner, isPledger, onUpdate, socket }) {
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
    if (!msg.templateId && msg.content) return msg.content;
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
      toast.error('チャットサーバーに接続していません。');
      return;
    }
    socket.emit('sendGroupChatMessage', {
      projectId: project.id,
      templateId,
      content
    });
  };
  
  const handleVote = (optionIndex) => {
    if (!project.activePoll) return;
    const token = localStorage.getItem('accessToken');
    
    const promise = fetch(`${API_URL}/api/group-chat/polls/vote`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pollId: project.activePoll.id, optionIndex }),
    }).then(async res => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || '投票に失敗しました。');
      }
    });

    toast.promise(promise, {
      loading: '投票中...',
      success: () => { onUpdate(); return '投票しました！'; },
      error: (err) => err.message,
    });
  };
  
  const activePoll = project.activePoll;
  const userVote = activePoll?.votes.find(v => v.user_id === user.id);
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
                const voteCount = activePoll.votes.filter(v => v.option_index === index).length;
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const didUserVoteForThis = userVote?.option_index === index;
                return (
                  <div key={index}>
                    {userVote ? (
                      <div title={`${voteCount} / ${totalVotes} 票`}>
                        <div className="flex justify-between text-sm mb-1">
                          {/* ★★★ 変更点1 ★★★ */}
                          <span className={`font-semibold ${didUserVoteForThis ? 'text-purple-600' : 'text-gray-700'}`}>{option.text} {didUserVoteForThis ? ' (あなたが投票)' : ''}</span>
                          <span className="text-gray-500">{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-purple-400 h-4 rounded-full" style={{ width: `${percentage}%` }}></div></div>
                      </div>
                    ) : (
                      /* ★★★ 変更点2 ★★★ */
                      <button onClick={() => handleVote(index)} disabled={!isPledger} className="w-full text-left p-2 border rounded-md text-gray-800 hover:bg-purple-100 disabled:bg-gray-100 disabled:cursor-not-allowed">{option.text}</button>
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
            project.groupChatMessages.map(msg => (
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
                  <button key={template.id} onClick={() => handleTemplateClick(template)} className="px-3 py-1 text-sm bg-white border text-gray-800 rounded-full hover:bg-orange-200 transition-colors">{template.text}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t mt-4 pt-3">
             <p className="text-xs font-semibold text-gray-600 mb-1">その他 (自由記述)</p>
             <form onSubmit={handleFreeTextSubmit} className="flex gap-2">
               <input type="text" value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="メッセージを入力..." className="p-2 border rounded-md text-gray-900 flex-grow" />
               <button type="submit" className="p-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">送信</button>
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