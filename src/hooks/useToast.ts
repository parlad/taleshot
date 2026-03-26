import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';
import type { ToastType } from '../components/Toast';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}