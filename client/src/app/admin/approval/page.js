'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CheckCircle2, XCircle, Clock, User, Globe, MapPin, 
  X, Palette, Flower2, Award, Building2, ShieldCheck, FileText, Loader2, ArrowLeft, Mail, ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

const TABS = [
  { id: 'projects', label: '企画審査', icon: Award, color: 'text-sky-500', bg: 'bg-sky-100', activeBg: 'bg-sky-500' },
  { id: 'florists', label: '花屋審査', icon: Flower2, color: 'text-pink-500', bg: 'bg-pink-100', activeBg: 'bg-pink-500' },
  { id: 'illustrators', label: '絵師審査', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-100', activeBg: 'bg-purple-500' },
  { id: 'venues', label: '会場登録', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-100', activeBg: 'bg-emerald-500' },
  { id: 'organizers', label: '主催者', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-100', activeBg: 'bg-rose-500' }
];

// --- 安全なテキスト抽出ヘルパー ---
const getItemTitle = (item, type) => {
  if (!item) return '不明';
  if (type === 'projects') return item.title || '名称未設定';
  if (type === 'florists') return item.platformName || item.shopName || '名称未設定';
  if (type === 'illustrators') return item.handleName || item.name || '名称未設定';
  if (type === 'venues') return item.venueName || '名称未設定';
  if (type === 'organizers') return item.name || '名称未設定';
  return '不明';
}

const getItemSub = (item, type) => {
  if (!item) return '';
  if (type === 'projects') return item.planner?.handleName || item.planner?.name || '主催者不明';
  if (type === 'florists') return item.contactName || '担当者不明';
  if (type === 'illustrators') return item.name || '本名未設定';
  if (type === 'venues') return item.address || '住所未設定';
  if (type === 'organizers') return item.email || 'メール未設定';
  return item.email || '';
}

// 安全な日付フォーマット関数（空なら「日付不明」を返す）
const safeFormatDate = (dateString) => {
  if (!dateString) return '日付不明';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '日付エラー';
  }
};

// --- 動的詳細モーダル ---
function DetailModal({ item, type, onClose, onAction, isProcessing }) {
  if (!item) return null;
  const tabInfo = TABS.find(t => t.id === type) || TABS[0];
  const Icon = tabInfo.icon;

  const renderFields = () => {
    switch (type) {
      case 'projects':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">企画名</label><p className="font-bold text-slate-800">{item.title || '未設定'}</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主催者</label><p className="font-bold text-slate-800">{item.planner?.handleName || item.planner?.name || '不明'}</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目標金額</label><p className="font-bold text-slate-800">{(item.targetAmount || 0).toLocaleString()} pt</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">納品予定日</label><p className="font-bold text-slate-800">{safeFormatDate(item.eventDate || item.deliveryDateTime)}</p></div>
            </div>
            <div className="mt-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">企画詳細</label>
              <p className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 mt-1.5 whitespace-pre-wrap font-medium">{item.description || '未入力'}</p>
            </div>
          </>
        );
      case 'florists':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活動名 (公開用)</label><p className="font-bold text-slate-800">{item.platformName || '未設定'}</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">店舗名/屋号</label><p className="font-bold text-slate-800">{item.shopName || '未設定'}</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">担当者名</label><p className="font-bold text-slate-800">{item.contactName || '未設定'}</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">連絡先メール</label><p className="font-bold text-slate-800">{item.email || '未設定'}</p></div>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> 住所</label><p className="bg-slate-50 p-3 rounded-lg text-sm font-bold text-slate-700 mt-1">{item.address || '未入力'}</p></div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Globe size={12}/> ポートフォリオ / Webサイト</label>
                {item.portfolio ? <a href={item.portfolio} target="_blank" rel="noreferrer" className="text-sky-500 font-bold hover:underline mt-1 block text-sm">{item.portfolio}</a> : <p className="text-sm text-slate-400 mt-1">なし</p>}
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">自己紹介・アピール</label><p className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 mt-1.5 whitespace-pre-wrap font-medium">{item.bio || '未入力'}</p></div>
            </div>
          </>
        );
      case 'illustrators':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ペンネーム (活動名)</label><p className="font-bold text-slate-800">{item.handleName || '未設定'}</p></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本名</label><p className="font-bold text-slate-800">{item.name || '未設定'}</p></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">連絡先メール</label><p className="font-bold text-slate-800">{item.email || '未設定'}</p></div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Globe size={12}/> ポートフォリオ・実績</label>
                {item.portfolio ? <a href={item.portfolio} target="_blank" rel="noreferrer" className="text-sky-500 font-bold hover:underline mt-1 block text-sm">{item.portfolio}</a> : <p className="text-sm text-slate-400 mt-1">なし</p>}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Twitter / SNS</label>
                {item.twitter ? <a href={item.twitter.startsWith('http') ? item.twitter : `https://twitter.com/${item.twitter}`} target="_blank" rel="noreferrer" className="text-sky-500 font-bold hover:underline mt-1 block text-sm">{item.twitter}</a> : <p className="text-sm text-slate-400 mt-1">なし</p>}
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">アピール・得意なジャンル</label><p className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 mt-1.5 whitespace-pre-wrap font-medium">{item.bio || '未入力'}</p></div>
            </div>
          </>
        );
      case 'venues':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">会場・ホール名</label><p className="font-bold text-slate-800">{item.venueName || '未設定'}</p></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">所在地</label><p className="font-bold text-slate-800">{item.address || '未設定'}</p></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">連絡先メール</label><p className="font-bold text-slate-800">{item.email || '未設定'}</p></div>
          </div>
        );
      case 'organizers':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">団体 / 法人名</label><p className="font-bold text-slate-800">{item.name || '未設定'}</p></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">連絡先メール</label><p className="font-bold text-slate-800">{item.email || '未設定'}</p></div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Globe size={12}/> 公式Webサイト</label>
              {item.website ? <a href={item.website} target="_blank" rel="noreferrer" className="text-sky-500 font-bold hover:underline mt-1 block text-sm">{item.website}</a> : <p className="text-sm text-slate-400 mt-1">なし</p>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className={cn("p-1.5 rounded-lg shadow-inner", tabInfo.bg, tabInfo.color)}><Icon size={18} /></span>
            申請内容の詳細
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-slate-100/50"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
          {renderFields()}
        </div>

        <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={() => onAction(item.id, 'REJECTED')} disabled={isProcessing} className="flex-1 bg-white border border-rose-200 text-rose-500 font-black py-4 rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm text-sm">
            <XCircle size={18}/> 却下する
          </button>
          <button onClick={() => onAction(item.id, 'APPROVED')} disabled={isProcessing} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md text-sm">
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18}/>}
            この申請を承認する
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ApprovalHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'projects';
  const { user, isAuthenticated, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [counts, setCounts] = useState({ projects: 0, florists: 0, illustrators: 0, venues: 0, organizers: 0 });

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      toast.error('管理者権限がありません');
      router.push('/login');
    }
  }, [loading, isAuthenticated, user, router]);

  const fetchCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [projRes, floRes, illRes, venRes, orgRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/projects/pending`, { headers }),
        fetch(`${API_URL}/api/admin/florists/pending`, { headers }),
        fetch(`${API_URL}/api/admin/illustrators/pending`, { headers }),
        fetch(`${API_URL}/api/admin/venues/pending`, { headers }),
        fetch(`${API_URL}/api/admin/organizers/pending`, { headers }),
      ]);
      const [proj, flo, ill, ven, org] = await Promise.all([
        projRes.ok ? projRes.json() : [], floRes.ok ? floRes.json() : [], 
        illRes.ok ? illRes.json() : [], venRes.ok ? venRes.json() : [], orgRes.ok ? orgRes.json() : []
      ]);
      setCounts({
        projects: Array.isArray(proj) ? proj.length : 0, 
        florists: Array.isArray(flo) ? flo.length : 0, 
        illustrators: Array.isArray(ill) ? ill.length : 0,
        venues: Array.isArray(ven) ? ven.length : 0, 
        organizers: Array.isArray(org) ? org.length : 0
      });
    } catch (error) {
      console.error('Count fetch error:', error);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoadingData(true);
    setSelectedItem(null); 
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/admin/${activeTab}/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('データの取得に失敗しました');
      setItems([]);
    } finally {
      setLoadingData(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchCounts();
      fetchItems();
    }
  }, [isAuthenticated, user, fetchCounts, fetchItems]);

  const handleUpdateStatus = async (id, status) => {
    setIsProcessing(true);
    const toastId = toast.loading('処理中...');
    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/admin/${activeTab}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('処理に失敗しました');

      toast.success(status === 'APPROVED' ? '承認しました！' : '却下しました', { id: toastId });
      setSelectedItem(null);
      fetchItems();
      fetchCounts();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(item => {
      if (!item) return false;
      const text = `${item.title||''} ${item.platformName||''} ${item.shopName||''} ${item.name||''} ${item.handleName||''} ${item.email||''} ${item.venueName||''}`.toLowerCase();
      return text.includes(lower);
    });
  }, [items, searchTerm]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>;
  }

  const activeTabInfo = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-sky-500 transition-colors uppercase tracking-widest mb-3 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
              <ArrowLeft size={12}/> ダッシュボードへ戻る
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
              <span className="bg-slate-900 text-white p-2 rounded-xl shadow-lg"><FileText size={20}/></span> 
              統合審査センター
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-2">各種アカウントや企画の登録申請を一元管理します。</p>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={cn(
                "flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all",
                activeTab === tab.id ? `${tab.activeBg} text-white shadow-md` : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : tab.color} />
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={cn("px-2 py-0.5 rounded-full text-[10px]", activeTab === tab.id ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600")}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* メインエリア */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <h2 className="font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
              <span className={cn("p-1.5 rounded-lg shadow-inner", activeTabInfo.bg, activeTabInfo.color)}><activeTabInfo.icon size={16}/></span>
              {activeTabInfo.label} の審査待ち
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md">{filteredItems.length}件</span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" placeholder="名前やメールで検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="p-5 md:p-8 bg-slate-50/30 min-h-[400px]">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-slate-300 w-8 h-8 mb-4" />
                <p className="text-xs font-bold text-slate-500">データを読み込み中...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={40} />
                <p className="text-slate-600 font-black text-base">現在、審査待ちはありません</p>
                <p className="text-xs font-bold text-slate-400 mt-2">すべて処理済みです！素晴らしいです 🎉</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div 
                      key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col group relative overflow-hidden"
                    >
                      <div className={cn("absolute top-0 left-0 w-full h-1", activeTabInfo.activeBg)} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-amber-100 text-amber-600 text-[9px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-widest shadow-sm">
                          <Clock size={10} /> 審査待ち
                        </span>
                        {/* 修正: 安全な日付表示関数を使用 */}
                        <span className="text-[10px] font-bold text-slate-400">{safeFormatDate(item.createdAt)}</span>
                      </div>
                      
                      <h3 className="font-black text-slate-800 text-base md:text-lg mb-1.5 line-clamp-1 group-hover:text-sky-500 transition-colors" title={getItemTitle(item, activeTab)}>
                        {getItemTitle(item, activeTab)}
                      </h3>
                      
                      <div className="text-xs font-medium text-slate-500 space-y-1 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="flex items-center gap-2 truncate"><User size={12} className="text-slate-400 shrink-0"/> {getItemSub(item, activeTab)}</p>
                        <p className="flex items-center gap-2 truncate"><Mail size={12} className="text-slate-400 shrink-0"/> {item.email || item.planner?.email || 'メールなし'}</p>
                      </div>

                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="mt-auto w-full py-3 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg active:scale-95"
                      >
                        内容を確認して審査へ <ChevronRight size={14}/>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {selectedItem && (
          <DetailModal 
            item={selectedItem} type={activeTab} onClose={() => setSelectedItem(null)} 
            onAction={handleUpdateStatus} isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

export default function UnifiedApprovalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>}>
      <ApprovalHubContent />
    </Suspense>
  );
}