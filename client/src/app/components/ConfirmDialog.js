'use client';
import { AnimatePresence, motion } from 'framer-motion';

export function ConfirmDialog({ open, message, onConfirm, onCancel, confirmLabel = '削除する', confirmClassName = 'bg-red-500 hover:bg-red-600 text-white' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-[var(--z-modal)]"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          >
            <p className="text-slate-700 text-sm leading-relaxed mb-6 jp-text">{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                キャンセル
              </button>
              <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmClassName}`}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
