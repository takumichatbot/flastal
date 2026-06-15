"use client";
import { useState, useEffect } from 'react';
import { Cpu, Loader2, Check, X, Star, Pencil, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// 雰囲気の選択肢定義
const TONE_OPTIONS = [
  { id: '情熱的・エモい', label: '🔥 情熱的', desc: '想いを熱く伝える' },
  { id: '元気・ポップ', label: '🎉 元気', desc: '明るく盛り上げる' },
  { id: '丁寧・フォーマル', label: '👔 丁寧', desc: '大人っぽく誠実に' },
  { id: '面白い・ユニーク', label: '🤣 ユニーク', desc: '個性を出して目立つ' },
];

// ローディング中のメッセージ
const LOADING_MESSAGES = [
  'キーワードを分析しています...',
  '魅力的なタイトルを考案中...',
  '説明文を構成しています...',
  '最後の仕上げをしています...',
];

export default function AiPlanGenerator({ onGenerated, onClose }) {
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    targetName: '',
    eventName: '',
    tone: '情熱的・エモい',
    extraInfo: ''
  });

  // ローディングメッセージのアニメーション
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
    } else {
      setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToneSelect = (toneId) => {
    setFormData({ ...formData, tone: toneId });
  };

  const handleGenerate = async () => {
    if (!formData.targetName || !formData.eventName) {
      toast.error('推しの名前とイベント名は必須です');
      return;
    }

    setLoading(true);

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
      
      onGenerated(data.title, data.description);
      toast.success('AIが文章を作成しました！', { icon: '🤖' });
      onClose();

    } catch (error) {
      console.error(error);
      toast.error('生成エラーが発生しました。時間を置いてお試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden border border-white/20">
        
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex justify-between items-center text-white">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="text-yellow-300" /> AI アシスタント
                </h3>
                <p className="text-xs text-indigo-100 mt-1 opacity-90">
                    キーワードから、人を惹きつける企画文を自動生成します。
                </p>
            </div>
            <button 
                onClick={onClose} 
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-0"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">推しの名前 <span className="text-red-500">*</span></label>
              <input 
                name="targetName" 
                placeholder="例: 星野アイ" 
                disabled={loading}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-gray-800 placeholder-gray-400"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">イベント名 <span className="text-red-500">*</span></label>
              <input 
                name="eventName" 
                placeholder="例: 東京ドーム 卒業ライブ" 
                disabled={loading}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-gray-800 placeholder-gray-400"
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 ml-1">文章の雰囲気</label>
            <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => handleToneSelect(t.id)}
                        disabled={loading}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                            formData.tone === t.id 
                            ? 'border-violet-500 bg-violet-50 text-violet-800 ring-1 ring-violet-500' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                        <div className="text-sm font-bold">{t.label}</div>
                        <div className="text-[10px] opacity-70">{t.desc}</div>
                        {formData.tone === t.id && (
                            <div className="absolute top-2 right-2 text-violet-500"><Check /></div>
                        )}
                    </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">補足情報 (任意)</label>
            <div className="relative">
                <textarea 
                name="extraInfo" 
                placeholder="AIに伝えたい要素があれば入力してください。&#13;&#10;例: イメージカラーは赤。バルーンスタンドにしたい。感動的にしてほしい。" 
                disabled={loading}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none h-24 text-sm resize-none placeholder-gray-400"
                onChange={handleChange}
                />
                <Pencil className="absolute bottom-3 right-3 text-gray-400 pointer-events-none"/>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !formData.targetName || !formData.eventName}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed group"
          >
            {loading ? (
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Loader2 className="animate-spin text-xl" />
                        <span>生成中...</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-90 animate-pulse">
                        {LOADING_MESSAGES[loadingMsgIndex]}
                    </span>
                </div>
            ) : (
                <>
                    <Cpu className="text-xl group-hover:rotate-12 transition-transform" /> 
                    AIに文章を考えてもらう
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}