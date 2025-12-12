// src/app/components/VenueLogisticsPostModal.js
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiSend, FiUpload, FiMapPin } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    const rawToken = localStorage.getItem('authToken');
    return rawToken ? rawToken.replace(/^"|"$/g, '') : null;
};

/**
 * 会場ロジスティクス情報投稿モーダル
 * @param {object} props
 * @param {string} props.venueId - 対象会場ID
 * @param {string} props.venueName - 対象会場名
 * @param {function} props.onClose - モーダルを閉じる関数
 * @param {function} props.onPostSuccess - 投稿成功時のコールバック
 */
export default function VenueLogisticsPostModal({ venueId, venueName, onClose, onPostSuccess }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        // 最大3枚に制限
        const newFiles = Array.from(e.target.files).slice(0, 3 - imageFiles.length);
        setImageFiles(prev => [...prev, ...newFiles]);
    };
    
    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description) {
            toast.error('タイトルと内容は必須です。');
            return;
        }

        setIsSubmitting(true);
        const masterToastId = toast.loading(`「${venueName}」に事例を投稿中...`);
        const token = getAuthToken();

        try {
            // 1. 画像をアップロード
            setIsUploading(true);
            const imageUrls = [];
            
            for (const file of imageFiles) {
                const formData = new FormData();
                formData.append('image', file);
                const uploadRes = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました。');
                const result = await uploadRes.json();
                imageUrls.push(result.url);
            }
            setIsUploading(false);

            // 2. Wiki情報をDBに登録
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
                throw new Error(errorDetail.message || '事例の投稿に失敗しました。');
            }
            
            toast.success('会場の搬入事例を共有しました！', { id: masterToastId });
            onPostSuccess();
            onClose();

        } catch (error) {
            console.error('Wiki Post Error:', error);
            toast.error(error.message || '投稿中にエラーが発生しました。', { id: masterToastId });
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const isButtonDisabled = isSubmitting || isUploading || !title.trim() || !description.trim();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                    <FiMapPin className="mr-2 text-pink-600"/> {venueName} 現場事例の共有
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    あなたの搬入経験やレギュレーションの注意点を、他の花屋さんのために共有してください。
                </p>
                <button onClick={onClose} disabled={isSubmitting} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={24}/></button>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">タイトル (搬入日時など)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例: 2025/12/24 イベント名 搬入事例"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">具体的な手順・注意事項 <span className="text-xs font-normal text-gray-500">(回収時間や搬入ルートなど)</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            placeholder="詳細を記述してください。"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {/* 画像アップロードエリア */}
                    <div className="border border-gray-200 p-3 rounded-lg bg-gray-50">
                        <label className="block text-sm font-bold text-gray-700 mb-2">参考写真 (最大 3 枚)</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {imageFiles.map((file, index) => (
                                <div key={index} className="relative w-16 h-16">
                                    <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={`preview-${index}`} 
                                        className="w-full h-full object-cover rounded border"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                    >
                                        <FiX size={10}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        {imageFiles.length < 3 && (
                            <label className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                                <FiUpload className="mr-2"/> 画像を追加
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" disabled={isSubmitting || imageFiles.length >= 3} />
                            </label>
                        )}
                        {isUploading && <span className="ml-3 text-sm text-indigo-500">画像をアップロード中...</span>}
                    </div>

                    <div className="flex justify-end pt-3 border-t">
                        <button 
                            type="submit" 
                            disabled={isButtonDisabled}
                            className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 disabled:bg-gray-400 transition-colors flex items-center"
                        >
                            <FiSend className="mr-2"/> {isSubmitting ? '投稿中...' : '事例を共有する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Subcomponent: PostModal End