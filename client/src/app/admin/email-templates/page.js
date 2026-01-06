'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import toast from 'react-hot-toast';
import { 
  FiMail, FiEdit, FiSave, FiArrowLeft, FiRefreshCw, 
  FiInfo, FiTag, FiFileText, FiLoader 
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => localStorage.getItem('authToken')?.replace(/^"|"$/g, '') || '';

function EmailTemplateContent() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // テンプレート一覧取得
    const fetchTemplates = useCallback(async () => {
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/email-templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('取得に失敗しました');
            const data = await res.json();
            setTemplates(data || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/admin');
            return;
        }
        fetchTemplates();
    }, [isAuthenticated, user, router, fetchTemplates]);

    // 保存処理
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('テンプレートを保存中...');
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_URL}/api/admin/email-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(selectedTemplate)
            });
            if (!res.ok) throw new Error('保存に失敗しました');
            await fetchTemplates();
            toast.success('テンプレートを更新しました', { id: toastId });
            setSelectedTemplate(null);
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-3xl text-indigo-500"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/settings" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-gray-500 shadow-sm transition-all">
                            <FiArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FiMail className="text-indigo-600"/> メールテンプレート管理
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">システムから自動送信されるメールの文面をカスタマイズします。</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左側：テンプレート一覧 */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">テンプレート一覧</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {templates.map((temp) => (
                                    <button
                                        key={temp.id}
                                        onClick={() => setSelectedTemplate({ ...temp })}
                                        className={`w-full text-left px-4 py-4 hover:bg-indigo-50 transition-colors flex items-center justify-between group ${selectedTemplate?.id === temp.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                                    >
                                        <div>
                                            <p className={`font-bold text-sm ${selectedTemplate?.id === temp.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                {temp.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{temp.key}</p>
                                        </div>
                                        <FiEdit className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedTemplate?.id === temp.id ? 'text-indigo-500' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 右側：エディター */}
                    <div className="lg:col-span-2">
                        {selectedTemplate ? (
                            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FiEdit3 className="text-indigo-400" />
                                        <span className="font-bold">{selectedTemplate.name} の編集</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedTemplate(null)}
                                        className="text-xs text-gray-400 hover:text-white"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    {/* 件名 */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                            <FiTag className="text-gray-400"/> メールの件名
                                        </label>
                                        <input 
                                            type="text" 
                                            value={selectedTemplate.subject}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                                        />
                                    </div>

                                    {/* 本文 */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                            <FiFileText className="text-gray-400"/> メールの本文
                                        </label>
                                        <textarea 
                                            rows="12"
                                            value={selectedTemplate.body}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                                            required
                                            className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm leading-relaxed"
                                        />
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                                        <FiInfo className="text-amber-500 mt-1 shrink-0" />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <strong>ヒント:</strong> 本文中で <code>{"{{userName}}"}</code> などの変数を使用すると、送信時に自動的にユーザー名に置き換わります。
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />} テンプレートを保存
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-40 text-gray-400">
                                <FiMail size={48} className="mb-4 opacity-20" />
                                <p className="font-medium">編集するテンプレートを選択してください</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EmailTemplatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin text-indigo-500 text-3xl"/></div>}>
            <EmailTemplateContent />
        </Suspense>
    );
}