'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

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
      setError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#050a14',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-5%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 80px',
        position: 'relative', zIndex: 1,
      }} className="anim-fade">
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(59,130,246,0.5)',
            }}>
              <Zap size={24} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>OmniDesk AI</div>
              <div style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>Intelligent Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: 16 }}>
            Atendimento<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              inteligente
            </span><br />
            via WhatsApp.
          </h1>
          <p style={{ color: '#7c8fa6', fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
            IA avançada que atende, qualifica e agenda — sem intervenção humana na maioria dos casos.
          </p>
        </div>

        {/* Feature pills */}
        {[
          { icon: '⚡', text: 'Resposta em menos de 2 segundos' },
          { icon: '🤖', text: 'IA GPT-4 treinada para o seu negócio' },
          { icon: '📊', text: 'Analytics em tempo real' },
        ].map((f, i) => (
          <div key={i} className={`anim-fade-up anim-d${i+2}`} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', marginBottom: 10,
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.12)',
            borderRadius: 10, maxWidth: 340,
          }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <span style={{ color: '#94a3b8', fontSize: 13.5 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 460,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div className="anim-fade-up" style={{
          width: '100%',
          background: 'rgba(13,20,36,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 0 60px rgba(59,130,246,0.1), 0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              Bem-vindo de volta
            </h2>
            <p style={{ color: '#7c8fa6', fontSize: 13.5 }}>
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#4a5568" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 26 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#4a5568" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
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
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 9, padding: '10px 14px',
                color: '#f87171', fontSize: 13, marginBottom: 18,
              }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: 14,
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? (
                <>
                  <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rotate .7s linear infinite' }} />
                  Entrando...
                </>
              ) : (
                <>Acessar painel <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#4a5568' }}>
            Protegido por criptografia AES-256 · JWT
          </div>
        </div>
      </div>
    </div>
  );
}
