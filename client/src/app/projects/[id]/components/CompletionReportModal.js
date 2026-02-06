'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiUpload, FiCheckCircle, FiAlertCircle, FiX, FiImage, FiInfo, FiDollarSign } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function CompletionReportModal({ project, user, onClose, onReportSubmitted }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [comment, setComment] = useState('');
  const [surplusUsageDescription, setSurplusUsageDescription] = useState(''); 
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // 収支計算
  const totalExpense = project.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const finalBalance = project.collectedAmount - totalExpense;

  // 画像アップロード処理
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    const toastId = toast.loading(`${files.length}枚の画像をアップロード中...`);
    
    try {
        const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, ''); // ★トークン取得を追加
        const uploadPromises = files.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            // ★headersにAuthorizationを追加
            const res = await fetch(`${API_URL}/api/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }, 
                body: formData 
            });
            if (!res.ok) throw new Error('アップロード失敗');
            return await res.json();
        });

        const results = await Promise.all(uploadPromises);
        const newUrls = results.map(r => r.url);
        
        setImageUrls(prev => [...prev, ...newUrls]);
        toast.success('アップロード完了！', { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error('一部の画像アップロードに失敗しました', { id: toastId });
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
      setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('ログインが必要です');
    if (imageUrls.length === 0) return toast.error('完成写真を少なくとも1枚アップロードしてください');
    
    // 余剰金がある場合のバリデーション
    if (finalBalance > 0 && !surplusUsageDescription.trim()) {
        return toast.error('余剰金が発生しています。「使い道」を入力してください。');
    }

    if (!window.confirm("この内容で完了報告を送信しますか？\n送信すると、支援者全員に通知が送られ、企画ステータスが「完了」になります。")) return;

    setIsSubmitting(true);
    const toastId = toast.loading('報告を送信中...');

    try {
        const res = await fetch(`${API_URL}/api/projects/${project.id}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                completionImageUrls: imageUrls,
                completionComment: comment,
                userId: user.id,
                surplusUsageDescription: surplusUsageDescription,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || '送信に失敗しました');
        }

        toast.success('企画の完了を報告しました！お疲れ様でした🎉', { id: toastId });
        onReportSubmitted();
        onClose();

    } catch (err) {
        toast.error(err.message, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 relative overflow-hidden">
        
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <FiCheckCircle className="text-2xl"/> 企画完了報告
                </h2>
                <p className="text-sm text-green-100 mt-1">
                    完成写真とメッセージを投稿して、企画を締めくくりましょう。
                </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <FiX size={24}/>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto">
            
            {/* 1. 写真アップロード */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FiImage className="text-emerald-500"/> 完成写真 <span className="text-red-500 text-xs">*必須</span>
              </label>
              
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 transition-colors hover:bg-gray-100">
                {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative w-24 h-24 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} className="w-full h-full object-cover rounded-lg shadow-sm" alt={`Uploaded ${index}`} />
                                <button 
                                    type="button" 
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow hover:bg-red-600 transition-colors text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="text-center py-4 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 shadow-sm border border-gray-200">
                        {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div> : <FiUpload size={24}/>}
                    </div>
                    <p className="text-sm font-bold text-gray-600">
                        {isUploading ? 'アップロード中...' : '写真を選択またはドロップ'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">複数枚選択可能 (最大5枚推奨)</p>
                </div>
                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" disabled={isUploading}/>
              </div>
            </div>

            {/* 2. メッセージ */}
            <div>
               <label htmlFor="completion-comment" className="block text-sm font-bold text-gray-700 mb-2">参加者へのメッセージ <span className="text-red-500 text-xs">*必須</span></label>
               <textarea 
                    id="completion-comment" 
                    required
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    rows="5" 
                    className="w-full p-4 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" 
                    placeholder="企画へのご参加ありがとうございました！無事にフラスタを贈ることができました..."
                ></textarea>
            </div>

            {/* 3. 収支報告 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <FiDollarSign className="text-gray-500"/>
                    <h3 className="text-sm font-bold text-gray-700">最終収支確認</h3>
                </div>
                <div className="p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">支援総額 (収入)</span>
                        <span className="font-bold">{project.collectedAmount.toLocaleString()} pt</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                        <span>経費合計 (支出)</span>
                        <span>- {totalExpense.toLocaleString()} pt</span>
                    </div>
                    <div className="h-px bg-gray-200 my-1"></div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">最終残高 (余剰金)</span>
                        <span className={`text-lg font-bold ${finalBalance > 0 ? 'text-blue-600' : 'text-gray-800'}`}>
                            {finalBalance.toLocaleString()} pt
                        </span>
                    </div>
                </div>
            </div>

             {/* 4. 余剰金の使い道 (条件付き表示) */}
            {finalBalance > 0 && (
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 animate-fadeIn">
                    <div className="flex items-start gap-2 mb-2 text-blue-800">
                        <FiInfo className="mt-0.5 shrink-0"/>
                        <span className="text-sm font-bold">余剰金が発生しています</span>
                    </div>
                    <p className="text-xs text-blue-700 mb-4">
                        信頼維持のため、余った資金の使い道を参加者に説明してください。<br/>
                        （例: 次回の企画へ繰り越し、参加者へ返金、追加の装飾に使用 など）
                    </p>
                    
                    <label htmlFor="surplus-usage" className="block text-xs font-bold text-gray-600 mb-1">使い道の説明 <span className="text-red-500">*</span></label>
                    <textarea
                        id="surplus-usage"
                        value={surplusUsageDescription}
                        onChange={(e) => setSurplusUsageDescription(e.target.value)}
                        rows="3"
                        required
                        className="w-full p-3 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="例：今回発生した余剰金 5,000pt は、次回の企画の初期費用としてプールさせていただきます。"
                    ></textarea>
                </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                    キャンセル
                </button>
                <button 
                    type="submit" 
                    disabled={isUploading || isSubmitting} 
                    className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> 送信中...</>
                    ) : (
                        '完了を報告する'
                    )}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}