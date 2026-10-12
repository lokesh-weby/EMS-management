import React from 'react';
import { X, Calendar, Clock, MapPin, Users, Phone, Mail, Award, CheckCircle, ArrowRight } from 'lucide-react';

export const EventDetailModal = ({ isOpen, onClose, event, onRegisterClick }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Banner Header */}
        <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
          <img 
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80'} 
            alt={event.title}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {Number(event.registrationFee) === 0 ? (
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                  FREE ENTRY
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                  ₹{event.registrationFee}
                </span>
              )}

              {Number(event.maxTeamSize) === 1 ? (
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                  INDIVIDUAL
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                  TEAM (UP TO {event.maxTeamSize})
                </span>
              )}

              <span className="px-3 py-1 rounded-full bg-[#0c4da2] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                {event.eventScope || event.event_scope || 'National'}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-700 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                {event.eventType || event.event_type || 'Competition'}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                {event.category || 'Technical'}
              </span>
              {event.department && (
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                  {event.department}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white">{event.title}</h2>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Grid Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Event Date</span>
              <span className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {event.eventDate}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Timings</span>
              <span className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                {event.startTime} - {event.endTime}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Max Team Size</span>
              <span className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Up to {event.maxTeamSize} Members
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Registration Fee</span>
              <span className="text-xs font-extrabold text-emerald-600 mt-0.5 block">
                {event.registrationFee === 0 ? 'FREE ENTRY' : `₹${event.registrationFee}`}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">About Competition</h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {event.description}
            </p>
          </div>

          {/* Venue & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Venue & Campus Location
              </span>
              <p className="text-xs font-bold text-slate-900">{event.venue}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Registration Deadline
              </span>
              <p className="text-xs font-bold text-amber-700">{event.registrationDeadline}</p>
            </div>
          </div>

          {/* Event Organizers Section */}
          {event.organizers && event.organizers.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Event Co-ordinators & Support</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.organizers.map((org, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h5 className="font-extrabold text-xs text-slate-900">{org.name}</h5>
                    <p className="text-[11px] text-slate-500">{org.department} {org.registerNumber ? `(${org.registerNumber})` : ''}</p>
                    <div className="flex items-center gap-3 text-[11px] text-indigo-700 pt-1 font-medium">
                      {org.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {org.phone}</span>}
                      {org.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {org.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Close Window
          </button>

          <button
            onClick={() => { onClose(); onRegisterClick(event); }}
            className="glow-button px-6 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 transition-all hover:scale-105 shadow-md"
          >
            {Number(event.maxTeamSize || 1) === 1 ? 'Register Now' : 'Register Team For Event'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
