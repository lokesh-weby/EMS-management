import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Mail, X } from 'lucide-react';

export const Toast = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        const isEmail = toast.type === 'email';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 transform translate-y-0 animate-fade-in ${
              isEmail 
                ? 'bg-white/95 border-brand-500/50 text-slate-900 ring-2 ring-brand-500/20' 
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {isEmail ? (
                  <Mail className="w-5 h-5 text-brand-600 animate-pulse" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                ) : toast.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Info className="w-5 h-5 text-brand-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold tracking-wide flex items-center justify-between">
                  <span>{toast.title}</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>

                {toast.emailPreview && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {toast.emailPreview}
                  </div>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
