'use client';
import { useEffect, useState, useCallback } from 'react';
import { settingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Smartphone, Bot, Building2, Save, CheckCircle2,
  Wifi, WifiOff, Loader2, AlertTriangle, Sliders,
  MessageSquare, Clock, MapPin, Phone, QrCode,
  RefreshCw, LogOut as Disconnect,
} from 'lucide-react';

export default function SettingsPage() {
  const { user }    = useAuthStore();
  const [config,    setConfig]    = useState<any>(null);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [wpStatus,  setWpStatus]  = useState<string>('loading');
  const [qr,        setQr]        = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await settingsApi.getWhatsappStatus();
      setWpStatus(r.data.status);
    } catch { setWpStatus('unreachable'); }
  }, []);

  useEffect(() => {
    if (user?.tenantId) {
      settingsApi.getAiConfig(user.tenantId).then((r) => setConfig(r.data)).catch(() => {});
      fetchStatus();
    }
  }, [user, fetchStatus]);

  /* Auto-refresh QR a cada 25s enquanto aguarda scan */
  useEffect(() => {
    if (wpStatus !== 'open' && wpStatus !== 'loading') {
      const id = setInterval(fetchStatus, 8000);
      return () => clearInterval(id);
    }
  }, [wpStatus, fetchStatus]);

  async function handleGetQr() {
    setQrLoading(true);
    setQr(null);
    try {
      const r = await settingsApi.getWhatsappQr();
      setQr(r.data.qr || null);
    } catch { }
    finally { setQrLoading(false); }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await settingsApi.disconnectWhatsapp();
      setWpStatus('close');
      setQr(null);
    } catch { }
    finally { setDisconnecting(false); }
  }

  function handleChange(field: string, value: any) {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!user?.tenantId || !config) return;
    setSaving(true);
    try {
      await settingsApi.updateAiConfig(user.tenantId, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { }
    finally { setSaving(false); }
  }

  const isConnected = wpStatus === 'open';
  const isLoading   = wpStatus === 'loading';

  return (
    <div style={{ maxWidth: 740 }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 4 }}>
          Configurações
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Gerencie a conexão WhatsApp e personalize a IA</p>
      </div>

      {/* ── WhatsApp Card ── */}
      <div className="card-base anim-fade-up anim-d1" style={{ padding: 24, marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #25d366, transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={18} color="#25d366" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>WhatsApp</h2>
              <p style={{ color: 'var(--text3)', fontSize: 12 }}>Gerencie a conexão do seu número</p>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 20,
            background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {isLoading
              ? <Loader2 size={13} color="var(--accent)" style={{ animation: 'rotate 1s linear infinite' }} />
              : isConnected
                ? <><span className="live-dot" /><Wifi size={13} color="var(--green)" /></>
                : <WifiOff size={13} color="var(--red)" />
            }
            <span style={{ fontSize: 12.5, fontWeight: 700, color: isConnected ? 'var(--green)' : isLoading ? 'var(--accent2)' : 'var(--red)' }}>
              {isLoading ? 'Verificando...' : isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isConnected ? (
            <button onClick={handleDisconnect} disabled={disconnecting}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px',
                background: 'rgba(239,68,68,0.08)', color: 'var(--red)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
              }}>
              {disconnecting
                ? <Loader2 size={14} style={{ animation: 'rotate 1s linear infinite' }} />
                : <Disconnect size={14} />}
              Desconectar WhatsApp
            </button>
          ) : (
            <>
              <button onClick={handleGetQr} disabled={qrLoading}
                className="btn btn-primary"
                style={{ padding: '9px 18px' }}>
                {qrLoading
                  ? <><Loader2 size={14} style={{ animation: 'rotate 1s linear infinite' }} /> Gerando QR...</>
                  : <><QrCode size={14} /> Conectar via QR Code</>
                }
              </button>
              <button onClick={fetchStatus}
                className="btn btn-ghost"
                style={{ padding: '9px 14px' }}>
                <RefreshCw size={14} /> Atualizar status
              </button>
            </>
          )}
        </div>

        {/* QR Code display */}
        {qr && !isConnected && (
          <div className="anim-fade-up" style={{ marginTop: 20, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{
              background: '#fff', padding: 12, borderRadius: 12,
              border: '3px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 30px rgba(59,130,246,0.15)',
              flexShrink: 0,
            }}>
              <img src={qr} alt="QR Code WhatsApp" style={{ width: 200, height: 200, display: 'block' }} />
            </div>
            <div style={{ paddingTop: 8 }}>
              <h3 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                Como conectar:
              </h3>
              {[
                'Abra o WhatsApp no celular',
                'Toque em ⋮ (3 pontos) → Dispositivos conectados',
                'Toque em "Conectar dispositivo"',
                'Aponte a câmera para o QR code ao lado',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-glow2)', border: '1px solid var(--border2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--accent2)',
                  }}>{i + 1}</div>
                  <span style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
              <p style={{ color: 'var(--text3)', fontSize: 11.5, marginTop: 12 }}>
                O QR code expira em ~60 segundos. Clique em "Conectar via QR Code" novamente se expirar.
              </p>
            </div>
          </div>
        )}

        {wpStatus === 'unreachable' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, padding: '12px 14px', background: 'var(--amber-glow)', borderRadius: 9, border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertTriangle size={15} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.6 }}>
              Evolution API inacessível. Reinicie o Cloudflare tunnel e atualize <code style={{ background: 'var(--card)', padding: '1px 5px', borderRadius: 4, color: 'var(--accent2)' }}>EVOLUTION_API_URL</code> no Vercel.
            </p>
          </div>
        )}
      </div>

      {/* ── AI Config ── */}
      <div className="card-base anim-fade-up anim-d2" style={{ padding: 24, marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-glow)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Configuração da IA</h2>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>Personalize o comportamento do assistente</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              <MessageSquare size={11} /> Nome da IA
            </label>
            <input value={config?.assistantName || ''} onChange={(e) => handleChange('assistantName', e.target.value)}
              placeholder="Sofia" className="input-field" />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              <Sliders size={11} /> Tom de Voz
            </label>
            <select value={config?.tone || 'friendly'} onChange={(e) => handleChange('tone', e.target.value)}
              className="input-field" style={{ cursor: 'pointer' }}>
              <option value="friendly">Amigável</option>
              <option value="formal">Formal</option>
              <option value="professional">Profissional</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            <Bot size={11} /> Instruções do Sistema
          </label>
          <textarea value={config?.systemPrompt || ''} onChange={(e) => handleChange('systemPrompt', e.target.value)}
            rows={4} placeholder="Você é [nome], recepcionista da [empresa]..."
            className="input-field" style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            <Clock size={11} /> Palavras para Transferência Humana
          </label>
          <input
            value={config?.humanHandoffKeywords?.join(', ') || ''}
            onChange={(e) => handleChange('humanHandoffKeywords', e.target.value.split(',').map((s: string) => s.trim()))}
            placeholder="falar com atendente, humano, urgente..."
            className="input-field" />
        </div>
      </div>

      {/* ── Business Info ── */}
      <div className="card-base anim-fade-up anim-d3" style={{ padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--purple), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--purple-glow)', border: '1px solid rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color="var(--purple)" />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Informações do Negócio</h2>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>A IA usa esses dados nas respostas</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Nome do Negócio', field: 'businessName', icon: Building2, placeholder: 'Clínica São João' },
            { label: 'Horário',         field: 'workingHours', icon: Clock,     placeholder: 'Seg-Sex 8h-18h' },
            { label: 'Endereço',        field: 'address',      icon: MapPin,    placeholder: 'Rua das Flores, 123' },
            { label: 'Telefone',        field: 'phone',        icon: Phone,     placeholder: '(11) 99999-9999' },
          ].map(({ label, field, icon: Icon, placeholder }) => (
            <div key={field}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                <Icon size={11} /> {label}
              </label>
              <input
                value={config?.businessContext?.[field] || ''}
                onChange={(e) => handleChange('businessContext', { ...config?.businessContext, [field]: e.target.value })}
                placeholder={placeholder} className="input-field" />
            </div>
          ))}
        </div>
      </div>

      {saved && (
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--green-glow)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 10, padding: '12px 16px', color: 'var(--green)', fontSize: 13.5, marginBottom: 16 }}>
          <CheckCircle2 size={16} /> Configurações salvas com sucesso!
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="btn btn-primary"
        style={{ padding: '13px 32px', fontSize: 14, opacity: saving ? .7 : 1 }}>
        {saving
          ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rotate .7s linear infinite' }} /> Salvando...</>
          : <><Save size={15} /> Salvar Configurações</>}
      </button>
    </div>
  );
}
