'use client';
import Image from 'next/image';
import { Users, MessageCircle, Sparkles, Send, Loader2, Zap } from 'lucide-react';
import { AppCard } from './shared.js';

export default function BackersTab({ ctx }) {
  const {
    project, user,
    cheers, cheerGuestName, setCheerGuestName,
    cheerMessage, setCheerMessage,
    handlePostCheer, isPostingCheer,
  } = ctx;

  // 早期支援者バッジ: pledgeOrder があればその値で、なければ id 昇順で上位10件を対象にする
  const earlyBackerIds = (() => {
    if (!project.pledges || project.pledges.length === 0) return new Set();
    const sorted = [...project.pledges].sort((a, b) => {
      if (a.pledgeOrder != null && b.pledgeOrder != null) return a.pledgeOrder - b.pledgeOrder;
      if (a.pledgeOrder != null) return -1;
      if (b.pledgeOrder != null) return 1;
      return (a.id > b.id ? 1 : a.id < b.id ? -1 : 0);
    });
    return new Set(sorted.slice(0, 10).map(p => p.id));
  })();

  return (
    <div className="space-y-4">
      {/* 支援者一覧 */}
      {(!project.pledges || project.pledges.length === 0) ? (
        <AppCard className="text-center py-16">
          <Users size={40} className="text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-400">まだ支援者がいません</p>
          <p className="text-xs text-slate-300 mt-1">最初の支援者になりましょう！</p>
        </AppCard>
      ) : (
        <AppCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-pink-400" /> 支援者一覧
            </h2>
            <span className="text-xs font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
              {project.pledges.length} 人
            </span>
          </div>
          <div className="space-y-3">
            {project.pledges.map((pledge, i) => (
              <div key={pledge.id || i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm shrink-0">
                  {pledge.user?.iconUrl
                    ? <Image src={pledge.user.iconUrl} alt={pledge.user?.handleName || 'ユーザーアイコン'} width={40} height={40} className="object-cover w-10 h-10" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100 text-pink-400 font-black text-sm">
                        {(pledge.user?.handleName || '?')[0]}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-black text-sm text-slate-800 truncate">{pledge.user?.handleName || '匿名'}</p>
                    {earlyBackerIds.has(pledge.id) && (
                      <span className="text-[10px] font-black bg-rose-100 text-rose-500 rounded-full px-2 py-0.5 shrink-0">🌸 早期支援者</span>
                    )}
                  </div>
                  {pledge.comment && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">"{pledge.comment}"</p>
                  )}
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1">
                  {pledge.isEarlyBacker && (
                    <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <Zap size={8} /> 早期支援
                    </span>
                  )}
                  <span className="text-xs font-black text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full">
                    ¥{(pledge.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* 応援コメント */}
      <div className="space-y-4 mt-4">
        <AppCard>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2 mb-4">
            <MessageCircle size={18} className="text-pink-400" /> 応援コメント
            {cheers !== null && cheers.length > 0 && (
              <span className="text-xs font-black text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full">{cheers.length}</span>
            )}
          </h2>

          <div className="mb-5 space-y-2">
            {!user && (
              <input
                type="text"
                placeholder="お名前（ニックネームOK）"
                value={cheerGuestName}
                onChange={e => setCheerGuestName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
              />
            )}
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder={`${project?.title || '企画'}への応援メッセージを送ろう✨`}
                value={cheerMessage}
                onChange={e => setCheerMessage(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all resize-none"
              />
              <button
                onClick={handlePostCheer}
                disabled={isPostingCheer || !cheerMessage.trim()}
                className="w-12 h-12 self-end bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 disabled:opacity-40 transition-all active:scale-95"
              >
                {isPostingCheer ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          {cheers === null ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-pink-300" /></div>
          ) : cheers.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-black text-slate-300">最初の応援コメントを書いてみよう！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cheers.map(cheer => (
                <div key={cheer.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-400 font-black text-xs shrink-0 overflow-hidden border border-pink-100">
                    {cheer.user?.iconUrl
                      ? <Image src={cheer.user.iconUrl} alt={cheer.user?.nickname || 'ユーザーアイコン'} width={32} height={32} className="object-cover w-8 h-8" />
                      : (cheer.user?.handleName || cheer.guestName || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-black text-xs text-slate-700">{cheer.user?.handleName || cheer.guestName || '応援者'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(cheer.createdAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{cheer.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>
    </div>
  );
}
