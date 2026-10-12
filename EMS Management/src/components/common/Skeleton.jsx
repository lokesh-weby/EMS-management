import React from 'react';

export const SkeletonCard = () => (
  <div className="glass-panel p-5 rounded-2xl border border-slate-800 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-3 w-24 bg-slate-800 rounded"></div>
      <div className="w-8 h-8 bg-slate-800 rounded-xl"></div>
    </div>
    <div className="h-8 w-16 bg-slate-800 rounded"></div>
    <div className="h-3 w-32 bg-slate-800/60 rounded"></div>
  </div>
);

export const SkeletonTableRow = () => (
  <tr className="animate-pulse border-b border-slate-800/50">
    <td className="p-4"><div className="h-4 w-32 bg-slate-800 rounded"></div></td>
    <td className="p-4"><div className="h-4 w-24 bg-slate-800 rounded"></div></td>
    <td className="p-4"><div className="h-4 w-28 bg-slate-800 rounded"></div></td>
    <td className="p-4"><div className="h-4 w-16 bg-slate-800 rounded"></div></td>
    <td className="p-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
  </tr>
);
