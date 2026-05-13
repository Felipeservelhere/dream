import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  IAiProvider,
  AiCompletionRequest,
  AiCompletionResponse,
  AiTranscriptionRequest,
} from './ai-provider.interface';
import { Readable } from 'stream';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly audioModel: string;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.get<string>('ai.openaiApiKey'),
    });
    this.defaultModel = configService.get<string>('ai.openaiModel') || 'gpt-4o-mini';
    this.audioModel = configService.get<string>('ai.openaiAudioModel') || 'whisper-1';
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    const model = req.model || this.defaultModel;

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: req.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 500,
    };

    if (req.tools?.length) {
      params.tools = req.tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      params.tool_choice = 'auto';
    }

    const response = await this.client.chat.completions.create(params);
    const choice = response.choices[0];

    const toolCalls = choice.message.tool_calls?.map((tc) => {
      const fn = (tc as any).function as { name: string; arguments: string };
      return {
        id: tc.id,
        name: fn.name,
        arguments: JSON.parse(fn.arguments),
      };
    });

    return {
      content: choice.message.content,
      toolCalls,
      tokensUsed: response.usage?.total_tokens || 0,
      model,
    };
  }

  async transcribeAudio(req: AiTranscriptionRequest): Promise<string> {
    const stream = Readable.from(req.audioBuffer);
    const file = await OpenAI.toFile(stream, req.filename || 'audio.ogg', {
      type: 'audio/ogg',
    });

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: this.audioModel,
      language: req.language || 'pt',
    });

    return transcription.text;
  }
}
