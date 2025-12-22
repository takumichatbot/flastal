"use client";
import { useEffect, useState } from 'react';
import { FiCheck, FiStar, FiLock, FiCopy, FiInfo, FiSmartphone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function OfficialBadge({ projectId, isPlanner }) {
  const [isOfficial, setIsOfficial] = useState(false);
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  // ステータス取得
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/official-status`);
        if (res.ok) {
          const data = await res.json();
          setIsOfficial(!!data.verifiedAt); // データが存在すればtrue
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [projectId]);

  // ▼ アクション: 推しになりきってボタンを押す（シミュレーション）
  const handleSimulateOfficial = async () => {
    if (!confirm('【テスト機能】\n演者本人として「見たよ」ボタンを押しますか？\n（本番では専用QRコード経由で行われます）')) return;

    // 1. サーバーへ送信
    try {
      await fetch(`${API_URL}/api/projects/${projectId}/official-react`, { method: 'POST' });
      setIsOfficial(true);
      setShowSecretMenu(false);
      
      // 2. 盛大に紙吹雪を飛ばす (金・銀・ピンク)
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#C0C0C0', '#FF69B4']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#C0C0C0', '#FF69B4']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      toast.success('推しが見てくれました！おめでとうございます！', {
        icon: '😭✨',
        duration: 5000,
        style: {
            background: '#FFF8E1',
            color: '#B7791F',
            fontWeight: 'bold',
        }
      });

    } catch (e) {
      toast.error('エラーが発生しました');
    }
  };

  // ▼ アクション: 招待リンクをコピー（ダミー）
  const copySecretLink = () => {
    const dummyLink = `https://flastal.jp/secret/${projectId}?token=xyz123`;
    navigator.clipboard.writeText(dummyLink);
    toast.success('楽屋招待用URLをコピーしました');
  };

  if (loading) return null;

  // ----------------------------------------------------------------
  // パターンA: 既に「推しが見た」状態 (誰でも見える)
  // ----------------------------------------------------------------
  if (isOfficial) {
    return (
      <div className="animate-fadeIn mt-2 inline-block">
        <div className="relative group cursor-help">
            {/* 背景のキラキラ (絶対配置) */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            
            {/* バッジ本体 */}
            <div className="relative flex items-center gap-2 bg-gradient-to-b from-amber-100 to-amber-200 border border-amber-300 text-amber-900 px-5 py-2 rounded-full shadow-lg">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-600 text-white rounded-full p-1 shadow-inner">
                    <FiCheck strokeWidth={4} size={14} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-amber-700 leading-none tracking-wider uppercase mb-0.5">OFFICIAL CHECKED</p>
                    <p className="text-sm font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-yellow-900">
                        推しが見ました！
                    </p>
                </div>
            </div>

            {/* ホバー時のツールチップ */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded text-center z-50">
                演者様または公式運営による<br/>閲覧確認済みです
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // パターンB: まだ見ていない & 自分が企画者 (設定メニューを表示)
  // ----------------------------------------------------------------
  if (isPlanner) {
    return (
      <div className="mt-6 border-t border-dashed border-gray-300 pt-4">
        {!showSecretMenu ? (
          <button 
            onClick={() => setShowSecretMenu(true)}
            className="text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <FiLock /> 演者様への共有設定を開く
          </button>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-fadeIn">
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <span className="bg-indigo-600 text-white p-1 rounded"><FiStar /></span>
                    演者様に見てもらうために
                </h4>
                <button onClick={() => setShowSecretMenu(false)} className="text-xs text-slate-400 hover:text-slate-600">閉じる</button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                以下の「秘密のURL」をQRコード化してファンレターに同封したり、マネージャー様経由で共有することで、
                演者様がこのページにアクセスし「見たよ」ボタンを押せるようになります。
            </p>

            <div className="flex gap-2 mb-4">
                <input 
                    readOnly 
                    value={`https://flastal.jp/secret/${projectId}************`} 
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-500 font-mono"
                />
                <button 
                    onClick={copySecretLink}
                    className="bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded hover:bg-slate-50 text-xs font-bold flex items-center gap-1"
                >
                    <FiCopy /> コピー
                </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-[10px] text-yellow-800 font-bold mb-2 flex items-center gap-1">
                    <FiInfo /> 動作確認（デバッグ用）
                </p>
                <button 
                    onClick={handleSimulateOfficial}
                    className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white py-2.5 rounded-lg font-bold text-xs hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <FiSmartphone /> テスト: 演者としてページを見てボタンを押す
                </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}