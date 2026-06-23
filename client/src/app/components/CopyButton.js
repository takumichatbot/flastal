'use client';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

export function CopyButton({ text, label = 'コピー', copiedLabel = 'コピーしました！', className = '', children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Clipboard } = await import('@capacitor/clipboard');
        await Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      toast.success(copiedLabel);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        toast.success(copiedLabel);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('コピーできませんでした。');
      }
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
      aria-label={copied ? copiedLabel : label}
    >
      {children || (copied ? '✓ ' + copiedLabel : label)}
    </button>
  );
}
