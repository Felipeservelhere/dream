'use client';
import { useEffect, useState } from 'react';
import { flowsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function FlowsPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    flowsApi.list()
      .then((r) => setFlows(r.data?.data || r.data || []))
      .catch(() => setFlows([]))
      .finally(() => setLoading(false));
  }, []);

  async function toggleFlow(id: string, isActive: boolean) {
    await flowsApi.update(id, { isActive: !isActive });
    setFlows((prev) => prev.map((f) => f.id === id ? { ...f, isActive: !isActive } : f));
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Fluxos de Atendimento</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Fluxos automáticos que guiam a conversa antes da IA livre</p>
        </div>
        <div style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Novo Fluxo
        </div>
      </div>

      {/* Info box */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#1e40af' }}>
        💡 <strong>Como funcionam os fluxos:</strong> Quando o cliente manda a primeira mensagem, o sistema tenta encaixar em um fluxo. Se não encaixar, a IA livre assume. Fluxos garantem respostas consistentes e baratas.
      </div>

      {loading && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 60 }}>Carregando...</div>}

      {!loading && flows.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔀</div>
          <p style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nenhum fluxo criado</p>
          <p style={{ fontSize: 14 }}>O fluxo padrão da clínica foi criado automaticamente no banco.<br />Use a API para visualizar e editar fluxos.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {flows.map((flow) => (
          <div key={flow.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, background: flow.isActive ? '#dcfce7' : '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {flow.isActive ? '🟢' : '⭕'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>{flow.name}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{flow.description || 'Sem descrição'}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                {flow.nodes?.length || 0} nós · {flow.executionCount || 0} execuções · Atualizado {flow.updatedAt ? formatDate(flow.updatedAt) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleFlow(flow.id, flow.isActive)}
                style={{ padding: '6px 14px', background: flow.isActive ? '#fef2f2' : '#f0fdf4', color: flow.isActive ? '#dc2626' : '#16a34a', border: `1px solid ${flow.isActive ? '#fecaca' : '#bbf7d0'}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {flow.isActive ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
