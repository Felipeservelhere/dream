'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/conversations', icon: '💬', label: 'Conversas' },
  { href: '/flows', icon: '🔀', label: 'Fluxos' },
  { href: '/settings', icon: '⚙️', label: 'Configurações' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside style={{ width: 240, background: '#1e1b4b', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #818cf8, #c084fc)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>OmniDesk AI</div>
            <div style={{ color: '#a5b4fc', fontSize: 11 }}>Painel de Controle</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 4, textDecoration: 'none', background: active ? 'rgba(129,140,248,.2)' : 'transparent', color: active ? '#818cf8' : '#94a3b8', fontWeight: active ? 600 : 400, transition: 'all .15s' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 14 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #818cf8, #c084fc)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Usuário'}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,.15)', color: '#f87171', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
          Sair
        </button>
      </div>
    </aside>
  );
}
