'use client';

import { useState } from 'react';
import { getPresignedUrl, savePostToDb } from '../actions'; // さっき作ったやつ
import { useAuth } from '../contexts/AuthContext'; // ユーザー情報をとるため

export default function UploadForm() {
  const { user } = useAuth(); // ログイン中のユーザー情報を取得
  const [file, setFile] = useState(null);
  const [eventName, setEventName] = useState('');
  const [senderName, setSenderName] = useState(''); // 贈り主名
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus('準備中...');

    try {
      // 1. サーバーからS3への書き込みURLをもらう
      const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);

      setStatus('S3へアップロード中...');

      // 2. ブラウザから直接S3へ送信！
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('S3へのアップロード失敗');

      // 3. DBに記録
      setStatus('DB登録中...');
      await savePostToDb(
        { eventName, senderName }, 
        publicUrl, 
        user?.email // 現在のユーザーのメアドを渡す
      );

      setStatus('完了しました！');
      // フォームをリセット
      setFile(null);
      setEventName('');
      setSenderName('');

    } catch (error) {
      console.error(error);
      setStatus('エラーが発生しました');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-gray-800">フラスタを投稿する</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* イベント名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">イベント名</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="例: SummerLive2025"
            required
          />
        </div>

        {/* 贈り主名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">贈り主 (From)</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="例: ファン有志一同"
          />
        </div>

        {/* 画像選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0])}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={status === 'S3へアップロード中...' || status === 'DB登録中...'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {status || 'アップロード'}
        </button>
      </form>
    </div>
  );
}