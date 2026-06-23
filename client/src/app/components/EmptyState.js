'use client';

const PRESET_ICONS = {
  project: '🌸',
  photo: '📸',
  message: '💬',
  order: '🛒',
  notification: '🔔',
  flower: '💐',
  search: '🔍',
  bookmark: '🔖',
  bell: '🔔',
  default: '📭',
};

export function EmptyState({
  icon,           // emoji文字 or presetキー
  title,          // 見出し
  description,    // 説明文
  action,         // { label: string, onClick: fn } or { label: string, href: string }
  className = '',
}) {
  const iconChar = PRESET_ICONS[icon] || icon || PRESET_ICONS.default;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="text-5xl mb-4 select-none" role="img" aria-label={title}>
        {iconChar}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            aria-label={action.label}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
