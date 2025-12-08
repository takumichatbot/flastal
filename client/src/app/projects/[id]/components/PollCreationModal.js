'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext'; // ★ useAuthをインポート
import toast from 'react-hot-toast';

// ★ API_URLを修正
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function PollCreationModal({ projectId, onClose, onPollCreated }) {
  const { user } = useAuth(); // ★ user を取得
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('アンケートの作成にはログインが必要です。');
      return;
    }
    if (!question.trim() || options.some(o => o.trim() === '')) {
      toast.error('質問と全ての選択肢を入力してください。');
      return;
    }
    
    // ★★★ 修正: token削除, userId追加 ★★★
    const promise = fetch(`${API_URL}/api/group-chat/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: projectId, // ★ parseIntを削除
        userId: user.id, // ★ ユーザーIDを追加
        question,
        options: options.filter(o => o.trim() !== ''),
      }),
    }).then(async res => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'アンケートの作成に失敗しました。');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '作成中...',
      success: () => {
        onPollCreated();
        onClose();
        return 'アンケートを作成しました！';
      },
      error: (err) => err.message,
    });
  };

  // --- JSX (変更なし) ---
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