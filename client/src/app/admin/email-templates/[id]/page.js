'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function EmailTemplateEditor() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const isNew = id === 'create';
    
    const { user, authenticatedFetch } = useAuth();
    const [loading, setLoading] = useState(!isNew);
    const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();

    const fetchTemplate = useCallback(async () => {
        if (isNew) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/admin/email-templates/${id}`);
            if (!res.ok) throw new Error('テンプレートの取得に失敗しました');
            const data = await res.json();
            reset(data);
        } catch (error) {
            toast.error(error.message);
            router.push('/admin/email-templates');
        } finally {
            setLoading(false);
        }
    }, [id, isNew, authenticatedFetch, reset, router]);

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchTemplate();
        }
    }, [user, fetchTemplate]);

    const onSubmit = async (data) => {
        const toastId = toast.loading('保存中...');
        try {
            const url = isNew 
                ? `${API_URL}/api/admin/email-templates` 
                : `${API_URL}/api/admin/email-templates/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    isSystemTemplate: data.isSystemTemplate === true || data.isSystemTemplate === 'true'
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || '保存に失敗しました');
            }
            
            toast.success('テンプレートを保存しました', { id: toastId });
            router.push('/admin/email-templates');
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    if (!user || user.role !== 'ADMIN') return <div className="p-8 text-center text-slate-500">権限がありません</div>;
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32}/></div>;

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <Link href="/admin/email-templates" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-1" /> テンプレート一覧に戻る
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50">
                    <h1 className="text-xl font-black text-slate-800">
                        {isNew ? '新規メールテンプレート作成' : 'メールテンプレート編集'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">テンプレート名 (管理用)</label>
                            <input 
                                {...register('name', { required: '必須項目です' })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="例: 支援完了サンクスメール"
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">キー (プログラム呼び出し用)</label>
                            <input 
                                {...register('key', { required: '必須項目です' })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="例: pledge_success"
                                readOnly={!isNew && false} // 必要に応じてシステムキーは編集不可にする
                            />
                            {errors.key && <p className="text-xs text-red-500 mt-1">{errors.key.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">対象ロール</label>
                        <select {...register('targetRole')} className="w-full md:w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">ALL (共通)</option>
                            <option value="USER">USER (支援者・ファン)</option>
                            <option value="FLORIST">FLORIST (お花屋さん)</option>
                            <option value="ORGANIZER">ORGANIZER (イベント主催者)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">メール件名</label>
                        <input 
                            {...register('subject', { required: '必須項目です' })} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="例: 【FLASTAL】ご支援ありがとうございます"
                        />
                        {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            メール本文 (HTML対応)
                        </label>
                        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg text-xs font-bold mb-3 flex gap-2">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <p>
                                変数を使用できます。例: <code>{`{{user_name}}`}</code> 様、<code>{`{{project_title}}`}</code> へのご支援ありがとうございます。<br/>
                                改行は <code>&lt;br&gt;</code> タグを使用するか、HTML形式で記述してください。
                            </p>
                        </div>
                        <textarea 
                            {...register('body', { required: '必須項目です' })} 
                            rows="15"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed" 
                            placeholder="<p>{{user_name}} 様</p><p>ご支援ありがとうございます。</p>"
                        ></textarea>
                        {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            テンプレートを保存する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}