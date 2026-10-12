import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Hourglass,
  PlusCircle,
  FileBarChart,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';
import { StatsCard } from '../components/common/StatsCard';
import { useData } from '../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const AdminDashboard = ({ openAddCoordinatorModal, openCreateEventModal }) => {
  const { events, coordinatorsList, registrations } = useData();
  const navigate = useNavigate();

  // Metrics Calculations
  const totalCoordinators = coordinatorsList.length;
  const activeCoordinators = coordinatorsList.filter(c => c.status === 'active').length;
  const inactiveCoordinators = totalCoordinators - activeCoordinators;

  const totalEvents = events.length;
  const technicalEvents = events.filter(e => (e.category || 'Technical') === 'Technical').length;
  const nonTechnicalEvents = events.filter(e => e.category === 'Non-Technical').length;

  const nationalEvents = events.filter(e => (e.eventScope || e.event_scope || 'National') === 'National').length;
  const internationalEvents = events.filter(e => (e.eventScope || e.event_scope) === 'International').length;

  const conferencesCount = events.filter(e => (e.eventType || e.event_type) === 'Conference').length;
  const workshopsCount = events.filter(e => (e.eventType || e.event_type) === 'Workshop').length;
  const seminarsCount = events.filter(e => (e.eventType || e.event_type) === 'Seminar').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.eventDate >= todayStr).length;

  const totalRegistrations = registrations.length;
  const totalParticipantsCount = registrations.reduce((acc, curr) => acc + (curr.teamSize || 1), 0);

  const pendingRegistrations = registrations.filter(r => r.status === 'pending').length;
  const approvedRegistrations = registrations.filter(r => r.status === 'approved').length;
  const rejectedRegistrations = registrations.filter(r => r.status === 'rejected').length;

  const approvalRatePct = totalRegistrations > 0 
    ? Math.round((approvedRegistrations / totalRegistrations) * 100) 
    : 0;

  const rejectionRatePct = totalRegistrations > 0 
    ? Math.round((rejectedRegistrations / totalRegistrations) * 100) 
    : 0;

  const statusData = [
    { name: 'Approved', value: approvedRegistrations, color: '#0f172a' },
    { name: 'Pending', value: pendingRegistrations, color: '#64748b' },
    { name: 'Rejected', value: rejectedRegistrations, color: '#cbd5e1' }
  ];

  const registrationByEvent = events.map(e => ({
    name: e.title.length > 18 ? e.title.substring(0, 18) + '...' : e.title,
    registrations: registrations.filter(r => r.eventId === e.id).length
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatsCard
          title="Total Coordinators"
          value={totalCoordinators}
          icon={Users}
          subtext={`Active: ${activeCoordinators} | Inactive: ${inactiveCoordinators}`}
          infoBadge="Coordinator Accounts"
        />
        <StatsCard
          title="Total Events"
          value={totalEvents}
          icon={Calendar}
          subtext={`National: ${nationalEvents} | International: ${internationalEvents}`}
          infoBadge={`${upcomingEvents} Upcoming`}
        />
        <StatsCard
          title="Total Registrations"
          value={totalRegistrations}
          icon={FileCheck}
          subtext={`Total Team Members Registered: ${totalParticipantsCount}`}
          infoBadge="Team Submissions"
        />
        <StatsCard
          title="Pending Approvals"
          value={pendingRegistrations}
          icon={Hourglass}
          subtext={pendingRegistrations > 0 ? "Requires Review & Approval" : "All Submissions Verified"}
          infoBadge={pendingRegistrations > 0 ? "Action Required" : "Up to Date"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <StatsCard
          title="Approved Registrations"
          value={approvedRegistrations}
          icon={CheckCircle2}
          subtext={`Approval Share: ${approvalRatePct}% of all team registrations`}
          infoBadge="Verified Teams"
        />
        <StatsCard
          title="Rejected Registrations"
          value={rejectedRegistrations}
          icon={XCircle}
          subtext={`Rejection Share: ${rejectionRatePct}% of all team registrations`}
          infoBadge="Declined Entries"
        />
      </div>


      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations Per Event Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 bg-white">
          <h3 className="text-base font-bold text-slate-900 mb-4">Registrations Distribution by Event</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationByEvent}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                />
                <Bar dataKey="registrations" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval Breakdown Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col justify-between bg-white">
          <h3 className="text-base font-bold text-slate-900 mb-2">Registration Status Ratio</h3>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-900">Approved</p>
              <p className="text-sm font-extrabold text-slate-900">{approvedRegistrations}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Pending</p>
              <p className="text-sm font-extrabold text-slate-900">{pendingRegistrations}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Rejected</p>
              <p className="text-sm font-extrabold text-slate-900">{rejectedRegistrations}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
