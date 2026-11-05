'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, getMe } from '../../lib/adminApi';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoginPage) {
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated()) {
        router.push('/admin/login');
        return;
      }

      try {
        const data = await getMe();
        setAdmin(data.admin || data);
      } catch (err) {
        console.error('Auth check failed', err);
        // Will be handled by adminApi (redirect to login)
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111720] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/10 border-t-amber rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Loading Founder Portal...</p>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Map path to title
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Executive Dashboard';

    const pathMap = {
      'payments': 'Payment Gateway & Fees',
      'bookings': 'Mentoring Bookings',
      'contacts': 'Mentoring Inquiries',
      'institutions': 'Institutional Inquiries',
      'support': 'Support & Bug Tracker',
      'opportunities': 'Curated Opportunities',
      'resources': 'Framework Articles',
      'testimonials': 'Testimonials',
      'newsletter': 'Newsletter Subscribers',
      'settings': 'Settings & Security',
    };

    if (segments[2] === 'new') return `Add ${segments[1].slice(0, -1)}`;
    if (segments[3] === 'edit') return `Edit ${segments[1].slice(0, -1)}`;

    return pathMap[segments[1]] || (segments[1].charAt(0).toUpperCase() + segments[1].slice(1));
  };

  return (
    <>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <title>Admin Portal | Unfoldinn</title>
      </head>
      <div className="flex h-screen overflow-hidden bg-[#F7F9FB]">
        <AdminSidebar admin={admin} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          admin={admin} 
          title={getPageTitle()} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  </>
  );
}
