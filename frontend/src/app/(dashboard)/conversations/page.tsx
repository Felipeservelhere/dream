'use client';
import { useEffect, useState } from 'react';
import { conversationsApi } from '@/lib/api';
import { formatRelativeTime, getInitials } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  open:          { label: 'Aberta',     color: '#1d4ed8', bg: '#dbeafe' },
  in_progress:   { label: 'Em andamento', color: '#7c3aed', bg: '#ede9fe' },
  waiting_human: { label: 'Aguard. humano', color: '#b45309', bg: '#fef3c7' },
  with_human:    { label: 'Com humano', color: '#15803d', bg: '#dcfce7' },
  resolved:      { label: 'Resolvida',  color: '#475569', bg: '#f1f5f9' },
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    conversationsApi.list()
      .then((r) => setConversations(r.data?.data || r.data || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  async function openConversation(conv: any) {
    setSelected(conv);
    try {
      const r = await conversationsApi.messages(conv.id);
      setMessages(r.data?.data || r.data || []);
    } catch { setMessages([]); }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    await conversationsApi.sendMessage(selected.id, reply);
    setReply('');
  }

  const filtered = filter === 'all' ? conversations : conversations.filter((c) => c.status === filter);

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
      {/* Lista */}
      <div style={{ width: 340, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Conversas</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all','waiting_human','open','resolved'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f ? '#6366f1' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b' }}>
                {f === 'all' ? 'Todas' : STATUS_LABELS[f]?.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 24, color: '#94a3b8', textAlign: 'center' }}>Carregando...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              Nenhuma conversa ainda.<br />Mensagens do WhatsApp aparecerão aqui.
            </div>
          )}
          {filtered.map((conv) => {
            const st = STATUS_LABELS[conv.status] || STATUS_LABELS.open;
            const active = selected?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => openConversation(conv)}
                style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: active ? '#f5f3ff' : '#fff', borderLeft: active ? '3px solid #6366f1' : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, background: '#818cf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {getInitials(conv.client?.name || conv.clientId || 'C')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.client?.name || conv.client?.phone || 'Cliente'}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 6 }}>
                        {conv.updatedAt ? formatRelativeTime(conv.updatedAt) : ''}
                      </span>
                    </div>
                    <div style={{ marginTop: 3 }}>
                      <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <p style={{ fontWeight: 500 }}>Selecione uma conversa para ver as mensagens</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#818cf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                {getInitials(selected.client?.name || 'C')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selected.client?.name || selected.client?.phone || 'Cliente'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selected.client?.phone || ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => conversationsApi.takeover(selected.id)}
                  style={{ padding: '6px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Assumir
                </button>
                <button onClick={() => conversationsApi.resolve(selected.id)}
                  style={{ padding: '6px 14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Resolver
                </button>
                <button onClick={() => conversationsApi.returnToAi(selected.id)}
                  style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Devolver para IA
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Nenhuma mensagem carregada</div>
              )}
              {messages.map((msg: any) => {
                const isOut = msg.direction === 'outbound';
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isOut ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isOut ? '#6366f1' : '#fff', color: isOut ? '#fff' : '#0f172a', fontSize: 14, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
                      {msg.transcription && <div style={{ fontSize: 11, opacity: .7, marginBottom: 4 }}>🎤 {msg.transcription}</div>}
                      {msg.text}
                      <div style={{ fontSize: 10, opacity: .6, marginTop: 4, textAlign: 'right' }}>
                        {msg.sender === 'ai' ? '🤖' : msg.sender === 'human' ? '👤' : '📱'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply box */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <input
                value={reply} onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                placeholder="Digite uma mensagem como atendente humano..."
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
              />
              <button onClick={sendReply}
                style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
