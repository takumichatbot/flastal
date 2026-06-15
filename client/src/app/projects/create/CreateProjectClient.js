'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import AiPlanGenerator from '@/app/components/AiPlanGenerator';

import {
  Calendar, MapPin, X, Image as ImageIcon, Loader2, Plus,
  Award, Search, AlertTriangle, ZoomIn, Sparkles,
  Wand2, Lock, Globe, ArrowRight, Paintbrush, FileText,
  Clock, UserPlus, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import FloatingParticles from '@/app/components/FloatingParticles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const formatDisplayDate = (dateString) => {
  if (!dateString) return '日付未定';
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  });
};

const STEPS = [
  { id: 1, label: 'イベント' },
  { id: 2, label: '内容' },
  { id: 3, label: '予算' },
  { id: 4, label: '詳細' },
  { id: 5, label: '確認' },
];

const STEP_TITLES = [
  'イベントと公開設定',
  '企画の内容を書こう',
  '予算を決めよう',
  'お届けとデザイン',
  '確認して作成',
];

// ── Slide animation ──────────────────────────────────────────
const slideVariants = {
  initial: (d) => ({ x: d * 48, opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    (d) => ({ x: -d * 48, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }),
};

// ── Shared UI primitives ──────────────────────────────────────
const GlassCard = ({ children, className }) => (
  <div className={cn(
    'bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.05)] rounded-[2rem] p-6',
    className,
  )}>
    {children}
  </div>
);

const InputLabel = ({ icon: Icon, title, subtitle, required }) => (
  <div className="flex items-end gap-2 mb-3 pl-1">
    {Icon && <Icon className="text-pink-400 mb-0.5 shrink-0" size={16} />}
    <label className="block text-sm font-black text-slate-700 tracking-tight">
      {title}{required && <span className="text-pink-500 ml-1">*</span>}
    </label>
    {subtitle && <span className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">{subtitle}</span>}
  </div>
);

const GlassInput = (props) => (
  <input
    {...props}
    className={cn(
      'w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl',
      'focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50',
      'transition-all font-bold text-slate-800 placeholder:text-slate-300 text-[16px]',
      props.className,
    )}
  />
);

const GlassTextarea = (props) => (
  <textarea
    {...props}
    className={cn(
      'w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl resize-none',
      'focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50',
      'transition-all font-bold text-slate-800 placeholder:text-slate-300 leading-relaxed text-[16px]',
      props.className,
    )}
  />
);

// ── Modals ───────────────────────────────────────────────────
function EventSelectionModal({ onClose, onSelect }) {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/events/public`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(d); setFiltered(d); })
      .catch(() => toast.error('イベント情報の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const lq = q.toLowerCase();
    setFiltered(events.filter(e =>
      e.title.toLowerCase().includes(lq) ||
      (e.venue?.venueName || '').toLowerCase().includes(lq),
    ));
  }, [q, events]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-end sm:items-center z-50 backdrop-blur-md">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white">
          <div>
            <span className="text-[10px] font-black text-sky-500 tracking-widest uppercase block mb-0.5">Official Events</span>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Calendar className="text-sky-500" size={20} /> 公式イベントを探す
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 border border-slate-100 shadow-sm">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="イベント名や会場名で検索..." value={q} onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:border-sky-300 outline-none text-[16px] font-bold transition-all text-slate-700" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin text-sky-500 mb-2" size={28} />
              <span className="text-sm font-bold">読み込み中...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3 opacity-40">😢</div>
              <p className="font-bold text-sm">該当するイベントが見つかりません</p>
            </div>
          ) : filtered.map(event => (
            <button key={event.id} onClick={() => { onSelect(event); onClose(); }}
              className="w-full text-left p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-sky-300 hover:shadow-[0_4px_20px_rgba(56,189,248,0.15)] transition-all group">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-sky-50 text-sky-600 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-sky-100">
                  {event.organizer?.name || 'Official'}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-800 group-hover:text-sky-600 mb-3 line-clamp-2 leading-tight">{event.title}</h4>
              <div className="text-xs font-bold text-slate-500 space-y-1.5 bg-slate-50 p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5"><Calendar className="text-sky-400 shrink-0" size={12} />{formatDisplayDate(event.eventDate)}</div>
                <div className="flex items-center gap-1.5"><MapPin className="text-sky-400 shrink-0" size={12} />{event.venue?.venueName || '会場未定'}</div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function VenueSelectionModal({ onClose, onSelect }) {
  const [venues, setVenues] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/venues`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setVenues(d); setFiltered(d); })
      .catch(() => toast.error('会場リストの読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const lq = q.toLowerCase();
    setFiltered(venues.filter(v =>
      v.venueName.toLowerCase().includes(lq) || (v.address || '').toLowerCase().includes(lq),
    ));
  }, [q, venues]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-end sm:items-center z-50 backdrop-blur-md">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        <div className="p-5 border-b border-emerald-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
          <div>
            <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase block mb-0.5">Venue Select</span>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <MapPin className="text-emerald-500" size={20} /> 会場を選択
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 border border-emerald-50 shadow-sm">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="会場名や住所で検索..." value={q} onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 outline-none text-[16px] font-bold transition-all text-slate-700" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin text-emerald-500 mb-2" size={28} />
              <span className="text-sm font-bold">読み込み中...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3 opacity-40">🏢</div>
              <p className="font-bold text-sm">該当する会場が見つかりません</p>
            </div>
          ) : filtered.map(venue => (
            <button key={venue.id} onClick={() => { onSelect(venue); onClose(); }}
              className="w-full text-left p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-emerald-300 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] transition-all group">
              <div className="font-black text-slate-800 group-hover:text-emerald-600 text-base mb-2 transition-colors">{venue.venueName}</div>
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                <MapPin className="text-emerald-400 shrink-0" size={12} />
                <span className="truncate">{venue.address || '住所未登録'}</span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ImageLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[110] border border-white/20">
        <X size={22} />
      </button>
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        src={url} alt="" onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl pointer-events-none"
      />
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={cn(
            'rounded-full transition-all duration-300 ease-out',
            s.id === current
              ? 'w-8 h-2.5 bg-gradient-to-r from-pink-500 to-rose-500 shadow-sm shadow-pink-300'
              : s.id < current
              ? 'w-2.5 h-2.5 bg-pink-300'
              : 'w-2.5 h-2.5 bg-slate-200',
          )} />
          {i < STEPS.length - 1 && (
            <div className={cn('h-0.5 w-4 mx-1 rounded transition-colors duration-300', s.id < current ? 'bg-pink-300' : 'bg-slate-100')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────
function CreateProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');
  const venueIdFromUrl = searchParams.get('venueId');

  const { user, authenticatedFetch, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDesignUploading, setIsDesignUploading] = useState(false);

  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAiPlanModalOpen, setIsAiPlanModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const [deliveryDateObj, setDeliveryDateObj] = useState('');
  const [deliveryTimeText, setDeliveryTimeText] = useState('午前中');
  const [needsIllustrator, setNeedsIllustrator] = useState(false);
  const [budgetRefs, setBudgetRefs] = useState([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    minContributionAmount: '1000',
    deliveryAddress: '',
    venueId: '',
    eventId: '',
    imageUrl: '',
    designImageUrls: [],
    designDetails: '',
    size: '',
    flowerTypes: '',
    projectType: 'PUBLIC',
    password: '',
    illustratorBudget: '',
    illustratorRequirements: '',
    isExpress: false,
  });

  useEffect(() => {
    fetch(`${API_URL}/api/tools/budget-references`)
      .then(r => r.ok ? r.json() : [])
      .then(setBudgetRefs)
      .catch(() => {})
      .finally(() => setIsLoadingRefs(false));
  }, []);

  const rushFeeAlert = (() => {
    if (!deliveryDateObj) return null;
    const diff = Math.ceil((new Date(`${deliveryDateObj}T12:00:00+09:00`) - Date.now()) / 86400000);
    if (diff <= 1) return { rate: '30%', label: '超特急', days: '前日・当日', msg: '在庫対応か無理な時間調整を伴います。' };
    if (diff <= 3) return { rate: '20%', label: '特急', days: '2〜3日前', msg: '市場外での花材の急ぎ確保が必要になる時期です。' };
    if (diff <= 7) return { rate: '10%', label: '急ぎ', days: '4〜7日前', msg: '花材の予約がギリギリ間に合う時期です。' };
    return null;
  })();

  const uploadImageToS3 = async (file) => {
    const res = await authenticatedFetch('/api/tools/s3-upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });
    if (!res.ok) throw new Error('署名付きURLの取得に失敗しました');
    const { uploadUrl, fileUrl } = await res.json();
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.onload = () => xhr.status === 200 ? resolve(fileUrl) : reject(new Error('S3アップロード失敗'));
      xhr.onerror = () => reject(new Error('ネットワークエラー'));
      xhr.send(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const tid = toast.loading('メイン画像をアップロード中...');
    try {
      const url = await uploadImageToS3(file);
      setFormData(p => ({ ...p, imageUrl: url }));
      toast.success('画像をアップロードしました！', { id: tid });
    } catch { toast.error('アップロードに失敗しました', { id: tid }); }
    finally { setIsUploading(false); }
  };

  const handleDesignImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsDesignUploading(true);
    const tid = toast.loading(`${files.length}枚アップロード中...`);
    try {
      const urls = await Promise.all(files.map(f => uploadImageToS3(f)));
      setFormData(p => ({ ...p, designImageUrls: [...p.designImageUrls, ...urls] }));
      toast.success('デザイン画像をアップロードしました！', { id: tid });
    } catch { toast.error('一部のアップロードに失敗しました', { id: tid }); }
    finally { setIsDesignUploading(false); e.target.value = ''; }
  };

  const fetchEventDetails = useCallback(async (id) => {
    if (!id) { setEventLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedEvent(data);
      if (data.eventDate) {
        const d = new Date(data.eventDate);
        setDeliveryDateObj(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
      }
      setFormData(prev => ({
        ...prev,
        title: data.title ? `【企画】${data.title} フラスタ企画` : prev.title,
        eventId: data.id,
        ...(data.venue ? { venueId: data.venue.id, deliveryAddress: data.venue.address || data.venue.venueName } : {}),
      }));
      if (data.venue) setSelectedVenue(data.venue);
    } catch { /* ignore */ }
    finally { setEventLoading(false); }
  }, []);

  const handleVenueSelect = (venue) => {
    if (venue) {
      setSelectedVenue(venue);
      setFormData(p => ({ ...p, deliveryAddress: venue.address || venue.venueName, venueId: venue.id }));
    } else {
      setSelectedVenue(null);
      setFormData(p => ({ ...p, deliveryAddress: '', venueId: '' }));
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!['USER', 'ORGANIZER', 'ADMIN'].includes(user.role)) {
      toast.error('企画作成は一般ユーザー・主催者のみ可能です。');
      router.push('/');
      return;
    }
    if (eventIdFromUrl) fetchEventDetails(eventIdFromUrl);
    else if (venueIdFromUrl) {
      fetch(`${API_URL}/api/venues/${venueIdFromUrl}`)
        .then(r => r.json())
        .then(v => { if (v) handleVenueSelect(v); })
        .catch(() => {})
        .finally(() => setEventLoading(false));
    } else {
      setEventLoading(false);
    }
  }, [user, authLoading, router, eventIdFromUrl, venueIdFromUrl, fetchEventDetails]);

  const handleEventSelect = (event) => {
    if (!event) return;
    setSelectedEvent(event);
    if (event.eventDate) {
      const d = new Date(event.eventDate);
      setDeliveryDateObj(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    }
    setFormData(p => ({
      ...p,
      title: `【企画】${event.title} フラスタ企画`,
      eventId: event.id,
      ...(event.venue ? { venueId: event.venue.id, deliveryAddress: event.venue.address || event.venue.venueName } : {}),
    }));
    if (event.venue) setSelectedVenue(event.venue);
    toast.success('イベント情報をセットしました！');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const validateStep = (s) => {
    switch (s) {
      case 1:
        if (formData.projectType === 'PRIVATE' && !formData.password.trim())
          return '合言葉（パスワード）を入力してください';
        return null;
      case 2:
        if (!formData.title.trim()) return '企画タイトルを入力してください';
        if (!formData.description.trim()) return '企画の説明を入力してください';
        return null;
      case 3: {
        const amount = parseInt(formData.targetAmount, 10);
        if (isNaN(amount) || amount < 1000) return '目標金額は1,000円以上で設定してください';
        return null;
      }
      case 4:
        if (!selectedVenue && !formData.deliveryAddress.trim()) return 'お届け先を入力してください';
        if (!deliveryDateObj) return '納品希望日を選択してください';
        if (needsIllustrator && !formData.illustratorBudget) return 'クリエイターへの依頼予算を入力してください';
        if (needsIllustrator && !formData.illustratorRequirements.trim()) return '求めるイラストの条件を入力してください';
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setDir(1);
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goPrev = () => {
    setDir(-1);
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    let deliveryDateTimeISO;
    try {
      if (!deliveryDateObj) throw new Error('納品希望日を選択してください');
      const dateObj = new Date(`${deliveryDateObj}T12:00:00+09:00`);
      if (isNaN(dateObj.getTime())) throw new Error('日時の形式が正しくありません');
      deliveryDateTimeISO = dateObj.toISOString();
    } catch (err) {
      toast.error(err.message);
      return;
    }

    setIsSubmitting(true);
    const tid = toast.loading('企画を保存中...');
    try {
      const amount = parseInt(formData.targetAmount, 10);
      const payload = {
        title: formData.title || '',
        description: formData.description || '',
        targetAmount: amount,
        minContributionAmount: parseInt(formData.minContributionAmount, 10) || 1000,
        deliveryAddress: `${formData.deliveryAddress || selectedVenue?.address || ''} 【希望時間帯: ${deliveryTimeText || '指定なし'}】`,
        deliveryDateTime: deliveryDateTimeISO,
        imageUrl: formData.imageUrl || '',
        designImageUrls: formData.designImageUrls || [],
        designDetails: formData.designDetails || '',
        size: formData.size || '',
        flowerTypes: formData.flowerTypes || '',
        projectType: formData.projectType || 'PUBLIC',
        password: formData.password || null,
        venueId: selectedVenue?.id || null,
        eventId: selectedEvent?.id || null,
        visibility: 'PUBLIC',
        needsIllustrator,
        illustratorBudget: needsIllustrator ? parseInt(formData.illustratorBudget, 10) : null,
        illustratorRequirements: needsIllustrator ? formData.illustratorRequirements : null,
        isExpress: formData.isExpress,
      };

      const res = await authenticatedFetch(`${API_URL}/api/projects`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '作成に失敗しました。');
      }

      toast.success('企画を作成しました！', { id: tid });
      setTimeout(() => { window.location.href = '/mypage'; }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error.message, { id: tid });
    }
  };

  if (authLoading || !user || eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50/50">
        <Loader2 className="animate-spin text-pink-500 w-12 h-12" />
      </div>
    );
  }

  // ── Step content renderers ─────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // STEP 1: イベントと公開設定
      case 1: return (
        <div className="space-y-5">
          <div className="text-center pt-2 pb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-[1.5rem] shadow-lg border border-pink-100 mb-4 text-pink-500">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">推しへの想いを形にしよう</h2>
            <p className="text-sm font-bold text-slate-400">素敵なフラスタ企画を立ち上げましょう🌸</p>
          </div>

          <GlassCard className="border-2 border-indigo-100 bg-gradient-to-br from-white/90 to-indigo-50/80">
            {!selectedEvent ? (
              <button type="button" onClick={() => setIsEventModalOpen(true)}
                className="w-full flex items-center gap-4 group text-left">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                  <Calendar size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                    <Sparkles size={10} /> Recommended
                  </p>
                  <p className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">公式イベントを選択する</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">会場・日時が自動で入力されます✨</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all border border-indigo-50 shrink-0">
                  <ArrowRight size={18} />
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <span className="bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase inline-block shadow-sm">Official Event</span>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Calendar className="text-indigo-500 shrink-0" size={18} /> {selectedEvent.title}
                </h3>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-1.5">
                    <Clock size={11} className="text-indigo-400" />{formatDisplayDate(selectedEvent.eventDate)}
                  </span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-1.5">
                    <MapPin size={11} className="text-indigo-400" />{selectedEvent.venue?.venueName || '会場未定'}
                  </span>
                </div>
                <button type="button"
                  onClick={() => { setSelectedEvent(null); setSelectedVenue(null); setFormData(p => ({ ...p, eventId: '', title: '', venueId: '', deliveryAddress: '' })); setDeliveryDateObj(''); }}
                  className="text-xs font-bold text-slate-400 hover:text-red-500 bg-white border border-slate-100 px-3 py-1.5 rounded-full transition-colors">
                  選択を解除
                </button>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <InputLabel icon={Globe} title="公開設定" subtitle="参加条件を選びましょう" required />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { id: 'PUBLIC',  emoji: '🌍', title: 'みんなで', desc: '全体公開',   color: 'sky' },
                { id: 'PRIVATE', emoji: '🔒', title: '仲間と',   desc: '合言葉限定', color: 'purple' },
                { id: 'SOLO',    emoji: '👤', title: 'ひとりで', desc: '自分専用',   color: 'emerald' },
              ].map((type) => (
                <button key={type.id} type="button"
                  onClick={() => setFormData(p => ({ ...p, projectType: type.id }))}
                  className={cn(
                    'py-4 px-2 rounded-[1.5rem] border-2 text-center transition-all flex flex-col items-center',
                    formData.projectType === type.id
                      ? `border-${type.color}-400 bg-white shadow-md ring-4 ring-${type.color}-100 scale-[1.03]`
                      : 'border-white/80 bg-white/40 hover:bg-white/70',
                  )}>
                  <div className="text-3xl mb-2">{type.emoji}</div>
                  <div className={cn('font-black text-xs mb-0.5', formData.projectType === type.id ? `text-${type.color}-600` : 'text-slate-600')}>
                    {type.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{type.desc}</div>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {formData.projectType === 'PRIVATE' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden">
                  <div className="bg-purple-50/60 p-4 rounded-[1.5rem] border border-purple-100">
                    <InputLabel icon={Lock} title="合言葉（パスワード）" subtitle="参加者に教える合言葉" required />
                    <GlassInput type="text" name="password" value={formData.password} onChange={handleChange}
                      placeholder="例: oshi2026" className="!bg-white font-mono tracking-widest" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      );

      // STEP 2: タイトル・説明
      case 2: return (
        <div className="space-y-5">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <InputLabel icon={FileText} title="企画タイトル" required />
              <button type="button" onClick={() => setIsAiPlanModalOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 border border-purple-200 px-3 py-2 rounded-full font-black shadow-sm hover:shadow-md hover:scale-105 transition-all shrink-0">
                <Wand2 size={12} /> AIで作成
              </button>
            </div>
            <GlassInput
              type="text" name="title" required
              value={formData.title} onChange={handleChange}
              placeholder="例：○○さん出演祝いフラスタ企画"
            />
          </GlassCard>

          <GlassCard>
            <InputLabel icon={FileText} title="企画の説明" subtitle="熱い想いを語りましょう！" required />
            <GlassTextarea
              name="description" required rows={8}
              value={formData.description} onChange={handleChange}
              placeholder="趣旨や想いを熱く語ってください！参加者の心を動かします✨"
            />
            <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">
              ※具体的なメッセージほど参加者が集まりやすくなります
            </p>
          </GlassCard>
        </div>
      );

      // STEP 3: 予算
      case 3: return (
        <div className="space-y-5">
          <GlassCard className="border-2 border-pink-100 bg-gradient-to-b from-white/90 to-pink-50/40">
            <InputLabel icon={Award} title="目標金額" subtitle="お花の総予算を決めましょう" required />
            <div className="mt-3 flex items-center justify-center bg-white/80 p-6 rounded-[2rem] border border-pink-100 shadow-inner">
              <span className="text-2xl text-pink-400 font-black mr-3">¥</span>
              <input type="number" name="targetAmount" required
                value={formData.targetAmount} onChange={handleChange}
                className="text-5xl md:text-6xl font-black text-slate-800 bg-transparent border-none focus:ring-0 w-full max-w-[260px] text-center placeholder:text-slate-200 outline-none"
                placeholder="30000" />
            </div>
            <div className="mt-5 pt-4 border-t border-pink-100/60">
              <InputLabel title="一口あたりの最低参加額" subtitle="参加者が支援する最低金額" required />
              <div className="flex items-center gap-2 max-w-xs">
                <span className="text-lg text-pink-400 font-black">¥</span>
                <GlassInput type="number" name="minContributionAmount" min="100" step="100" required
                  value={formData.minContributionAmount} onChange={handleChange}
                  className="text-lg text-center" />
                <span className="font-bold text-slate-400 shrink-0">から</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <InputLabel icon={ImageIcon} title="予算・ボリューム目安" subtitle="過去実績でイメージを掴もう" />
            {isLoadingRefs ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-400" size={28} /></div>
            ) : budgetRefs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-slate-100 mt-3">
                現在登録されているカタログはありません
              </div>
            ) : (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {budgetRefs.map(ref => (
                  <div key={ref.id} className="snap-start shrink-0 w-44 border-2 border-slate-100 rounded-[1.5rem] overflow-hidden bg-white hover:border-pink-300 transition-all">
                    <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                      <img src={ref.imageUrl} alt={ref.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 text-center">
                      <h4 className="font-black text-slate-800 text-sm mb-1">{ref.label}</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-2">{ref.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-bold mt-3 text-center">※あくまで目安です。お花屋さんとの相談で調整できます。</p>
          </GlassCard>
        </div>
      );

      // STEP 4: お届けとデザイン
      case 4: return (
        <div className="space-y-5">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <InputLabel icon={MapPin} title="お届け先" required />
              <button type="button" onClick={() => setIsVenueModalOpen(true)}
                className="text-xs bg-emerald-50 text-emerald-600 px-3 py-2 rounded-full font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 shrink-0">
                <Search size={11} /> 会場を検索
              </button>
            </div>
            {selectedVenue ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-[1.5rem] flex justify-between items-center">
                <div>
                  <p className="font-black text-emerald-900 text-base">{selectedVenue.venueName}</p>
                  <p className="text-xs font-bold text-emerald-700 opacity-80 mt-0.5">{selectedVenue.address}</p>
                </div>
                <button type="button" onClick={() => handleVenueSelect(null)}
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-emerald-400 hover:text-red-500 transition-colors shadow-sm shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <GlassInput type="text" name="deliveryAddress" required value={formData.deliveryAddress}
                onChange={handleChange} placeholder="例：東京都渋谷区○○..." />
            )}
          </GlassCard>

          <GlassCard>
            <InputLabel icon={Clock} title="納品希望日・時間帯" required />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <GlassInput type="date" required value={deliveryDateObj} onChange={e => setDeliveryDateObj(e.target.value)} />
              <div>
                <GlassInput type="text" list="time-slots" required value={deliveryTimeText}
                  onChange={e => setDeliveryTimeText(e.target.value)} placeholder="例: 午前中" />
                <datalist id="time-slots">
                  <option value="午前中" /><option value="12:00〜14:00" />
                  <option value="14:00〜16:00" /><option value="16:00〜18:00" />
                  <option value="時間指定なし" />
                </datalist>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">※お花屋さんが動きやすいよう、大まかな時間帯でOKです</p>

            <AnimatePresence>
              {rushFeeAlert && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 overflow-hidden">
                  <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-black text-rose-700">⚠️ {rushFeeAlert.label}料金（目安: +{rushFeeAlert.rate}）</p>
                    <p className="text-xs text-rose-600/80 font-bold mt-1 leading-relaxed">
                      {rushFeeAlert.days}のお届けのため、特急料金が加算される場合があります。<br />
                      <span className="opacity-75">{rushFeeAlert.msg}</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 bg-sky-50 border border-sky-100 rounded-2xl p-4">
              <p className="text-xs font-black text-sky-800 mb-2 flex items-center gap-1.5">
                <Clock size={13} /> 募集締切は自動設定されます
              </p>
              <p className="text-[11px] text-sky-700 leading-relaxed mb-3">
                原則として <strong className="text-rose-500">「納品希望日の7日前の深夜0時」</strong> に自動設定。目標達成時は即時締め切り。
              </p>
              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-sky-100 cursor-pointer hover:border-sky-300 transition-colors">
                <input type="checkbox" checked={formData.isExpress}
                  onChange={e => setFormData(p => ({ ...p, isExpress: e.target.checked }))}
                  className="w-5 h-5 text-sky-500 rounded border-gray-300 focus:ring-sky-500 mt-0.5 cursor-pointer shrink-0" />
                <div>
                  <p className="text-sm font-black text-slate-800">お急ぎ便（締切を3日前に短縮）</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold">対応できるお花屋さんが限られる場合があります</p>
                </div>
              </label>
            </div>
          </GlassCard>

          <GlassCard>
            <InputLabel icon={Paintbrush} title="デザインと装飾" subtitle="イメージを伝えましょう！" />

            <div className="mt-4">
              <label className="block text-xs font-black text-slate-600 mb-2">
                メイン画像 <span className="text-slate-400 font-bold">（企画一覧のサムネイル）</span>
              </label>
              <div className="border-2 border-dashed border-pink-200 bg-pink-50/50 rounded-[1.5rem] p-5 text-center cursor-pointer relative hover:bg-pink-50 transition-all group">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {formData.imageUrl ? (
                  <div className="relative w-full max-w-xs mx-auto aspect-video rounded-2xl overflow-hidden shadow-md">
                    <Image src={formData.imageUrl} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="py-6">
                    <div className="w-14 h-14 bg-white rounded-[1rem] flex items-center justify-center mx-auto mb-3 text-pink-300 group-hover:text-pink-500 group-hover:scale-110 transition-all shadow-sm">
                      {isUploading ? <Loader2 className="animate-spin" size={26} /> : <ImageIcon size={26} />}
                    </div>
                    <p className="text-sm font-black text-slate-500">タップして画像をアップロード</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-black text-slate-600 mb-3">
                参考画像・ラフ画 <span className="text-slate-400 font-bold">（複数枚OK）</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {formData.designImageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 group">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-[1rem] border-2 border-white shadow-md cursor-zoom-in" onClick={() => setPreviewImageUrl(url)} />
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[1rem] pointer-events-none transition-opacity">
                      <ZoomIn className="text-white" size={20} />
                    </div>
                    <button type="button"
                      onClick={() => setFormData(p => ({ ...p, designImageUrls: p.designImageUrls.filter((_, i) => i !== idx) }))}
                      className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 rounded-full w-7 h-7 flex items-center justify-center shadow-md scale-0 group-hover:scale-100 transition-all z-10 border border-slate-100">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 border-2 border-dashed border-slate-200 bg-white rounded-[1rem] flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all text-slate-400 group shadow-sm">
                  {isDesignUploading ? <Loader2 className="animate-spin text-sky-500 mb-1" size={20} /> : <Plus className="text-slate-300 group-hover:text-sky-500 mb-1" size={24} />}
                  <span className="text-[10px] font-black group-hover:text-sky-600">追加</span>
                  <input type="file" multiple accept="image/*" onChange={handleDesignImagesUpload} disabled={isDesignUploading} className="hidden" />
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 mb-2">デザインの雰囲気</label>
                <GlassTextarea name="designDetails" value={formData.designDetails} onChange={handleChange} rows={3}
                  placeholder="例：青色ベースにリボンと星を散りばめてクールで可愛い感じで！" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-2">希望サイズ</label>
                  <GlassInput type="text" name="size" value={formData.size} onChange={handleChange} placeholder="例：高さ180cm" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 mb-2">使いたいお花</label>
                  <GlassInput type="text" name="flowerTypes" value={formData.flowerTypes} onChange={handleChange} placeholder="例：青いバラ" />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-2 border-amber-100 bg-gradient-to-br from-white/90 to-amber-50/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <InputLabel icon={UserPlus} title="イラストレーターを公募する" subtitle="パネルイラストを外部クリエイターに依頼できます" />
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input type="checkbox" checked={needsIllustrator} onChange={e => setNeedsIllustrator(e.target.checked)} className="sr-only peer" />
                <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400 shadow-inner" />
              </label>
            </div>
            <AnimatePresence>
              {needsIllustrator && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-amber-200/50 space-y-4 overflow-hidden">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2">依頼予算（目安）</label>
                    <div className="relative max-w-xs">
                      <GlassInput type="number" name="illustratorBudget" min="1000" required={needsIllustrator}
                        value={formData.illustratorBudget} onChange={handleChange} placeholder="例: 10000" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">pt</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 ml-1">※この予算は目標金額に含まれます</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2">求めるイラストの条件・テイスト</label>
                    <GlassTextarea name="illustratorRequirements" required={needsIllustrator}
                      value={formData.illustratorRequirements} onChange={handleChange} rows={4}
                      placeholder="例: A3サイズのパネル用イラスト。ポップで可愛いアイドル風の絵柄が得意な方大歓迎！" />
                    <p className="text-[10px] font-bold text-slate-500 mt-1 ml-1">※クリエイター向け公募掲示板に掲載されます</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      );

      // STEP 5: 確認
      case 5: return (
        <div className="space-y-5">
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-[1.5rem] shadow-lg mb-3 text-white">
              <Check size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">内容を確認してください</h2>
            <p className="text-xs font-bold text-slate-400">問題なければ「企画を作成する」を押してください</p>
          </div>

          <GlassCard className="divide-y divide-slate-50 !p-0 overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">公開設定</p>
              <div className="flex flex-wrap gap-2">
                <span className={cn(
                  'text-xs font-black px-3 py-1 rounded-full',
                  formData.projectType === 'PUBLIC'  ? 'bg-sky-100 text-sky-700' :
                  formData.projectType === 'PRIVATE' ? 'bg-purple-100 text-purple-700' :
                                                       'bg-emerald-100 text-emerald-700',
                )}>
                  {formData.projectType === 'PUBLIC' ? '🌍 みんなで' : formData.projectType === 'PRIVATE' ? '🔒 仲間と' : '👤 ひとりで'}
                </span>
                {selectedEvent && (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                    <Calendar size={11} /> {selectedEvent.title}
                  </span>
                )}
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">企画タイトル</p>
              <p className="font-black text-slate-800 text-base leading-tight">{formData.title || '（未入力）'}</p>
              <p className="text-xs font-bold text-slate-500 mt-2 line-clamp-2 leading-relaxed">{formData.description}</p>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">目標金額</p>
                <p className="font-black text-slate-800 text-2xl">
                  ¥{parseInt(formData.targetAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">最低参加額</p>
                <p className="font-black text-slate-600 text-lg">¥{parseInt(formData.minContributionAmount || 1000).toLocaleString()}〜</p>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">お届け先 &amp; 日時</p>
              <p className="font-bold text-slate-700 text-sm">
                {selectedVenue?.venueName || formData.deliveryAddress || '（未設定）'}
              </p>
              {deliveryDateObj && (
                <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                  <Clock size={11} className="text-indigo-400" />
                  {new Date(`${deliveryDateObj}T12:00:00+09:00`).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} / {deliveryTimeText}
                </p>
              )}
              {rushFeeAlert && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} /> {rushFeeAlert.label}料金 +{rushFeeAlert.rate}
                </span>
              )}
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2">デザイン</p>
              <div className="flex items-center gap-2 flex-wrap">
                {formData.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <Image src={formData.imageUrl} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-100">
                    <ImageIcon size={20} />
                  </div>
                )}
                {formData.designImageUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                ))}
                {formData.designImageUrls.length > 3 && (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-100">
                    +{formData.designImageUrls.length - 3}
                  </div>
                )}
              </div>
              {formData.designDetails && (
                <p className="text-xs font-bold text-slate-500 mt-2 line-clamp-2">{formData.designDetails}</p>
              )}
            </div>

            {needsIllustrator && (
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <UserPlus size={11} /> イラストレーター公募あり
                  </span>
                  {formData.illustratorBudget && (
                    <span className="text-[10px] font-black text-slate-600">¥{parseInt(formData.illustratorBudget).toLocaleString()}予算</span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          <div className="bg-sky-50 border border-sky-100 rounded-[1.5rem] p-4 flex items-start gap-3">
            <Sparkles className="text-sky-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs font-bold text-sky-700 leading-relaxed">
              作成後、運営チームによる簡単な審査が行われます。審査通過後に企画が公開されます。
            </p>
          </div>
        </div>
      );
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-pink-50 to-sky-50 min-h-screen font-sans relative overflow-x-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-200/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={step === 1 ? () => router.back() : goPrev}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-black text-pink-400 tracking-widest uppercase">STEP {step} / {STEPS.length}</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{STEP_TITLES[step - 1]}</p>
          </div>
          <div className="w-9" />
        </div>
        <div className="pb-2.5">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Scrollable Step Content */}
      <div
        className="relative z-10 max-w-2xl mx-auto px-4"
        style={{
          paddingTop: 'calc(7rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
        }}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Footer Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200 transition-colors shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <motion.button
            type="button"
            onClick={step < STEPS.length ? goNext : handleSubmit}
            disabled={isSubmitting || isUploading || isDesignUploading}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex-1 h-12 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-sm transition-all',
              'bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-pink-200',
              (isSubmitting || isUploading || isDesignUploading) && 'opacity-60 cursor-not-allowed',
            )}
          >
            {step < STEPS.length ? (
              <><span>{step === 4 ? '確認へ進む' : '次へ'}</span><ChevronRight size={18} /></>
            ) : isSubmitting ? (
              <><Loader2 className="animate-spin" size={18} /><span>作成中...</span></>
            ) : (
              <><Sparkles size={18} /><span>企画を作成する！</span></>
            )}
          </motion.button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isVenueModalOpen && <VenueSelectionModal onClose={() => setIsVenueModalOpen(false)} onSelect={handleVenueSelect} />}
        {isEventModalOpen && <EventSelectionModal onClose={() => setIsEventModalOpen(false)} onSelect={handleEventSelect} />}
        {previewImageUrl && <ImageLightbox url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
        {isAiPlanModalOpen && (
          <AiPlanGenerator
            onClose={() => setIsAiPlanModalOpen(false)}
            onGenerated={(title, description) => {
              setFormData(p => ({ ...p, title, description }));
              toast.success('AIが文章を作成しました！');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-pink-50/50">
        <Loader2 className="animate-spin text-pink-500 w-12 h-12" />
      </div>
    }>
      <CreateProjectForm />
    </Suspense>
  );
}
