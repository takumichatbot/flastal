"use client";
import { useState, useEffect, useRef } from 'react';
import { FiGift, FiX, FiSend, FiMessageSquare } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// カラーパレット定義（グラデーション用に拡張）
const FLOWER_THEMES = {
  pink:   { bg: 'from-pink-400 to-rose-500', shadow: 'shadow-pink-500/50', icon: '🌸', label: 'キュートピンク' },
  red:    { bg: 'from-red-500 to-red-700', shadow: 'shadow-red-500/50', icon: '🌹', label: 'パッションレッド' },
  blue:   { bg: 'from-blue-400 to-indigo-600', shadow: 'shadow-blue-500/50', icon: '💠', label: 'クールブルー' },
  yellow: { bg: 'from-yellow-300 to-amber-500', shadow: 'shadow-yellow-500/50', icon: '🌻', label: 'ハッピーイエロー' },
  purple: { bg: 'from-purple-400 to-violet-600', shadow: 'shadow-purple-500/50', icon: '💜', label: 'ミステリアスパープル' },
  white:  { bg: 'from-slate-100 to-slate-300', shadow: 'shadow-slate-400/50', icon: '🕊️', label: 'ピュアホワイト' },
};

export default function VirtualStage({ projectId }) {
  const [flowers, setFlowers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const scrollContainerRef = useRef(null);
  
  // フォーム用ステート
  const [formData, setFormData] = useState({
    senderName: '',
    color: 'pink',
    message: ''
  });

  // データ取得 & Socket接続
  useEffect(() => {
    // 初期データ取得 (API連携の例)
    const fetchFlowers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/digital-flowers`);
        if(res.ok) setFlowers(await res.json());
      } catch (e) {
        console.error("Failed to fetch flowers", e);
      }
    };
    fetchFlowers();

    // Socket受信
    const socket = io(process.env.NEXT_PUBLIC_API_URL, { 
      transports: ['websocket', 'polling'], // websocket優先
      reconnectionAttempts: 3
    });

    socket.emit('joinProjectRoom', projectId);
    
    socket.on('newDigitalFlower', (flower) => {
      // 重複チェック（Optimistic UIとの競合回避）
      setFlowers(prev => {
        if (prev.some(f => f.id === flower.id)) return prev;
        return [...prev, flower];
      });
    });

    return () => socket.disconnect();
  }, [projectId]);

  // 新しい花が追加されたら右端へスクロール
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [flowers.length]);

  // 送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.senderName) return toast.error('お名前を入力してください');

    // 一時ID作成
    const tempId = Date.now().toString();
    const newFlower = { ...formData, id: tempId, isOptimistic: true };

    // 1. Optimistic UI: 先に画面に表示してしまう
    setFlowers(prev => [...prev, newFlower]);
    setShowModal(false);
    setFormData({ senderName: '', color: 'pink', message: '' });
    
    toast.success('ステージに飾られました！');

    try {
      // 2. バックグラウンドで送信
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/digital-flowers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('送信失敗');

      // 成功時はSocket経由で正規データが来るので、ここでは何もしないか、
      // 必要ならIDを正規のものに差し替える処理を入れる

    } catch(err) {
      // 失敗したらロールバック
      setFlowers(prev => prev.filter(f => f.id !== tempId));
      toast.error('送信に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      
      {/* --- ステージ背景演出 --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 床 */}
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-slate-950 to-slate-800 opacity-90"></div>
        {/* スポットライト */}
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-white/10 via-transparent to-transparent blur-3xl transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-1/2 h-full bg-gradient-to-b from-purple-500/10 via-transparent to-transparent blur-3xl transform skew-x-12"></div>
        {/* キラキラ粒子 (CSS画像またはSVGパターン推奨) */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
      </div>

      {/* --- ヘッダーエリア --- */}
      <div className="relative z-10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
            <span className="text-3xl">🏰</span> バーチャル・ステージ
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            あなたの応援花で、画面上のステージを華やかに彩りましょう！
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)] transform hover:scale-105 transition-all flex items-center text-sm"
        >
          <FiGift className="mr-2 text-lg"/> フラスタを贈る
        </button>
      </div>

      {/* --- ステージ（花表示エリア） --- */}
      <div 
        ref={scrollContainerRef}
        className="relative z-10 min-h-[260px] flex items-end overflow-x-auto px-6 pb-6 pt-12 gap-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {flowers.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-slate-500 py-10 opacity-70">
            <FiGift className="text-4xl mb-2" />
            <p className="text-sm">まだお花はありません。<br/>一番乗りで飾りませんか？</p>
          </div>
        ) : (
          flowers.map((flower) => (
            <FlowerStand key={flower.id} flower={flower} />
          ))
        )}
        {/* 右端の余白 */}
        <div className="w-6 shrink-0"></div>
      </div>

      {/* --- 送信モーダル --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            {/* モーダルヘッダー */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <FiGift className="text-pink-400"/> フラスタを作成
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <FiX size={24}/>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* カラー選択 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">お花の色を選ぶ</label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(FLOWER_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({...formData, color: key})}
                      className={`relative aspect-square rounded-full bg-gradient-to-br ${theme.bg} transition-all duration-200 flex items-center justify-center text-lg shadow-sm
                        ${formData.color === key ? 'scale-110 ring-2 ring-offset-2 ring-slate-500 shadow-md z-10' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                      title={theme.label}
                    >
                      {formData.color === key && <span className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full text-white text-xs">✔</span>}
                    </button>
                  ))}
                </div>
                <p className="text-right text-xs text-slate-400 mt-1">{FLOWER_THEMES[formData.color].label}</p>
              </div>

              {/* 入力フィールド */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">お名前 (必須)</label>
                  <input 
                    value={formData.senderName}
                    onChange={e => setFormData({...formData, senderName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    placeholder="例：推し活 太郎"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">メッセージ</label>
                  <textarea 
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none h-20"
                    placeholder="応援メッセージを入力..."
                  />
                </div>
              </div>

              {/* アクションボタン */}
              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <FiSend /> ステージに飾る
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 個別のフラスタコンポーネント
function FlowerStand({ flower }) {
  const theme = FLOWER_THEMES[flower.color] || FLOWER_THEMES.pink;

  return (
    <div className="relative group shrink-0 animate-in slide-in-from-bottom-4 duration-500">
      {/* ホバー時の吹き出し (上部) */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-white/95 backdrop-blur text-slate-800 text-xs p-3 rounded-xl shadow-xl border border-pink-100 text-center relative">
          <p className="font-bold text-pink-600 mb-1 border-b border-pink-50 pb-1">{flower.senderName}</p>
          <p className="text-slate-600 leading-tight">{flower.message || '応援してます！'}</p>
          {/* 三角矢印 */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-pink-100"></div>
        </div>
      </div>

      {/* --- フラスタ本体のデザイン --- */}
      <div className="relative flex flex-col items-center cursor-pointer hover:-translate-y-1 transition-transform duration-300">
        
        {/* 1. 名札ボード */}
        <div className="relative z-10 bg-white border-2 border-slate-200 shadow-sm px-2 py-1 min-w-[70px] max-w-[100px] text-center mb-[-5px] rounded-sm transform rotate-1">
          <p className="text-[9px] font-bold text-slate-800 truncate">{flower.senderName}</p>
          {/* ボードの紐（装飾） */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[1px] h-3 bg-slate-300"></div>
        </div>

        {/* 2. 花部分 (バルーンのような形状 + アイコン) */}
        <div className={`relative z-0 w-20 h-20 rounded-full bg-gradient-to-br ${theme.bg} ${theme.shadow} shadow-lg flex items-center justify-center border-2 border-white/30`}>
          <span className="text-3xl filter drop-shadow-md animate-pulse-slow">{theme.icon}</span>
          {/* 光沢 */}
          <div className="absolute top-2 left-2 w-6 h-3 bg-white/30 rounded-full rotate-[-45deg]"></div>
        </div>

        {/* 3. リボン */}
        <div className="absolute top-[85px] w-12 h-4 bg-red-500 rounded-sm z-10 flex justify-center">
          <div className="w-1 h-6 bg-red-500 absolute top-0"></div>
          <div className="w-4 h-4 bg-red-500 absolute top-1 left-[-5px] -rotate-12 rounded-sm"></div>
          <div className="w-4 h-4 bg-red-500 absolute top-1 right-[-5px] rotate-12 rounded-sm"></div>
        </div>

        {/* 4. スタンド脚 */}
        <div className="mt-[-10px] flex flex-col items-center opacity-80">
          <div className="w-0.5 h-16 bg-slate-400"></div>
          <div className="w-16 h-0.5 bg-slate-400 rounded-full relative">
             <div className="absolute left-0 bottom-0 w-0.5 h-3 bg-slate-400 rotate-12 origin-top"></div>
             <div className="absolute right-0 bottom-0 w-0.5 h-3 bg-slate-400 -rotate-12 origin-top"></div>
          </div>
        </div>

      </div>
    </div>
  );
}