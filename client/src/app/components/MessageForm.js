'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

// ★ API_URL corrected
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function MessageForm({ projectId, onMessagePosted }) {
  const { user } = useAuth(); // Get user info
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  const onSubmit = async (data) => {
    if (!user) { // Check if user is logged in
      toast.error('メッセージを投稿するにはログインが必要です。');
      return;
    }
    
    const { cardName, content } = data;

    // ★★★ Corrected API call: removed token, added userId ★★★
    const promise = fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': Bearer token removed
      },
      body: JSON.stringify({ 
          content, 
          cardName, 
          projectId: projectId, // Ensure projectId is passed correctly (string is fine)
          userId: user.id // Add userId from context
      }),
    }).then(async (res) => { // Added async for potential error parsing
      if (!res.ok) {
        // Try to parse error message from backend
        let errorMsg = 'メッセージの投稿に失敗しました。';
        try {
            const errData = await res.json();
            errorMsg = errData.message || errorMsg;
        } catch(e) { /* Ignore parsing error */ }
        throw new Error(errorMsg); // Throw specific error
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '投稿中...',
      success: () => {
        onMessagePosted(); 
        reset(); 
        return 'メッセージを投稿しました！ご参加ありがとうございます！';
      },
      error: (err) => err.message, // Display specific error
    });
  };

  // --- JSX (no changes needed) ---
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">カードに印刷するお名前</label>
        <input
          id="cardName"
          type="text"
          {...register("cardName", { required: "印刷するお名前は必須です。" })}
          className={`w-full mt-1 p-2 border rounded-md text-gray-900 ${errors.cardName ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="例：〇〇企画有志一同、田中太郎"
        />
        {errors.cardName && <p className="mt-1 text-sm text-red-600">{errors.cardName.message}</p>}
      </div>
      <div>
        <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700">お祝いメッセージ (50字程度推奨)</label>
        <textarea
          id="messageContent"
          {...register("content", { 
            required: "お祝いメッセージは必須です。",
            maxLength: { value: 200, message: "200文字以内で入力してください。" } 
          })}
          rows="4"
          className={`w-full mt-1 p-2 border rounded-md text-gray-900 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="例：ご出演おめでとうございます！"
        ></textarea>
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full p-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 disabled:bg-slate-400">
        {isSubmitting ? '投稿中...' : 'この内容でメッセージを投稿する'}
      </button>
    </form>
  );
}