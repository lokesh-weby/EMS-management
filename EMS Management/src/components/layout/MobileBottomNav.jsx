import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileCheck, 
  FileBarChart, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/admin/coordinators', label: 'Coordinators', icon: Users },
    { path: '/admin/events', label: 'Events', icon: Calendar },
    { path: '/admin/registrations', label: 'Registrations', icon: FileCheck },
    { path: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ];

  const coordinatorNavItems = [
    { path: '/coordinator/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/coordinator/events', label: 'Manage Events', icon: Calendar },
    { path: '/coordinator/registrations', label: 'Registrations', icon: FileCheck },
  ];

  const navItems = isAdmin ? adminNavItems : coordinatorNavItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 shadow-2xl">
      <nav className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-slate-900 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-slate-100 text-slate-900' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium tracking-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-1.5 text-rose-600 hover:text-rose-700 rounded-xl transition-all font-bold"
          title="Sign Out"
        >
          <div className="p-1">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Logout</span>
        </button>
      </nav>
    </div>
  );
};
