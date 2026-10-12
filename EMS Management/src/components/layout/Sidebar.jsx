import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileCheck, 
  FileBarChart, 
  Settings, 
  LogOut, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { currentUser, isAdmin, logout } = useAuth();
  const { setIsSettingsOpen } = useData();
  const navigate = useNavigate();

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/coordinators', label: 'Event Coordinators', icon: Users },
    { path: '/admin/events', label: 'Event Management', icon: Calendar },
    { path: '/admin/registrations', label: 'Registrations', icon: FileCheck },
    { path: '/admin/reports', label: 'Reports & Analytics', icon: FileBarChart },
  ];

  const coordinatorMenuItems = [
    { path: '/coordinator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/coordinator/events', label: 'Manage Events', icon: Calendar },
    { path: '/coordinator/registrations', label: 'Registrations', icon: FileCheck },
  ];

  const menuItems = isAdmin ? adminMenuItems : coordinatorMenuItems;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside 
      className={`hidden md:flex fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200/80 shadow-xs transition-all duration-300 flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img src="/srm logo.svg" alt="srmist Logo" className="h-9 object-contain shrink-0" />
          </div>
        ) : (
          <img src="/srm logo.svg" alt="srmist Logo" className="h-8 mx-auto object-contain" />
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2">
          {!isCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </span>
          )}
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#0c4da2] text-white shadow-md shadow-[#0c4da2]/25'
                    : 'text-slate-600 hover:text-[#0c4da2] hover:bg-blue-50/80 font-semibold'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                  }`} />
                  
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50">
        <div>
          {!isCollapsed && currentUser && (
            <div className="px-3 py-2 mb-2 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-bold text-xs uppercase flex items-center justify-center border border-slate-200 shrink-0">
                {(currentUser.fullName || currentUser.full_name || currentUser.email || 'U')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.fullName || currentUser.full_name || currentUser.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-medium">
                  {!isAdmin ? `${currentUser?.role.toUpperCase() || 'Coordinator'}` : currentUser.email}
                </p>
              </div>
            </div>
          )}

          

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-sm font-bold"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
