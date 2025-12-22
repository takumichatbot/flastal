'use client';

import { useState, useRef } from 'react';
import { getPresignedUrl, savePostToDb } from '../actions'; 
import { useAuth } from '../contexts/AuthContext';
import { FiUpload, FiX, FiImage, FiCheck, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function UploadForm({ onUploadSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [eventName, setEventName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ファイル選択時の処理
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // バリデーション: 画像のみ
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    // バリデーション: サイズ (10MB制限)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile);
  };

  // ドラッグ＆ドロップ処理
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  // 画像リセット
  const clearImage = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です');
    if (!file) return toast.error('画像を選択してください');

    setIsSubmitting(true);
    const toastId = toast.loading('投稿を準備中...');

    try {
      // 1. Presigned URL取得
      const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);

      // 2. S3へアップロード
      // toast.loading('画像をアップロード中...', { id: toastId });
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');

      // 3. DB保存
      // toast.loading('情報を保存中...', { id: toastId });
      await savePostToDb(
        { eventName, senderName }, 
        publicUrl, 
        user.email
      );

      toast.success('投稿が完了しました！', { id: toastId });
      
      // リセット
      clearImage();
      setEventName('');
      setSenderName('');
      
      // 親コンポーネントに通知（一覧更新など）
      if (onUploadSuccess) onUploadSuccess();

    } catch (error) {
      console.error(error);
      toast.error('エラーが発生しました。もう一度お試しください。', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center text-gray-500">
        ログインするとフラスタ画像を投稿できます。
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-pink-100 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <FiImage className="text-pink-500" /> フラスタ写真を投稿
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 画像アップロードエリア */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">お花の写真 <span className="text-red-500">*</span></label>
          
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`
                border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400 hover:bg-gray-50'}
              `}
            >
              <div className="bg-white p-3 rounded-full shadow-sm mb-2 text-pink-500">
                <FiUpload size={24} />
              </div>
              <p className="text-sm font-bold text-gray-600">クリック または ドラッグ＆ドロップ</p>
              <p className="text-xs text-gray-400 mt-1">最大 10MB (JPG, PNG)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
              {/* 画像プレビュー */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              
              {/* 削除ボタン */}
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
              >
                <FiX />
              </button>
            </div>
          )}
        </div>

        {/* 入力フィールド */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">イベント名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all"
              placeholder="例: Summer Live 2025 東京公演"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">贈り主名 (ボードの記載名)</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all"
              placeholder="例: ファン有志一同"
            />
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting || !file || !eventName}
          className={`
            w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all
            ${isSubmitting || !file || !eventName
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-pink-200 hover:-translate-y-0.5'}
          `}
        >
          {isSubmitting ? (
            <><FiLoader className="animate-spin" /> アップロード中...</>
          ) : (
            <><FiCheck /> 投稿する</>
          )}
        </button>
      </form>
    </div>
  );
}