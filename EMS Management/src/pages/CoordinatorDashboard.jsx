import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  FileCheck, 
  Hourglass, 
  CheckCircle2, 
  XCircle, 
  PlusCircle,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { StatsCard } from '../components/common/StatsCard';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const CoordinatorDashboard = ({ openCreateEventModal }) => {
  const { currentUser } = useAuth();
  const { visibleEvents, visibleRegistrations } = useData();
  const navigate = useNavigate();

  const myEventsCount = visibleEvents.length;
  const publishedEventsCount = visibleEvents.filter(e => e.status === 'published').length;
  const technicalEventsCount = visibleEvents.filter(e => e.category === 'Technical').length;
  const nonTechEventsCount = visibleEvents.filter(e => e.category === 'Non-Technical').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEventsCount = visibleEvents.filter(e => e.eventDate >= todayStr).length;

  const totalRegistrations = visibleRegistrations.length;
  const totalTeamMembers = visibleRegistrations.reduce((acc, curr) => acc + (curr.teamSize || 1), 0);

  const pendingApprovals = visibleRegistrations.filter(r => r.status === 'pending').length;
  const approvedRegistrations = visibleRegistrations.filter(r => r.status === 'approved').length;
  const rejectedRegistrations = visibleRegistrations.filter(r => r.status === 'rejected').length;

  const approvalRatePct = totalRegistrations > 0 
    ? Math.round((approvedRegistrations / totalRegistrations) * 100) 
    : 0;

  const rejectionRatePct = totalRegistrations > 0 
    ? Math.round((rejectedRegistrations / totalRegistrations) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-slate-900" />
            Event Coordinator Workspace
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {currentUser?.fullName}!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Manage your assigned events, track live team registrations, verify payment screenshots, and issue automated approvals.
          </p>
        </div>

        <button
          onClick={openCreateEventModal}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wide shadow-md transition-all shrink-0 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        <StatsCard
          title="My Events"
          value={myEventsCount}
          icon={Calendar}
          subtext={`Technical: ${technicalEventsCount} | Non-Tech: ${nonTechEventsCount}`}
          infoBadge={`${publishedEventsCount} Published`}
        />
        <StatsCard
          title="Upcoming Events"
          value={upcomingEventsCount}
          icon={Clock}
          subtext="Scheduled on active fest timeline"
          infoBadge="Active Schedule"
        />
        <StatsCard
          title="Total Registrations"
          value={totalRegistrations}
          icon={FileCheck}
          subtext={`Total Team Members Registered: ${totalTeamMembers}`}
          infoBadge="Team Submissions"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        <StatsCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={Hourglass}
          subtext={pendingApprovals > 0 ? "Requires Payment Screenshot Verification" : "All Registrations Verified"}
          infoBadge={pendingApprovals > 0 ? "Review Required" : "All Verified"}
          isClickable
          onClick={() => navigate('/coordinator/registrations')}
        />
        <StatsCard
          title="Approved Registrations"
          value={approvedRegistrations}
          icon={CheckCircle2}
          subtext={`Approval Share: ${approvalRatePct}% of event registrations`}
          infoBadge="Verified Teams"
        />
        <StatsCard
          title="Rejected Registrations"
          value={rejectedRegistrations}
          icon={XCircle}
          subtext={`Rejection Share: ${rejectionRatePct}% of event registrations`}
          infoBadge="Declined Entries"
        />
      </div>

      {/* Recent My Events Summary */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Recent Event Workspaces</h3>
          <button
            onClick={() => navigate('/coordinator/events')}
            className="text-xs text-slate-900 hover:underline font-bold flex items-center gap-1"
          >
            View All My Events
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">
            No events created yet. Click "Create New Event" above to publish your first fest event!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleEvents.slice(0, 4).map(event => (
              <div key={event.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=300&q=80'} 
                    alt={event.title} 
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{event.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{event.category} • Date: {event.eventDate}</p>
                  </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  event.status === 'published' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
