'use client';

const BADGE_DEFS = {
    FIRST_PLEDGE:    { label: '初めての支援',   emoji: '🌱' },
    PLEDGE_5:        { label: '5回支援',        emoji: '🌸' },
    PLEDGE_10:       { label: '10回支援',       emoji: '💐' },
    PLEDGE_30:       { label: '30回支援',       emoji: '🏆' },
    FIRST_PROJECT:   { label: '初企画',         emoji: '✨' },
    PROJECT_SUCCESS: { label: '企画達成',        emoji: '🎊' },
    PROJECT_3:       { label: '3企画達成',      emoji: '🌟' },
    TOTAL_10K:       { label: '1万pt支援',      emoji: '💎' },
    TOTAL_100K:      { label: '10万pt支援',     emoji: '👑' },
    EARLY_BIRD:      { label: 'アーリーバード', emoji: '🐦' },
    FOLLOWER_10:     { label: '10フォロワー',   emoji: '📣' },
};

export default function BadgeDisplay({ badgeIds = [], size = 'md' }) {
    if (!badgeIds?.length) return null;
    const sm = size === 'sm';
    return (
        <div className="flex flex-wrap gap-1.5">
            {badgeIds.map(id => {
                const def = BADGE_DEFS[id];
                if (!def) return null;
                return (
                    <div
                        key={id}
                        title={def.label}
                        className={`flex items-center gap-1 bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-100 rounded-full font-black text-slate-700 ${
                            sm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
                        }`}
                    >
                        <span>{def.emoji}</span>
                        <span>{def.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
