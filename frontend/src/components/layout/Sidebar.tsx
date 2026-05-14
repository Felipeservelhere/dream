'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, MessageSquare, GitBranch,
  Settings, LogOut, Sun, Moon,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',     color: '#3b82f6', glow: 'rgba(59,130,246,0.7)',  anim: 'scan'   },
  { href: '/conversations', icon: MessageSquare,    label: 'Conversas',     color: '#10b981', glow: 'rgba(16,185,129,0.7)',  anim: 'bounce' },
  { href: '/flows',         icon: GitBranch,        label: 'Fluxos',        color: '#8b5cf6', glow: 'rgba(139,92,246,0.7)', anim: 'draw'   },
  { href: '/settings',      icon: Settings,         label: 'Configurações', color: '#f59e0b', glow: 'rgba(245,158,11,0.7)', anim: 'spin'   },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const router    = useRouter();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  return (
    <aside style={{
      width: 240,
      background: 'var(--sidebar)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 100,
      borderRight: '1px solid rgba(59,130,246,0.08)',
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Image
          src="/nexa-logo.png"
          alt="Nexa"
          width={110}
          height={36}
          className="sidebar-logo"
          style={{ objectFit: 'contain', objectPosition: 'left' }}
          priority
        />
        <div style={{ marginTop: 6, color: 'var(--accent2)', fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', paddingLeft: 2 }}>
          AI Platform · v2
        </div>
      </div>

      {/* Live status */}
      <div style={{ padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, letterSpacing: '.04em' }}>Sistema operacional</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text3)', letterSpacing: '.14em', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
          Menu
        </div>
        {NAV.map((item, i) => {
          const active = pathname.startsWith(item.href);
          const Icon   = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`nav-link anim-slide anim-d${i + 1} ${active ? 'active' : ''}`}
              style={{ '--icon-glow': item.glow } as React.CSSProperties}>
              <div className={`nav-icon icon-${item.anim}`}>
                <Icon
                  size={18}
                  color={active ? item.color : 'var(--text2)'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </div>
              <span style={{ fontSize: 13.5 }}>{item.label}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%',
                  background: item.color,
                  boxShadow: `0 0 8px ${item.glow}`,
                  flexShrink: 0,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 8px' }}>

        {/* Theme toggle */}
        <button onClick={toggle}
          className="nav-link"
          style={{ '--icon-glow': theme === 'dark' ? 'rgba(245,158,11,0.7)' : 'rgba(139,92,246,0.7)', width: '100%', border: '1px solid transparent', background: 'none', marginBottom: 4, cursor: 'pointer' } as React.CSSProperties}>
          <div className="nav-icon icon-spin">
            {theme === 'dark'
              ? <Sun  size={16} color="#f59e0b" strokeWidth={2} />
              : <Moon size={16} color="#8b5cf6" strokeWidth={2} />
            }
          </div>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', marginBottom: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 11,
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Usuário'}
            </div>
            <div style={{ color: 'var(--accent2)', fontSize: 10, textTransform: 'capitalize' }}>
              {user?.role || 'owner'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={() => { logout(); router.push('/login'); }}
          className="nav-link"
          style={{ width: '100%', border: '1px solid rgba(239,68,68,.12)', background: 'rgba(239,68,68,.06)', cursor: 'pointer', color: '#f87171', justifyContent: 'center' }}>
          <LogOut size={14} strokeWidth={2} />
          <span style={{ fontSize: 13 }}>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
