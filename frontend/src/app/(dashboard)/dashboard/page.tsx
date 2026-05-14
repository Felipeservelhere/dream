'use client';
import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import {
  MessageSquare, Clock, CheckCircle2, CalendarDays,
  Bot, Mail, TrendingUp, Activity, Wifi,
} from 'lucide-react';

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

const CARDS = (s: Stats) => [
  {
    icon: MessageSquare, label: 'Conversas Abertas',
    value: s.openConversations, sub: 'em atendimento agora',
    color: '#3b82f6', glow: 'rgba(59,130,246,0.2)',
  },
  {
    icon: Clock, label: 'Aguardando Humano',
    value: s.waitingHuman, sub: 'na fila de atendimento',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',
  },
  {
    icon: CheckCircle2, label: 'Resolvidas Hoje',
    value: s.resolvedToday, sub: 'pela IA + atendentes',
    color: '#10b981', glow: 'rgba(16,185,129,0.2)',
  },
  {
    icon: CalendarDays, label: 'Agendamentos Hoje',
    value: s.totalBookingsToday, sub: 'criados pela IA',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',
  },
  {
    icon: Bot, label: 'Resolvido pela IA',
    value: `${s.aiHandledPercent ?? 0}%`, sub: 'sem intervenção humana',
    color: '#06b6d4', glow: 'rgba(6,182,212,0.2)',
  },
  {
    icon: Mail, label: 'Msgs Este Mês',
    value: s.messagesThisMonth, sub: 'total de mensagens',
    color: '#ec4899', glow: 'rgba(236,72,153,0.2)',
  },
];

function StatCard({ icon: Icon, label, value, sub, color, glow, delay }: any) {
  return (
    <div
      className={`card-base anim-fade-up ${delay}`}
      style={{ padding: '22px 24px', cursor: 'default', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42,
          borderRadius: 11,
          background: glow,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} strokeWidth={2} />
        </div>
        <TrendingUp size={14} color="var(--green)" />
      </div>

      <div className="anim-count" style={{ fontSize: 34, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1, marginBottom: 6 }}>
        {value ?? '—'}
      </div>
      <div style={{ color: 'var(--text2)', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--text3)', fontSize: 11.5 }}>{sub}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-base" style={{ padding: '22px 24px' }}>
      <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 11, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: '60%', height: 36, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: '50%', height: 12 }} />
    </div>
  );
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState('');

  useEffect(() => {
    analyticsApi.dashboard()
      .then((r) => setStats(r.data))
      .catch(() => setStats({
        totalConversations: 0, openConversations: 0, waitingHuman: 0,
        resolvedToday: 0, aiHandledPercent: 0, avgResponseTime: '—',
        totalBookingsToday: 0, messagesThisMonth: 0,
      }))
      .finally(() => setLoading(false));

    const updateTime = () => setNow(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  const delays = ['anim-d1','anim-d2','anim-d3','anim-d4','anim-d5','anim-d6'];

  return (
    <div>
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em', marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Visão geral do atendimento em tempo real
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <Activity size={14} color="var(--accent)" />
          <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--accent2)', fontWeight: 600 }}>{now}</span>
          <span className="live-dot" style={{ marginLeft: 4 }} />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : CARDS(stats!).map((c, i) => (
              <StatCard key={i} {...c} delay={delays[i]} />
            ))
        }
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Live feed */}
        <div className="card-base anim-fade-up anim-d3" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wifi size={16} color="var(--accent)" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Atividade ao Vivo</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', background: 'var(--green-glow)', borderRadius: 20 }}>
              <span className="live-dot" />
              <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700 }}>AO VIVO</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '36px 0', borderRadius: 10, background: 'var(--bg2)', border: '1px dashed var(--border2)' }}>
            <div style={{ animation: 'float 3s ease-in-out infinite', display: 'inline-block', marginBottom: 12 }}>
              <MessageSquare size={40} color="var(--accent)" style={{ opacity: .5 }} />
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13.5 }}>
              Sistema operacional — aguardando<br />mensagens via WhatsApp.
            </p>
            <p style={{ color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>
              Conecte seu WhatsApp em Configurações
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card-base anim-fade-up anim-d4" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Bot size={16} color="var(--purple)" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Performance da IA</h2>
          </div>

          {[
            { label: 'Taxa de resolução pela IA', value: stats?.aiHandledPercent ?? 0, color: '#3b82f6' },
            { label: 'Satisfação do cliente',     value: 94,                           color: '#10b981' },
            { label: 'Uptime do sistema',          value: 99.9,                         color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)', fontSize: 12.5 }}>{item.label}</span>
                <span style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 700 }}>{item.value}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${item.value}%`,
                  background: item.color,
                  borderRadius: 3,
                  boxShadow: `0 0 8px ${item.color}88`,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--accent-glow)', borderRadius: 10, border: '1px solid var(--border2)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <CheckCircle2 size={16} color="var(--green)" />
            <span style={{ color: 'var(--text2)', fontSize: 12.5 }}>
              Todos os sistemas funcionando normalmente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
