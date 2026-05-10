'use client';
import React, { useState, useEffect } from 'react';
// ※環境に合わせてAPIクライアント(axiosやカスタムfetch)をインポートしてください

const BudgetReferenceManager = () => {
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(false);

    // フォームの状態管理
    const [formData, setFormData] = useState({
        priceRange: '',
        label: '',
        description: '',
        imageUrl: '',
        isActive: true
    });

    const [uploadingImage, setUploadingImage] = useState(false);

    // 初期データの取得
    useEffect(() => {
        fetchReferences();
    }, []);

    const fetchReferences = async () => {
        try {
            // トークンの取得処理は環境に合わせてください
            const token = localStorage.getItem('token'); 
            const res = await fetch('/api/admin/budget-references', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setReferences(data);
        } catch (error) {
            console.error('取得エラー:', error);
        }
    };

    // 画像のアップロード処理
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData
            });
            const data = await res.json();
            
            // アップロード成功後、フォームのimageUrlにセット
            setFormData({ ...formData, imageUrl: data.url });
        } catch (error) {
            alert('画像のアップロードに失敗しました。');
        } finally {
            setUploadingImage(false);
        }
    };

    // データの保存（作成・更新）
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/budget-references', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('保存しました！');
                setFormData({ priceRange: '', label: '', description: '', imageUrl: '', isActive: true });
                fetchReferences(); // リストを更新
            }
        } catch (error) {
            alert('保存に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    // 編集ボタンを押した時の処理
    const handleEdit = (ref) => {
        setFormData(ref);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 削除処理
    const handleDelete = async (priceRange) => {
        if (!window.confirm('本当に削除しますか？')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/admin/budget-references/${priceRange}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchReferences();
        } catch (error) {
            alert('削除に失敗しました。');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">予算カタログ管理</h1>

            {/* 登録・編集フォーム */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">新規登録 / 編集</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">価格帯ID (英数字)</label>
                            <input 
                                type="text" 
                                required
                                placeholder="例: 30k_50k, tabletop"
                                className="w-full border p-2 rounded"
                                value={formData.priceRange} 
                                onChange={e => setFormData({...formData, priceRange: e.target.value})} 
                            />
                            <p className="text-xs text-gray-500 mt-1">※システムで判別する用の一意のIDです</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">表示ラベル</label>
                            <input 
                                type="text" 
                                required
                                placeholder="例: スタンダード (3〜5万円)"
                                className="w-full border p-2 rounded"
                                value={formData.label} 
                                onChange={e => setFormData({...formData, label: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">説明文 (ユーザーへの補足)</label>
                        <textarea 
                            className="w-full border p-2 rounded"
                            placeholder="例: 豪華な2段スタンド花になります。バルーン装飾も可能です。"
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">参考写真</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="mb-2"
                        />
                        {uploadingImage && <p className="text-blue-500 text-sm">アップロード中...</p>}
                        {formData.imageUrl && (
                            <img src={formData.imageUrl} alt="プレビュー" className="h-32 object-contain border rounded mt-2" />
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || uploadingImage || !formData.imageUrl}
                        className="bg-blue-600 text-white px-6 py-2 rounded font-semibold disabled:bg-gray-400"
                    >
                        {loading ? '保存中...' : 'この内容で保存する'}
                    </button>
                </form>
            </div>

            {/* 登録済み一覧 */}
            <h2 className="text-xl font-semibold mb-4">登録済みカタログ一覧</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {references.map(ref => (
                    <div key={ref.id} className="bg-white border rounded-lg p-4 flex gap-4">
                        <img src={ref.imageUrl} alt={ref.label} className="w-24 h-24 object-cover rounded bg-gray-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{ref.label}</h3>
                            <p className="text-sm text-gray-500">ID: {ref.priceRange}</p>
                            <p className="text-sm mt-1">{ref.description}</p>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => handleEdit(ref)} className="text-sm bg-gray-200 px-3 py-1 rounded">編集</button>
                                <button onClick={() => handleDelete(ref.priceRange)} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded">削除</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BudgetReferenceManager;