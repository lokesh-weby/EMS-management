import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, subtext, infoBadge, onClick, isClickable }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-200 flex flex-col justify-between ${
        isClickable ? 'cursor-pointer hover:border-slate-400 hover:shadow-md hover:scale-[1.02]' : ''
      }`}
    >
      <div>
        {/* Card Header: Metric Name & Unified Icon */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
          {Icon && (
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        
        {/* Metric Value & Label Badge */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
          {infoBadge && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 border border-slate-200">
              {infoBadge}
            </span>
          )}
        </div>
      </div>

      {/* Descriptive Metadata Subtext */}
      {subtext && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold">
          {subtext}
        </div>
      )}
    </div>
  );
};
