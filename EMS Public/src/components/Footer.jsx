import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src="/srm logo.svg" alt="srmist Logo" className="h-8 object-contain" />
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">National Inter-College Fest 2026</h4>
            <p className="text-xs text-slate-500">srmist College Event Management System (EMS)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <Link to="/events" className="hover:text-slate-900 transition-colors">Events & Register</Link>
          <Link to="/status" className="hover:text-slate-900 transition-colors">Check Status</Link>
          <Link to="/about" className="hover:text-slate-900 transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-slate-900 transition-colors">Contact Us</Link>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span>© 2026 College EMS. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
