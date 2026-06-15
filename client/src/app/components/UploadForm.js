'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, ImagePlus, Loader2, Send, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';


export default function UploadForm({ onUploadSuccess }) {
  const { user, authenticatedFetch } = useAuth();
  const [step, setStep] = useState(1); // 1: pick image, 2: fill details
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [eventName, setEventName] = useState('');
  const [caption, setCaption] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) return toast.error('画像ファイルを選択してください');
    if (selectedFile.size > 10 * 1024 * 1024) return toast.error('ファイルサイズは10MB以下にしてください');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep(2);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setEventName('');
    setCaption('');
    setIsPublic(true);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です');
    if (!file) return toast.error('画像を選択してください');
    if (!eventName.trim()) return toast.error('イベント名を入力してください');

    setIsSubmitting(true);
    const toastId = toast.loading('投稿中...');
    try {
      const presignRes = await authenticatedFetch('/api/tools/s3-upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!presignRes.ok) throw new Error('署名取得失敗');
      const { uploadUrl, fileUrl } = await presignRes.json();

      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });

      const saveRes = await authenticatedFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ eventName: eventName.trim(), caption: caption.trim(), imageUrl: fileUrl, isPublic }),
      });
      if (!saveRes.ok) throw new Error('保存失敗');

      toast.success('投稿しました！', { id: toastId });
      reset();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      toast.error('エラーが発生しました', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-400 font-bold text-sm">
        ログインすると写真を投稿できます
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === 1 ? (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
          <div
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-pink-200 rounded-3xl h-40 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center mb-2">
              <ImagePlus size={22} className="text-pink-400" />
            </div>
            <p className="text-sm font-black text-slate-600">写真を選ぶ</p>
            <p className="text-[11px] text-slate-400 mt-0.5">タップまたはドラッグ＆ドロップ</p>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="step2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {/* Preview + caption side by side on larger screens */}
          <div className="flex gap-3">
            <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
              {previewUrl && <Image src={previewUrl} alt="preview" fill className="object-cover" />}
              <button type="button" onClick={reset}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <div className="relative rounded-2xl border-2 border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  placeholder="イベント名 *"
                  className="w-full px-3 py-2.5 bg-transparent outline-none text-[16px] font-bold text-slate-800 placeholder:text-slate-300 rounded-2xl"
                />
              </div>
              <div className="relative rounded-2xl border-2 border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white transition-all">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="キャプション（任意）..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-transparent outline-none text-[16px] text-slate-700 placeholder:text-slate-300 rounded-2xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Public toggle */}
          <button type="button" onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
              isPublic ? 'bg-pink-50 text-pink-500' : 'bg-slate-100 text-slate-500'
            }`}>
            {isPublic ? <Globe size={14} /> : <Lock size={14} />}
            {isPublic ? '全員に公開' : '自分のみ'}
          </button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting || !eventName.trim()}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-sm shadow-md shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
            {isSubmitting ? '投稿中...' : '投稿する'}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
