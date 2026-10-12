import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sparkles, Trophy, CheckCircle, Info, Mail, Home } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img src="/srm logo.svg" alt="srmist Logo" className="h-9 sm:h-10 object-contain group-hover:scale-105 transition-transform" />

        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 text-xs font-semibold">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                isActive ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Home className="w-3.5 h-3.5 text-indigo-600" />
            Home
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                isActive ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Trophy className="w-3.5 h-3.5 text-indigo-600" />
            Events & Register
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                isActive ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Info className="w-3.5 h-3.5 text-purple-600" />
            About Us
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                isActive ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Mail className="w-3.5 h-3.5 text-cyan-600" />
            Contact Us
          </NavLink>
        </nav>

        {/* Mobile & Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/status"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0c4da2] hover:bg-[#09397a] text-xs font-bold text-white transition-colors shadow-sm shadow-[#0c4da2]/20"
          >
            <span className="hidden sm:inline">Check Registration</span>
            <span className="sm:hidden">Status</span>
          </Link>
        </div>
      </div>

      {/* Sub-header Navigation Bar for Mobile */}
      <div className="flex lg:hidden items-center justify-around gap-1 pt-2 border-t border-slate-100 mt-2 text-[11px] font-semibold text-slate-600">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'text-[#0c4da2] font-bold' : ''}>Home</NavLink>
        <NavLink to="/events" className={({ isActive }) => isActive ? 'text-[#0c4da2] font-bold' : ''}>Events</NavLink>
        <NavLink to="/status" className={({ isActive }) => isActive ? 'text-[#0c4da2] font-bold' : ''}>Status</NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? 'text-[#0c4da2] font-bold' : ''}>About</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? 'text-[#0c4da2] font-bold' : ''}>Contact</NavLink>
      </div>
    </header>
  );
};
