import React, { useState } from 'react';
import { X, Search, CheckCircle, Clock, AlertTriangle, ExternalLink, Users, Calendar, Download } from 'lucide-react';
import { generateRegistrationReceiptPDF } from '../lib/pdfGenerator';

export const StatusCheckModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearched(true);

    try {
      const API_BASE = 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/public/status/${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : [data]);
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults(null);
    setSearched(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Check Registration Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your Email Address or Registration Reference ID.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. priya.s@gmail.com or reg-002-robo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Lookup Status'}
            </button>
          </form>

          {/* Results List */}
          {searched && (
            <div className="space-y-4 pt-2">
              {results === null || results.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-700">No registrations found matching "{query}"</p>
                  <p className="text-[11px] text-slate-500">Please double check your email address or Registration ID.</p>
                </div>
              ) : (
                results.map(reg => (
                  <div key={reg.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-indigo-600 font-extrabold uppercase">Ref ID: {reg.id}</span>
                        <h4 className="font-extrabold text-sm text-slate-900">{reg.event?.title || 'College Event'}</h4>
                        <p className="text-xs text-slate-600">Team Leader: {reg.teamLeaderName} ({reg.college})</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        reg.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : reg.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {reg.status}
                      </span>
                    </div>

                    {/* Status Remarks */}
                    {reg.remarks && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Coordinator Remarks:</span>
                        <p className="mt-0.5">{reg.remarks}</p>
                      </div>
                    )}

                    {/* Team Roster */}
                    {reg.members && reg.members.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Team Members ({reg.members.length}):</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {reg.members.map((m, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 font-medium">
                              {m.name} {m.registerNumber ? `(${m.registerNumber})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                      {/* Event Coordinators / Organizers Section */}
                      {((reg.organizers && reg.organizers.length > 0) || reg.organizerPhone) && (
                        <div className="space-y-2 mt-2">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                            Event Coordinators ({reg.organizers?.length || 1})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {reg.organizers && reg.organizers.length > 0 ? (
                              reg.organizers.map((org, i) => (
                                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {org.name ? org.name[0] : 'C'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-slate-900 truncate">{org.name || 'Coordinator'}</p>
                                      <p className="text-[9px] text-slate-500 truncate">{org.department || 'Department'}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {org.phone && (
                                      <>
                                        {reg.status === 'pending' && (
                                          <a
                                            href={`https://wa.me/${org.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, my registration is currently pending verification.\n\nReference ID:\n${reg.id || reg.registrationNumber}\n\nName: ${reg.leaderName || ''}\nEvent: ${reg.eventTitle || ''}`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors shadow-xs"
                                            title={`Message ${org.name} on WhatsApp`}
                                          >
                                            <MessageSquare className="w-2.5 h-2.5" />
                                            WhatsApp
                                          </a>
                                        )}

                                        <a
                                          href={`tel:${org.phone.replace(/[^0-9+]/g, '')}`}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono font-bold text-[10px] hover:bg-slate-100 transition-colors shadow-xs"
                                          title={`Call ${org.name}`}
                                        >
                                          <Phone className="w-2.5 h-2.5 text-slate-500" />
                                          {org.phone}
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {reg.organizerName ? reg.organizerName[0] : 'C'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-slate-900 truncate">{reg.organizerName || 'Event Coordinator'}</p>
                                    <p className="text-[9px] text-slate-500 truncate">{reg.organizerDepartment || 'Department'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {reg.organizerPhone && (
                                    <>
                                      {reg.status === 'pending' && (
                                        <a
                                          href={`https://wa.me/${reg.organizerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, my registration is currently pending verification.\n\nReference ID:\n${reg.id || reg.registrationNumber}\n\nName: ${reg.leaderName || ''}\nEvent: ${reg.eventTitle || ''}`)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors shadow-xs"
                                        >
                                          <MessageSquare className="w-2.5 h-2.5" />
                                          WhatsApp
                                        </a>
                                      )}

                                      <a
                                        href={`tel:${reg.organizerPhone.replace(/[^0-9+]/g, '')}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono font-bold text-[10px] hover:bg-slate-100 transition-colors shadow-xs"
                                      >
                                        <Phone className="w-2.5 h-2.5 text-slate-500" />
                                        {reg.organizerPhone}
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={() => generateRegistrationReceiptPDF({ registration: reg, event: reg.event })}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Receipt (PDF)
                        </button>

                        {reg.status === 'approved' && (reg.event?.whatsappGroupLink || reg.whatsappGroupLink) && (
                          <a
                            href={reg.event?.whatsappGroupLink || reg.whatsappGroupLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            Join WhatsApp Group
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
