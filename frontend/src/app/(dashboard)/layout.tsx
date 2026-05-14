'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const { theme }  = useThemeStore();
  const router     = useRouter();

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    if (!localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!token && typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div className="grid-bg" style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 240,
        padding: '32px 36px',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
