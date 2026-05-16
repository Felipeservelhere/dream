'use client';
import { useEffect, useState, useRef } from 'react';
import { flowsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  GitBranch, Activity, Zap, ToggleLeft, ToggleRight, Plus, Box,
  X, ChevronDown, Trash2, GripVertical, MessageSquare, ArrowRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TriggerType = 'keyword' | 'first_message' | 'menu_option';

interface Step {
  id: string;
  text: string;
}

interface NewFlowForm {
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerValue: string;
  steps: Step[];
}

const EMPTY_FORM: NewFlowForm = {
  name: '',
  description: '',
  triggerType: 'keyword',
  triggerValue: '',
  steps: [{ id: crypto.randomUUID(), text: '' }],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFlowPayload(form: NewFlowForm) {
  const nodes = form.steps.map((s, i) => ({
    id: `node_${i}`,
    type: 'message',
    label: `Mensagem ${i + 1}`,
    config: { text: s.text },
    transitions: i < form.steps.length - 1
      ? [{ isDefault: true, nextNodeId: `node_${i + 1}` }]
      : [],
  }));

  const triggers = form.triggerType === 'first_message'
    ? [{ type: 'first_message' }]
    : [{ type: form.triggerType, value: form.triggerValue.trim() }];

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    entryNodeId: nodes[0]?.id ?? 'node_0',
    nodes,
    triggers,
    isActive: true,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlowsPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<NewFlowForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    flowsApi.list()
      .then((r) => setFlows(r.data?.data || r.data || []))
      .catch(() => setFlows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 120);
    }
  }, [drawerOpen]);

  // Close drawer on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  function openDrawer() {
    setForm(EMPTY_FORM);
    setSaveError('');
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  async function toggleFlow(id: string, isActive: boolean) {
    await flowsApi.update(id, { isActive: !isActive });
    setFlows((prev) => prev.map((f) => f.id === id ? { ...f, isActive: !isActive } : f));
  }

  async function handleCreate() {
    setSaveError('');
    if (!form.name.trim()) { setSaveError('Dê um nome ao fluxo.'); return; }
    if (form.triggerType !== 'first_message' && !form.triggerValue.trim()) {
      setSaveError('Informe o gatilho do fluxo.'); return;
    }
    if (form.steps.some((s) => !s.text.trim())) {
      setSaveError('Preencha todas as mensagens.'); return;
    }

    setSaving(true);
    try {
      const res = await flowsApi.create(buildFlowPayload(form));
      const created = res.data?.data || res.data;
      setFlows((prev) => [created, ...prev]);
      closeDrawer();
    } catch {
      setSaveError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, { id: crypto.randomUUID(), text: '' }] }));
  }

  function removeStep(id: string) {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  }

  function updateStep(id: string, text: string) {
    setForm((f) => ({ ...f, steps: f.steps.map((s) => s.id === id ? { ...s, text } : s) }));
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
        <button className="btn btn-primary" onClick={openDrawer}>
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
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
            Crie seu primeiro fluxo para automatizar o atendimento inicial.
          </p>
          <button className="btn btn-primary" onClick={openDrawer} style={{ margin: '0 auto' }}>
            <Plus size={14} strokeWidth={2.5} />
            Criar primeiro fluxo
          </button>
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

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 50,
            animation: 'fadeIn 0.18s ease',
          }}
        />
      )}

      {/* ── Drawer panel ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(520px, 96vw)',
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        zIndex: 51,
        display: 'flex',
        flexDirection: 'column',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.45)',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={16} color="var(--purple)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Novo Fluxo</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>Configure as mensagens automáticas</div>
          </div>
          <button
            onClick={closeDrawer}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Nome do fluxo</label>
            <input
              ref={firstInputRef}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Boas-vindas, Agendamento..."
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Descrição <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Para que serve este fluxo?"
              style={inputStyle}
            />
          </div>

          {/* Trigger */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Gatilho</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.triggerType}
                onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value as TriggerType, triggerValue: '' }))}
                style={{ ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
              >
                <option value="keyword">Palavra-chave</option>
                <option value="first_message">Primeira mensagem</option>
                <option value="menu_option">Opção de menu</option>
              </select>
              <ChevronDown size={14} color="var(--text3)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Trigger value */}
          {form.triggerType !== 'first_message' && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                {form.triggerType === 'keyword' ? 'Palavra ou frase que ativa o fluxo' : 'Identificador da opção'}
              </label>
              <input
                value={form.triggerValue}
                onChange={(e) => setForm((f) => ({ ...f, triggerValue: e.target.value }))}
                placeholder={form.triggerType === 'keyword' ? 'Ex: agendar, preço, horário...' : 'Ex: opcao_1'}
                style={inputStyle}
              />
              <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 5 }}>
                O cliente precisa enviar exatamente essa palavra para ativar o fluxo.
              </p>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 22px' }} />

          {/* Steps */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Mensagens enviadas <span style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 400 }}>em sequência</span>
              </label>
              <button
                onClick={addStep}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: 7, fontSize: 12, fontWeight: 600,
                  color: 'var(--purple)', cursor: 'pointer',
                }}
              >
                <Plus size={12} strokeWidth={2.5} /> Adicionar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.steps.map((step, idx) => (
                <div key={step.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {/* Step number */}
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 9,
                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--purple)',
                  }}>
                    {idx + 1}
                  </div>
                  {/* Textarea */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                      value={step.text}
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      placeholder={idx === 0 ? 'Olá! Como posso te ajudar?' : 'Próxima mensagem...'}
                      rows={3}
                      style={{
                        ...inputStyle,
                        resize: 'vertical',
                        minHeight: 72,
                        fontFamily: 'inherit',
                        lineHeight: 1.55,
                      }}
                    />
                    <MessageSquare size={12} color="var(--text3)" style={{ position: 'absolute', right: 10, bottom: 10, pointerEvents: 'none' }} />
                  </div>
                  {/* Arrow connector + delete */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    {form.steps.length > 1 && (
                      <button
                        onClick={() => removeStep(step.id)}
                        style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--red)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Visual connector */}
              {form.steps.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 34, color: 'var(--text3)', fontSize: 11.5 }}>
                  <ArrowRight size={11} />
                  <span>As mensagens são enviadas em sequência, com intervalo de 1,5s</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          {saveError && (
            <p style={{ flex: 1, fontSize: 12, color: 'var(--red)', alignSelf: 'center' }}>{saveError}</p>
          )}
          <button
            onClick={closeDrawer}
            style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="btn btn-primary"
            style={{ opacity: saving ? 0.65 : 1 }}
          >
            {saving ? 'Salvando...' : 'Criar Fluxo'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        select option { background: var(--card); color: var(--text); }
      `}</style>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--text2)',
  marginBottom: 7,
  letterSpacing: '.01em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: 9,
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
