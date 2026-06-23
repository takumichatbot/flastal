'use client';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboardAwareScroll() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleKeyboardShow = () => {
      requestAnimationFrame(() => {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    };

    let listener;
    Keyboard.addListener('keyboardDidShow', handleKeyboardShow).then(l => { listener = l; });
    return () => { listener?.remove(); };
  }, []);
}
