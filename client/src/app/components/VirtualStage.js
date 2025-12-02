"use client";
import { useState, useEffect } from 'react';
import { FiGift, FiSmile, FiSend, FiX } from 'react-icons/fi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// 花の色の定義
const COLORS = [
  { id: 'pink', code: '#ec4899', label: 'ピンク' },
  { id: 'red', code: '#ef4444', label: '赤' },
  { id: 'blue', code: '#3b82f6', label: '青' },
  { id: 'yellow', code: '#eab308', label: '黄' },
  { id: 'purple', code: '#a855f7', label: '紫' },
  { id: 'white', code: '#f3f4f6', label: '白' },
];

export default function VirtualStage({ projectId }) {
  const [flowers, setFlowers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // フォーム用ステート
  const [formData, setFormData] = useState({
    senderName: '',
    color: 'pink',
    message: ''
  });

  // データ取得
  useEffect(() => {
    const fetchFlowers = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/digital-flowers`);
      if(res.ok) setFlowers(await res.json());
    };
    fetchFlowers();

    // Socket受信 (リアルタイム追加)
    const socket = io(process.env.NEXT_PUBLIC_API_URL, { transports: ['polling'] });
    socket.emit('joinProjectRoom', projectId);
    socket.on('newDigitalFlower', (flower) => {
      setFlowers(prev => [...prev, flower]);
    });

    return () => socket.disconnect();
  }, [projectId]);

  // 送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.senderName) return toast.error('お名前を入力してください');

    const loadingToast = toast.loading('デジタルフラスタを作成中...');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/digital-flowers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if(res.ok) {
        toast.success('ステージに飾られました！', { id: loadingToast });
        setShowModal(false);
        setFormData({ senderName: '', color: 'pink', message: '' });
      } else {
        throw new Error('送信失敗');
      }
    } catch(err) {
      toast.error('エラーが発生しました', { id: loadingToast });
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border-4 border-slate-700 relative overflow-hidden">
      {/* 背景の装飾 */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center text-glow">
            <span className="text-3xl mr-2">🏰</span> バーチャル・ステージ
          </h2>
          <p className="text-slate-400 text-sm">
            デジタルフラスタを贈って、画面上のステージを彩ろう！
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center"
        >
          <FiGift className="mr-2"/> 贈る
        </button>
      </div>

      {/* ステージエリア (横スクロール) */}
      <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-2 min-h-[200px] items-end scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {flowers.length === 0 ? (
          <div className="text-slate-500 text-center w-full py-10 font-bold">
            まだお花はありません。<br/>一番乗りで飾りませんか？
          </div>
        ) : (
          flowers.map((flower) => (
            <div key={flower.id} className="relative group shrink-0 animate-bounce-in">
              {/* フラスタの絵 (CSSで簡易表現) */}
              <div className="w-24 h-40 relative flex flex-col items-center justify-end">
                {/* 札 */}
                <div className="bg-white text-[8px] px-1 py-0.5 mb-1 w-16 text-center border border-gray-300 shadow-sm truncate font-bold">
                  {flower.senderName}より
                </div>
                {/* 花部分 */}
                <div 
                  className="w-20 h-20 rounded-full shadow-lg relative"
                  style={{ background: `radial-gradient(circle, ${getColorCode(flower.color)}, #fff)` }}
                >
                  {/* 装飾のキラキラ */}
                  <div className="absolute top-0 left-0 w-full h-full animate-pulse opacity-50 text-white text-xs flex justify-center items-center">✨</div>
                </div>
                {/* スタンド足 */}
                <div className="w-1 h-16 bg-gray-400"></div>
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>

              {/* ホバー時のメッセージ吹き出し */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-xs p-3 rounded-lg shadow-xl w-40 opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                <p className="font-bold border-b pb-1 mb-1">{flower.senderName}</p>
                <p>{flower.message || '応援してます！'}</p>
                {/* 吹き出しの三角 */}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 送信モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center"><FiGift className="mr-2"/> デジタルフラスタ作成</h3>
              <button onClick={() => setShowModal(false)}><FiX size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">お名前 (ニックネーム)</label>
                <input 
                  value={formData.senderName}
                  onChange={e => setFormData({...formData, senderName: e.target.value})}
                  className="w-full border rounded p-2"
                  placeholder="推し活太郎"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">お花の色</label>
                <div className="flex gap-2 justify-center">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData({...formData, color: c.id})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c.id ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: c.code, borderColor: c.code }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">応援メッセージ (一言)</label>
                <input 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full border rounded p-2"
                  placeholder="ずっと応援してます！"
                />
              </div>

              <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center">
                <FiSend className="mr-2"/> ステージに飾る (無料)
              </button>
              <p className="text-[10px] text-center text-gray-400">※今回はデモのため無料です</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getColorCode(id) {
  const c = COLORS.find(x => x.id === id);
  return c ? c.code : '#ec4899';
}