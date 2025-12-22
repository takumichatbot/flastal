'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiX, FiPlus, FiTrash2, FiBarChart2, FiHelpCircle, FiLoader } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// トークン取得ヘルパー (セキュリティのため復活)
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const rawToken = localStorage.getItem('authToken');
  return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

export default function PollCreationModal({ projectId, onClose, onPollCreated }) {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  // 初期値は2つの空選択肢
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 選択肢の入力変更
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // 選択肢の追加
  const addOption = () => {
    if (options.length < 10) { // 最大10個まで
        setOptions([...options, '']);
    } else {
        toast.error('選択肢は最大10個までです');
    }
  };

  // 選択肢の削除
  const removeOption = (index) => {
    if (options.length <= 2) {
        return toast.error('選択肢は最低2つ必要です');
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です');

    // 空白除去 & バリデーション
    const validOptions = options.map(o => o.trim()).filter(o => o !== '');
    
    if (!question.trim()) return toast.error('質問を入力してください');
    if (validOptions.length < 2) return toast.error('有効な選択肢を2つ以上入力してください');

    setIsSubmitting(true);
    const token = getAuthToken();

    try {
        const res = await fetch(`${API_URL}/api/group-chat/polls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // トークン認証を使用
            },
            body: JSON.stringify({
                projectId: projectId,
                userId: user.id,
                question: question,
                options: validOptions,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || '作成に失敗しました');
        }

        toast.success('アンケートを作成しました！');
        onPollCreated();
        onClose();

    } catch (err) {
        console.error(err);
        toast.error(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ヘッダー */}
        <div className="bg-purple-50 p-5 border-b border-purple-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <FiBarChart2 className="text-xl"/> アンケートを作成
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white transition-colors">
                <FiX size={24}/>
            </button>
        </div>

        {/* フォームエリア (スクロール可能) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* 質問 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <FiHelpCircle className="text-purple-500"/> 質問内容 <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)} 
                required 
                placeholder="例：フラスタの色はどっちがいい？"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-bold text-gray-800"
              />
            </div>

            {/* 選択肢 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">選択肢 <span className="text-xs font-normal text-gray-500">(2つ以上)</span></label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold shrink-0">
                          {index + 1}
                      </div>
                      <input 
                        type="text" 
                        value={option} 
                        onChange={(e) => handleOptionChange(index, e.target.value)} 
                        placeholder={`選択肢 ${index + 1}`} 
                        className="flex-grow p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                        autoFocus={index === options.length - 1 && index > 1} // 新規追加時はフォーカス
                      />
                      {options.length > 2 && (
                          <button 
                            type="button" 
                            onClick={() => removeOption(index)}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="削除"
                          >
                              <FiTrash2 />
                          </button>
                      )}
                  </div>
                ))}
              </div>
              
              {options.length < 10 && (
                  <button 
                    type="button" 
                    onClick={addOption} 
                    className="mt-3 text-sm font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FiPlus /> 選択肢を追加
                  </button>
              )}
            </div>
          </div>
        </form>

        {/* フッター */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
                キャンセル
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2"
            >
                {isSubmitting ? <><FiLoader className="animate-spin"/> 作成中...</> : 'アンケートを作成'}
            </button>
        </div>

      </div>
    </div>
  );
}