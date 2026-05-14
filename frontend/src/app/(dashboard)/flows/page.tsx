'use client';
import { useEffect, useState } from 'react';
import { flowsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { GitBranch, Activity, Zap, ToggleLeft, ToggleRight, Plus, Box } from 'lucide-react';

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
    <div className="anim-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={18} color="var(--purple)" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Fluxos de Atendimento</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginLeft: 46 }}>Automações que guiam a conversa antes da IA livre</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} strokeWidth={2.5} />
          Novo Fluxo
        </button>
      </div>

      {/* Info box */}
      <div style={{
        background: 'rgba(139,92,246,0.07)',
        border: '1px solid rgba(139,92,246,0.18)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 24,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <Zap size={15} color="var(--purple)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>Como funcionam: </span>
          Quando um cliente envia a primeira mensagem, o sistema tenta encaixar num fluxo ativo. Se não encaixar, a IA livre assume. Fluxos garantem respostas consistentes e econômicas.
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 82, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && flows.length === 0 && (
        <div className="card-base" style={{ padding: '56px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <GitBranch size={26} color="var(--purple)" />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6, fontSize: 15 }}>Nenhum fluxo criado</p>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            O fluxo padrão foi criado automaticamente no banco.<br />
            Use a API para visualizar e editar fluxos.
          </p>
        </div>
      )}

      {/* Flows list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {flows.map((flow) => (
          <div key={flow.id} className="card-base" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 42, height: 42,
              background: flow.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${flow.isActive ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: flow.isActive ? '0 0 12px rgba(16,185,129,0.12)' : 'none',
            }}>
              <Activity size={18} color={flow.isActive ? 'var(--green)' : 'var(--text3)'} strokeWidth={2} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14.5, marginBottom: 3 }}>
                {flow.name}
              </div>
              <div style={{ color: 'var(--text2)', fontSize: 12.5, marginBottom: 4 }}>
                {flow.description || 'Sem descrição'}
              </div>
              <div style={{ display: 'flex', gap: 14, color: 'var(--text3)', fontSize: 11.5, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box size={10} /> {flow.nodes?.length || 0} nós
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Zap size={10} /> {flow.executionCount || 0} execuções
                </span>
                <span>{flow.updatedAt ? formatDate(flow.updatedAt) : '—'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                color: flow.isActive ? 'var(--green)' : 'var(--text3)',
                padding: '3px 9px',
                background: flow.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                borderRadius: 20,
                border: `1px solid ${flow.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {flow.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <button
                onClick={() => toggleFlow(flow.id, flow.isActive)}
                style={{
                  padding: '6px 14px',
                  background: flow.isActive ? 'rgba(239,68,68,0.09)' : 'rgba(16,185,129,0.09)',
                  color: flow.isActive ? 'var(--red)' : 'var(--green)',
                  border: `1px solid ${flow.isActive ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.22)'}`,
                  borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s ease',
                }}>
                {flow.isActive
                  ? <><ToggleRight size={13} strokeWidth={2.5} /> Desativar</>
                  : <><ToggleLeft  size={13} strokeWidth={2.5} /> Ativar</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
