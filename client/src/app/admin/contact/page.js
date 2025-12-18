'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSend, FiPaperclip, FiUser, FiImage } from 'react-icons/fi';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function AdminContactPage() {
  const { user, token } = useAuth();
  const [targetEmail, setTargetEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // ★ 画像アップロード用
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!targetEmail || (!message && !selectedFile)) return;
    setSending(true);

    try {
      let fileUrl = null;
      let fileName = null;

      // 1. 画像があれば先にアップロード
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!uploadRes.ok) throw new Error('画像のアップロードに失敗');
        const data = await uploadRes.json();
        fileUrl = data.url;
        fileName = selectedFile.name;
      }

      // 2. メッセージ送信 (個別チャットAPIを叩く想定)
      // ※ここでは簡易的にメール送信API、または新規のチャット作成APIを呼ぶ
      // 本来は `AdminChatRoom` を作成してメッセージを追加するロジックが必要
      // 今回は「連絡機能」としてメールを送る形にフォールバック（または実装済みのAPIに合わせてください）
      
      const res = await fetch(`${API_URL}/api/admin/contact/send`, { // ★このAPIをindex.jsに追加が必要
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            email: targetEmail, 
            content: message,
            fileUrl,
            fileName
        })
      });

      if (res.ok) {
        toast.success('送信しました');
        setMessage('');
        setSelectedFile(null);
      } else {
        throw new Error('送信失敗');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
       <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">個別チャット連絡</h1>
        <Link href="/admin" className="text-gray-500 hover:underline">戻る</Link>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSend} className="space-y-6">
            <div>
                <label className="block font-bold mb-2">宛先メールアドレス</label>
                <input 
                    type="email" 
                    value={targetEmail} 
                    onChange={e => setTargetEmail(e.target.value)} 
                    className="w-full p-3 border rounded-lg"
                    placeholder="user@example.com"
                    required
                />
            </div>
            <div>
                <label className="block font-bold mb-2">メッセージ</label>
                <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    className="w-full p-3 border rounded-lg h-40"
                    placeholder="ここにメッセージを入力..."
                />
            </div>

            {/* ファイル添付エリア */}
            <div className="flex items-center gap-4">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                >
                    <FiImage /> {selectedFile ? '画像を変更' : '画像を添付'}
                </button>
                <span className="text-sm text-gray-500">{selectedFile?.name}</span>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={e => setSelectedFile(e.target.files[0])} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                />
            </div>

            <button 
                type="submit" 
                disabled={sending}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex justify-center items-center gap-2"
            >
                <FiSend /> {sending ? '送信中...' : '送信する'}
            </button>
        </form>
      </div>
    </div>
  );
}