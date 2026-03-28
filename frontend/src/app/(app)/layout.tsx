"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AIChatPanel from '@/components/AIChatPanel';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (!auth) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, []); // only run once on mount, not on every pathname change

  if (checking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex-none z-50">
        <Navbar />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-none z-40 relative">
          <Sidebar />
        </div>
        <main className="flex-1 p-6 pb-24 overflow-y-auto relative z-10 transition-colors duration-300 custom-scrollbar">
          {children}
        </main>
      </div>
      <AIChatPanel />
    </>
  );
}
