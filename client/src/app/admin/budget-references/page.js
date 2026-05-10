'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    Image as ImageIcon, UploadCloud, Save, X, Edit3, Trash2, 
    CheckCircle2, Plus, Loader2, ImagePlus
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const BudgetReferenceManager = () => {
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // 編集モードかどうかの判定
    const [uploadingImage, setUploadingImage] = useState(false);

    // フォームの初期状態
    const initialFormState = {
        priceRange: '',
        label: '',
        description: '',
        imageUrl: '',
        isActive: true
    };
    const [formData, setFormData] = useState(initialFormState);

    // 初期データの取得
    useEffect(() => {
        fetchReferences();
    }, []);

    const fetchReferences = async () => {
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/budget-references`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReferences(data);
            }
        } catch (error) {
            toast.error('データの取得に失敗しました');
        }
    };

    // ★ S3署名付きURLを利用した最新の画像アップロード処理
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const toastId = toast.loading('画像をアップロード中...');

        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            
            // 1. S3署名付きURLを取得
            const urlRes = await fetch(`${API_URL}/api/tools/s3-upload-url`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ fileName: file.name, fileType: file.type })
            });
            
            if (!urlRes.ok) throw new Error('署名付きURLの取得に失敗しました');
            const { uploadUrl, fileUrl } = await urlRes.json();

            // 2. S3へ直接PUT
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.onload = () => {
                    if (xhr.status === 200) resolve(fileUrl);
                    else reject(new Error('S3へのアップロードに失敗しました'));
                };
                xhr.onerror = () => reject(new Error('ネットワークエラーが発生しました'));
                xhr.send(file);
            });

            // 3. フォームにURLをセット
            setFormData({ ...formData, imageUrl: fileUrl });
            toast.success('画像をアップロードしました！', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('アップロードに失敗しました', { id: toastId });
        } finally {
            setUploadingImage(false);
            e.target.value = ''; // 選択状態をリセット
        }
    };

    // データの保存（作成・更新）
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('保存中...');

        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/budget-references`, {
                method: 'POST', // upsertなのでPOSTまたはPATCHで対応
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('保存に失敗しました');

            toast.success(isEditing ? 'カタログを更新しました！' : '新しいカタログを登録しました！', { id: toastId });
            setFormData(initialFormState);
            setIsEditing(false);
            fetchReferences();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    // 編集ボタン
    const handleEdit = (ref) => {
        setFormData(ref);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 編集キャンセル
    const handleCancelEdit = () => {
        setFormData(initialFormState);
        setIsEditing(false);
    };

    // 削除処理
    const handleDelete = async (priceRange, label) => {
        if (!window.confirm(`「${label}」を本当に削除しますか？\n※既にこのカタログを参考にしているユーザーには影響しません。`)) return;
        
        const toastId = toast.loading('削除中...');
        try {
            const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
            const res = await fetch(`${API_URL}/api/admin/budget-references/${priceRange}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('削除に失敗しました');
            
            toast.success('削除しました', { id: toastId });
            if (isEditing && formData.priceRange === priceRange) {
                handleCancelEdit();
            }
            fetchReferences();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 font-sans text-slate-800">
            
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <ImagePlus size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">予算カタログ管理</h1>
                    <p className="text-xs font-bold text-slate-500">企画作成画面でユーザーが参考にする「予算とボリュームの目安」を設定します。</p>
                </div>
            </div>

            {/* --- 登録・編集フォーム --- */}
            <div className={cn("bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border transition-all", isEditing ? "border-sky-300 ring-4 ring-sky-50" : "border-slate-200")}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        {isEditing ? <><Edit3 className="text-sky-500" size={20}/> カタログを編集</> : <><Plus className="text-emerald-500" size={20}/> 新規カタログを登録</>}
                    </h2>
                    {isEditing && (
                        <button onClick={handleCancelEdit} className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors flex items-center gap-1">
                            <X size={14}/> キャンセル
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-black text-slate-700 mb-2">価格帯ID (英数字) <span className="text-pink-500">*</span></label>
                            <input 
                                type="text" 
                                required
                                disabled={isEditing} // 編集時はIDは変更不可にする
                                placeholder="例: 30k_50k, balloon_stand"
                                className={cn("w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:border-sky-500 transition-all placeholder:text-slate-400", isEditing && "opacity-60 cursor-not-allowed")}
                                value={formData.priceRange} 
                                onChange={e => setFormData({...formData, priceRange: e.target.value})} 
                            />
                            <p className="text-[10px] font-bold text-slate-400 mt-1.5 ml-1">※システム用のIDです。半角英数字とアンダーバーのみ推奨。</p>
                        </div>
                        <div>
                            <label className="block text-sm font-black text-slate-700 mb-2">表示ラベル <span className="text-pink-500">*</span></label>
                            <input 
                                type="text" 
                                required
                                placeholder="例: スタンダード (3〜5万円)"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all placeholder:text-slate-400"
                                value={formData.label} 
                                onChange={e => setFormData({...formData, label: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-700 mb-2">説明文 (ユーザーへの補足) <span className="text-pink-500">*</span></label>
                        <textarea 
                            required
                            rows="2"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all placeholder:text-slate-400 resize-none"
                            placeholder="例: 豪華な2段スタンド花になります。イラストパネルやバルーン装飾も十分に可能な予算感です。"
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-700 mb-2">参考写真 <span className="text-pink-500">*</span></label>
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <label className="relative w-full sm:w-64 aspect-video sm:aspect-square bg-slate-50 border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50 rounded-2xl overflow-hidden group cursor-pointer transition-all flex flex-col items-center justify-center text-slate-400 hover:text-sky-500 shadow-sm">
                                {formData.imageUrl ? (
                                    <>
                                        <img src={formData.imageUrl} alt="プレビュー" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <p className="text-white font-black text-xs flex items-center gap-1"><Edit3 size={14}/> 画像を変更</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {uploadingImage ? <Loader2 className="animate-spin mb-2" size={28}/> : <UploadCloud className="mb-2" size={28}/>}
                                        <span className="text-xs font-black">{uploadingImage ? 'アップロード中...' : '画像を選択'}</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                            </label>
                            
                            <div className="flex-1 space-y-4">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 border-slate-300 rounded text-sky-500 focus:ring-sky-500" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-800">ユーザーに公開する (Active)</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">チェックを外すと、作成画面のカタログに表示されなくなります。</p>
                                    </div>
                                </label>

                                <button 
                                    type="submit" 
                                    disabled={loading || uploadingImage || !formData.imageUrl || !formData.priceRange || !formData.label}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                    {isEditing ? '変更内容を保存する' : '新しく登録する'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* --- 登録済み一覧 --- */}
            <div>
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <ImageIcon className="text-slate-400" size={20}/> 登録済みカタログ一覧
                </h2>
                
                {references.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-[2rem]">
                        <ImageIcon size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-bold text-sm">まだ登録されているカタログはありません</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {references.map(ref => (
                            <div key={ref.id} className={cn("bg-white border rounded-[1.5rem] overflow-hidden flex flex-col group transition-all hover:shadow-md", !ref.isActive && "opacity-60", formData.priceRange === ref.priceRange && isEditing && "ring-2 ring-sky-500 border-sky-500")}>
                                <div className="relative w-full h-40 bg-slate-100 overflow-hidden">
                                    <img src={ref.imageUrl} alt={ref.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {!ref.isActive && (
                                        <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm">
                                            非公開
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-[10px] font-black text-sky-500 font-mono mb-1">{ref.priceRange}</p>
                                    <h3 className="font-black text-slate-800 mb-2 leading-tight">{ref.label}</h3>
                                    <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">{ref.description}</p>
                                    
                                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                                        <button onClick={() => handleEdit(ref)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                            <Edit3 size={14}/> 編集
                                        </button>
                                        <button onClick={() => handleDelete(ref.priceRange, ref.label)} className="px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors flex items-center justify-center">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetReferenceManager;