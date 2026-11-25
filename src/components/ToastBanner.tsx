import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';

export const ToastBanner: React.FC = () => {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'error' || toast.type === 'warning'
        ? AlertCircle
        : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-white border border-[#B9D7F3] rounded-xl shadow-[0_12px_32px_rgba(15,41,66,0.14)] p-4 flex items-start gap-3"
    >
      <Icon className="w-5 h-5 text-[#1769AA] shrink-0 mt-0.5" />
      <p className="text-sm text-[#0F2942] leading-snug flex-1">{toast.text}</p>
      <button
        type="button"
        onClick={clearToast}
        aria-label="Fermer la notification"
        className="text-[#4A637D] hover:text-[#0F2942] p-0.5 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
