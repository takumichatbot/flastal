'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
    FiSend, FiPaperclip, FiUser, FiImage, FiSearch, 
    FiX, FiMessageSquare, FiAlertCircle, FiCheck, FiArrowLeft
} from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const TEMPLATES = [
    { label: '本人確認のお願い', text: 'お世話になっております。FLASTAL運営事務局です。\n\nご提出いただいた本人確認書類に一部不備がございましたため、再提出をお願いしたくご連絡いたしました。\n\nお手数をおかけしますが、マイページよりご確認をお願いいたします。' },
    { label: '掲載内容の確認', text: 'お世話になっております。FLASTAL運営事務局です。\n\n現在掲載申請中のプロジェクトについて、いくつか確認事項がございます。\n\n1. \n2. \n\n上記についてご回答いただけますでしょうか。よろしくお願いいたします。' },
    { label: '規約違反の警告', text: 'FLASTAL運営事務局です。\n\nお客様の投稿において、利用規約第◯条に抵触する内容が確認されました。\n該当箇所：\n\n直ちに修正または削除を行ってください。対応が見られない場合、アカウントを停止する可能性がございます。' },
];

// 1. 実際のロジックと表示を持つコンポーネント
function AdminContactInner() {
    const { token } = useAuth();
    const [targetUser, setTargetUser] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
            if (targetUser && (targetUser.email === searchTerm || targetUser.name === searchTerm)) return;
            setIsSearching(true);
            try {
                const res = await fetch(`${API_URL}/api/admin/users?search=${encodeURIComponent(searchTerm)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(Array.isArray(data) ? data : (data.users || []));
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, token, targetUser]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('ファイルサイズは5MB以下にしてください');
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!targetUser || !targetUser.email) return toast.error('宛先ユーザーを選択してください');
        if (!message && !selectedFile) return toast.error('メッセージを入力してください');
        setSending(true);
        const loadingToast = toast.loading('送信中...');
        try {
            let fileUrl = null;
            let fileName = null;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('image', selectedFile);
                const uploadRes = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!uploadRes.ok) throw new Error('画像のアップロードに失敗しました');
                const uploadData = await uploadRes.json();
                fileUrl = uploadData.url;
                fileName = selectedFile.name;
            }
            const res = await fetch(`${API_URL}/api/admin/contact/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    userId: targetUser.id,
                    email: targetUser.email, 
                    content: message,
                    fileUrl,
                    fileName
                })
            });
            if (!res.ok) throw new Error('送信に失敗しました');
            toast.success('メッセージを送信しました', { id: loadingToast });
            setMessage('');
            clearFile();
        } catch (e) {
            toast.error(e.message || '送信エラーが発生しました', { id: loadingToast });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FiMessageSquare className="text-indigo-600"/> 個別連絡・通知
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">特定のユーザーに対して、システム通知またはチャットメッセージを送信します。</p>
                    </div>
                    <Link href="/admin" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <FiArrowLeft className="mr-1"/> ダッシュボードへ戻る
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="font-bold text-slate-700 mb-4 flex items-center"><FiSearch className="mr-2"/> 宛先を検索</h2>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="名前、メールアドレス..."
                                    disabled={!!targetUser}
                                />
                                <FiSearch className="absolute left-3 top-3.5 text-slate-400" />
                                {targetUser && (
                                    <button onClick={() => { setTargetUser(null); setSearchTerm(''); setSearchResults([]); }} className="absolute right-3 top-3 text-slate-400 hover:text-red-500"><FiX /></button>
                                )}
                            </div>
                            {!targetUser && searchTerm.length >= 2 && (
                                <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto absolute z-10 w-[calc(100%-2.5rem)] lg:w-72">
                                    {isSearching ? <div className="p-4 text-center text-sm text-slate-500">検索中...</div> : searchResults.length > 0 ? (
                                        searchResults.map(user => (
                                            <button key={user.id} onClick={() => { setTargetUser(user); setSearchTerm(user.email); }} className="w-full text-left p-3 hover:bg-indigo-50 border-b border-slate-100 last:border-0 flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 text-slate-500">
                                                    {user.iconUrl ? <img src={user.iconUrl} alt="" className="w-full h-full rounded-full object-cover"/> : <FiUser />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{user.name || 'No Name'}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                </div>
                                            </button>
                                        ))
                                    ) : <div className="p-4 text-center text-sm text-slate-500">ユーザーが見つかりません</div>}
                                </div>
                            )}
                            {targetUser && (
                                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg animate-fadeIn">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm">
                                            {targetUser.iconUrl ? <img src={targetUser.iconUrl} className="w-full h-full rounded-full object-cover"/> : <FiUser size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-indigo-900 text-sm">{targetUser.name}</p>
                                            <p className="text-xs text-indigo-700">{targetUser.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-indigo-600 bg-white p-2 rounded border border-indigo-100 break-all">{targetUser.email}</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 mb-3">定型文を挿入</h3>
                            <div className="space-y-2">
                                {TEMPLATES.map((tpl, idx) => (
                                    <button key={idx} onClick={() => setMessage(tpl.text)} className="w-full text-left text-xs p-2.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 transition-colors">{tpl.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 h-full flex flex-col">
                            <form onSubmit={handleSend} className="flex-1 flex flex-col space-y-6">
                                <div className="flex-1 flex flex-col">
                                    <label className="block font-bold text-slate-700 mb-2">メッセージ内容</label>
                                    <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full flex-1 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 text-slate-800 leading-relaxed min-h-[300px]" placeholder="ここにメッセージを入力してください..."/>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-2 text-sm">添付ファイル (任意)</label>
                                    <div className="flex items-start gap-4">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><FiPaperclip /> ファイルを選択</button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/png, image/jpeg, image/jpg, application/pdf"/>
                                        {selectedFile && (
                                            <div className="relative group">
                                                {previewUrl ? (
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 relative"><Image src={previewUrl} alt="Preview" fill className="object-cover" /></div>
                                                ) : <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded"><FiImage /> {selectedFile.name}</div>}
                                                <button type="button" onClick={clearFile} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><FiX size={12} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs text-slate-500"><FiAlertCircle className="inline mr-1" />送信内容は履歴に保存されます</div>
                                    <button type="submit" disabled={sending || !targetUser} className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all ${sending || !targetUser ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{sending ? '送信中...' : <><FiSend /> 送信する</>}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 2. メインエクスポート (Suspenseでラップ)
export default function AdminContactPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        }>
            <AdminContactInner />
        </Suspense>
    );
}