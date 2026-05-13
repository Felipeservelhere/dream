'use client';
import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';

interface Stats {
  totalConversations: number;
  openConversations: number;
  waitingHuman: number;
  resolvedToday: number;
  aiHandledPercent: number;
  avgResponseTime: string;
  totalBookingsToday: number;
  messagesThisMonth: number;
}

function StatCard({ icon, label, value, color, sub }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, background: color + '20', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>{value ?? '—'}</div>
      {sub && <div style={{ color: '#94a3b8', fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.dashboard()
      .then((r) => setStats(r.data))
      .catch(() => setStats({
        totalConversations: 0, openConversations: 0, waitingHuman: 0,
        resolvedToday: 0, aiHandledPercent: 0, avgResponseTime: '—',
        totalBookingsToday: 0, messagesThisMonth: 0,
      }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Visão geral do atendimento em tempo real</p>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 60 }}>Carregando métricas...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon="💬" label="Conversas Abertas" value={stats?.openConversations} color="#6366f1" sub="em atendimento agora" />
            <StatCard icon="🙋" label="Aguardando Humano" value={stats?.waitingHuman} color="#f59e0b" sub="na fila de atendimento" />
            <StatCard icon="✅" label="Resolvidas Hoje" value={stats?.resolvedToday} color="#22c55e" sub="pela IA + atendentes" />
            <StatCard icon="📅" label="Agendamentos Hoje" value={stats?.totalBookingsToday} color="#8b5cf6" sub="criados pela IA" />
            <StatCard icon="🤖" label="Resolvido pela IA" value={`${stats?.aiHandledPercent ?? 0}%`} color="#06b6d4" sub="sem intervenção humana" />
            <StatCard icon="📨" label="Msgs Este Mês" value={stats?.messagesThisMonth} color="#ec4899" sub="total de mensagens" />
          </div>

          {/* Live feed placeholder */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Atividade Recente</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>Ao vivo</span>
              </div>
            </div>
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🟢</div>
              Sistema operacional — aguardando mensagens via WhatsApp.<br />
              <span style={{ color: '#6366f1', fontWeight: 600 }}>Conecte seu WhatsApp em Configurações para começar.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
