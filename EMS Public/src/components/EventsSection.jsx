import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  ArrowRight, 
  Clock, 
  Eye,
  X,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

const DEPARTMENT_OPTIONS = [
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

export const EventsSection = ({ onRegisterClick, onViewDetailClick }) => {
  const [eventsList, setEventsList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeScope, setActiveScope] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [activeDepartment, setActiveDepartment] = useState('All');

  const sentinelRef = useRef(null);

  const loadingRef = useRef(false);

  // 500ms Debounce effect for Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Dynamic 10-Item Viewport Loader from Backend API
  const loadPage = async (pageToLoad) => {
    loadingRef.current = true;
    setIsLoadingPage(true);

    try {
      const paramsObj = {
        page: pageToLoad,
        limit: 10
      };
      if (debouncedSearchTerm.trim()) paramsObj.search = debouncedSearchTerm.trim();
      if (activeDepartment !== 'All') paramsObj.department = activeDepartment;
      if (activeScope !== 'All') paramsObj.scope = activeScope;
      if (activeType !== 'All') paramsObj.type = activeType;

      const queryStr = new URLSearchParams(paramsObj).toString();
      console.log(`🌐 [Viewport Load] GET /api/public/events?${queryStr}`);

      const res = await fetch(`${API_BASE_URL}/api/public/events?${queryStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.events)) {
          setEventsList(prev => pageToLoad === 1 ? data.events : [...prev, ...data.events]);
          setHasMore(data.hasMore);
          setTotalEvents(data.total);
          setPage(pageToLoad);
        }
      }
    } catch (err) {
      console.warn("Failed to load viewport events:", err);
    } finally {
      loadingRef.current = false;
      setIsLoadingPage(false);
    }
  };

  // Reset & load first 10 items on Search / Filter Change
  useEffect(() => {
    setPage(1);
    loadPage(1);
  }, [debouncedSearchTerm, activeDepartment, activeScope, activeType]);

  // Viewport IntersectionObserver to dynamically load next 10 items on scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && eventsList.length > 0) {
        const nextPage = page + 1;
        console.log(`🚀 [Viewport Hit] Loading next 10 items (Page ${nextPage})`);
        loadPage(nextPage);
      }
    }, { threshold: 0.1, rootMargin: '200px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore, eventsList.length]);

  const filteredEvents = eventsList;

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setActiveScope('All');
    setActiveType('All');
    setActiveDepartment('All');
  };

  return (
    <section id="events" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* Section Title & Search Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#0c4da2]" />
            All Live Events & Competitions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose an event below to inspect guidelines, organizers, and register your team.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search event title, venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0c4da2] focus:ring-1 focus:ring-[#0c4da2] shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Filter By:
          </span>

          {/* Department Filter */}
          <select
            value={activeDepartment}
            onChange={(e) => setActiveDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0c4da2] shadow-xs cursor-pointer max-w-[220px] truncate"
          >
            <option value="All">All Departments</option>
            {DEPARTMENT_OPTIONS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Scope Select */}
          <select
            value={activeScope}
            onChange={(e) => setActiveScope(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0c4da2] shadow-xs cursor-pointer"
          >
            <option value="All">All Scopes</option>
            <option value="National">National</option>
            <option value="International">International</option>
            <option value="State">State</option>
            <option value="Regional">Regional</option>
            <option value="Institutional">Institutional</option>
          </select>

          {/* Type Select */}
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0c4da2] shadow-xs cursor-pointer"
          >
            <option value="All">All Event Types</option>
            <option value="Conference">Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Webinar">Webinar</option>
            <option value="Symposium">Symposium</option>
            <option value="FDP">FDP</option>
            <option value="STTP">STTP</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Competition">Competition</option>
            <option value="Guest Lecture">Guest Lecture</option>
            <option value="Training Programme">Training Programme</option>
            <option value="Exhibition">Exhibition</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(activeDepartment !== 'All' || activeScope !== 'All' || activeType !== 'All' || searchTerm) && (
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors ml-auto flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Unified All-Events Grid */}
      {eventsList.length === 0 && isLoadingPage ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 animate-pulse">
              <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
              <div className="h-6 bg-slate-200 rounded-xl w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded-xl w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
          <p className="text-slate-500 text-sm font-semibold">No published events found matching your criteria.</p>
          <button
            onClick={resetFilters}
            className="text-xs text-[#0c4da2] font-bold hover:underline font-extrabold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-indigo-200 group"
              >
                {/* Event Image Banner */}
                <a 
                  href={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-48 w-full overflow-hidden bg-slate-100 cursor-pointer group/banner block"
                  title="Open image in new tab"
                >
                  <img 
                    src={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500" 
                  />

                  {/* Hover Hint Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover/banner:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover/banner:opacity-100 transition-opacity bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs shadow-lg">
                      <Eye className="w-3.5 h-3.5" />
                      Open image in new tab
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs z-10">
                    <div className="flex items-center gap-1.5 font-semibold bg-white/90 text-slate-800 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-200 shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#0c4da2]" />
                      <span>{event.eventDate}</span>
                    </div>
                    <div className="font-extrabold text-emerald-700 bg-white/90 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-200 shadow-xs">
                      {event.registrationFee === 0 ? 'FREE ENTRY' : `₹${event.registrationFee}`}
                    </div>
                  </div>
                </a>

                {/* Event Details Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  {/* Topic, Badges & Description */}
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-[#0c4da2] transition-colors line-clamp-1 tracking-tight">
                      {event.title}
                    </h3>

                    {/* Classification Badges Below Topic */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#0c4da2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                        {event.eventScope || event.event_scope || 'National'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#0c4da2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                        {event.eventType || event.event_type || 'Competition'}
                      </span>
                      {event.department && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold truncate max-w-[150px]" title={event.department}>
                          {event.department}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                      {event.description}
                    </p>
                  </div>

                  {/* Event Metadata (Venue, Time, Deadline) */}
                  <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-slate-600 font-medium truncate">
                        <MapPin className="w-4 h-4 text-[#0c4da2] shrink-0" />
                        <span className="truncate max-w-[170px]">{event.venue}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-slate-700 shrink-0">
                        <Users className="w-4 h-4 text-[#0c4da2]" />
                        Max {event.maxTeamSize} Members
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {event.startTime} - {event.endTime}
                      </span>
                      <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                        Deadline: {event.registrationDeadline}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onViewDetailClick && onViewDetailClick(event)}
                      className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors shadow-2xs cursor-pointer"
                      title="View Full Guidelines & Organizers"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRegisterClick && onRegisterClick(event)}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-[#0c4da2] text-white font-extrabold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {Number(event.maxTeamSize || 1) === 1 ? 'Register Now' : 'Register Team Now'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Viewport Dynamic 10-Item Scroll Sentinel Loader */}
          <div ref={sentinelRef} className="py-8 text-center flex flex-col items-center justify-center space-y-2">
            {isLoadingPage ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm animate-pulse">
                <Loader2 className="w-4 h-4 text-[#0c4da2] animate-spin" />
                <span>Loading 10 more events into viewport...</span>
              </div>
            ) : hasMore ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-400">
                <span>Scroll down to load next 10 events</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </section>
  );
};
