import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  FileCheck, 
  Users, 
  Filter 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { exportToPDF } from '../lib/pdfExport';
import { exportToExcel } from '../lib/excelExport';
import { Badge } from '../components/common/Badge';

export const ReportsPage = () => {
  const { events, visibleRegistrations, coordinatorsList } = useData();

  const [reportType, setReportType] = useState('events'); // events | registrations | coordinators
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter Data
  const getFilteredData = () => {
    if (reportType === 'events') {
      return events.filter(e => {
        const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesCat && matchesStatus;
      });
    } else if (reportType === 'registrations') {
      return visibleRegistrations.filter(r => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesStatus;
      });
    } else if (reportType === 'coordinators') {
      return coordinatorsList.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesStatus;
      });
    }
    return [];
  };

  const reportData = getFilteredData();

  const handleExportPDF = () => {
    exportToPDF(reportType, reportData, { category: categoryFilter, status: statusFilter });
  };

  const handleExportExcel = () => {
    exportToExcel(reportType, reportData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reports & Export Hub</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate detailed system reports for events, registrations, and coordinators with instant PDF and Excel exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => { setReportType('events'); setStatusFilter('all'); }}
          className={`glass-panel p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
            reportType === 'events'
              ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/30'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Events Report</h4>
            <p className="text-[11px] text-slate-500">Schedule, fee & status</p>
          </div>
        </button>

        <button
          onClick={() => { setReportType('registrations'); setStatusFilter('all'); }}
          className={`glass-panel p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
            reportType === 'registrations'
              ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/30'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Registrations Report</h4>
            <p className="text-[11px] text-slate-500">Teams, colleges & approvals</p>
          </div>
        </button>

        <button
          onClick={() => { setReportType('coordinators'); setStatusFilter('all'); }}
          className={`glass-panel p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
            reportType === 'coordinators'
              ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/30'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="p-3 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Coordinators Report</h4>
            <p className="text-[11px] text-slate-500">Faculty & student logs</p>
          </div>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Report Filters</span>
        </div>

        <div className="flex items-center gap-4">
          {reportType === 'events' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              >
                <option value="all">All</option>
                <option value="Technical">Technical</option>
                <option value="Non-Technical">Non-Technical</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
            >
              <option value="all">All</option>
              {reportType === 'events' ? (
                <>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </>
              ) : reportType === 'registrations' ? (
                <>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : (
                <>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Live Preview Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden bg-white">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Live Preview ({reportData.length} records)
          </h3>
          <span className="text-[11px] text-slate-500">Click Export buttons above for full file download</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'events' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Event Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Fee</th>
                  <th className="p-4">Max Team</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{ev.title}</td>
                    <td className="p-4">{ev.category}</td>
                    <td className="p-4 font-mono">{ev.eventDate}</td>
                    <td className="p-4">{ev.venue}</td>
                    <td className="p-4 font-bold text-emerald-600">₹{ev.registrationFee}</td>
                    <td className="p-4">{ev.maxTeamSize}</td>
                    <td className="p-4"><Badge status={ev.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'registrations' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Team Leader</th>
                  <th className="p-4">Event Name</th>
                  <th className="p-4">College</th>
                  <th className="p-4">Dept</th>
                  <th className="p-4">Team Size</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((reg, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{reg.teamLeaderName}</td>
                    <td className="p-4 text-brand-600 font-semibold">{reg.eventName}</td>
                    <td className="p-4">{reg.college}</td>
                    <td className="p-4">{reg.department}</td>
                    <td className="p-4 font-bold">{reg.teamSize}</td>
                    <td className="p-4"><Badge status={reg.status} /></td>
                    <td className="p-4 font-mono">{new Date(reg.registrationDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'coordinators' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Firebase UID</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((coord, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{coord.fullName}</td>
                    <td className="p-4 font-mono">{coord.email}</td>
                    <td className="p-4 font-mono">{coord.phone}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-500">{coord.firebaseUid}</td>
                    <td className="p-4"><Badge status={coord.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
