import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Users, 
  ZoomIn,
  CreditCard,
  Mail,
  Phone,
  Building,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const RegistrationManagement = () => {
  const { isAdmin } = useAuth();
  const { visibleRegistrations, approveRegistration, rejectRegistration } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registrationsList, setRegistrationsList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRegsPage = async (pageToLoad = 1) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingPage(true);

    try {
      const token = localStorage.getItem('ems_jwt_token');
      const queryParams = new URLSearchParams({
        page: pageToLoad,
        limit: 6,
        ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {})
      });

      const res = await fetch(`http://localhost:5000/api/registrations?${queryParams.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const regArray = data.registrations || (Array.isArray(data) ? data : []);
        setRegistrationsList(prev => pageToLoad === 1 ? regArray : [...prev, ...regArray]);
        setHasMore(data.hasMore ?? false);
        setPage(pageToLoad + 1);
      }
    } catch (err) {
      console.warn("Failed to load paginated registrations:", err);
    } finally {
      loadingRef.current = false;
      setIsLoadingPage(false);
    }
  };

  // Re-fetch registrations from DB whenever debounced search or status filter changes
  useEffect(() => {
    loadRegsPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && page > 1) {
        loadRegsPage(page);
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore]);

  // Modal States
  const [selectedReg, setSelectedReg] = useState(null);
  const [screenshotModalUrl, setScreenshotModalUrl] = useState(null);
  const [rejectModalReg, setRejectModalReg] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');

  const handleApprove = async (id) => {
    setRegistrationsList(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    await approveRegistration(id);
    if (selectedReg?.id === id) {
      setSelectedReg(prev => ({ ...prev, status: 'approved' }));
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (rejectModalReg) {
      const regId = rejectModalReg.id;
      setRegistrationsList(prev => prev.map(r => r.id === regId ? { ...r, status: 'rejected', remarks: remarksInput } : r));
      await rejectRegistration(regId, remarksInput);
      if (selectedReg?.id === regId) {
        setSelectedReg(prev => ({ ...prev, status: 'rejected', remarks: remarksInput }));
      }
      setRejectModalReg(null);
      setRemarksInput('');
    }
  };

  // Filter Logic
  const sourceRegs = registrationsList.length > 0 ? registrationsList : visibleRegistrations;
  const filtered = sourceRegs.filter(r => {
    const leaderName = (r.teamLeaderName || r.leaderName || r.leader_name || '').toLowerCase();
    const collegeName = (r.college || r.leaderDept || r.department || '').toLowerCase();
    const eventTitle = (r.eventName || r.eventTitle || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();

    const matchesSearch = !term || leaderName.includes(term) || collegeName.includes(term) || eventTitle.includes(term);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayedData = filtered;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Participant Registrations Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Auditing all team registrations across all college fest events.' 
              : 'Review team submissions, payment screenshots, and approve registrations.'}
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search team leader, college or event..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          >
            <option value="all">All Registrations</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Team Leader</th>
                <th className="p-4">Event Name</th>
                <th className="p-4">College & Dept</th>
                <th className="p-4">Team Size</th>
                <th className="p-4">Payment Screenshot</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No registrations found matching search criteria.
                  </td>
                </tr>
              ) : (
                displayedData.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div>{reg.teamLeaderName}</div>
                      <div className="text-[11px] font-normal text-slate-500">{reg.teamLeaderEmail}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {reg.eventName}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{reg.college}</div>
                      <div className="text-[11px] text-slate-500">{reg.department}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {reg.teamSize} Members
                    </td>
                    <td className="p-4">
                      {(!reg.paymentScreenshotUrl || reg.paymentScreenshotUrl === 'Free Event' || (typeof reg.paymentScreenshotUrl === 'string' && reg.paymentScreenshotUrl.includes('Free Event'))) ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                          FREE ENTRY
                        </span>
                      ) : (
                        <button
                          onClick={() => setScreenshotModalUrl(reg.paymentScreenshotUrl)}
                          className="relative group rounded-lg overflow-hidden border border-slate-200 w-12 h-12 inline-block bg-slate-50"
                          title="Click to Zoom Payment Screenshot"
                        >
                          <img 
                            src={reg.paymentScreenshotUrl} 
                            alt="Payment Proof" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge status={reg.status} />
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(reg.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="View Full Team & Payment Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {reg.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(reg.id)}
                          className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Approve & Send Automated Email"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {reg.status !== 'rejected' && (
                        <button
                          onClick={() => { setRejectModalReg(reg); setRemarksInput(''); }}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                          title="Reject with Remarks"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* IntersectionObserver Sentinel & Infinite Scroll Footer */}
        <div ref={sentinelRef} className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Showing <strong className="text-slate-900">{displayedData.length}</strong> of <strong className="text-slate-900">{filtered.length}</strong> registrations
          </span>
          {hasMore && (
            <span className="text-indigo-600 font-bold animate-pulse">Loading more registrations...</span>
          )}
        </div>
      </div>

      {/* Comprehensive Team Registration & Payment Details Modal */}
      {selectedReg && (
        <Modal
          isOpen={Boolean(selectedReg)}
          onClose={() => setSelectedReg(null)}
          title={`Team Registration Details - ${selectedReg.teamLeaderName}`}
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-700" />
                  <span className="font-semibold text-slate-500 uppercase">Team Leader:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReg.teamLeaderName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{selectedReg.teamLeaderEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{selectedReg.teamLeaderPhone}</span>
                </div>
              </div>

              <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span className="font-semibold text-slate-500 uppercase">College:</span>
                  <span className="font-bold text-slate-900">{selectedReg.college}</span>
                </div>
                <div className="text-slate-600 pl-6">
                  Department: <span className="font-medium text-slate-800">{selectedReg.department}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered: {new Date(selectedReg.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Event & Status Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900 text-white gap-3">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Event Name</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedReg.eventName}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-medium">Team Size: <strong>{selectedReg.teamSize} Members</strong></span>
                <Badge status={selectedReg.status} />
              </div>
            </div>

            {/* Payment Proof Verification Screenshot (Shown ONLY for Paid Events) */}
            {!(
              selectedReg.paymentScreenshotUrl === 'Free Event' ||
              !selectedReg.paymentScreenshotUrl ||
              selectedReg.paymentScreenshotUrl.toLowerCase().includes('free')
            ) && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-900" />
                  Payment Proof Screenshot
                </h4>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div 
                    onClick={() => setScreenshotModalUrl(selectedReg.paymentScreenshotUrl)}
                    className="w-full sm:w-36 h-36 rounded-xl border border-slate-200 overflow-hidden bg-white relative group cursor-pointer"
                  >
                    <img 
                      src={selectedReg.paymentScreenshotUrl} 
                      alt="Payment Proof" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-bold gap-1 text-[11px]">
                      <ZoomIn className="w-4 h-4" /> Zoom Image
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold text-slate-800">UPI Transaction Verification Proof</p>
                    <p className="text-xs text-slate-500">
                      Verify the reference number and payment amount against the event fee before approving registration.
                    </p>
                    <a
                      href={selectedReg.paymentScreenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:underline pt-1"
                    >
                      Open Original Image File <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members List */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-900" />
                Team Members Roster ({selectedReg.members?.length || selectedReg.teamSize || 1})
              </h4>
              
              <div className="space-y-2.5">
                {selectedReg.members && selectedReg.members.length > 0 ? (
                  selectedReg.members.map((m, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">
                          {m.name || m.memberName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {m.registerNumber ? `Reg No: ${m.registerNumber} | ` : ''}Dept: {m.department || selectedReg.department}
                        </p>
                      </div>
                      <div className="text-left sm:text-right text-[11px] text-slate-600 font-mono">
                        <div>{m.email || m.memberEmail || selectedReg.teamLeaderEmail}</div>
                        <div>{m.phone || m.memberPhone || selectedReg.teamLeaderPhone}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{selectedReg.teamLeaderName} <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold ml-1.5 uppercase">Team Leader</span></p>
                      <p className="text-[11px] text-slate-500">Dept: {selectedReg.department}</p>
                    </div>
                    <div className="text-left sm:text-right text-[11px] text-slate-600 font-mono">
                      <div>{selectedReg.teamLeaderEmail}</div>
                      <div>{selectedReg.teamLeaderPhone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            {selectedReg.remarks && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-bold uppercase tracking-wider text-[10px]">Coordinator Remarks: </span> 
                <p className="mt-0.5 text-xs">{selectedReg.remarks}</p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close View
              </button>

              {selectedReg.status !== 'rejected' && (
                <button
                  onClick={() => { setRejectModalReg(selectedReg); setRemarksInput(''); }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Registration
                </button>
              )}

              {selectedReg.status !== 'approved' && (
                <button
                  onClick={() => handleApprove(selectedReg.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Registration & Send Email
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Screenshot Modal Viewer */}
      {screenshotModalUrl && (
        <Modal
          isOpen={Boolean(screenshotModalUrl)}
          onClose={() => setScreenshotModalUrl(null)}
          title="Payment Proof Screenshot Verification"
        >
          <div className="space-y-4 text-center">
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img 
                src={screenshotModalUrl} 
                alt="Payment Screenshot" 
                className="max-h-full max-w-full object-contain rounded-lg" 
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 px-2">
              <span>UPI Transaction Reference Verification</span>
              <a
                href={screenshotModalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 font-bold hover:underline flex items-center gap-1"
              >
                Open Original File
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Registration Modal with Remarks */}
      {rejectModalReg && (
        <Modal
          isOpen={Boolean(rejectModalReg)}
          onClose={() => setRejectModalReg(null)}
          title={`Reject Registration - ${rejectModalReg.teamLeaderName}`}
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Please specify the reason/remarks for rejecting this registration (e.g., payment screenshot unclear, transaction mismatch):
            </p>
            <textarea
              required
              rows={3}
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              placeholder="Enter rejection remarks..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReg(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
