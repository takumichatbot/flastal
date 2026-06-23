'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Loader2, Flower2, Palette, AlignLeft, MessageSquare,
  LayoutPanelLeft, CheckSquare, Copy, Check, ChevronRight, Leaf
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// ─── カラースウォッチ ───────────────────────────────────────────────
function ColorSwatch({ color }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(color).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title={`${color} をコピー`}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className="w-12 h-12 rounded-2xl shadow-md border border-white/50 group-hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] font-black text-slate-500 group-hover:text-pink-500 transition-colors tracking-widest uppercase">
        {copied ? <Check size={12} className="text-emerald-500 mx-auto" /> : color}
      </span>
    </button>
  );
}

// ─── メッセージコピーボタン ────────────────────────────────────────
function CopyableMessage({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('コピーしました！');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-start gap-3 bg-pink-50 border border-pink-100 rounded-2xl p-4">
      <p className="flex-1 text-slate-700 font-bold text-base leading-relaxed">{text}</p>
      <button
        onClick={handleCopy}
        className="shrink-0 p-2 rounded-xl bg-white border border-pink-100 hover:bg-pink-100 transition-colors text-pink-500"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

// ─── ローディングアニメーション ─────────────────────────────────────
function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
          <Flower2 size={32} className="text-pink-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-400 rounded-full animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-lg font-black text-slate-700">AIが考えています...🌸</p>
        <p className="text-sm text-slate-400 font-medium">あなたの推しに最高のフラスタを提案中</p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-pink-300 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 結果セクション ───────────────────────────────────────────────
function DesignResult({ design, artistName }) {
  return (
    <div className="space-y-6 mt-8">
      {/* コンセプト */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-pink-500" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">デザインコンセプト</h3>
        </div>
        <p className="text-slate-700 text-lg font-bold leading-relaxed">{design.concept}</p>
      </div>

      {/* カラーパレット */}
      {design.colorPalette && design.colorPalette.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-violet-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">カラーパレット</h3>
          </div>
          <div className="flex gap-4 flex-wrap">
            {design.colorPalette.map((color, i) => (
              <ColorSwatch key={i} color={color} />
            ))}
          </div>
        </div>
      )}

      {/* 使用花材 */}
      {design.flowers && design.flowers.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Flower2 size={18} className="text-rose-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">使用花材</h3>
          </div>
          <div className="space-y-3">
            {design.flowers.map((flower, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                <Leaf size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-black text-slate-800">{flower.name}</span>
                  {flower.color && (
                    <span className="ml-2 text-sm text-slate-500 font-medium">（{flower.color}）</span>
                  )}
                  {flower.role && (
                    <p className="text-sm text-slate-500 mt-0.5">{flower.role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {design.estimatedFlowers && (
            <p className="mt-4 text-xs text-slate-400 font-bold bg-slate-50 rounded-xl px-4 py-2">
              目安数量: {design.estimatedFlowers}
            </p>
          )}
        </div>
      )}

      {/* レイアウト */}
      {design.layout && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlignLeft size={18} className="text-sky-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">レイアウト構成</h3>
          </div>
          <p className="text-slate-600 leading-relaxed font-medium">{design.layout}</p>
        </div>
      )}

      {/* メッセージ案 */}
      {design.message && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-amber-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">リボンメッセージ案</h3>
          </div>
          <CopyableMessage text={design.message} />
        </div>
      )}

      {/* パネル・ボード */}
      {design.panels && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <LayoutPanelLeft size={18} className="text-indigo-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">パネル・ボード提案</h3>
          </div>
          <p className="text-slate-600 leading-relaxed font-medium">{design.panels}</p>
        </div>
      )}

      {/* 制作のポイント */}
      {design.tips && design.tips.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare size={18} className="text-emerald-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">制作のポイント</h3>
          </div>
          <ul className="space-y-3">
            {design.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={11} className="text-emerald-600" />
                </div>
                <span className="text-slate-600 font-medium text-sm leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTAリンク */}
      <Link
        href={`/projects/create?artistName=${encodeURIComponent(artistName)}`}
        className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-200 hover:brightness-105 transition-all active:scale-95"
      >
        <Sparkles size={18} />
        この内容で企画を作成する
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────
export default function AiDesignPageClient() {
  const [formData, setFormData] = useState({
    artistName: '',
    imageColors: '',
    budget: '',
    venue: '',
    mood: '',
    existingTheme: '',
  });
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState(null);
  const [rawResult, setRawResult] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.artistName.trim()) {
      toast.error('アーティスト名は必須です');
      return;
    }

    setLoading(true);
    setDesign(null);
    setRawResult(null);

    try {
      const token = localStorage.getItem('authToken')?.replace(/^"|"$/g, '');
      const res = await fetch(`${API_URL}/api/tools/design/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'AIデザイン生成に失敗しました');
      }

      const data = await res.json();
      if (data.design) {
        setDesign(data.design);
        toast.success('デザイン案が完成しました！');
      } else if (data.raw) {
        setRawResult(data.raw);
        toast.success('提案を取得しました');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'エラーが発生しました。時間をおいてお試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ページタイトル */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <Sparkles size={13} />
            AI POWERED
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-3">
            AIフラスタ<br className="md:hidden" />デザイン提案
          </h1>
          <p className="text-slate-500 font-medium text-base leading-relaxed max-w-md mx-auto">
            推しアーティストの情報を入力するだけで、AIがフラスタのデザイン案（花材・配色・レイアウト・メッセージ）を提案します。
          </p>
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 border border-pink-50 p-6 md:p-8 space-y-5">

          {/* アーティスト名（必須） */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              アーティスト名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="artistName"
              value={formData.artistName}
              onChange={handleChange}
              placeholder="例: 〇〇（グループ名・ソロ名）"
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 focus:border-pink-300 transition-all"
            />
          </div>

          {/* イメージカラー */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              イメージカラー
            </label>
            <input
              type="text"
              name="imageColors"
              value={formData.imageColors}
              onChange={handleChange}
              placeholder="例: ピンク・白・ゴールド"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 focus:border-pink-300 transition-all"
            />
          </div>

          {/* 予算 */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              予算（円）
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">¥</span>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="例: 50000"
                min="0"
                className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 focus:border-pink-300 transition-all"
              />
            </div>
          </div>

          {/* 設置会場 */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              設置会場
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="例: 〇〇アリーナ、Zepp Tokyo"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 focus:border-pink-300 transition-all"
            />
          </div>

          {/* 雰囲気・テーマ */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              雰囲気・テーマ
            </label>
            <input
              type="text"
              name="mood"
              value={formData.mood}
              onChange={handleChange}
              placeholder="例: 清楚・華やか、クール・かっこいい"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 focus:border-pink-300 transition-all"
            />
          </div>

          {/* 既存テーマ・世界観 */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
              既存テーマ・世界観
            </label>
            <input
              type="text"
              name="existingTheme"
              value={formData.existingTheme}
              onChange={handleChange}
              placeholder="例: 〇〇のライブビジュアル、妖精・ファンタジー"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-800 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 focus:border-pink-300 transition-all"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-200 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 text-base"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
            {loading ? '生成中...' : 'デザインを提案してもらう'}
          </button>
        </form>

        {/* ローディング表示 */}
        {loading && (
          <div className="mt-6 bg-white rounded-3xl shadow-lg shadow-pink-50 border border-pink-50 px-6 py-4">
            <LoadingPlaceholder />
          </div>
        )}

        {/* 結果表示 */}
        {!loading && design && (
          <DesignResult design={design} artistName={formData.artistName} />
        )}

        {/* RAWフォールバック（JSONパース失敗時） */}
        {!loading && rawResult && (
          <div className="mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
            <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-pink-400" /> AIからの提案
            </h3>
            <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono leading-relaxed">{rawResult}</pre>
            <Link
              href={`/projects/create?artistName=${encodeURIComponent(formData.artistName)}`}
              className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg shadow-pink-200 hover:brightness-105 transition-all"
            >
              <Sparkles size={18} />
              この内容で企画を作成する
              <ChevronRight size={18} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
