import React from 'react';
import { Sparkles, Trophy, Award, Users, ShieldCheck, Heart } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="py-10 px-4 sm:px-8 max-w-5xl mx-auto space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About National Fest 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Empowering Next-Gen Innovators & Talent
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Welcome to the official portal of our flagship Annual National Inter-College Fest. Bringing together technical engineering hackathons, robotics combat, and cultural arts competitions under one unified platform.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit border border-indigo-100">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">National Competition</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hosting student participants from over 100+ premier institutions across technical and non-technical domains.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Digital Registration</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Streamlined online team submission with instant UPI payment screenshot upload, PDF receipts, and coordinator approval.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit border border-purple-100">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Student Council</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Organized and managed by faculty coordinators and student event council committees.
          </p>
        </div>
      </div>

      {/* Custom Data Placeholder Container */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-xl font-extrabold text-slate-900">Fest Overview & History</h3>
          <p className="text-xs text-slate-500 mt-1">Custom data section — update this content anytime in `src/pages/AboutPage.jsx`.</p>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <strong>Fest Vision:</strong> Our annual college fest aims to foster competitive excellence, technical innovation, and creative artistic expression among students. We provide state-of-the-art auditoriums, robotics arenas, and computer lab facilities.
          </p>
          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <strong>Organizing College:</strong> Autonomous Engineering & Management Institution accredited with NAAC Grade A+.
          </p>
        </div>
      </div>
    </div>
  );
};
