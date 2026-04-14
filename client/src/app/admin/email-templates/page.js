// src/app/admin/email-templates/page.js
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import toast from 'react-hot-toast';
import { 
  FiMail, FiEdit, FiSave, FiArrowLeft, FiRefreshCw, 
  FiInfo, FiTag, FiFileText, FiLoader, FiEdit3, FiPlus 
} from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';
const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('authToken')?.replace(/^"|"$/g, '') || '';
};

// 空のテンプレートの初期状態
const INITIAL_TEMPLATE = {
    id: 'new',
    name: '',
    key: '',
    targetRole: 'USER',
    subject: '',
    body: ''
};

function EmailTemplateContent() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

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
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/admin');
            return;
        }
        fetchTemplates();
    }, [isAuthenticated, user, router, fetchTemplates, authLoading]);

    const handleSave = async (e) => {
        e.preventDefault();
        
        // バリデーション
        if (!selectedTemplate.name || !selectedTemplate.key || !selectedTemplate.subject || !selectedTemplate.body) {
            return toast.error('すべての必須項目を入力してください');
        }

        setIsSaving(true);
        const toastId = toast.loading('テンプレートを保存中...');
        
        try {
            const token = getAuthToken();
            // 新規作成か更新かでURLとメソッドを変える
            const isNew = selectedTemplate.id === 'new';
            const url = isNew 
                ? `${API_URL}/api/admin/email-templates` 
                : `${API_URL}/api/admin/email-templates/${selectedTemplate.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const payload = { ...selectedTemplate };
            if (isNew) delete payload.id; // 新規作成時はIDを外す

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '保存に失敗しました');
            }
            
            await fetchTemplates();
            toast.success(isNew ? '新しいテンプレートを作成しました' : 'テンプレートを更新しました', { id: toastId });
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/settings" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-gray-500 shadow-sm transition-all">
                            <FiArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FiMail className="text-indigo-600"/> メールテンプレート管理
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">システムから自動送信されるメールの文面を作成・カスタマイズします。</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左カラム：一覧 */}
                    <div className="lg:col-span-1 space-y-4">
                        <button 
                            onClick={() => setSelectedTemplate({ ...INITIAL_TEMPLATE })}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
                        >
                            <FiPlus /> 新しいテンプレートを作成
                        </button>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">テンプレート一覧</h3>
                                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">{templates.length}件</span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
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
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-gray-400 font-mono">{temp.key}</p>
                                                {temp.targetRole && (
                                                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase">{temp.targetRole}</span>
                                                )}
                                            </div>
                                        </div>
                                        <FiEdit className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedTemplate?.id === temp.id ? 'text-indigo-500' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                                {templates.length === 0 && (
                                    <div className="p-8 text-center text-sm text-gray-400 font-bold">
                                        まだテンプレートがありません。
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右カラム：エディタ */}
                    <div className="lg:col-span-2">
                        {selectedTemplate ? (
                            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FiEdit3 className="text-indigo-400" />
                                        <span className="font-bold">
                                            {selectedTemplate.id === 'new' ? '新規テンプレート作成' : `${selectedTemplate.name} の編集`}
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => setSelectedTemplate(null)} className="text-xs text-gray-400 hover:text-white transition-colors">閉じる</button>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                                管理用名前 <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                value={selectedTemplate.name}
                                                onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                                                placeholder="例：支援完了サンクスメール"
                                                required
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                                システムKey <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                value={selectedTemplate.key}
                                                onChange={(e) => setSelectedTemplate({...selectedTemplate, key: e.target.value})}
                                                placeholder="例：pledge_success"
                                                required
                                                readOnly={selectedTemplate.id !== 'new' && selectedTemplate.isSystemTemplate}
                                                className={`w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm ${selectedTemplate.id !== 'new' && selectedTemplate.isSystemTemplate ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 focus:bg-white'}`}
                                            />
                                            {selectedTemplate.id !== 'new' && selectedTemplate.isSystemTemplate && (
                                                <p className="text-[10px] text-amber-600 mt-1">※システム必須のキーは変更できません</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                            送信対象ロール
                                        </label>
                                        <select 
                                            value={selectedTemplate.targetRole || ''}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, targetRole: e.target.value})}
                                            className="w-full md:w-1/2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-sm"
                                        >
                                            <option value="">すべて（共通）</option>
                                            <option value="USER">USER（ファン・支援者）</option>
                                            <option value="FLORIST">FLORIST（お花屋さん）</option>
                                            <option value="ORGANIZER">ORGANIZER（主催者）</option>
                                        </select>
                                    </div>

                                    <hr className="border-gray-100" />

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                            <FiTag className="text-gray-400"/> メールの件名 <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={selectedTemplate.subject}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                                            placeholder="例：【FLASTAL】ご支援ありがとうございます"
                                            required
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                                            <span className="flex items-center gap-2"><FiFileText className="text-gray-400"/> メールの本文 (HTML可) <span className="text-red-500">*</span></span>
                                        </label>
                                        <textarea 
                                            rows="12"
                                            value={selectedTemplate.body}
                                            onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                                            required
                                            placeholder={`<p>{{user_name}} 様</p>\n<p>{{project_title}} へのご支援が完了しました。</p>`}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm leading-relaxed resize-y"
                                        />
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 shadow-inner">
                                        <FiInfo className="text-amber-500 mt-1 shrink-0" size={18} />
                                        <div className="text-xs text-amber-800 leading-relaxed font-medium">
                                            <p className="font-bold mb-1">💡 利用可能な変数の例：</p>
                                            <ul className="list-disc list-inside ml-2 space-y-0.5">
                                                <li><code>{"{{user_name}}"}</code> : ユーザーのハンドルネーム</li>
                                                <li><code>{"{{project_title}}"}</code> : 企画のタイトル</li>
                                                <li><code>{"{{amount}}"}</code> : 支援金額</li>
                                                <li><code>{"{{login_url}}"}</code> : ログイン画面のURL</li>
                                            </ul>
                                            <p className="mt-2 text-[10px] text-amber-700">※HTMLタグ(&lt;br&gt;や&lt;strong&gt;)がそのままメールに反映されます。</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                    {selectedTemplate.id !== 'new' && !selectedTemplate.isSystemTemplate && (
                                        <button 
                                            type="button" 
                                            onClick={async () => {
                                                if(!confirm('本当に削除しますか？')) return;
                                                try {
                                                    const res = await fetch(`${API_URL}/api/admin/email-templates/${selectedTemplate.id}`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
                                                    });
                                                    if(!res.ok) throw new Error('削除失敗');
                                                    toast.success('削除しました');
                                                    setSelectedTemplate(null);
                                                    fetchTemplates();
                                                } catch(e) { toast.error(e.message); }
                                            }}
                                            className="px-6 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors text-sm"
                                        >
                                            削除
                                        </button>
                                    )}
                                    <button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
                                    >
                                        {isSaving ? <FiRefreshCw className="animate-spin" size={16}/> : <FiSave size={16}/>} 
                                        {selectedTemplate.id === 'new' ? '新規作成' : '上書き保存'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-40 text-gray-400">
                                <FiMail size={48} className="mb-4 opacity-20" />
                                <p className="font-bold text-gray-500">左のリストからテンプレートを選択するか、</p>
                                <p className="font-medium text-sm mt-1">「新しいテンプレートを作成」ボタンを押してください。</p>
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