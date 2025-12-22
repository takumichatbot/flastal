'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/contexts/AuthContext';
import { FiSend, FiUser, FiMessageSquare, FiEdit3, FiEye, FiCheck } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function MessageForm({ projectId, onMessagePosted }) {
  const { user } = useAuth();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    defaultValues: {
      cardName: user?.handleName || '',
      content: ''
    }
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // リアルタイムプレビュー用
  const watchedValues = watch();
  const charCount = watchedValues.content?.length || 0;
  const maxChars = 200;

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('メッセージを投稿するにはログインが必要です。');
      return;
    }
    
    // トークン取得 (セキュリティのためヘッダーに付与推奨)
    const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');

    const promise = fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
          content: data.content, 
          cardName: data.cardName, 
          projectId: projectId,
          userId: user.id 
      }),
    }).then(async (res) => {
      if (!res.ok) {
        let errorMsg = '投稿に失敗しました';
        try {
            const errData = await res.json();
            errorMsg = errData.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: 'メッセージカードを作成中...',
      success: () => {
        onMessagePosted(); 
        reset(); 
        setIsPreviewMode(false);
        return 'メッセージを投稿しました！';
      },
      error: (err) => err.message,
    });
  };

  if (!user) {
      return (
          <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <p className="text-gray-500 mb-2">メッセージを贈るにはログインが必要です</p>
              <a href="/login" className="text-pink-500 font-bold hover:underline">ログインして参加する</a>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden mt-6">
      
      {/* ヘッダータブ */}
      <div className="flex border-b border-pink-50">
        <button
            type="button"
            onClick={() => setIsPreviewMode(false)}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${!isPreviewMode ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
            <FiEdit3 /> 入力
        </button>
        <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${isPreviewMode ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
            <FiEye /> プレビュー
        </button>
      </div>

      <div className="p-6">
        {/* プレビュー画面 */}
        {isPreviewMode ? (
            <div className="animate-fadeIn">
                <p className="text-xs text-center text-gray-400 mb-4">実際のメッセージカードのイメージです</p>
                <div className="max-w-md mx-auto bg-gradient-to-br from-white to-pink-50 border-2 border-pink-200 p-6 rounded-xl shadow-lg relative overflow-hidden transform rotate-1">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-pink-200 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative z-10">
                        <p className="text-gray-800 font-serif leading-loose whitespace-pre-wrap min-h-[100px]">
                            {watchedValues.content || "ここにメッセージが入ります..."}
                        </p>
                        <div className="mt-6 text-right border-t border-pink-200 pt-2">
                            <p className="text-sm text-gray-600 font-bold">{watchedValues.cardName || "お名前"}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button 
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="bg-pink-500 text-white px-8 py-2.5 rounded-full font-bold shadow-md hover:bg-pink-600 transition-all hover:shadow-lg disabled:bg-gray-300"
                    >
                        {isSubmitting ? '送信中...' : 'この内容でカードを作成'}
                    </button>
                </div>
            </div>
        ) : (
            /* 入力フォーム */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fadeIn">
                <div>
                    <label htmlFor="cardName" className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                        カードに記載するお名前 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            id="cardName"
                            type="text"
                            {...register("cardName", { required: "お名前を入力してください" })}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-800 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all ${errors.cardName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                            placeholder="例：山田 太郎、〇〇企画有志一同"
                        />
                    </div>
                    {errors.cardName && <p className="mt-1 ml-1 text-xs text-red-500 font-bold">{errors.cardName.message}</p>}
                </div>

                <div>
                    <label htmlFor="content" className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                        お祝いメッセージ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <FiMessageSquare className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                            id="content"
                            {...register("content", { 
                                required: "メッセージを入力してください",
                                maxLength: { value: maxChars, message: `${maxChars}文字以内で入力してください` } 
                            })}
                            rows="4"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-800 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all resize-none ${errors.content ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                            placeholder="出演おめでとうございます！これからも応援しています！"
                        ></textarea>
                        
                        {/* 文字数カウンター */}
                        <div className={`absolute bottom-3 right-3 text-xs font-bold ${charCount > maxChars ? 'text-red-500' : 'text-gray-400'}`}>
                            {charCount} / {maxChars}
                        </div>
                    </div>
                    {errors.content && <p className="mt-1 ml-1 text-xs text-red-500 font-bold">{errors.content.message}</p>}
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting || Object.keys(errors).length > 0} 
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            送信中...
                        </span>
                    ) : (
                        <>
                            <FiSend className="text-lg" /> メッセージを届ける
                        </>
                    )}
                </button>
            </form>
        )}
      </div>
    </div>
  );
}