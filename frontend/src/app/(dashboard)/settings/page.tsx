'use client';
import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      settingsApi.getAiConfig(user.tenantId)
        .then((r) => setConfig(r.data))
        .catch(() => {});
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
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Configurações</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Configure a IA e o perfil do seu negócio</p>
      </div>

      {/* WhatsApp */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>📱</span> Conexão WhatsApp
        </h2>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#92400e', marginBottom: 16 }}>
          ⚠️ Para conectar o WhatsApp, você precisa ter a <strong>Evolution API</strong> rodando. Configure a URL e chave no arquivo <code>.env</code> do backend.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
            Status: <strong style={{ color: '#ef4444' }}>Desconectado</strong>
          </div>
          <button style={{ padding: '12px 20px', background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            🔗 Conectar WhatsApp
          </button>
        </div>
      </div>

      {/* IA Config */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🤖</span> Configuração da IA
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nome da IA</label>
            <input value={config?.assistantName || ''} onChange={(e) => handleChange('assistantName', e.target.value)}
              placeholder="Sofia"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tom de Voz</label>
            <select value={config?.tone || 'friendly'} onChange={(e) => handleChange('tone', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
              <option value="friendly">Amigável</option>
              <option value="formal">Formal</option>
              <option value="professional">Profissional</option>
              <option value="casual">Casual</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Instruções do Sistema</label>
          <textarea value={config?.systemPrompt || ''} onChange={(e) => handleChange('systemPrompt', e.target.value)}
            rows={4} placeholder="Você é [nome], recepcionista da [clínica]..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Palavras que transferem para humano (separadas por vírgula)
          </label>
          <input
            value={config?.humanHandoffKeywords?.join(', ') || ''}
            onChange={(e) => handleChange('humanHandoffKeywords', e.target.value.split(',').map((s: string) => s.trim()))}
            placeholder="falar com atendente, humano, urgente..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        </div>
      </div>

      {/* Negócio */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🏥</span> Informações do Negócio
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Nome do Negócio', 'businessName', 'Clínica São João'],
            ['Horário de Atendimento', 'workingHours', 'Seg-Sex 8h-18h, Sáb 8h-12h'],
            ['Endereço', 'address', 'Rua das Flores, 123'],
            ['Telefone', 'phone', '(11) 99999-9999'],
          ].map(([label, field, placeholder]) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
              <input
                value={config?.businessContext?.[field] || ''}
                onChange={(e) => handleChange('businessContext', { ...config?.businessContext, [field]: e.target.value })}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            </div>
          ))}
        </div>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', color: '#15803d', fontSize: 14, marginBottom: 16 }}>
          ✅ Configurações salvas com sucesso!
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        style={{ padding: '12px 32px', background: saving ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}
