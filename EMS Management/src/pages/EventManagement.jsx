import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  UserPlus,
  X,
  User,
  Users,
  Gift,
  CreditCard,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ImageUploader } from '../components/common/ImageUploader';
import { uploadToCloudinary } from '../lib/cloudinary';

export const SCOPE_OPTIONS = ['National', 'International', 'State', 'Regional', 'Institutional'];
export const TYPE_OPTIONS = [
  'Conference', 'Workshop', 'Seminar', 'Webinar', 'Symposium', 
  'FDP', 'STTP', 'Hackathon', 'Competition', 'Guest Lecture', 
  'Training Programme', 'Exhibition'
];
export const DEPARTMENT_OPTIONS = [
  "Food Technology",
  "Aerospace Engineering",
  "Agricultural Economics",
  "Agricultural Extension Education",
  "Agricultural Sciences",
  "Agronomy",
  "Automobile Engineering",
  "Basic Sciences",
  "Basic Sciences and Engineering - Vendhar Nagar, Baburayanpettai, Acharapakkam Campus",
  "Biochemistry",
  "Biomedical Engineering",
  "Biotechnology",
  "Biotechnology – Science and Humanities",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Commerce",
  "Computational Intelligence",
  "Computer Applications",
  "Computer Science",
  "Computer Science & Engineering",
  "Computer Science & Engineering - Vendhar Nagar, Baburayanpettai, Acharapakkam Campus",
  "Computing Technologies",
  "Corporate Secretaryship and Accounting & Finance",
  "Data Science And Business Systems",
  "Defence and Strategic Studies",
  "Economics",
  "Electrical and Electronics Engineering",
  "Electronics & Communication",
  "Electronics & Communication Engineering - Vendhar Nagar, Baburayanpettai, Acharapakkam Campus",
  "Electronics & Instrumentation Engineering",
  "English",
  "Entomology",
  "Fashion Designing",
  "Floriculture and Landscaping Architecture",
  "French",
  "Fruit Science",
  "Genetic Engineering",
  "Genetics and Plant breeding",
  "Hindi",
  "Horticulture",
  "Journalism And Mass Communication",
  "Language, Culture and Society",
  "Law",
  "Management",
  "Mathematics",
  "Mathematics and Statistics",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Natural Resources Management",
  "Networking And Communications",
  "Pharmaceutical Analysis",
  "Pharmaceutical Chemistry",
  "Pharmaceutical Quality Assurance",
  "Pharmaceutical Regulatory Affairs",
  "Pharmaceutics",
  "Pharmacognosy",
  "Pharmacology",
  "Pharmacy Practice",
  "Physical Education",
  "Physical Education & Sports Sciences",
  "Physics",
  "Physics and Nanotechnology",
  "Plant Pathology",
  "Plant Protection",
  "Post Harvest and Technology",
  "Psychology",
  "Social Sciences",
  "Social Work",
  "Soil Science",
  "Tamil",
  "Vegetable Science",
  "Visual Communication",
  "Yoga"
];

