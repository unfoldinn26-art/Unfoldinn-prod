'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Mail,
  Building2,
  AlertCircle,
  Briefcase,
  FileText,
  MessageSquareQuote,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  X
} from 'lucide-react';
import { removeToken } from '../../lib/adminApi';

const NAV_GROUPS = [
  {
    title: 'CORE PLATFORM',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
      { href: '/admin/payments', label: 'Payments & Fees', icon: CreditCard },
    ]
  },
  {
    title: 'INQUIRIES & SUPPORT',
    items: [
      { href: '/admin/contacts', label: 'Mentoring Contacts', icon: Mail },
      { href: '/admin/institutions', label: 'Institutions', icon: Building2 },
      { href: '/admin/support', label: 'Support & Bugs', icon: AlertCircle },
    ]
  },
  {
    title: 'CONTENT & CURATION',
    items: [
      { href: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
      { href: '/admin/resources', label: 'Framework Articles', icon: FileText },
      { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { href: '/admin/newsletter', label: 'Newsletter', icon: Users },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export default function AdminSidebar({ admin, isOpen, setIsOpen }) {
  const pathname = usePathname();

  const handleLogout = () => {
    removeToken();
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#111720] text-gray-300
        transform transition-transform duration-200 ease-in-out
        flex flex-col h-screen border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="16" fill="#D97724" fillOpacity="0.25" />
                <circle cx="50" cy="50" r="9" fill="#D97724" />
                <path d="M 68 84 C 40 98 12 80 12 50 C 12 25 35 12 55 12 C 80 12 90 32 90 50 C 90 62 82 72 75 77" stroke="#FAF7F0" strokeWidth="6" strokeLinecap="round" />
                <rect x="76" y="76" width="14" height="14" rx="2" fill="#C85236" />
                <text x="83" y="86" fontSize="7.5" fill="#FFFFFF" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SI</text>
              </svg>
            </div>
            <div>
              <div className="font-serif font-bold text-white text-base leading-tight">
                Unfoldinn
              </div>
              <div className="text-[10px] font-mono text-amber font-semibold uppercase tracking-wider mt-0.5">
                Founder&apos;s Portal
              </div>
            </div>
          </Link>

          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items (Grouped & Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                {group.title}
              </div>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative
                        ${isActive 
                          ? 'bg-amber/15 text-white font-semibold' 
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
                      `}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber" />
                      )}
                      <Icon size={17} className={isActive ? 'text-amber' : 'text-gray-400 group-hover:text-gray-200'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Card & Logout (Bottom) */}
        <div className="p-3.5 border-t border-white/10 bg-[#0E131B]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 mb-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-amber text-charcoal-blue font-bold font-serif flex items-center justify-center text-xs flex-shrink-0">
                DS
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {admin?.name || 'Mr. Deepak Sogani'}
                </p>
                <p className="text-[10px] font-mono text-amber truncate">
                  {admin?.role || 'Superadmin'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Quick link to live public site */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full"
          >
            <span>View Live Website</span>
            <ExternalLink size={12} />
          </Link>
        </div>

      </aside>
    </>
  );
}
