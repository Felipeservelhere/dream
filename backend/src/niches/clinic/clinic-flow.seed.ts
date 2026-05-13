import { FlowNodeType } from '../../database/entities/flow.entity';

export const CLINIC_FLOW_SEED = {
  name: 'Fluxo Principal — Clínica',
  description: 'Atendimento completo: agendamento, remarcação, cancelamento e FAQ',
  entryNodeId: 'welcome',
  isActive: true,
  triggers: [
    { type: 'first_message' },
    { type: 'keyword', value: 'oi' },
    { type: 'keyword', value: 'olá' },
    { type: 'keyword', value: 'bom dia' },
    { type: 'keyword', value: 'boa tarde' },
    { type: 'keyword', value: 'boa noite' },
    { type: 'keyword', value: 'menu' },
  ],
  nodes: [
    {
      id: 'welcome',
      type: FlowNodeType.MESSAGE,
      label: 'Boas-vindas',
      config: {
        text: '👋 Olá! Seja bem-vindo(a) à *{{businessName}}*!\n\nSou a *Sofia*, sua assistente virtual. Estou aqui para te ajudar! 😊',
      },
      transitions: [{ isDefault: true, nextNodeId: 'menu' }],
    },
    {
      id: 'menu',
      type: FlowNodeType.QUESTION,
      label: 'Menu Principal',
      config: {
        text: 'O que você precisa hoje?',
        buttons: [
          { id: 'agendar', label: '📅 Agendar consulta' },
          { id: 'remarcar', label: '🔄 Remarcar' },
          { id: 'cancelar', label: '❌ Cancelar' },
          { id: 'duvidas', label: '❓ Dúvidas / Outros' },
        ],
      },
      transitions: [
        { match: ['agendar', '1', 'agendar consulta'], nextNodeId: 'ask_specialty' },
        { match: ['remarcar', '2'], nextNodeId: 'ask_booking_id' },
        { match: ['cancelar', '3'], nextNodeId: 'confirm_cancel' },
        { match: ['duvidas', '4', 'duvidas'], nextNodeId: 'ai_free' },
        { isDefault: true, nextNodeId: 'ai_free' },
      ],
    },
    {
      id: 'ask_specialty',
      type: FlowNodeType.QUESTION,
      label: 'Qual especialidade?',
      config: {
        text: 'Qual especialidade você precisa?',
        variable: 'specialty',
        listItems: [
          { id: 'clinico', title: 'Clínico Geral', description: 'Consulta de rotina' },
          { id: 'cardiologista', title: 'Cardiologia', description: 'Coração e sistema circulatório' },
          { id: 'dermatologista', title: 'Dermatologia', description: 'Pele, cabelo e unhas' },
          { id: 'ortopedista', title: 'Ortopedia', description: 'Ossos e articulações' },
        ],
      },
      transitions: [{ isDefault: true, nextNodeId: 'ask_date' }],
    },
    {
      id: 'ask_date',
      type: FlowNodeType.QUESTION,
      label: 'Qual data?',
      config: {
        text: '📅 Para qual data você prefere?\n\nDigite no formato *DD/MM/AAAA* ou diga "amanhã", "semana que vem" etc.',
        variable: 'preferredDate',
      },
      transitions: [{ isDefault: true, nextNodeId: 'schedule_ai' }],
    },
    {
      id: 'schedule_ai',
      type: FlowNodeType.AI_HANDOVER,
      label: 'IA finaliza agendamento',
      config: {},
      transitions: [],
    },
    {
      id: 'ask_booking_id',
      type: FlowNodeType.QUESTION,
      label: 'Qual agendamento remarcar?',
      config: {
        text: '🔍 Deixa eu verificar seus agendamentos...\n\nVou buscar agora para você!',
        variable: 'lookupBooking',
      },
      transitions: [{ isDefault: true, nextNodeId: 'reschedule_ai' }],
    },
    {
      id: 'reschedule_ai',
      type: FlowNodeType.AI_HANDOVER,
      label: 'IA faz remarcação',
      config: {},
      transitions: [],
    },
    {
      id: 'confirm_cancel',
      type: FlowNodeType.QUESTION,
      label: 'Confirmar cancelamento',
      config: {
        text: '⚠️ Tem certeza que deseja cancelar sua consulta?\n\nEssa ação não pode ser desfeita.',
        buttons: [
          { id: 'sim_cancelar', label: '✅ Sim, cancelar' },
          { id: 'nao_voltar', label: '❌ Não, voltar ao menu' },
        ],
      },
      transitions: [
        { match: ['sim_cancelar', 'sim', 'cancelar'], nextNodeId: 'cancel_ai' },
        { match: ['nao_voltar', 'nao', 'voltar'], nextNodeId: 'menu' },
        { isDefault: true, nextNodeId: 'menu' },
      ],
    },
    {
      id: 'cancel_ai',
      type: FlowNodeType.AI_HANDOVER,
      label: 'IA faz cancelamento',
      config: {},
      transitions: [],
    },
    {
      id: 'ai_free',
      type: FlowNodeType.AI_HANDOVER,
      label: 'IA livre para dúvidas',
      config: {},
      transitions: [],
    },
  ],
};
