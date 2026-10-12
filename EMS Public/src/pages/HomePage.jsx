import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { Sparkles, ArrowRight, ShieldCheck, Trophy, Calendar, CheckCircle } from 'lucide-react';

export const HomePage = ({ events = [], onRegisterClick, onViewDetailClick }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Banner */}
      <Hero 
        onExploreClick={() => navigate('/events')}
        totalEventsCount={(events || []).length || 10}
      />

      {/* Highlights Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">20+ National Competitions</h4>
              <p className="text-xs text-slate-500 mt-1">Hackathons, Robotics, Coding, Cultural & Gaming Arenas with prizes.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Instant UPI Receipt</h4>
              <p className="text-xs text-slate-500 mt-1">Upload payment screenshot & get official PDF registration pass immediately.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">WhatsApp & Email Pass</h4>
              <p className="text-xs text-slate-500 mt-1">Direct access to event co-ordinators and dedicated WhatsApp team groups.</p>
            </div>
          </div>
        </div>
      </div>

 

      {/* Call to Action Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-8">
        <div className="bg-gradient-to-r from-[#0c4da2] to-[#09397a] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Ready to Compete?</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">Form your team & claim your spot today!</h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Registrations are open for all college students. Verify your team status anytime using your email address.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <Link
              to="/events"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0c4da2] font-extrabold text-xs transition-all shadow-md flex items-center gap-2"
            >
              Browse All Events
              <ArrowRight className="w-4 h-4 text-[#0c4da2]" />
            </Link>
            <Link
              to="/status"
              className="px-5 py-3 rounded-xl bg-[#09397a]/80 hover:bg-[#09397a] text-white border border-blue-400/40 text-xs font-bold transition-all"
            >
              Check My Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
