export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
}

export interface AiToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  tools?: AiTool[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AiCompletionResponse {
  content: string | null;
  toolCalls?: AiToolCall[];
  tokensUsed: number;
  model: string;
}

export interface AiTranscriptionRequest {
  audioBuffer: Buffer;
  language?: string;
  filename?: string;
}

export interface IAiProvider {
  complete(req: AiCompletionRequest): Promise<AiCompletionResponse>;
  transcribeAudio(req: AiTranscriptionRequest): Promise<string>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
