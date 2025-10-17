'use client';

import { useForm } from 'react-hook-form'; // ★ 1. useFormをインポート
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL_PYTHON || 'https://flastal-backend.onrender.com';

export default function MessageForm({ projectId, onMessagePosted }) {
  // ★ 2. useFormをセットアップ。フォームの状態を全て管理してくれる
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  // ★ 3. handleSubmitが呼び出す、実際の送信処理
  const onSubmit = async (data) => {
    // useFormがフォームデータを 'data' オブジェクトにまとめて渡してくれる
    const { cardName, content } = data;
    const token = localStorage.getItem('authToken'); // 認証トークンを取得

    // toast.promiseで見栄えの良い通知を出す
    const promise = fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content, cardName, projectId: parseInt(projectId) }),
    }).then(res => {
      if (!res.ok) throw new Error('メッセージの投稿に失敗しました。');
      return res.json();
    });

    toast.promise(promise, {
      loading: '投稿中...',
      success: () => {
        onMessagePosted(); // 親コンポーネントに更新を通知
        reset(); // フォームの内容をリセット
        return 'メッセージを投稿しました！ご参加ありがとうございます！';
      },
      error: (err) => err.message,
    });
  };

  return (
    // ★ 4. formのonSubmitを、useFormのhandleSubmitでラップする
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">カードに印刷するお名前</label>
        <input
          id="cardName"
          type="text"
          // ★ 5. registerを使い、入力欄をuseFormに登録。バリデーションルールも設定
          {...register("cardName", { required: "印刷するお名前は必須です。" })}
          // エラーがあれば枠を赤くする
          className={`w-full mt-1 p-2 border rounded-md text-gray-900 ${errors.cardName ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="例：〇〇企画有志一同、田中太郎"
        />
        {/* ★ 6. エラーがあれば、設定したエラーメッセージを表示 */}
        {errors.cardName && <p className="mt-1 text-sm text-red-600">{errors.cardName.message}</p>}
      </div>
      <div>
        <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700">お祝いメッセージ (50字程度推奨)</label>
        <textarea
          id="messageContent"
          // ★ 5. こちらも同様に登録とバリデーションルールを設定
          {...register("content", { 
            required: "お祝いメッセージは必須です。",
            maxLength: { value: 200, message: "200文字以内で入力してください。" } 
          })}
          rows="4"
          // エラーがあれば枠を赤くする
          className={`w-full mt-1 p-2 border rounded-md text-gray-900 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="例：ご出演おめでとうございます！"
        ></textarea>
        {/* ★ 6. エラーメッセージの表示 */}
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full p-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 disabled:bg-slate-400">
        {isSubmitting ? '投稿中...' : 'この内容でメッセージを投稿する'}
      </button>
    </form>
  );
}