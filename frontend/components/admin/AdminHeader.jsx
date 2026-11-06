'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, ExternalLink, ShieldCheck, Bell } from 'lucide-react';
import { removeToken } from '../../lib/adminApi';

export default function AdminHeader({ admin, title, onMenuClick }) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }));
  }, []);

  const handleLogout = () => {
    removeToken();
    window.location.href = '/admin/login';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 shadow-xs">
      
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3.5">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Admin Portal /
            </span>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-gray-900 leading-none">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Date, Live Status, Admin Pill */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Date string */}
        {currentDate && (
          <span className="hidden lg:inline-block text-xs font-mono text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            {currentDate}
          </span>
        )}

        {/* Live system status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono">Live</span>
        </div>

        {/* Admin profile pill */}
        <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-gray-200">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-gray-900 leading-tight">
              {admin?.name || 'Mr. Deepak Sogani'}
            </span>
            <span className="text-[10px] font-mono text-amber-700 font-semibold uppercase tracking-wider">
              {admin?.role || 'Superadmin'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-charcoal-blue text-amber font-serif font-bold flex items-center justify-center text-xs shadow-xs">
            DS
          </div>
        </div>

        {/* Mobile Logout */}
        <button 
          onClick={handleLogout} 
          className="sm:hidden text-xs text-red-600 font-semibold px-2 py-1 rounded hover:bg-red-50"
        >
          Exit
        </button>

      </div>
    </header>
  );
}
