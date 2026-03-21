'use client';

// Next.js 15 ビルドエラー回避用
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import AiPlanGenerator from '@/app/components/AiPlanGenerator';

// Lucide Icons (react-iconsから移行し統一)
import { 
  Calendar, MapPin, X, Image as ImageIcon, Loader2, Plus, 
  User, Award, Search, CheckCircle2, ZoomIn, Sparkles, 
  Heart, Wand2, Lock, Globe, UploadCloud, ArrowRight, Paintbrush, FileText
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const JpText = ({ children, className }) => (
  <span className={cn("inline-block", className)}>{children}</span>
);

// 日付フォーマット関数
const formatToLocalISO = (dateString) => {
  if (!dateString) return '';
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
      return '';
  }
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return '日付未定';
  return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
  });
};

// ===========================================
// 🎨 UI COMPONENTS & ANIMATIONS
// ===========================================

const FloatingParticles = () => {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-pink-300 rounded-full mix-blend-multiply filter blur-[1px] opacity-40"
          initial={{
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
          }}
          animate={{
            y: [null, Math.random() * -200],
            x: [null, (Math.random() - 0.5) * 100],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={cn("bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2.5rem] p-6 md:p-10", className)}
  >
    {children}
  </motion.div>
);

const InputLabel = ({ icon: Icon, title, subtitle, required }) => (
  <div className="flex items-end gap-2 mb-3 pl-2">
    {Icon && <Icon className="text-pink-400 mb-0.5" size={18} />}
    <label className="block text-sm md:text-base font-black text-slate-700 tracking-tight">
      {title} {required && <span className="text-pink-500 ml-1">*</span>}
    </label>
    {subtitle && <span className="text-[10px] text-slate-400 font-bold mb-0.5">{subtitle}</span>}
  </div>
);

const GlassInput = (props) => (
  <input 
    {...props}
    className={cn(
      "w-full px-5 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl",
      "focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50",
      "transition-all font-bold text-slate-800 placeholder:text-slate-300",
      props.className
    )}
  />
);

const GlassTextarea = (props) => (
  <textarea 
    {...props}
    className={cn(
      "w-full px-5 py-4 bg-white/60 backdrop-blur-sm border-2 border-slate-100 rounded-2xl resize-none",
      "focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50",
      "transition-all font-bold text-slate-800 placeholder:text-slate-300 leading-relaxed",
      props.className
    )}
  />
);

// ===========================================
// 🪄 MODALS
// ===========================================

function AIGenerationModal({ onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { authenticatedFetch } = useAuth();

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('キーワードを入力してください');
    
    setIsGenerating(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/ai/generate-ai-image`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('生成に失敗しました');
      
      const data = await res.json();
      onGenerate(data.url);
      onClose();
      toast.success('イメージ画像を生成しました！');
    } catch (error) {
      console.error(error);
      toast.error('画像の生成に失敗しました。しばらく待ってからお試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white"
      >
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
          <button onClick={onClose} disabled={isGenerating} className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors bg-black/10 rounded-full p-2">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Wand2 className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tighter relative z-10">AI デザイン生成</h3>
          <p className="text-white/80 text-xs font-bold mt-2 relative z-10">魔法のようにお花のイメージを描き出します</p>
        </div>
        
        <div className="p-8 bg-slate-50/50">
          <p className="text-xs text-slate-500 mb-4 font-bold leading-relaxed">
            作りたいフラスタのイメージを言葉で入力してください。<br/>
            AIが数秒でラフ画（デザイン案）を生成します。
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 全体的にピンク色、大きなリボン、天使の羽、キラキラした装飾、かわいらしい雰囲気"
            rows="4"
            className="w-full p-5 border-2 border-purple-100 bg-white rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none text-slate-800 transition-all resize-none font-bold"
            disabled={isGenerating}
          ></textarea>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={onClose} disabled={isGenerating} className="px-6 py-3.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-full font-bold transition-all text-sm">キャンセル</button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black rounded-full hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {isGenerating ? <><Loader2 className="animate-spin" size={18}/> 生成中...</> : <><Sparkles size={18}/> 生成する</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EventSelectionModal({ onClose, onSelect }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/public`); 
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          setFilteredEvents(data);
        }
      } catch (e) {
        console.error(e);
        toast.error('イベント情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredEvents(
      events.filter(e => 
        e.title.toLowerCase().includes(query) || 
        (e.venue?.venueName || '').toLowerCase().includes(query)
      )
    );
  }, [searchQuery, events]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-white">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white">
          <div>
            <span className="text-[10px] font-black text-sky-500 tracking-widest uppercase mb-1 block">Official Events</span>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Calendar className="text-sky-500" size={24}/> 公式イベントを探す
            </h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-sm border border-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 bg-white border-b border-slate-100">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="イベント名や会場名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:border-sky-300 outline-none text-sm font-bold transition-all text-slate-700"
                />
            </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-grow bg-slate-50/50 space-y-4">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-sky-500" size={32}/>
                読み込み中...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-4xl mb-4 opacity-50">😢</div>
              <p className="font-bold">該当するイベントが見つかりません。</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <button
                key={event.id}
                onClick={() => { onSelect(event); onClose(); }}
                className="w-full text-left p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-sky-300 hover:shadow-[0_8px_30px_rgba(56,189,248,0.15)] transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className="bg-sky-50 text-sky-600 text-[10px] px-3 py-1 rounded-full font-black border border-sky-100 uppercase tracking-widest">
                    {event.organizer?.name || 'Official'}
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-800 group-hover:text-sky-600 mb-4 relative z-10 line-clamp-2 leading-tight">{event.title}</h4>
                <div className="text-xs font-bold text-slate-500 space-y-2 relative z-10 bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center"><Calendar className="mr-2 text-sky-400 shrink-0" size={14}/> {formatDisplayDate(event.eventDate)}</div>
                  <div className="flex items-center"><MapPin className="mr-2 text-sky-400 shrink-0" size={14}/> {event.venue ? event.venue.venueName : '会場未定'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function VenueSelectionModal({ onClose, onSelect }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues`);
        if (res.ok) setVenues(await res.json());
      } catch (e) {
        toast.error('会場リストの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-white">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><MapPin className="text-emerald-500" size={24}/> 会場を選択</h3>
          <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-sm"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50 space-y-4">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-bold"><Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={32}/>読み込み中...</div>
          ) : (
            venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => { onSelect(venue); onClose(); }}
                  className="w-full text-left p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] transition-all group"
                >
                  <div className="font-black text-slate-800 group-hover:text-emerald-600 text-lg mb-2">{venue.venueName}</div>
                  <div className="text-xs font-bold text-slate-500 flex items-center bg-slate-50 p-2 rounded-lg"><MapPin className="mr-2 text-emerald-400" size={14}/> {venue.address}</div>
                </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ImageLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[110] backdrop-blur-md border border-white/20">
        <X size={24} />
      </button>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <img src={url} alt="Enlarged design" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
      </motion.div>
    </div>
  );
}

// ===========================================
// 🎨 MAIN FORM COMPONENT
// ===========================================

function CreateProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const eventIdFromUrl = searchParams.get('eventId');
  const venueIdFromUrl = searchParams.get('venueId');

  const { user, authenticatedFetch, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDesignUploading, setIsDesignUploading] = useState(false);
  
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); 
  const [isAiPlanModalOpen, setIsAiPlanModalOpen] = useState(false); 
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deliveryAddress: '', 
    venueId: '',
    eventId: '',
    deliveryDateTime: '',
    imageUrl: '',
    designImageUrls: [], 
    designDetails: '',
    size: '',
    flowerTypes: '',
    projectType: 'PUBLIC',
    password: '',
  });

  const uploadImageToS3 = async (file) => {
    try {
        const res = await authenticatedFetch('/api/tools/s3-upload-url', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        if (!res.ok) throw new Error('署名付きURLの取得に失敗しました');
        const { uploadUrl, fileUrl } = await res.json();

        return new Promise((resolve, reject) => {
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
    } catch (error) {
        throw error;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading('メイン画像をアップロード中...');
    try {
      const url = await uploadImageToS3(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('画像をアップロードしました！', { id: toastId });
    } catch (error) {
      toast.error('アップロードに失敗しました。', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDesignImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsDesignUploading(true);
    const toastId = toast.loading(`${files.length}枚の画像をアップロード中...`);
    const uploadedUrls = [];
    try {
        for (const file of files) {
            const url = await uploadImageToS3(file);
            uploadedUrls.push(url);
        }
        setFormData(prev => ({ ...prev, designImageUrls: [...prev.designImageUrls, ...uploadedUrls] }));
        toast.success('デザイン画像をアップロードしました！', { id: toastId });
    } catch (error) {
        toast.error('一部の画像のアップロードに失敗しました', { id: toastId });
    } finally {
        setIsDesignUploading(false);
        e.target.value = '';
    }
  };

  const handleAIGenerated = (url) => {
    setFormData(prev => ({
      ...prev,
      designImageUrls: [...prev.designImageUrls, url]
    }));
  };

  const fetchEventDetails = useCallback(async (id) => {
    if (!id) { setEventLoading(false); return; }
    try {
        const res = await fetch(`${API_URL}/api/events/${id}`);
        if (res.ok) {
            const data = await res.json();
            setSelectedEvent(data);
            const isoDate = data.eventDate ? formatToLocalISO(data.eventDate) : '';
            setFormData(prev => ({
                ...prev,
                title: data.title ? `【企画】${data.title} フラスタ企画` : prev.title, 
                eventId: data.id,
                deliveryDateTime: isoDate || prev.deliveryDateTime,
                ...(data.venue ? { venueId: data.venue.id, deliveryAddress: data.venue.address || data.venue.venueName } : {})
            }));
            if (data.venue) setSelectedVenue(data.venue);
        }
    } catch (error) { console.error(error); } finally { setEventLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'USER' && user.role !== 'ORGANIZER') {
        toast.error('企画作成は一般ユーザーまたは主催者のみ可能です。');
        router.push('/');
        return;
    }
    if (eventIdFromUrl) { fetchEventDetails(eventIdFromUrl); } 
    else if (venueIdFromUrl) {
        fetch(`${API_URL}/api/venues/${venueIdFromUrl}`)
            .then(res => res.json())
            .then(v => {
                if(v) handleVenueSelect(v);
                setEventLoading(false);
            })
            .catch(() => setEventLoading(false));
    } else {
        setEventLoading(false);
    }
  }, [user, authLoading, router, eventIdFromUrl, venueIdFromUrl, fetchEventDetails]);
  
  const handleEventSelect = (event) => {
    if (!event) return;
    setSelectedEvent(event);
    setFormData(prev => ({
        ...prev,
        title: `【企画】${event.title} フラスタ企画`, 
        eventId: event.id,
        deliveryDateTime: formatToLocalISO(event.eventDate),
        ...(event.venue ? { venueId: event.venue.id, deliveryAddress: event.venue.address || event.venue.venueName } : {})
    }));
    if (event.venue) setSelectedVenue(event.venue);
    toast.success('イベント情報をセットしました！');
  };

  const handleVenueSelect = (venue) => {
      if (venue) {
          setSelectedVenue(venue);
          setFormData(prev => ({ ...prev, deliveryAddress: venue.address || venue.venueName, venueId: venue.id }));
      } else {
          setSelectedVenue(null);
          setFormData(prev => ({ ...prev, deliveryAddress: '', venueId: '' }));
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let deliveryDateTimeISO;
    try {
        if (!formData.deliveryDateTime) throw new Error("納品希望日時を選択してください");
        const dateObj = new Date(formData.deliveryDateTime);
        if (isNaN(dateObj.getTime())) throw new Error("日時の形式が正しくありません");
        deliveryDateTimeISO = dateObj.toISOString();
    } catch (err) {
        return toast.error(err.message);
    }

    const amount = parseInt(formData.targetAmount, 10);
    if (isNaN(amount) || amount < 1000) {
        return toast.error('目標金額は1,000pt以上で設定してください');
    }

    setIsSubmitting(true);
    const toastId = toast.loading('企画を保存中...');

    try {
      const payload = {
        title: formData.title || "",
        description: formData.description || "",
        targetAmount: amount,
        deliveryAddress: formData.deliveryAddress || (selectedVenue?.address || ""),
        deliveryDateTime: deliveryDateTimeISO,
        imageUrl: formData.imageUrl || "",
        designImageUrls: formData.designImageUrls || [],
        designDetails: formData.designDetails || "",
        size: formData.size || "",
        flowerTypes: formData.flowerTypes || "",
        projectType: formData.projectType || "PUBLIC",
        password: formData.password || null,
        venueId: selectedVenue?.id || null,
        eventId: selectedEvent?.id || null,
        visibility: "PUBLIC"
      };

      const res = await authenticatedFetch(`${API_URL}/api/projects`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || '作成に失敗しました。');
      }

      toast.success('企画を作成しました！', { id: toastId });
      setTimeout(() => { window.location.href = '/mypage'; }, 1000);

    } catch (error) { 
        setIsSubmitting(false);
        toast.error(error.message, { id: toastId }); 
    }
  };

  if (authLoading || !user || eventLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50/50"><Loader2 className="animate-spin text-pink-500 w-12 h-12" /></div>;
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 to-sky-50 min-h-screen py-16 font-sans text-slate-800 relative overflow-hidden">
      <FloatingParticles />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-3xl shadow-lg border border-pink-100 mb-6 text-pink-500 rotate-3">
            <Sparkles size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-4">推しへの想いを形にしよう</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base">素敵なフラスタ企画を立ち上げて、仲間を集めましょう🌸</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
          
          {/* --- EVENT BANNER --- */}
          <GlassCard className="!p-8 overflow-hidden relative border-2 border-indigo-100 bg-gradient-to-br from-white/90 to-indigo-50/80">
            {!selectedEvent ? (
              <button type="button" onClick={() => setIsEventModalOpen(true)} className="w-full flex flex-col md:flex-row items-center justify-between gap-6 group text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0"><Calendar size={28} /></div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles size={12}/> Recommended</p>
                        <p className="font-black text-xl md:text-2xl text-slate-800 group-hover:text-indigo-600 transition-colors">公式イベントを選択する</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">会場や日時が自動で入力されてとっても便利です✨</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all border border-indigo-50 shrink-0"><ArrowRight size={20} /></div>
              </button>
            ) : (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase mb-3 inline-block shadow-md">Official Event</span>
                  <h3 className="font-black text-slate-800 text-xl md:text-2xl mb-3 flex items-center gap-2"><Calendar className="text-indigo-500"/> {selectedEvent.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1"><Clock size={12} className="text-indigo-400"/>{formatDisplayDate(selectedEvent.eventDate)}</span>
                      <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1"><MapPin size={12} className="text-indigo-400"/>{selectedEvent.venue?.venueName || '会場未定'}</span>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedEvent(null); setSelectedVenue(null); setFormData(p => ({ ...p, eventId: '', title: '', deliveryDateTime: '', venueId: '', deliveryAddress: '' })); }} className="px-4 py-2 bg-white text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full border border-slate-200 transition-all shadow-sm">
                  イベント選択を解除
                </button>
              </div>
            )}
          </GlassCard>

          {/* --- BLOCK 1: 公開設定 --- */}
          <GlassCard>
            <InputLabel icon={Globe} title="公開設定" subtitle="企画への参加条件を選びましょう" required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {[
                    { id: 'PUBLIC', icon: '🌍', title: 'みんなで', desc: '全体に公開', color: 'sky' },
                    { id: 'PRIVATE', icon: '🔒', title: '仲間と', desc: '合言葉で限定', color: 'purple' },
                    { id: 'SOLO', icon: '👤', title: 'ひとりで', desc: '自分専用依頼', color: 'emerald' },
                ].map((type) => (
                    <button key={type.id} type="button" onClick={() => setFormData(p => ({...p, projectType: type.id}))} 
                        className={cn(
                          "p-6 rounded-[2rem] border-2 text-center transition-all flex flex-col items-center justify-center",
                          formData.projectType === type.id ? `border-${type.color}-400 bg-white shadow-lg scale-105 ring-4 ring-${type.color}-100` : 'border-white bg-white/40 hover:bg-white/80 hover:border-slate-200'
                        )}>
                        <div className="text-4xl mb-3 drop-shadow-sm">{type.icon}</div>
                        <div className={cn("font-black text-sm mb-1", formData.projectType === type.id ? `text-${type.color}-600` : "text-slate-600")}>{type.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{type.desc}</div>
                    </button>
                ))}
            </div>
            <AnimatePresence>
              {formData.projectType === 'PRIVATE' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100 overflow-hidden">
                      <InputLabel icon={Lock} title="合言葉（パスワード）" subtitle="参加者にこの合言葉を教えてあげてください" required />
                      <GlassInput type="text" name="password" value={formData.password} onChange={handleChange} placeholder="例: oshi2026" className="!bg-white font-mono tracking-widest text-lg"/>
                  </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* --- BLOCK 2: 企画の想い --- */}
          <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-slate-100/50 pb-6">
              <InputLabel icon={FileText} title="企画の想い" subtitle="どんなお祝いにしたいか、熱い想いを書きましょう！" />
              <button type="button" onClick={() => setIsAiPlanModalOpen(true)} className="flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 border border-purple-200 px-5 py-2.5 rounded-full font-black shadow-sm hover:shadow-md hover:scale-105 transition-all">
                <Wand2 size={14} /> <span>AIにおまかせ文章作成</span>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                  <InputLabel title="企画タイトル" required />
                  <GlassInput type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="例：○○さん出演祝いフラスタ企画"/>
              </div>
              <div>
                  <InputLabel title="企画の詳しい説明" required />
                  <GlassTextarea name="description" required value={formData.description} onChange={handleChange} rows="6" placeholder="趣旨や想いを熱く語ってください！参加者の心を動かします✨" />
              </div>
            </div>
          </GlassCard>

          {/* --- BLOCK 3: 目標金額 --- */}
          <GlassCard className="border-4 border-pink-100 bg-gradient-to-b from-white/90 to-pink-50/30">
            <InputLabel icon={Award} title="目標金額" subtitle="お花の制作や装飾品にかかる総予算を決めましょう" required />
            <div className="mt-4 flex items-center justify-center bg-white/80 p-8 rounded-[2.5rem] border border-pink-100 shadow-inner">
                <span className="text-3xl text-pink-400 font-black mr-4">¥</span>
                <input type="number" name="targetAmount" required value={formData.targetAmount} onChange={handleChange} 
                  className="text-5xl md:text-7xl font-black text-slate-800 bg-transparent border-none focus:ring-0 w-full max-w-[300px] text-center placeholder:text-slate-200 outline-none" 
                  placeholder="30000" />
            </div>
          </GlassCard>

          {/* --- BLOCK 4: お届け先と日時 --- */}
          <GlassCard>
             <div className="flex justify-between items-center mb-6">
                <InputLabel icon={MapPin} title="お届け先" required />
                <button type="button" onClick={() => setIsVenueModalOpen(true)} className="text-xs bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"><Search size={12}/> 会場を検索</button>
             </div>
             {selectedVenue ? (
                 <div className="mb-8">
                     <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-[2rem] flex justify-between items-center shadow-sm">
                         <div>
                             <p className="font-black text-emerald-900 text-xl mb-1">{selectedVenue.venueName}</p>
                             <p className="text-xs font-bold text-emerald-700 opacity-80">{selectedVenue.address}</p>
                         </div>
                         <button type="button" onClick={() => handleVenueSelect(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-400 hover:text-red-500 transition-colors shadow-sm"><X size={18}/></button>
                     </div>
                 </div>
             ) : (
                 <GlassInput type="text" name="deliveryAddress" required value={formData.deliveryAddress} onChange={handleChange} className="mb-8" placeholder="例：東京都渋谷区○○..." />
             )}
             <div>
                <InputLabel icon={Clock} title="納品希望日時" required />
                <GlassInput type="datetime-local" name="deliveryDateTime" required value={formData.deliveryDateTime} onChange={handleChange} />
             </div>
          </GlassCard>

          {/* --- BLOCK 5: デザイン --- */}
          <GlassCard>
            <InputLabel icon={Paintbrush} title="デザインと装飾" subtitle="どんなお花にするか、イメージを伝えましょう！" />
            
            <div className="mt-8 space-y-10">
              {/* メイン画像 */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">メイン画像 <span className="text-[10px] text-slate-400 font-bold ml-2">(企画一覧のサムネイルになります)</span></label>
                <div className="border-2 border-dashed border-pink-200 bg-pink-50/50 rounded-[2.5rem] p-8 text-center hover:bg-pink-50 cursor-pointer relative overflow-hidden group transition-all">
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                    {formData.imageUrl ? (
                        <div className="relative w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden shadow-lg">
                          <Image src={formData.imageUrl} alt="メイン画像" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="py-12">
                            <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-pink-300 group-hover:text-pink-500 group-hover:scale-110 transition-all shadow-sm">
                                {isUploading ? <Loader2 className="animate-spin" size={32}/> : <ImageIcon size={32}/>}
                            </div>
                            <p className="text-sm font-black text-slate-500">クリックして画像をアップロード</p>
                        </div>
                    )}
                </div>
              </div>

              {/* サブ画像・ラフ画 */}
              <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <label className="block text-sm font-black text-slate-700">参考画像・ラフ画 <span className="text-[10px] text-slate-400 font-bold ml-2">(複数枚OK)</span></label>
                      <button type="button" onClick={() => setIsAIModalOpen(true)} className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-purple-500/30 font-black transition-all flex items-center justify-center gap-2"><Wand2 size={14}/> AIでラフ画を作る</button>
                  </div>
                  <div className="flex flex-wrap gap-4">
                      {formData.designImageUrls.map((url, index) => (
                          <div key={index} className="relative w-28 h-28 group">
                              <img src={url} alt={`デザイン ${index}`} className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md cursor-zoom-in" onClick={() => setPreviewImageUrl(url)} />
                              <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl pointer-events-none transition-opacity">
                                <ZoomIn className="text-white" size={24} />
                              </div>
                              <button type="button" onClick={() => setFormData(p => ({...p, designImageUrls: p.designImageUrls.filter((_, i) => i !== index)}))} className="absolute -top-3 -right-3 bg-white text-slate-400 hover:text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-all z-10 border border-slate-100"><X size={16}/></button>
                          </div>
                      ))}
                      <label className="w-28 h-28 border-2 border-dashed border-slate-300 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all text-slate-400 group shadow-sm">
                          {isDesignUploading ? <Loader2 className="animate-spin text-sky-500 mb-2" size={24}/> : <Plus className="text-slate-300 group-hover:text-sky-500 mb-2" size={28} />}
                          <span className="text-[10px] font-black group-hover:text-sky-600">画像を追加</span>
                          <input type="file" multiple accept="image/*" onChange={handleDesignImagesUpload} disabled={isDesignUploading} className="hidden" />
                      </label>
                  </div>
              </div>

              {/* テキスト詳細 */}
              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">デザインの雰囲気</label>
                    <GlassTextarea name="designDetails" value={formData.designDetails} onChange={handleChange} rows="3" placeholder="例：青色をベースに、リボンと星を散りばめてクールで可愛い感じにしてください！"></GlassTextarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-black text-slate-700 mb-2">希望サイズ</label>
                        <GlassInput type="text" name="size" value={formData.size} onChange={handleChange} placeholder="例：高さ180cm程度"/>
                    </div>
                    <div>
                        <label className="block text-sm font-black text-slate-700 mb-2">使いたいお花</label>
                        <GlassInput type="text" name="flowerTypes" value={formData.flowerTypes} onChange={handleChange} placeholder="例：青いバラ、かすみ草、ユリ"/>
                    </div>
                </div>
              </div>
            </div>
          </GlassCard>
          
          {/* --- SUBMIT --- */}
          <div className="pt-8 pb-12">
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(56,189,248,0.4)" }} 
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isSubmitting || isUploading || isDesignUploading} 
              className={cn(
                "w-full px-8 py-6 font-black text-white bg-gradient-to-r from-sky-400 to-indigo-500 rounded-[2.5rem] shadow-2xl text-xl md:text-2xl flex items-center justify-center gap-3 transition-all",
                (isSubmitting || isUploading || isDesignUploading) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? <><Loader2 className="animate-spin" size={28}/> 魔法をかけています...</> : <><Sparkles size={28} /> 企画を作成する！</>}
            </motion.button>
            <p className="text-center text-xs font-bold text-slate-400 mt-6">作成後、運営チームによる簡単な審査が行われます。</p>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {isVenueModalOpen && <VenueSelectionModal onClose={() => setIsVenueModalOpen(false)} onSelect={handleVenueSelect} />}
        {isEventModalOpen && <EventSelectionModal onClose={() => setIsEventModalOpen(false)} onSelect={handleEventSelect} />}
        {isAIModalOpen && <AIGenerationModal onClose={() => setIsAIModalOpen(false)} onGenerate={handleAIGenerated} />}
        {previewImageUrl && <ImageLightbox url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
        {isAiPlanModalOpen && (
          <AiPlanGenerator 
            onClose={() => setIsAiPlanModalOpen(false)}
            onGenerated={(title, description) => {
              setFormData(prev => ({ ...prev, title, description }));
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-pink-50/50"><Loader2 className="animate-spin text-pink-500 w-12 h-12" /></div>}>
      <CreateProjectForm />
    </Suspense>
  );
}