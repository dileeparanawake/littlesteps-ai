import type { MessageRole } from '@/lib/chat/message-roles';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ResponseOptions {
  threadId?: string;
}

export interface AIResponseUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  usage?: AIResponseUsage;
}

export interface AIResponseService {
  generateResponse(
    messages: Message[],
    options?: ResponseOptions,
  ): Promise<AIResponse>;
}
