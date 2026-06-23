'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ImagePlus, Globe, Lock, ChevronLeft,
  Camera, Tag, User2, FileText, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const CAPTION_MAX = 300;

// Upload progress via XHR
function uploadToS3(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`S3 ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('network error'));
    xhr.send(file);
  });
}

export default function UploadForm({ onUploadSuccess }) {
  const { user, authenticatedFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // form fields
  const [eventName, setEventName] = useState('');
  const [caption, setCaption] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) return toast.error('画像ファイルを選択してください');
    if (selectedFile.size > 10 * 1024 * 1024) return toast.error('ファイルサイズは10MB以下にしてください');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep(2);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setEventName('');
    setCaption('');
    setRecipientName('');
    setIsPublic(true);
    setUploadProgress(0);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!user) return toast.error('ログインが必要です');
    if (!file) return toast.error('画像を選択してください');
    if (!eventName.trim()) return toast.error('イベント名を入力してください');

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const presignRes = await authenticatedFetch('/api/tools/s3-upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!presignRes.ok) throw new Error('署名取得失敗');
      const { uploadUrl, fileUrl } = await presignRes.json();

      // 2. Upload to S3 with progress
      await uploadToS3(uploadUrl, file, setUploadProgress);

      // 3. Save to DB
      const saveRes = await authenticatedFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          eventName: eventName.trim(),
          caption: caption.trim() || null,
          senderName: recipientName.trim() || null,
          imageUrl: fileUrl,
          isPublic,
        }),
      });
      if (!saveRes.ok) throw new Error('保存失敗');

      toast.success('投稿しました！');
      reset();
      onUploadSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('エラーが発生しました。もう一度お試しください');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <Camera size={32} className="text-pink-200 mx-auto mb-3" />
        <p className="text-slate-500 font-bold text-sm">ログインすると写真を投稿できます</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">

      {/* ── STEP 1: 画像選択 ── */}
      {step === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="p-5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0])}
          />

          {/* drag & drop zone */}
          <div
            onClick={() => fileInputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 h-56 ${
              isDragging
                ? 'border-pink-400 bg-pink-50 scale-[0.99]'
                : 'border-pink-200 hover:border-pink-400 hover:bg-pink-50/40 active:scale-[0.98]'
            }`}
          >
            <motion.div
              animate={isDragging ? { scale: 1.15 } : { scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
            >
              <ImagePlus size={28} className="text-pink-500" />
            </motion.div>
            <p className="text-base font-black text-slate-700">{isDragging ? 'ここに放す' : '写真を選ぶ'}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">タップまたはドラッグ＆ドロップ</p>
            <p className="text-[10px] text-slate-300 mt-3 font-bold uppercase tracking-wider">JPG · PNG · WEBP · 最大 10MB</p>
          </div>

          {/* quick tips */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { emoji: '📸', label: 'フラスタ全体' },
              { emoji: '🌸', label: 'お花のアップ' },
              { emoji: '✨', label: '設置シーン' },
            ].map(({ emoji, label }) => (
              <div key={label} className="bg-slate-50 rounded-2xl py-3 text-center">
                <p className="text-xl mb-1">{emoji}</p>
                <p className="text-[10px] font-black text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── STEP 2: 詳細入力 ── */}
      {step === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* full-width preview */}
          <div className="relative aspect-square bg-slate-100 w-full">
            {previewUrl && (
              <Image src={previewUrl} alt="preview" fill className="object-cover" />
            )}
            {/* back to step 1 */}
            <button
              type="button"
              onClick={reset}
              className="absolute top-3 left-3 w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            {/* retake */}
            <button
              type="button"
              onClick={() => { fileInputRef.current.click(); }}
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          {/* form */}
          <div className="p-5 space-y-3">

            {/* event name */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                <Tag size={11} />イベント名 <span className="text-pink-500">*</span>
              </label>
              <div className="relative rounded-2xl border-2 border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.08)] transition-all">
                <input
                  type="text"
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                  placeholder="例: Summer Live 2025 東京公演"
                  className="w-full px-4 py-3 bg-transparent outline-none text-[16px] font-bold text-slate-800 placeholder:text-slate-300 rounded-2xl"
                  maxLength={100}
                />
              </div>
            </div>

            {/* recipient */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                <User2 size={11} />贈り先・ボード記載名 <span className="text-slate-300 font-medium normal-case tracking-normal">(任意)</span>
              </label>
              <div className="relative rounded-2xl border-2 border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.08)] transition-all">
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="例: ○○さんへ / ファン有志一同"
                  className="w-full px-4 py-3 bg-transparent outline-none text-[16px] font-medium text-slate-800 placeholder:text-slate-300 rounded-2xl"
                  maxLength={50}
                />
              </div>
            </div>

            {/* caption */}
            <div>
              <div className="flex items-center justify-between mb-1.5 mx-1">
                <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <FileText size={11} />キャプション <span className="text-slate-300 font-medium normal-case tracking-normal">(任意)</span>
                </label>
                <span className={`text-[10px] font-black ${caption.length > CAPTION_MAX * 0.9 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {caption.length}/{CAPTION_MAX}
                </span>
              </div>
              <div className="relative rounded-2xl border-2 border-transparent bg-slate-50 focus-within:border-pink-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(244,114,182,0.08)] transition-all">
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value.slice(0, CAPTION_MAX))}
                  placeholder="想いやエピソードを書こう..."
                  rows={3}
                  className="w-full px-4 py-3 bg-transparent outline-none text-[16px] text-slate-700 placeholder:text-slate-300 rounded-2xl resize-none leading-relaxed"
                />
              </div>
              {caption.length >= CAPTION_MAX && (
                <p className="text-[10px] text-rose-400 font-bold mt-1 ml-1">{CAPTION_MAX}文字の上限に達しました</p>
              )}
            </div>

            {/* public toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                {isPublic ? <Globe size={16} className="text-pink-500" /> : <Lock size={16} className="text-slate-400" />}
                <div>
                  <p className="text-sm font-black text-slate-700">{isPublic ? '全員に公開' : '自分のみ'}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isPublic ? 'みんなのフィードに表示されます' : 'あなたのアルバムにのみ表示'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${isPublic ? 'bg-pink-500' : 'bg-slate-200'}`}
              >
                <motion.div
                  animate={{ x: isPublic ? 24 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            {/* upload progress */}
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-pink-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black text-pink-700">
                        {uploadProgress < 100 ? 'アップロード中...' : '保存中...'}
                      </p>
                      <p className="text-xs font-black text-pink-500">{uploadProgress}%</p>
                    </div>
                    <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !eventName.trim()}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-base shadow-lg shadow-pink-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  投稿中...
                </div>
              ) : (
                <>
                  <Check size={18} strokeWidth={3} />
                  投稿する
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
