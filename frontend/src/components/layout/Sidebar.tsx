'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, MessageSquare, GitBranch,
  Settings, LogOut, Sun, Moon, Zap,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',     color: '#3b82f6' },
  { href: '/conversations', icon: MessageSquare,    label: 'Conversas',     color: '#10b981' },
  { href: '/flows',         icon: GitBranch,        label: 'Fluxos',        color: '#8b5cf6' },
  { href: '/settings',      icon: Settings,         label: 'Configurações', color: '#f59e0b' },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const router    = useRouter();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

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
      borderRight: '1px solid var(--border)',
      boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
    }}>

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59,130,246,0.4)',
            animation: 'glowPulse 3s ease-in-out infinite',
            flexShrink: 0,
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>
              Nexa
            </div>
            <div style={{ color: 'var(--accent2)', fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              AI Platform · v2
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Sistema operacional</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
          Menu principal
        </div>
        {NAV.map((item, i) => {
          const active = pathname.startsWith(item.href);
          const Icon   = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`nav-link anim-slide anim-d${i + 1} ${active ? 'active' : ''}`}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: active ? `${item.color}22` : 'var(--sidebar-item)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
                flexShrink: 0,
              }}>
                <Icon size={16} color={active ? item.color : 'var(--text2)'} strokeWidth={2} />
              </div>
              <span>{item.label}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}`,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 10px' }}>

        {/* Theme toggle */}
        <button onClick={toggle}
          className="nav-link"
          style={{ width: '100%', border: 'none', background: 'none', marginBottom: 6, cursor: 'pointer' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--sidebar-item)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {theme === 'dark'
              ? <Sun  size={16} color="#f59e0b" strokeWidth={2} />
              : <Moon size={16} color="#8b5cf6" strokeWidth={2} />
            }
          </div>
          <span style={{ fontSize: 13.5, color: 'var(--text2)' }}>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: 'var(--sidebar-item)', marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 11,
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(59,130,246,0.35)',
          }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Usuário'}
            </div>
            <div style={{ color: 'var(--accent2)', fontSize: 10, fontWeight: 500, textTransform: 'capitalize' }}>
              {user?.role || 'owner'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{
            width: '100%', padding: '8px 12px',
            background: 'var(--red-glow)',
            color: 'var(--red)',
            border: '1px solid rgba(239,68,68,.15)',
            borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-glow)'; }}>
          <LogOut size={13} strokeWidth={2.5} />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
