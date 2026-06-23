'use client';
import { useState, useCallback } from 'react';

export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', resolve: null });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ open: true, message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ open: false, message: '', resolve: null });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ open: false, message: '', resolve: null });
  };

  return { confirm, confirmState: state, handleConfirm, handleCancel };
}
