'use client';
import { useEffect, useState, useRef } from 'react';
import { conversationsApi, settingsApi } from '@/lib/api';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import {
  MessageSquare, Search, Send, UserCheck,
  CheckCheck, RotateCcw, Bot, User, Smartphone, RefreshCw, ChevronDown,
} from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  open:          { label: 'Aberta',          color: '#60a5fa', bg: 'rgba(59,130,246,.12)',  dot: '#3b82f6' },
  in_progress:   { label: 'Em andamento',    color: '#a78bfa', bg: 'rgba(139,92,246,.12)', dot: '#8b5cf6' },
  waiting_human: { label: 'Aguard. humano',  color: '#fbbf24', bg: 'rgba(245,158,11,.12)', dot: '#f59e0b' },
  with_human:    { label: 'Com humano',      color: '#34d399', bg: 'rgba(16,185,129,.12)', dot: '#10b981' },
  resolved:      { label: 'Resolvida',       color: '#94a3b8', bg: 'rgba(148,163,184,.1)', dot: '#64748b' },
};

const FILTERS = [
  { key: 'all',          label: 'Todas' },
  { key: 'waiting_human',label: 'Aguardando' },
  { key: 'open',         label: 'Abertas' },
  { key: 'with_human',   label: 'Com humano' },
  { key: 'resolved',     label: 'Resolvidas' },
];

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected,      setSelected]      = useState<any | null>(null);
  const [messages,      setMessages]      = useState<any[]>([]);
  const [reply,         setReply]         = useState('');
  const [loading,       setLoading]       = useState(true);
  const [syncing,       setSyncing]       = useState(false);
  const [syncMsg,       setSyncMsg]       = useState('');
  const [filter,        setFilter]        = useState('all');
  const [search,        setSearch]        = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  function loadConversations() {
    return conversationsApi.list()
      .then((r) => setConversations(r.data?.data || r.data || []))
      .catch(() => setConversations([]));
  }

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const r = await settingsApi.syncWhatsapp();
      const count = r.data?.synced ?? 0;
      setSyncMsg(`${count} conversa${count !== 1 ? 's' : ''} importada${count !== 1 ? 's' : ''}`);
      await loadConversations();
    } catch {
      setSyncMsg('Erro ao sincronizar');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 4000);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openConversation(conv: any) {
    setSelected(conv);
    try {
      const r = await conversationsApi.messages(conv.id);
      setMessages(r.data?.data || r.data || []);
    } catch { setMessages([]); }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    const text = reply;
    setReply('');
    await conversationsApi.sendMessage(selected.id, text);
    setMessages((prev) => [...prev, { id: Date.now(), text, direction: 'outbound', sender: 'human', createdAt: new Date() }]);
  }

  const filtered = conversations.filter((c) => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !search || (c.client?.name || c.client?.phone || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', gap: 16, overflow: 'hidden' }}>

      {/* Conversation list */}
      <div className="card-base" style={{ width: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Conversas</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {syncMsg && <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>{syncMsg}</span>}
              <button
                onClick={handleSync}
                disabled={syncing}
                title="Importar todas as conversas do WhatsApp"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 9px', borderRadius: 7, border: '1px solid var(--border2)',
                  background: 'var(--accent-glow)', color: 'var(--accent2)',
                  fontSize: 11, fontWeight: 600, cursor: syncing ? 'wait' : 'pointer',
                  opacity: syncing ? 0.7 : 1, transition: 'all 0.15s',
                }}>
                <RefreshCw size={11} strokeWidth={2.5} style={{ animation: syncing ? 'rotate .8s linear infinite' : 'none' }} />
                {syncing ? 'Sync...' : 'Sync'}
              </button>
              <span style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 600, background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: 20 }}>
                {filtered.length}
              </span>
            </div>
          </div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={13} color="var(--text3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="input-field"
              style={{ paddingLeft: 30, fontSize: 12.5, padding: '7px 10px 7px 30px' }}
            />
          </div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: '3px 9px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: filter === f.key ? 'var(--accent)' : 'var(--bg2)',
                  color: filter === f.key ? '#fff' : 'var(--text2)',
                  transition: 'all .15s',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '70%', height: 12, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: '40%', height: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
              <p style={{ fontSize: 13 }}>Nenhuma conversa encontrada.<br />Mensagens do WhatsApp aparecerão aqui.</p>
            </div>
          )}

          {filtered.map((conv) => {
            const st     = STATUS_CFG[conv.status] || STATUS_CFG.open;
            const active = selected?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => openConversation(conv)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: active ? 'var(--sidebar-active)' : 'transparent',
                  borderLeft: `3px solid ${active ? st.dot : 'transparent'}`,
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 36, height: 36,
                    background: `linear-gradient(135deg, ${st.dot}, ${st.dot}88)`,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {getInitials(conv.client?.name || conv.clientId || 'C')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.client?.name || conv.client?.phone || 'Cliente'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginLeft: 6 }}>
                        {conv.updatedAt ? formatRelativeTime(conv.updatedAt) : ''}
                      </span>
                    </div>
                    <span className="badge" style={{ background: st.bg, color: st.color, fontSize: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className="card-base" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ animation: 'float 4s ease-in-out infinite' }}>
              <MessageSquare size={52} color="var(--accent)" style={{ opacity: .3 }} />
            </div>
            <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center' }}>
              Selecione uma conversa<br />para ver as mensagens
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40,
                background: `linear-gradient(135deg, ${STATUS_CFG[selected.status]?.dot || '#3b82f6'}, #8b5cf6)`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14,
                boxShadow: `0 0 12px ${STATUS_CFG[selected.status]?.dot || '#3b82f6'}44`,
              }}>
                {getInitials(selected.client?.name || 'C')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                  {selected.client?.name || selected.client?.phone || 'Cliente'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={11} />
                  {selected.client?.phone || 'WhatsApp'}
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Assumir',         action: () => conversationsApi.takeover(selected.id),    icon: UserCheck,  color: '#f59e0b' },
                  { label: 'Resolver',        action: () => conversationsApi.resolve(selected.id),     icon: CheckCheck, color: '#10b981' },
                  { label: 'Devolver à IA',   action: () => conversationsApi.returnToAi(selected.id),  icon: RotateCcw,  color: '#3b82f6' },
                ].map((btn) => (
                  <button key={btn.label} onClick={btn.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px',
                      background: `${btn.color}18`,
                      color: btn.color,
                      border: `1px solid ${btn.color}33`,
                      borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${btn.color}30`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${btn.color}18`; }}>
                    <btn.icon size={13} strokeWidth={2.5} />
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: 10,
              background: 'var(--bg2)',
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                  <ChevronDown size={24} style={{ margin: '0 auto 8px', opacity: .4 }} />
                  <p style={{ fontSize: 13 }}>Nenhuma mensagem carregada</p>
                </div>
              )}
              {messages.map((msg: any) => {
                const isOut = msg.direction === 'outbound';
                const SenderIcon = msg.sender === 'ai' ? Bot : msg.sender === 'human' ? User : Smartphone;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }} className="anim-fade">
                    <div style={{
                      maxWidth: '68%',
                      padding: '10px 14px',
                      borderRadius: isOut ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                      background: isOut ? 'var(--accent)' : 'var(--card)',
                      color: isOut ? '#fff' : 'var(--text)',
                      fontSize: 13.5,
                      boxShadow: isOut ? '0 2px 12px rgba(59,130,246,.25)' : 'var(--shadow)',
                      border: isOut ? 'none' : '1px solid var(--border)',
                    }}>
                      {msg.transcription && (
                        <div style={{ fontSize: 11, opacity: .7, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          🎤 {msg.transcription}
                        </div>
                      )}
                      {msg.text}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 5, opacity: .6 }}>
                        <SenderIcon size={10} />
                        <span style={{ fontSize: 10 }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={reply} onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                placeholder="Digite como atendente humano... (Enter para enviar)"
                className="input-field"
                style={{ fontSize: 13.5 }}
              />
              <button onClick={sendReply}
                className="btn btn-primary"
                style={{ padding: '10px 18px', flexShrink: 0 }}>
                <Send size={15} />
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
