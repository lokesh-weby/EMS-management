import React, { useState, useEffect } from 'react';
import { 
  X, 
  User,
  Users, 
  Upload, 
  QrCode, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Download,
  Copy,
  Check,
  Loader2
} from 'lucide-react';

import { uploadToCloudinary } from '../lib/cloudinary';
import { generateRegistrationReceiptPDF } from '../lib/pdfGenerator';

export const RegistrationModal = ({ isOpen, onClose, event, events }) => {
  const [selectedEvent, setSelectedEvent] = useState(event || (events && events[0]));
  const [step, setStep] = useState(1);
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form Fields
  const [teamLeaderName, setTeamLeaderName] = useState('');
  const [teamLeaderEmail, setTeamLeaderEmail] = useState('');
  const [teamLeaderPhone, setTeamLeaderPhone] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');

  // Team Members State
  const [members, setMembers] = useState([
    { name: '', email: '', phone: '', registerNumber: '', department: '' }
  ]);

  // Payment Screenshot State
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState(null);
  const [paymentScreenshotPreviewUrl, setPaymentScreenshotPreviewUrl] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (event) {
      setSelectedEvent(event);
    } else if (events && events.length > 0) {
      setSelectedEvent(events[0]);
    }
  }, [event, events]);

  // Sync initial Leader as 1st member
  useEffect(() => {
    if (teamLeaderName || teamLeaderEmail) {
      setMembers(prev => {
        const copy = [...prev];
        copy[0] = {
          ...copy[0],
          name: teamLeaderName,
          email: teamLeaderEmail,
          phone: teamLeaderPhone,
          department: department
        };
        return copy;
      });
    }
  }, [teamLeaderName, teamLeaderEmail, teamLeaderPhone, department]);

  if (!isOpen || !selectedEvent) return null;

  const maxMembersAllowed = Number(selectedEvent.maxTeamSize || 1);
  const isTeamEvent = maxMembersAllowed > 1;
  const isFreeEvent = Number(selectedEvent.registrationFee || 0) === 0;

  const addMemberField = () => {
    if (members.length < maxMembersAllowed) {
      setMembers(prev => [
        ...prev,
        { name: '', email: '', phone: '', registerNumber: '', department: department || '' }
      ]);
    }
  };

  const removeMemberField = (idx) => {
    if (members.length > 1) {
      setMembers(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const updateMemberField = (idx, field, val) => {
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  // Local Image Selection Preview Handler (Defers Cloudinary upload to Complete Registration)
  const handleScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaymentScreenshotFile(file);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshotPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Live Database Pre-Check: Verify event still exists in DB & is published BEFORE doing Cloudinary upload or submitting
      const API_BASE = 'http://localhost:5000';
      let statusCheckRes;
      try {
        statusCheckRes = await fetch(`${API_BASE}/api/public/events/${selectedEvent.id}`);
      } catch (netErr) {
        console.warn("Pre-check network error:", netErr);
      }

      if (!statusCheckRes || !statusCheckRes.ok || statusCheckRes.status === 404) {
        setErrorMessage('Registration Failed: This event has been deleted from the database while you were registering. It is no longer accepting submissions.');
        setIsSubmitting(false);
        return;
      }

      const liveEvent = await statusCheckRes.json();
      if (!liveEvent || liveEvent.status !== 'published') {
        setErrorMessage('Registration Failed: This event is currently unpublished or no longer accepting registrations.');
        setIsSubmitting(false);
        return;
      }

      // 2. Upload payment screenshot to Cloudinary ONLY NOW when clicking Complete Registration
      let finalScreenshotUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
      
      if (isFreeEvent) {
        finalScreenshotUrl = 'N/A (Free Event)';
      } else if (paymentScreenshotFile) {
        setIsUploadingCloudinary(true);
        try {
          const uploadedUrl = await uploadToCloudinary(paymentScreenshotFile, 'EMS');
          if (uploadedUrl) {
            finalScreenshotUrl = uploadedUrl;
            setPaymentScreenshotUrl(uploadedUrl);
          }
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed on submission:", uploadErr);
        } finally {
          setIsUploadingCloudinary(false);
        }
      } else if (paymentScreenshotUrl) {
        finalScreenshotUrl = paymentScreenshotUrl;
      } else if (paymentScreenshotPreviewUrl) {
        finalScreenshotUrl = paymentScreenshotPreviewUrl;
      }

      // Prepare members list
      const finalMembers = isTeamEvent 
        ? members 
        : [{ name: teamLeaderName, email: teamLeaderEmail, phone: teamLeaderPhone, department: department || 'General' }];

      // 3. Submit application to DB
      const res = await fetch(`${API_BASE}/api/public/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          leaderName: teamLeaderName,
          leaderEmail: teamLeaderEmail,
          leaderPhone: teamLeaderPhone,
          leaderRegisterNum: teamLeaderName,
          leaderDept: department || college || 'General',
          teamName: isTeamEvent ? (teamLeaderName + "'s Team") : null,
          paymentScreenshot: finalScreenshotUrl,
          members: finalMembers
        })
      });

      const data = await res.json();
      if (res.ok && (data.id || data.registrationNumber || data.success)) {
        setSubmittedResult(data);
        setStep(4); // Success confirmation step
      } else {
        setErrorMessage(data.error || 'Registration submission failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTeamLeaderName('');
    setTeamLeaderEmail('');
    setTeamLeaderPhone('');
    setCollege('');
    setDepartment('');
    setMembers([{ name: '', email: '', phone: '', registerNumber: '', department: '' }]);
    setPaymentScreenshotFile(null);
    setPaymentScreenshotPreviewUrl('');
    setPaymentScreenshotUrl('');
    setSubmittedResult(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 my-6">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              {isTeamEvent ? (
                <>
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Team Event Registration</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Individual Event Registration</span>
                </>
              )}
              {isFreeEvent && <span className="ml-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-black">FREE</span>}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              {selectedEvent.title}
            </h3>
          </div>
          <button
            onClick={resetForm}
            className="p-2 rounded-full bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Step Progress Bar */}
        {step < 4 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            {/* Step 1: Info */}
            <div className={`flex items-center gap-2 font-bold ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px]">1</span>
              <span>{isTeamEvent ? 'Leader Info' : 'Participant Details'}</span>
            </div>

            {/* Step 2: Team Roster (Only if Team Event) */}
            {isTeamEvent && (
              <>
                <div className="w-8 h-[1px] bg-slate-200"></div>
                <div className={`flex items-center gap-2 font-bold ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px]">2</span>
                  <span>Team Roster ({members.length}/{maxMembersAllowed})</span>
                </div>
              </>
            )}

            {/* Step 3: Payment (Only if Paid Event) */}
            {!isFreeEvent && (
              <>
                <div className="w-8 h-[1px] bg-slate-200"></div>
                <div className={`flex items-center gap-2 font-bold ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px]">{isTeamEvent ? 3 : 2}</span>
                  <span>UPI Payment</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Participant / Team Leader Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Registration Fee</span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {isFreeEvent ? 'FREE ENTRY (₹0)' : `₹${selectedEvent.registrationFee}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block font-medium">Participation Mode</span>
                  <span className="text-xs font-extrabold text-indigo-700">
                    {isTeamEvent ? `Team (Up to ${maxMembersAllowed} Members)` : 'Individual Participant'}
                  </span>
                </div>
              </div>

              {isFreeEvent && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>This is a Free Event! No payment screenshot upload is required. Register instantly.</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTeamEvent ? 'Team Leader Name *' : 'Participant Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isTeamEvent ? "Enter team captain full name" : "Enter your full name"}
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="participant@gmail.com"
                      value={teamLeaderEmail}
                      onChange={(e) => setTeamLeaderEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={teamLeaderPhone}
                      onChange={(e) => setTeamLeaderPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">College / Institution *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. National Institute of Technology"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Stream *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science / Robotics"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Team Members Roster (Only if Team Event) */}
          {step === 2 && isTeamEvent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Team Members Information
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add up to {maxMembersAllowed} members participating in this event.
                  </p>
                </div>

                {members.length < maxMembersAllowed && (
                  <button
                    type="button"
                    onClick={addMemberField}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {members.map((mem, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[11px] font-extrabold uppercase text-indigo-700 flex items-center gap-1.5">
                        Member #{i + 1} {i === 0 ? '(Team Captain)' : ''}
                      </span>

                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => removeMemberField(i)}
                          className="text-rose-600 hover:text-rose-700 p-1 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Member Full Name"
                          value={mem.name}
                          onChange={(e) => updateMemberField(i, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Register / Roll Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 21CS045"
                          value={mem.registerNumber}
                          onChange={(e) => updateMemberField(i, 'registerNumber', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="member@gmail.com"
                          value={mem.email}
                          onChange={(e) => updateMemberField(i, 'email', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="+91 98765 00000"
                          value={mem.phone}
                          onChange={(e) => updateMemberField(i, 'phone', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: UPI Payment & Screenshot Upload (Only if Paid Event) */}
          {step === 3 && !isFreeEvent && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-500">Scan & Pay Registration Fee</span>
                
                {/* QR Code Display */}
                <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl w-40 h-40 mx-auto shadow-md">
                  <img
                    src={selectedEvent.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${selectedEvent.upiId || 'college.events@okicici'}&pn=${encodeURIComponent(selectedEvent.accountHolderName || 'College Student Council')}`}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-slate-900">UPI ID: <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-mono border border-slate-200">{selectedEvent.upiId || 'college.events@okicici'}</code></p>
                  <p className="text-slate-500 font-medium">Account Name: {selectedEvent.accountHolderName || 'College Student Council'}</p>
                  <p className="text-emerald-700 font-extrabold text-sm pt-1">Amount to Pay: ₹{selectedEvent.registrationFee}</p>
                </div>
              </div>

              {/* Upload Screenshot File */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Upload Payment Confirmation Screenshot *
                </label>
                
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors bg-slate-50 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className={`w-8 h-8 text-indigo-600 ${isUploadingCloudinary ? 'animate-bounce' : ''}`} />
                    {isUploadingCloudinary ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          Uploading receipt to Cloudinary CDN...
                        </span>
                        <p className="text-[10px] text-slate-500">Generating secure HTTPS image URL for DB...</p>
                      </div>
                    ) : paymentScreenshotPreviewUrl ? (
                      <div className="space-y-1.5 flex flex-col items-center">
                        <div className="relative w-28 h-20 rounded-xl border border-emerald-300 overflow-hidden shadow-xs bg-slate-100">
                          <img src={paymentScreenshotPreviewUrl} alt="Payment Receipt Preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Payment Receipt Attached!
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">Preview Ready (Uploads to Cloudinary on Complete Registration)</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Click or Drag & Drop Payment Receipt Screenshot</p>
                        <p className="text-[10px] text-slate-500 font-medium">Previewed on site & uploaded to Cloudinary on submission</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && submittedResult && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {isFreeEvent ? 'Registration Confirmed!' : 'Registration Submitted!'}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {isFreeEvent 
                    ? `Your registration for ${selectedEvent.title} is auto-confirmed!`
                    : `Your registration for ${selectedEvent.title} has been submitted for review.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-600 font-semibold">Registration Reference ID:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-indigo-700 font-mono font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs select-all">
                      {submittedResult.id || submittedResult.registrationNumber}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = submittedResult.id || submittedResult.registrationNumber;
                        if (targetId) {
                          navigator.clipboard.writeText(targetId);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg transition-colors"
                      title="Copy Reference ID to clipboard"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{isTeamEvent ? 'Team Leader:' : 'Participant:'}</span>
                  <span className="text-slate-900 font-semibold">{submittedResult.leaderName || submittedResult.teamLeaderName || teamLeaderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border ${
                    submittedResult.status === 'approved' 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {submittedResult.status === 'approved' ? 'VERIFIED & CONFIRMED' : `${submittedResult.status} (Verification In Progress)`}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 max-w-md mx-auto text-left">
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  💡 <strong>Tip:</strong> If you lose your Reference ID, you can check your status anytime on the <strong>Check Registration</strong> page using your <strong>Captain Email Address</strong> or <strong>Phone Number</strong>.
                </p>
              </div>

              {/* Download PDF Receipt Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => generateRegistrationReceiptPDF({ registration: submittedResult, event: selectedEvent })}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  Download Official Receipt (PDF)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {/* STEP 1 BUTTON ACTIONS */}
          {step === 1 && (
            isTeamEvent ? (
              <button
                type="button"
                onClick={() => {
                  if (!teamLeaderName || !teamLeaderEmail || !teamLeaderPhone) {
                    setErrorMessage('Please fill in all required team leader details.');
                    return;
                  }
                  setErrorMessage('');
                  setStep(2);
                }}
                className="glow-button px-6 py-2.5 rounded-xl text-white font-extrabold text-xs ml-auto flex items-center gap-1.5 transition-all hover:scale-105 shadow-md"
              >
                Next: Team Members <ArrowRight className="w-4 h-4" />
              </button>
            ) : isFreeEvent ? (
              <button
                type="button"
                onClick={(e) => {
                  if (!teamLeaderName || !teamLeaderEmail || !teamLeaderPhone || !college || !department) {
                    setErrorMessage('Please fill in all required participant details.');
                    return;
                  }
                  handleSubmit(e);
                }}
                disabled={isSubmitting}
                className="glow-button px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs ml-auto flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? 'Confirming Registration...' : 'Confirm & Complete Free Registration'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!teamLeaderName || !teamLeaderEmail || !teamLeaderPhone || !college || !department) {
                    setErrorMessage('Please fill in all required participant details.');
                    return;
                  }
                  setErrorMessage('');
                  setStep(3);
                }}
                className="glow-button px-6 py-2.5 rounded-xl text-white font-extrabold text-xs ml-auto flex items-center gap-1.5 transition-all hover:scale-105 shadow-md"
              >
                Next: Payment <ArrowRight className="w-4 h-4" />
              </button>
            )
          )}

          {/* STEP 2 BUTTON ACTIONS (Team Event) */}
          {step === 2 && isTeamEvent && (
            isFreeEvent ? (
              <button
                type="button"
                onClick={(e) => {
                  if (!members[0]?.name) {
                    setErrorMessage('Please enter at least member #1 details.');
                    return;
                  }
                  handleSubmit(e);
                }}
                disabled={isSubmitting}
                className="glow-button px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs ml-auto flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? 'Confirming Registration...' : 'Confirm & Complete Free Registration'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!members[0]?.name) {
                    setErrorMessage('Please enter at least member #1 details.');
                    return;
                  }
                  setErrorMessage('');
                  setStep(3);
                }}
                className="glow-button px-6 py-2.5 rounded-xl text-white font-extrabold text-xs ml-auto flex items-center gap-1.5 transition-all hover:scale-105 shadow-md"
              >
                Next: Payment <ArrowRight className="w-4 h-4" />
              </button>
            )
          )}

          {/* STEP 3 BUTTON ACTION (Paid Event Only) */}
          {step === 3 && !isFreeEvent && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingCloudinary}
              className="glow-button px-7 py-2.5 rounded-xl text-white font-extrabold text-xs ml-auto flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-md"
            >
              {isSubmitting || isUploadingCloudinary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Uploading to Cloudinary & Saving...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 rounded-xl bg-[#0c4da2] hover:bg-[#09397a] text-white font-extrabold text-xs ml-auto transition-colors shadow-md"
            >
              Done & Return to Fest
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
