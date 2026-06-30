'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
    ArrowLeft, Package, Plus, Edit3, ToggleLeft, ToggleRight,
    Tag, RefreshCw, X, ShoppingCart, FolderPlus, List, Star, StarOff,
    ChevronRight, Layers
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const GlassCard = ({ children, className }) => (
    <div className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]", className)}>
        {children}
    </div>
);

const EMPTY_FORM = {
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    sku: '',
    categoryId: '',
    stock: '',
    unit: '個',
    minOrder: 1,
    isActive: true,
    isFeatured: false,
    tags: '',
    images: [],
};

export default function AdminShopPage() {
    const { user, token, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // モーダル
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    // カテゴリ追加
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    // ---- Auth guard ----
    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            toast.error('管理者権限がありません');
            router.push('/');
        }
    }, [loading, isAuthenticated, user, router]);

    // ---- Fetch ----
    const getToken = useCallback(() => {
        if (token) return token;
        return window.__flastalToken || ''|window.__flastalToken;
    }, [token]);

    const fetchAll = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const tok = getToken();
            const headers = { 'Authorization': `Bearer ${tok}` };
            const [catRes, prodRes] = await Promise.all([
                fetch(`${API_URL}/api/shop/categories`, { headers }),
                fetch(`${API_URL}/api/shop/admin/products?page=1&limit=50`, { headers }),
            ]);
            if (catRes.ok) {
                const d = await catRes.json();
                setCategories(Array.isArray(d) ? d : (d.categories || []));
            }
            if (prodRes.ok) {
                const d = await prodRes.json();
                setProducts(Array.isArray(d) ? d : (d.products || []));
            }
        } catch (e) {
            toast.error('データの取得に失敗しました');
        } finally {
            setIsLoadingData(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (!loading && isAuthenticated && user?.role === 'ADMIN') {
            fetchAll();
        }
    }, [loading, isAuthenticated, user, fetchAll]);

    // ---- Product CRUD ----
    const openAdd = () => {
        setForm(EMPTY_FORM);
        setShowAddModal(true);
    };

    const openEdit = (product) => {
        setEditTarget(product);
        setForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price ?? '',
            comparePrice: product.comparePrice ?? '',
            sku: product.sku || '',
            categoryId: product.categoryId || '',
            stock: product.stock ?? '',
            unit: product.unit || '個',
            minOrder: product.minOrder ?? 1,
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured ?? false,
            tags: Array.isArray(product.tags) ? product.tags.join('、') : (product.tags || ''),
            images: product.images || [],
        });
        setShowEditModal(true);
    };

    const buildBody = (f) => ({
        name: f.name,
        description: f.description,
        price: Number(f.price),
        comparePrice: f.comparePrice !== '' ? Number(f.comparePrice) : undefined,
        sku: f.sku,
        categoryId: f.categoryId || undefined,
        stock: Number(f.stock),
        unit: f.unit,
        minOrder: Number(f.minOrder),
        isActive: f.isActive,
        isFeatured: f.isFeatured,
        tags: f.tags ? f.tags.split(/[,、\s]+/).map(t => t.trim()).filter(Boolean) : [],
        images: f.images,
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const toastId = toast.loading('商品を作成中...');
        try {
            const res = await fetch(`${API_URL}/api/shop/admin/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(buildBody(form)),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || '作成に失敗しました');
            }
            toast.success('商品を作成しました', { id: toastId });
            setShowAddModal(false);
            fetchAll();
        } catch (e) {
            toast.error(e.message, { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editTarget) return;
        setSubmitting(true);
        const toastId = toast.loading('商品を更新中...');
        try {
            const res = await fetch(`${API_URL}/api/shop/admin/products/${editTarget.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(buildBody(form)),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || '更新に失敗しました');
            }
            toast.success('商品を更新しました', { id: toastId });
            setShowEditModal(false);
            setEditTarget(null);
            fetchAll();
        } catch (e) {
            toast.error(e.message, { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (product) => {
        const toastId = toast.loading('更新中...');
        try {
            const res = await fetch(`${API_URL}/api/shop/admin/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ ...product, isActive: !product.isActive }),
            });
            if (!res.ok) throw new Error('更新に失敗しました');
            toast.success(product.isActive ? '商品を無効化しました' : '商品を有効化しました', { id: toastId });
            fetchAll();
        } catch (e) {
            toast.error(e.message, { id: toastId });
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setAddingCategory(true);
        const toastId = toast.loading('カテゴリを作成中...');
        try {
            const res = await fetch(`${API_URL}/api/shop/admin/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ name: newCategoryName.trim(), description: newCategoryDesc.trim() }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'カテゴリ作成に失敗しました');
            }
            toast.success('カテゴリを作成しました', { id: toastId });
            setNewCategoryName('');
            setNewCategoryDesc('');
            fetchAll();
        } catch (e) {
            toast.error(e.message, { id: toastId });
        } finally {
            setAddingCategory(false);
        }
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : '—';
    };

    // ---- Form field helper ----
    const F = ({ label, children, required }) => (
        <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );

    const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all font-medium";

    // ---- Modal ----
    const ProductModal = ({ title, onSubmit, onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <F label="商品名" required>
                            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </F>
                    </div>
                    <div className="col-span-2">
                        <F label="説明">
                            <textarea className={cn(inputCls, "resize-none")} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </F>
                    </div>
                    <F label="販売価格（円）" required>
                        <input type="number" min="0" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                    </F>
                    <F label="定価（円）">
                        <input type="number" min="0" className={inputCls} value={form.comparePrice} onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))} />
                    </F>
                    <F label="SKU">
                        <input className={inputCls} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="FF-001" />
                    </F>
                    <F label="カテゴリ">
                        <select className={inputCls} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                            <option value="">未分類</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </F>
                    <F label="在庫数" required>
                        <input type="number" min="0" className={inputCls} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
                    </F>
                    <F label="単位">
                        <input className={inputCls} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="個" />
                    </F>
                    <F label="最低注文数">
                        <input type="number" min="1" className={inputCls} value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} />
                    </F>
                    <div className="col-span-2">
                        <F label="タグ（カンマ・読点区切り）">
                            <input className={inputCls} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="フォーム、吸水" />
                        </F>
                    </div>
                    <div className="col-span-2 flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div
                                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-colors relative",
                                    form.isActive ? "bg-emerald-400" : "bg-slate-300"
                                )}
                            >
                                <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform", form.isActive ? "translate-x-5" : "translate-x-1")} />
                            </div>
                            <span className="text-sm font-bold text-slate-600">有効</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div
                                onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-colors relative",
                                    form.isFeatured ? "bg-amber-400" : "bg-slate-300"
                                )}
                            >
                                <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform", form.isFeatured ? "translate-x-5" : "translate-x-1")} />
                            </div>
                            <span className="text-sm font-bold text-slate-600">おすすめ</span>
                        </label>
                    </div>
                    <div className="col-span-2 flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-60">
                            {submitting ? '保存中...' : '保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <RefreshCw className="animate-spin text-emerald-500" size={32} />
        </div>
    );

    return (
        <>
            {/* Add Modal */}
            {showAddModal && (
                <ProductModal
                    title="新規商品追加"
                    onSubmit={handleCreate}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <ProductModal
                    title="商品編集"
                    onSubmit={handleUpdate}
                    onClose={() => { setShowEditModal(false); setEditTarget(null); }}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 pb-24">

                {/* Header */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                    <ArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <Package className="text-emerald-500" size={24} /> ショップ商品管理
                                    </h1>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Shop Product Management</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/shop/orders"
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-sm"
                                >
                                    <ShoppingCart size={16} />
                                    注文管理
                                    <ChevronRight size={14} />
                                </Link>
                                <button
                                    onClick={openAdd}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-sm"
                                >
                                    <Plus size={16} />
                                    新規商品
                                </button>
                                <button
                                    onClick={fetchAll}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                                >
                                    <RefreshCw size={18} className={isLoadingData ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                    {/* Products Table */}
                    <GlassCard className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <List className="text-emerald-500" size={20} />
                            <h2 className="font-black text-slate-800">商品一覧</h2>
                            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                {products.length} 件
                            </span>
                        </div>

                        {isLoadingData ? (
                            <div className="flex items-center justify-center py-16">
                                <RefreshCw className="animate-spin text-emerald-400" size={28} />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <Package size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-bold">商品がありません</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60">
                                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">商品名</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">カテゴリ</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">価格</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">在庫</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">状態</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">おすすめ</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{product.name}</div>
                                                    {product.sku && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{product.sku}</div>}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg">
                                                        {getCategoryName(product.categoryId)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="font-black text-slate-800">¥{(product.price ?? 0).toLocaleString()}</div>
                                                    {product.comparePrice && (
                                                        <div className="text-[11px] text-slate-400 line-through">¥{product.comparePrice.toLocaleString()}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className={cn(
                                                        "font-bold",
                                                        product.stock === 0 ? "text-rose-500" :
                                                        product.stock < 10 ? "text-amber-500" : "text-slate-700"
                                                    )}>
                                                        {product.stock ?? 0}
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-1">{product.unit || '個'}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleActive(product)}
                                                        title={product.isActive ? '無効化する' : '有効化する'}
                                                        className="inline-flex items-center gap-1"
                                                    >
                                                        {product.isActive ? (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                                                                <ToggleRight size={14} /> 有効
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">
                                                                <ToggleLeft size={14} /> 無効
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {product.isFeatured ? (
                                                        <Star size={16} className="mx-auto text-amber-400 fill-amber-400" />
                                                    ) : (
                                                        <StarOff size={16} className="mx-auto text-slate-300" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => openEdit(product)}
                                                        className="p-2 hover:bg-emerald-100 rounded-xl transition-colors text-emerald-600"
                                                        title="編集"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>

                    {/* Categories */}
                    <GlassCard className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Layers className="text-teal-500" size={20} />
                            <h2 className="font-black text-slate-800">カテゴリ管理</h2>
                        </div>
                        <div className="p-6 grid md:grid-cols-2 gap-6">
                            {/* Category list */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">カテゴリ一覧</p>
                                {categories.length === 0 ? (
                                    <p className="text-sm text-slate-400">カテゴリがありません</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {categories.map(cat => (
                                            <li key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                <Tag size={14} className="text-teal-500 flex-shrink-0" />
                                                <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
                                                {cat.description && (
                                                    <span className="text-xs text-slate-400 ml-1">{cat.description}</span>
                                                )}
                                                <span className="ml-auto text-xs text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                                                    {products.filter(p => p.categoryId === cat.id).length} 件
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Add category form */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">新規カテゴリ追加</p>
                                <form onSubmit={handleAddCategory} className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="カテゴリ名 *"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all font-medium"
                                    />
                                    <input
                                        type="text"
                                        placeholder="説明（任意）"
                                        value={newCategoryDesc}
                                        onChange={e => setNewCategoryDesc(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={addingCategory || !newCategoryName.trim()}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                                    >
                                        <FolderPlus size={15} />
                                        {addingCategory ? '作成中...' : 'カテゴリを追加'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </GlassCard>

                </div>
            </div>
        </>
    );
}
