"use client";
import { useState } from 'react';
import { FiCpu, FiLoader, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AiPlanGenerator({ onGenerated, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetName: '',
    eventName: '',
    tone: '情熱的・エモい', // デフォルト
    extraInfo: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!formData.targetName || !formData.eventName) {
      toast.error('推しの名前とイベント名は必須です');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('AIが最高のアピール文を考えています...');

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('生成に失敗しました');

      const data = await res.json();
      
      // 親コンポーネントにデータを渡す
      onGenerated(data.title, data.description);
      toast.success('文章が生成されました！', { id: toastId });
      onClose();

    } catch (error) {
      toast.error('エラーが発生しました', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border-t-4 border-purple-500">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FiCpu className="text-purple-500" /> AI アシスタント
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          キーワードを入れるだけで、AIが参加者を募るための魅力的なタイトルと説明文を自動作成します。
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">推しの名前 <span className="text-red-500">*</span></label>
            <input 
              name="targetName" 
              placeholder="例: 星野アイ" 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">イベント名 <span className="text-red-500">*</span></label>
            <input 
              name="eventName" 
              placeholder="例: 東京ドーム 卒業コンサート" 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">文章の雰囲気</label>
            <select 
              name="tone" 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={handleChange}
            >
              <option value="情熱的・エモい">🔥 情熱的・エモい (想いを伝える)</option>
              <option value="元気・ポップ">🎉 元気・ポップ (楽しく盛り上げる)</option>
              <option value="丁寧・フォーマル">👔 丁寧・フォーマル (大人っぽく)</option>
              <option value="面白い・ユニーク">🤣 面白い・ユニーク (目立ちたい)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">補足情報 (任意)</label>
            <textarea 
              name="extraInfo" 
              placeholder="例: イメージカラーは赤です。バルーンを使いたいです。" 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none h-20"
              onChange={handleChange}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><FiLoader className="animate-spin" /> 生成中...</> : <><FiCheck /> AIに書いてもらう</>}
          </button>
        </div>
      </div>
    </div>
  );
}