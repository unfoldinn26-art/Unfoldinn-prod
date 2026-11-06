'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import { UserAuthProvider } from '../context/UserAuthContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <ThemeProvider>
      <UserAuthProvider>
        <div className="flex min-h-[100dvh] flex-col">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </UserAuthProvider>
    </ThemeProvider>
  );
}
