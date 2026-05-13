import { AiTool } from '../provider/ai-provider.interface';

// Ferramentas disponíveis para a IA agir sobre o sistema
export const AI_TOOLS: AiTool[] = [
  {
    name: 'get_available_slots',
    description: 'Busca horários disponíveis para agendamento',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
        specialty: { type: 'string', description: 'Especialidade médica' },
        resourceId: { type: 'string', description: 'ID do profissional (opcional)' },
      },
      required: ['date'],
    },
  },
  {
    name: 'create_booking',
    description: 'Cria um novo agendamento para o cliente',
    parameters: {
      type: 'object',
      properties: {
        resourceId: { type: 'string', description: 'ID do profissional/recurso' },
        datetime: { type: 'string', description: 'Data e hora no formato ISO 8601' },
        notes: { type: 'string', description: 'Observações do agendamento' },
      },
      required: ['resourceId', 'datetime'],
    },
  },
  {
    name: 'reschedule_booking',
    description: 'Remarca um agendamento existente',
    parameters: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'ID do agendamento atual' },
        newDatetime: { type: 'string', description: 'Nova data e hora no formato ISO 8601' },
        reason: { type: 'string', description: 'Motivo da remarcação' },
      },
      required: ['bookingId', 'newDatetime'],
    },
  },
  {
    name: 'cancel_booking',
    description: 'Cancela um agendamento',
    parameters: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'ID do agendamento' },
        reason: { type: 'string', description: 'Motivo do cancelamento' },
      },
      required: ['bookingId'],
    },
  },
  {
    name: 'get_client_bookings',
    description: 'Busca agendamentos do cliente atual',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['upcoming', 'past', 'all'],
          description: 'Filtro de status',
        },
      },
      required: [],
    },
  },
  {
    name: 'transfer_to_human',
    description: 'Transfere o atendimento para um atendente humano',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo da transferência' },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'Prioridade do atendimento',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'update_client_profile',
    description: 'Atualiza dados do perfil do cliente',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        profileData: { type: 'object', description: 'Dados extras do perfil' },
      },
      required: [],
    },
  },
];

export type AiToolName =
  | 'get_available_slots'
  | 'create_booking'
  | 'reschedule_booking'
  | 'cancel_booking'
  | 'get_client_bookings'
  | 'transfer_to_human'
  | 'update_client_profile';
