import React from 'react';
import { Sparkles, Calendar, MapPin, ArrowRight, ShieldCheck, Users, Award } from 'lucide-react';

export const Hero = ({ onExploreClick, totalEventsCount }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-12 pb-16 px-4 sm:px-8 overflow-hidden bg-[url('/SRMIST-BG.jpg')] bg-cover bg-center bg-no-repeat">
      {/* Background Dim Overlay */}
      <div className="absolute inset-0 bg-slate-950/20 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 my-auto">
        {/* Main Hero Card for 100% Text Clarity */}
        <div className="bg-white/92 backdrop-blur-xl border border-white/90 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#0c4da2]" />
            <span>Official Inter-College Fest Portal 2026</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Innovate, Compete & <br />
            <span>
              Conquer The Stage
            </span>
          </h1>

          {/* Hero Description */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Join engineering, robotics, and creative talent from across the country. Register your team online with instant UPI verification and receipt generation.
          </p>

          {/* Action Button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={onExploreClick}
              className="glow-button text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all hover:scale-105 shadow-xl"
            >
              Explore & Register Events
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Fest Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-md text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-indigo-600 font-extrabold text-xl sm:text-2xl">
              <Award className="w-5 h-5" />
              <span>{totalEventsCount || 2}+</span>
            </div>
            <p className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">Live Fest Events</p>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-md text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-xl sm:text-2xl">
              <Users className="w-5 h-5" />
              <span>100%</span>
            </div>
            <p className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">Online Verification</p>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl col-span-2 sm:col-span-1 border border-slate-200 shadow-md text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-extrabold text-xl sm:text-2xl">
              <ShieldCheck className="w-5 h-5" />
              <span>Instant</span>
            </div>
            <p className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">WhatsApp & Email Pass</p>
          </div>
        </div>
      </div>
    </section>
  );
};
