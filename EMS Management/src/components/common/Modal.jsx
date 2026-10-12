import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalJSX = (
    <div 
      className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/70 text-slate-700 hover:text-slate-900 hover:bg-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Close Modal (Esc)"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  );

  // Mount directly to document.body via React Portal to overlay the entire screen
  return createPortal(modalJSX, document.body);
};
