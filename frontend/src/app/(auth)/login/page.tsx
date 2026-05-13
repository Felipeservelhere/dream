'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch {
      setError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>🤖</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>OmniDesk AI</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Atendimento inteligente via WhatsApp</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border .2s' }}
              onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Senha</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border .2s' }}
              onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
