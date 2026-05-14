'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch {
      setError('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background image — logo escura com brilho */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/nexa-dark.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.18,
        filter: 'blur(2px)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, #000 80%)',
      }} />

      {/* Subtle blue grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Card */}
      <div className="anim-fade-up" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 380,
        padding: '0 24px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Image
            src="/nexa-logo.png"
            alt="Nexa"
            width={160}
            height={52}
            style={{ objectFit: 'contain' }}
            priority
          />
          <p style={{ color: 'var(--text2)', marginTop: 10, fontSize: 13.5, letterSpacing: '.02em' }}>
            Plataforma de Atendimento Inteligente
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: 'rgba(10,16,32,0.9)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(59,130,246,0.18)',
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 0 60px rgba(59,130,246,0.08), 0 32px 64px rgba(0,0,0,0.6)',
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.08em' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, padding: '9px 12px', color: '#f87171', fontSize: 13, marginBottom: 16,
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center', opacity: loading ? .7 : 1 }}>
              {loading ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rotate .7s linear infinite' }} /> Entrando...</>
              ) : (
                <>Acessar <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11.5, color: 'var(--text3)', letterSpacing: '.03em' }}>
          Nexa AI · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
