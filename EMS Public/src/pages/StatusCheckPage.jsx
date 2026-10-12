import React, { useState } from 'react';
import { Search, CheckCircle, Clock, AlertTriangle, ExternalLink, Users, Calendar, Download, ShieldCheck, MessageSquare, Phone } from 'lucide-react';
import { generateRegistrationReceiptPDF } from '../lib/pdfGenerator';

export const StatusCheckPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
        console.log(results)
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Participant Registration Status Lookup
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Track live approval status, view co-ordinator remarks, download your official registration receipt (PDF), and join team WhatsApp groups.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter Team Reference ID (e.g. REG-2026-123456) or Captain Email / Phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-[#0c4da2] hover:bg-[#09397a] text-white font-extrabold text-xs transition-colors shadow-md shadow-[#0c4da2]/20 disabled:opacity-50 shrink-0"
          >
            {isLoading ? 'Searching Database...' : 'Lookup Status'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {searched && (
        <div className="space-y-4">
          {results === null || results.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Registrations Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                We could not find any team registration matching "<strong className="text-slate-900">{query}</strong>". Please check your Reference ID from your receipt, or try searching with your Captain Email / Phone.
              </p>
            </div>
          ) : (
            results.map(reg => (
              <div key={reg.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
                      <span>REFERENCE ID:</span>
                      <span className="select-all text-indigo-900">{reg.id || reg.registrationNumber}</span>
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 mt-2">{reg.eventTitle || reg.event?.title || 'College Event'}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Team Captain: <strong>{reg.leaderName || reg.teamLeaderName || 'Participant'}</strong></p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                    reg.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : reg.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {reg.status}
                  </span>
                </div>

                {/* Co-ordinator Remarks */}
                {(reg.remarks || reg.rejectionReason) && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Co-ordinator Note:</span>
                    <p className="leading-relaxed">{reg.remarks || reg.rejectionReason}</p>
                  </div>
                )}

                {/* Team Members Roster */}
                {reg.members && reg.members.length > 0 && (
                  <div className="text-xs space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Registered Team Members ({reg.members.length}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {reg.members.map((m, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs">
                          {m.name} {m.register_number || m.registerNumber ? `(${m.register_number || m.registerNumber})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Coordinators / Organizers Section */}
                {((reg.organizers && reg.organizers.length > 0) || reg.organizerPhone) && (
                  <div className="space-y-2.5 mt-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Event Coordinators ({reg.organizers?.length || 1})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {reg.organizers && reg.organizers.length > 0 ? (
                        reg.organizers.map((org, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {org.name ? org.name[0] : 'C'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 truncate">{org.name || 'Coordinator'}</p>
                                <p className="text-[10px] text-slate-500 truncate">{org.department || 'Event Department'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {org.phone && (
                                <>
                                  {reg.status === 'pending' && (
                                    <a
                                      href={`https://wa.me/${org.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, my registration is currently pending verification.\n\nReference ID:\n${reg.id || reg.registrationNumber}\n\nName: ${reg.leaderName || ''}\nEvent: ${reg.eventTitle || ''}`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                                      title={`Message ${org.name} on WhatsApp`}
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      WhatsApp
                                    </a>
                                  )}

                                  <a
                                    href={`tel:${org.phone.replace(/[^0-9+]/g, '')}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono font-bold text-[11px] hover:bg-slate-100 transition-colors shadow-xs"
                                    title={`Call ${org.name}`}
                                  >
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    {org.phone}
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {reg.organizerName ? reg.organizerName[0] : 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 truncate">{reg.organizerName || 'Event Coordinator'}</p>
                              <p className="text-[10px] text-slate-500 truncate">{reg.organizerDepartment || 'Event Department'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {reg.organizerPhone && (
                              <>
                                {reg.status === 'pending' && (
                                  <a
                                    href={`https://wa.me/${reg.organizerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, my registration is currently pending verification.\n\nReference ID:\n${reg.id || reg.registrationNumber}\n\nName: ${reg.leaderName || ''}\nEvent: ${reg.eventTitle || ''}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    WhatsApp
                                  </a>
                                )}

                                <a
                                  href={`tel:${reg.organizerPhone.replace(/[^0-9+]/g, '')}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono font-bold text-[11px] hover:bg-slate-100 transition-colors shadow-xs"
                                >
                                  <Phone className="w-3 h-3 text-slate-500" />
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
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => generateRegistrationReceiptPDF({ registration: reg, event: reg.event })}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Download Official Receipt (PDF)
                  </button>

                  {reg.status === 'approved' && (reg.event?.whatsappGroupLink || reg.whatsappGroupLink) && (
                    <a
                      href={reg.event?.whatsappGroupLink || reg.whatsappGroupLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                    >
                      Join WhatsApp Group
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
