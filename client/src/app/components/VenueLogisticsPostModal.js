// src/app/components/VenueLogisticsPostModal.js
'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiSend, FiUpload, FiMapPin, FiTag, FiImage, FiLoader, FiTrash2 } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 入力補助用のタグ
const QUICK_TAGS = ['搬入経路', '駐車場情報', 'サイズ制限', '搬入時間', '撤去・回収', '台車利用', 'エレベーター'];

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

/**
 * 会場ロジスティクス情報投稿モーダル
 * - デザイン刷新
 * - クイックタグ機能追加
 * - 画像プレビュー改善
 */
export default function VenueLogisticsPostModal({ venueId, venueName, onClose, onPostSuccess }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + imageFiles.length > 3) {
            toast.error('画像は最大3枚までです');
            return;
        }
        
        // 画像バリデーション
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) return false;
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error(`${file.name} はサイズが大きすぎます(5MB制限)`);
                return false;
            }
            return true;
        });

        setImageFiles(prev => [...prev, ...validFiles]);
    };
    
    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    // タグをクリックして本文に挿入
    const handleTagClick = (tag) => {
        setDescription(prev => {
            const prefix = prev.length > 0 && !prev.endsWith('\n') ? '\n' : '';
            return `${prev}${prefix}【${tag}】 `;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            toast.error('タイトルと内容は必須です。');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('情報を共有中...');
        const token = getAuthToken();

        try {
            // 1. 画像をアップロード (並列処理)
            const uploadPromises = imageFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);
                const res = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (!res.ok) throw new Error('Upload failed');
                return (await res.json()).url;
            });

            const imageUrls = await Promise.all(uploadPromises);

            // 2. 投稿データを送信
            const postRes = await fetch(`${API_URL}/api/venues/${venueId}/logistics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title,
                    description,
                    imageUrls,
                }),
            });

            if (!postRes.ok) {
                const errorDetail = await postRes.json();
                throw new Error(errorDetail.message || '投稿に失敗しました');
            }
            
            toast.success('貴重な情報を共有しました！ありがとうございます。', { id: toastId });
            onPostSuccess();
            onClose();

        } catch (error) {
            console.error('Post Error:', error);
            toast.error('投稿中にエラーが発生しました。', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景オーバーレイ */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={!isSubmitting ? onClose : undefined}
            />

            {/* モーダル本体 */}
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
                
                {/* ヘッダー */}
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-5 text-white flex justify-between items-start shrink-0">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <FiMapPin /> 現場情報を共有
                        </h3>
                        <p className="text-pink-100 text-xs mt-1 font-medium">
                            {venueName}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <FiX size={20}/>
                    </button>
                </div>

                {/* スクロール可能なコンテンツエリア */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* 1. タイトル */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">タイトル (要件・日付など)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="例: 2025/12/24 大ホール搬入時の注意点"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all font-bold text-gray-700"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {/* 2. 本文 & クイックタグ */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-bold text-gray-500 ml-1">詳細情報</label>
                                <span className="text-[10px] text-gray-400">タグタップで挿入</span>
                            </div>
                            
                            {/* クイックタグ */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {QUICK_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagClick(tag)}
                                        disabled={isSubmitting}
                                        className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded-md hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors flex items-center gap-1"
                                    >
                                        <FiTag className="text-[9px]" /> {tag}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="6"
                                placeholder="搬入経路の幅、台車の貸出有無、警備員への申請手順など、他の花屋さんの役に立つ情報を記述してください。"
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-200 focus:border-pink-500 outline-none transition-all resize-none text-sm leading-relaxed"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {/* 3. 画像アップロード */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">現場写真 (最大3枚)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {imageFiles.map((file, index) => (
                                    <div key={index} className="relative aspect-square group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt="preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => removeImage(index)}
                                            disabled={isSubmitting}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors backdrop-blur-sm"
                                        >
                                            <FiTrash2 size={12}/>
                                        </button>
                                    </div>
                                ))}
                                
                                {imageFiles.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={isSubmitting}
                                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-pink-50 hover:border-pink-300 text-gray-400 hover:text-pink-500 flex flex-col items-center justify-center transition-all gap-1"
                                    >
                                        <FiImage size={24} />
                                        <span className="text-[10px] font-bold">追加する</span>
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                multiple 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                        </div>

                    </form>
                </div>

                {/* フッター */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim() || !description.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <><FiLoader className="animate-spin"/> 送信中...</>
                        ) : (
                            <><FiSend /> 共有する</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}