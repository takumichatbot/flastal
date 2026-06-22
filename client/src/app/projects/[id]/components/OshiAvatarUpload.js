'use client';

import { useState, useRef } from 'react';
import { Camera, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OshiAvatarUpload({ projectId, onGenerated }) {
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!preview) return;
    setIsGenerating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`/api/tools/generate-ar-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, imageBase64: preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'アバター生成に失敗しました');
      toast.success('AR用アバターを生成しました！');
      onGenerated?.(data.avatarUrl);
    } catch (err) {
      toast.error(err.message || 'アバター生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-violet-500" />
        <h3 className="text-sm font-black text-violet-700">推しアバターをARに追加</h3>
      </div>
      <p className="text-[11px] text-violet-500 mb-3">
        推しの写真をアップロードして、ARフラスタに重ねて表示できます
      </p>

      {preview ? (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden mb-3">
          <img src={preview} alt="推し写真プレビュー" className="w-full h-full object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors"
            aria-label="プレビューを削除"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current.click()}
          className="w-full border-2 border-dashed border-violet-200 rounded-xl py-4 text-violet-400 text-xs font-bold flex flex-col items-center gap-1 hover:border-violet-400 hover:text-violet-500 transition-colors mb-3"
        >
          <Camera size={20} />
          写真を選ぶ
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {preview && (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 disabled:opacity-60 hover:brightness-105 transition-all active:scale-[0.98]"
        >
          {isGenerating ? (
            'AI生成中...'
          ) : (
            <>
              <Sparkles size={12} />
              ARアバターを生成
            </>
          )}
        </button>
      )}
    </div>
  );
}