export const EventManagement = ({ externalModalOpen, setExternalModalOpen }) => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    visibleEvents, 
    organizers, 
    saveEvent, 
    deleteEvent, 
    toggleEventPublish 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [eventsList, setEventsList] = useState([]);
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

  const loadEventsPage = async (pageToLoad = 1) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingPage(true);

    try {
      const token = localStorage.getItem('ems_jwt_token');
      const queryParams = new URLSearchParams({
        page: pageToLoad,
        limit: 6,
        ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
        ...(selectedScope !== 'All' ? { scope: selectedScope } : {}),
        ...(selectedType !== 'All' ? { type: selectedType } : {}),
        ...(selectedStatus !== 'All' ? { status: selectedStatus } : {}),
        ...(selectedDepartment !== 'All' ? { department: selectedDepartment } : {})
      });

      const res = await fetch(`http://localhost:5000/api/events?${queryParams.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const evArray = data.events || (Array.isArray(data) ? data : []);
        setEventsList(prev => pageToLoad === 1 ? evArray : [...prev, ...evArray]);
        setHasMore(data.hasMore ?? false);
        setPage(pageToLoad + 1);
      }
    } catch (err) {
      console.warn("Failed to load paginated events:", err);
    } finally {
      loadingRef.current = false;
      setIsLoadingPage(false);
    }
  };

  // Re-fetch events from DB whenever debounced search or filter options change
  useEffect(() => {
    loadEventsPage(1);
  }, [debouncedSearchTerm, selectedScope, selectedType, selectedStatus, selectedDepartment]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && page > 1) {
        loadEventsPage(page);
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const handleOpen = () => handleOpenCreate();
    window.addEventListener('open-create-event', handleOpen);
    return () => window.removeEventListener('open-create-event', handleOpen);
  }, []);
  const [deletingId, setDeletingId] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventScope, setEventScope] = useState('National');
  const [eventType, setEventType] = useState('Competition');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [bannerUrl, setBannerUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [venue, setVenue] = useState('');
  const [registrationFee, setRegistrationFee] = useState(0);
  const [maxTeamSize, setMaxTeamSize] = useState(1);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [eventStatus, setEventStatus] = useState('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [registrationRequired, setRegistrationRequired] = useState('yes'); // 'yes' | 'no'

  // Fee Mode & Participation Mode toggles
  const [feeMode, setFeeMode] = useState('paid'); // 'free' | 'paid'
  const [participationMode, setParticipationMode] = useState('team'); // 'individual' | 'team'

  // Dynamic Organizers Array State
  const [organizerList, setOrganizerList] = useState([]);

  // Reset form
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setEventScope('National');
    setEventType('Competition');
    setDepartment('Computer Science & Engineering');
    setBannerUrl('');
    setEventDate(new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndTime('17:00');
    setRegistrationDeadline(new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]);
    setVenue('Main Auditorium Block A');
    setRegistrationFee(200);
    setFeeMode('paid');
    setMaxTeamSize(4);
    setParticipationMode('team');
    setWhatsappGroupLink('https://chat.whatsapp.com/CollegeEventGroup');
    setUpiId('college.events@okicici');
    setAccountHolderName('College Student Council');
    setUpiQrUrl('');
    setEventStatus('published');
    setOrganizerList([
      { name: '', department: '', email: '', phone: '', registerNumber: '' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setEventScope(ev.eventScope || ev.event_scope || 'National');
    setEventType(ev.eventType || ev.event_type || 'Competition');
    setDepartment(ev.department || 'Computer Science & Engineering');
    setBannerUrl(ev.bannerUrl || '');
    setEventDate(ev.eventDate);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setRegistrationDeadline(ev.registrationDeadline);
    setVenue(ev.venue);
    
    const fee = Number(ev.registrationFee || 0);
    setRegistrationFee(fee);
    setFeeMode(fee === 0 ? 'free' : 'paid');

    const teamSize = Number(ev.maxTeamSize || 1);
    setMaxTeamSize(teamSize);
    setParticipationMode(teamSize === 1 ? 'individual' : 'team');

    setWhatsappGroupLink(ev.whatsappGroupLink || '');
    setUpiId(ev.upiId || '');
    setAccountHolderName(ev.accountHolderName || '');
    setUpiQrUrl(ev.upiQrUrl || '');
    setEventStatus(ev.status);

    const existingOrgs = (ev.organizers && ev.organizers.length > 0) 
      ? ev.organizers 
      : organizers.filter(o => o.eventId === ev.id);
    setOrganizerList(existingOrgs.length > 0 ? existingOrgs : [
      { name: '', department: '', email: '', phone: '', registerNumber: '' }
    ]);
    setIsModalOpen(true);
  };

  // Sync external modal trigger
  React.useEffect(() => {
    if (externalModalOpen) {
      handleOpenCreate();
      if (setExternalModalOpen) setExternalModalOpen(false);
    }
  }, [externalModalOpen]);

  // Dynamic Organizers Helpers
  const addOrganizerField = () => {
    setOrganizerList(prev => [
      ...prev,
      { name: '', department: '', email: '', phone: '', registerNumber: '' }
    ]);
  };

  const removeOrganizerField = (index) => {
    setOrganizerList(prev => prev.filter((_, i) => i !== index));
  };

  const updateOrganizerField = (index, field, value) => {
    setOrganizerList(prev => prev.map((org, i) => i === index ? { ...org, [field]: value } : org));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      let finalBannerUrl = bannerUrl;
      let finalUpiQrUrl = upiQrUrl;

      // 1. Upload Banner Image to Cloudinary ONLY when Save & Publish Event is clicked
      if (bannerUrl && (bannerUrl.startsWith('data:image/') || bannerUrl.startsWith('blob:'))) {
        console.log('🚀 Uploading Event Banner to Cloudinary on Save...');
        const uploadedBannerUrl = await uploadToCloudinary(bannerUrl, 'EMS');
        if (uploadedBannerUrl) {
          finalBannerUrl = uploadedBannerUrl;
        }
      }

      // 2. Upload UPI QR Code Image to Cloudinary ONLY when Save & Publish Event is clicked
      if (upiQrUrl && (upiQrUrl.startsWith('data:image/') || upiQrUrl.startsWith('blob:'))) {
        console.log('🚀 Uploading UPI QR Code to Cloudinary on Save...');
        const uploadedQrUrl = await uploadToCloudinary(upiQrUrl, 'EMS');
        if (uploadedQrUrl) {
          finalUpiQrUrl = uploadedQrUrl;
        }
      }

      const eventPayload = {
        id: editingEvent ? editingEvent.id : undefined,
        title,
        description,
        eventScope,
        eventType,
        department,
        bannerUrl: finalBannerUrl,
        eventDate,
        startTime,
        endTime,
        registrationDeadline,
        venue,
        registrationFee: Number(registrationFee),
        maxTeamSize: Number(maxTeamSize),
        whatsappGroupLink,
        upiId,
        accountHolderName,
        upiQrUrl: finalUpiQrUrl,
        status: eventStatus,
        createdById: editingEvent ? editingEvent.createdById : currentUser?.id
      };

      const validOrganizers = organizerList.filter(o => o.name.trim() !== '');
      await saveEvent(eventPayload, validOrganizers);
      await loadEventsPage(1);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save event:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (ev) => {
    const newStatus = ev.status === 'published' ? 'draft' : 'published';
    setEventsList(prev => prev.map(e => e.id === ev.id ? { ...e, status: newStatus } : e));
    await toggleEventPublish(ev.id, ev.status);
    setTimeout(() => {
      loadEventsPage(1);
    }, 200);
  };

  const handleDeleteEvent = async (id) => {
    try {
      setEventsList(prev => prev.filter(e => e.id !== id));
      setDeletingId(null);
      await deleteEvent(id);
      setTimeout(() => {
        loadEventsPage(1);
      }, 200);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  // Multi-field Classification & Search Filtering
  const sourceEvents = eventsList.length > 0 ? eventsList : visibleEvents;
  const filteredEvents = sourceEvents.filter(e => {
    const scopeVal = e.eventScope || e.event_scope || 'National';
    const typeVal = e.eventType || e.event_type || 'Competition';
    const statusVal = e.status || 'draft';

    const matchesSearch = !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = selectedScope === 'All' || scopeVal === selectedScope;
    const matchesType = selectedType === 'All' || typeVal === selectedType;
    const matchesStatus = selectedStatus === 'All' || statusVal === selectedStatus;

    return matchesSearch && matchesScope && matchesType && matchesStatus;
  });

  const displayedEvents = filteredEvents;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? 'All College Events Catalog' : 'My Event Workspace'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Full admin authority to audit, create, edit, or publish any college event.'
              : 'Create, publish, and manage organizers for your events.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Event
          </button>
        )}
      </div>

      {/* Controls Bar & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search title, venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2] focus:bg-white"
          />
        </div>

        {/* Classification Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Scope Filter */}
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0c4da2]"
          >
            <option value="All">All Scopes</option>
            {SCOPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0c4da2]"
          >
            <option value="All">All Types</option>
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Category Filter */}
         

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0c4da2]"
          >
            <option value="All">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Events Grid Cards */}
      {displayedEvents.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-200 text-center">
          <p className="text-slate-500 text-sm font-semibold">No events found matching selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map(ev => {
            const eventOrgs = organizers.filter(o => o.eventId === ev.id);
            const scopeVal = ev.eventScope || ev.event_scope || 'National';
            const typeVal = ev.eventType || ev.event_type || 'Competition';
            const catVal = ev.category || 'Technical';

            return (
              <div 
                key={ev.id} 
                className="glass-panel rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between group hover:border-[#0c4da2]/40 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div>
                  {/* Event Banner & Badges */}
                  <a 
                    href={ev.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative h-48 w-full bg-slate-100 overflow-hidden cursor-pointer group/banner block"
                    title="Open image in new tab"
                  >
                    <img 
                      src={ev.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'} 
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Hover Hint Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/banner:bg-black/25 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover/banner:opacity-100 transition-opacity bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs shadow-lg">
                        <Eye className="w-3.5 h-3.5" />
                        Open image in new tab
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <Badge status={ev.status} />
                    </div>
                  </a>

                  {/* Card Content */}
                  <div className="p-6 space-y-5">
                    {/* Topic, Tags & Description */}
                    <div className="space-y-3">
                      <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-[#0c4da2] transition-colors line-clamp-1 tracking-tight">
                        {ev.title}
                      </h3>

                      {/* Classification Badges Below Topic */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
                        {Number(ev.registrationFee) === 0 ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                            FREE ENTRY
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                            ₹{ev.registrationFee}
                          </span>
                        )}

                        {Number(ev.maxTeamSize) === 1 ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                            INDIVIDUAL
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                            TEAM (MAX {ev.maxTeamSize})
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0c4da2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                          {scopeVal}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0c4da2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                          {typeVal}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0c4da2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                          {catVal}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                        {ev.description}
                      </p>
                    </div>

                    {/* Date, Time & Venue */}
                    <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#0c4da2] shrink-0" />
                          <span className="truncate">{ev.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#0c4da2] shrink-0" />
                          <span>{ev.startTime} - {ev.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#0c4da2] shrink-0" />
                        <span className="truncate">{ev.venue}</span>
                      </div>
                    </div>

                    {/* Fee & Team Size */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-500">Fee: <strong className="text-emerald-600 font-extrabold text-sm ml-1">₹{ev.registrationFee}</strong></span>
                      <span className="text-slate-500">Max Team: <strong className="text-slate-900 font-bold ml-1">{ev.maxTeamSize} Members</strong></span>
                    </div>

                    {/* Organizers Count Pill */}
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <span>Organizers: <strong className="text-slate-900 font-bold">{eventOrgs.length} assigned</strong></span>
                      <span className="text-[10px] text-amber-700 font-bold font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Deadline: {ev.registrationDeadline}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  {isAdmin ? (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleTogglePublish(ev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          ev.status === 'published'
                            ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {ev.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewEvent({ ...ev, organizers: eventOrgs })}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Event & Organizers Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ev)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Edit Event"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(ev.id)}
                          className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setViewEvent({ ...ev, organizers: eventOrgs })}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0c4da2] font-bold text-xs transition-all border border-blue-200/80 shadow-2xs group/btn"
                      title="View Event & Organizers Details"
                    >
                      <Eye className="w-4 h-4 text-[#0c4da2] group-hover/btn:scale-110 transition-transform" />
                      <span>About the Event</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* IntersectionObserver Sentinel & Dynamic Scroll Footer */}
        <div ref={sentinelRef} className="py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Showing <strong className="text-slate-900">{displayedEvents.length}</strong> of <strong className="text-slate-900">{filteredEvents.length}</strong> events
          </span>
          {hasMore && (
            <span className="text-indigo-600 font-bold animate-pulse">Loading more events...</span>
          )}
        </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Edit Event Details' : 'Create & Publish New Event'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Details & Classification */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0c4da2] border-b border-slate-100 pb-1">
              1. Basic Information & Event Classification
            </h4>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HackTech 2026 - National Inter-College Hackathon"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#0c4da2] focus:bg-white"
              />
            </div>

            {/* Event Scope, Type, Category & Department Classification Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Event Scope *
                </label>
                <select
                  value={eventScope}
                  onChange={(e) => setEventScope(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#0c4da2] focus:bg-white font-medium"
                >
                  {SCOPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Event Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#0c4da2] focus:bg-white font-medium"
                >
                  {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>



              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#0c4da2] focus:bg-white font-medium truncate"
                >
                  {DEPARTMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Event Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive details, guidelines, rules, and prize pool structure..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>

            {/* Cloudinary Banner Uploader */}
            <ImageUploader
              label="Event Banner Image (Cloudinary Storage)"
              value={bannerUrl}
              onChange={setBannerUrl}
              folder="event_banners"
            />
          </div>

          {/* Section 2: Schedule & Venue */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 border-b border-slate-100 pb-1">
              2. Event Schedule & Venue
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Registration Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Venue Location *
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Auditorium Block A & CS Labs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 3: Registration, Communication & Payment */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 border-b border-slate-100 pb-1">
              3. Participation Type, Pricing & Payment Details
            </h4>

            {/* Participation & Fee Mode Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {/* Participation Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Participation Type *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParticipationMode('individual');
                      setMaxTeamSize(1);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      participationMode === 'individual' || Number(maxTeamSize) === 1
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Individual (1 Person)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParticipationMode('team');
                      if (Number(maxTeamSize) <= 1) setMaxTeamSize(4);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      participationMode === 'team' && Number(maxTeamSize) > 1
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Team Event
                  </button>
                </div>
              </div>

              {/* Fee Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Event Pricing *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFeeMode('free');
                      setRegistrationFee(0);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      feeMode === 'free' || Number(registrationFee) === 0
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" /> Free Event (₹0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeeMode('paid');
                      if (Number(registrationFee) === 0) setRegistrationFee(150);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      feeMode === 'paid' && Number(registrationFee) > 0
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Paid Event
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs Grid: Configured per Pricing & Participation selections */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Registration Fee: Only shown for Paid Events */}
              {feeMode === 'paid' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Registration Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={registrationFee}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRegistrationFee(val);
                      if (val === 0) setFeeMode('free');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Max Team Size: Shown whenever Team Event is enabled */}
              {participationMode === 'team' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Max Team Size (Members) *
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={maxTeamSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxTeamSize(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              )}

              {/* WhatsApp Group Link: Only shown for Paid Events */}
              {feeMode === 'paid' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    WhatsApp Group Link
                  </label>
                  <input
                    type="url"
                    value={whatsappGroupLink}
                    onChange={(e) => setWhatsappGroupLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              )}
            </div>

     

            {/* Payment Details (UPI ID & QR Code) - Only shown for Paid Events */}
            {feeMode === 'paid' && Number(registrationFee) > 0 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      UPI ID (Payee)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="college.events@okicici"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="College Student Council"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Cloudinary UPI QR Code Uploader */}
                <ImageUploader
                  label="UPI Payment QR Code (Cloudinary Storage)"
                  value={upiQrUrl}
                  onChange={setUpiQrUrl}
                  folder="upi_qr_codes"
                />
              </div>
            )}
          </div>

          {/* Section 4: Dynamic Event Organizers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                4. Dynamic Event Organizers
              </h4>
              <button
                type="button"
                onClick={addOrganizerField}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Another Organizer
              </button>
            </div>

            <div className="space-y-3">
              {organizerList.map((org, index) => (
                <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Organizer #{index + 1}
                    </span>
                    {organizerList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrganizerField(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={org.name}
                        onChange={(e) => updateOrganizerField(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Register Number"
                        value={org.registerNumber}
                        onChange={(e) => updateOrganizerField(index, 'registerNumber', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Department"
                        value={org.department}
                        onChange={(e) => updateOrganizerField(index, 'department', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={org.email}
                        onChange={(e) => updateOrganizerField(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={org.phone}
                        onChange={(e) => updateOrganizerField(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Publish Status Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h5 className="text-xs font-bold text-slate-900">Publish Event to Portal Catalog</h5>
              <p className="text-[11px] text-slate-500">Published events are visible to participants for team registration.</p>
            </div>
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
            >
              <option value="draft">Save as Draft</option>
              <option value="published">Publish Now</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              {isSaving 
                ? (editingEvent ? 'Uploading to Cloudinary & Updating...' : 'Uploading Images to Cloudinary & Saving...') 
                : (editingEvent ? 'Update Event' : 'Save & Publish Event')
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* View Event Detail Modal */}
      {viewEvent && (
        <Modal
          isOpen={Boolean(viewEvent)}
          onClose={() => setViewEvent(null)}
          title={`Event Details: ${viewEvent.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Banner */}
            {viewEvent.bannerUrl && (
              <img 
                src={viewEvent.bannerUrl} 
                alt={viewEvent.title} 
                className="w-full h-56 object-cover rounded-xl border border-slate-200"
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-500 font-semibold uppercase">Event Scope</p>
                <p className="text-xs font-bold text-[#0c4da2] mt-0.5">{viewEvent.eventScope || viewEvent.event_scope || 'National'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Event Type</p>
                <p className="text-xs font-bold text-purple-700 mt-0.5">{viewEvent.eventType || viewEvent.event_type || 'Competition'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Category</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{viewEvent.category || 'Technical'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Status</p>
                <Badge status={viewEvent.status} />
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Date & Time</p>
                <p className="text-slate-900 mt-0.5">{viewEvent.eventDate} ({viewEvent.startTime} - {viewEvent.endTime})</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Venue</p>
                <p className="text-slate-900 mt-0.5">{viewEvent.venue}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Registration Fee</p>
                <p className="text-emerald-600 font-bold text-sm mt-0.5">₹{viewEvent.registrationFee}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase">Max Team Size</p>
                <p className="text-slate-900 font-bold mt-0.5">{viewEvent.maxTeamSize} Members</p>
              </div>
            </div>

            {/* Organizers List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Event Organizers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewEvent.organizers?.map((org, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="font-bold text-slate-900 text-xs">{org.name} ({org.registerNumber})</p>
                    <p className="text-[11px] text-slate-500">{org.department}</p>
                    <p className="text-[11px] text-slate-500">Phone: {org.phone} | Email: {org.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDeleteEvent(deletingId)}
        title="Delete Event"
        message="Are you sure you want to delete this event? All associated organizers and registrations will be permanently removed."
        confirmText="Delete Event"
        confirmStyle="danger"
      />
    </div>
  );
};
