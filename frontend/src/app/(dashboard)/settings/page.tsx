'use client';
import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Smartphone, Bot, Building2, Save, CheckCircle2,
  Wifi, WifiOff, Loader2, AlertTriangle, Sliders,
  MessageSquare, Clock, MapPin, Phone,
} from 'lucide-react';

export default function SettingsPage() {
  const { user }   = useAuthStore();
  const [config,   setConfig]  = useState<any>(null);
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);
  const [wpStatus, setWpStatus] = useState<string>('loading');

  useEffect(() => {
    if (user?.tenantId) {
      settingsApi.getAiConfig(user.tenantId)
        .then((r) => setConfig(r.data))
        .catch(() => {});
      settingsApi.getWhatsappStatus()
        .then((r) => setWpStatus(r.data.status))
        .catch(() => setWpStatus('unreachable'));
    }
  }, [user]);

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

  const WpIcon   = wpStatus === 'open' ? Wifi : wpStatus === 'loading' ? Loader2 : WifiOff;
  const wpColor  = wpStatus === 'open' ? 'var(--green)' : wpStatus === 'loading' ? 'var(--accent)' : 'var(--red)';
  const wpLabel  = { open: '✅ Conectado', loading: 'Verificando...', not_configured: '⚠️ Não configurado', unreachable: '❌ Inacessível' }[wpStatus] ?? wpStatus;

  return (
    <div style={{ maxWidth: 740 }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 4 }}>
          Configurações
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Personalize a IA e o perfil do seu negócio</p>
      </div>

      {/* WhatsApp Card */}
      <div className="card-base anim-fade-up anim-d1" style={{ padding: 24, marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #25d366, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={18} color="#25d366" />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Conexão WhatsApp</h2>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>Status da integração com Evolution API</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            flex: 1, padding: '12px 16px',
            background: 'var(--bg2)',
            border: `1px solid ${wpColor}33`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <WpIcon size={16} color={wpColor} style={{ animation: wpStatus === 'loading' ? 'rotate 1s linear infinite' : 'none' }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: wpColor }}>{wpLabel}</span>
          </div>
          {wpStatus === 'open' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px', background: 'var(--green-glow)', borderRadius: 10, border: '1px solid rgba(16,185,129,.2)' }}>
              <span className="live-dot" />
              <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 700 }}>Ativo</span>
            </div>
          )}
        </div>

        {wpStatus === 'unreachable' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12, padding: '12px 14px', background: 'var(--amber-glow)', borderRadius: 9, border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertTriangle size={15} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.6 }}>
              O túnel para a Evolution API está fora do ar. Reinicie o Cloudflare tunnel e atualize <code style={{ background: 'var(--card)', padding: '1px 5px', borderRadius: 4, color: 'var(--accent2)' }}>EVOLUTION_API_URL</code> no Vercel.
            </p>
          </div>
        )}
      </div>

      {/* AI Config Card */}
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
          {/* Nome da IA */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <MessageSquare size={12} /> Nome da IA
            </label>
            <input value={config?.assistantName || ''} onChange={(e) => handleChange('assistantName', e.target.value)}
              placeholder="Sofia"
              className="input-field"
            />
          </div>

          {/* Tom de voz */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <Sliders size={12} /> Tom de Voz
            </label>
            <select value={config?.tone || 'friendly'} onChange={(e) => handleChange('tone', e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer' }}>
              <option value="friendly">Amigável</option>
              <option value="formal">Formal</option>
              <option value="professional">Profissional</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>

        {/* System prompt */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <Bot size={12} /> Instruções do Sistema
          </label>
          <textarea value={config?.systemPrompt || ''} onChange={(e) => handleChange('systemPrompt', e.target.value)}
            rows={4}
            placeholder="Você é [nome], recepcionista da [empresa]. Seja sempre gentil e profissional..."
            className="input-field"
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
        </div>

        {/* Handoff keywords */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <Clock size={12} /> Palavras para Transferência Humana
          </label>
          <input
            value={config?.humanHandoffKeywords?.join(', ') || ''}
            onChange={(e) => handleChange('humanHandoffKeywords', e.target.value.split(',').map((s: string) => s.trim()))}
            placeholder="falar com atendente, humano, urgente, reclamação..."
            className="input-field"
          />
          <p style={{ color: 'var(--text3)', fontSize: 11.5, marginTop: 6 }}>Separe por vírgula. A IA transfere automaticamente quando detectar essas palavras.</p>
        </div>
      </div>

      {/* Business Info */}
      <div className="card-base anim-fade-up anim-d3" style={{ padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--purple), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--purple-glow)', border: '1px solid rgba(139,92,246,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color="var(--purple)" />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Informações do Negócio</h2>
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>A IA usa esses dados nas respostas</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Nome do Negócio',    field: 'businessName', icon: Building2, placeholder: 'Clínica São João' },
            { label: 'Horário de Atendimento', field: 'workingHours', icon: Clock, placeholder: 'Seg-Sex 8h-18h' },
            { label: 'Endereço',           field: 'address',      icon: MapPin,    placeholder: 'Rua das Flores, 123' },
            { label: 'Telefone',           field: 'phone',        icon: Phone,     placeholder: '(11) 99999-9999' },
          ].map(({ label, field, icon: Icon, placeholder }) => (
            <div key={field}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                <Icon size={12} /> {label}
              </label>
              <input
                value={config?.businessContext?.[field] || ''}
                onChange={(e) => handleChange('businessContext', { ...config?.businessContext, [field]: e.target.value })}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      {saved && (
        <div className="anim-fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--green-glow)',
          border: '1px solid rgba(16,185,129,.25)',
          borderRadius: 10, padding: '12px 16px',
          color: 'var(--green)', fontSize: 13.5, marginBottom: 16,
        }}>
          <CheckCircle2 size={16} />
          Configurações salvas com sucesso!
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="btn btn-primary"
        style={{ padding: '13px 32px', fontSize: 14, opacity: saving ? .7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving
          ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rotate .7s linear infinite' }} /> Salvando...</>
          : <><Save size={15} /> Salvar Configurações</>
        }
      </button>
    </div>
  );
}
