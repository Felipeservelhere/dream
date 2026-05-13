'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    if (!localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  if (!token && typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '32px', overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
