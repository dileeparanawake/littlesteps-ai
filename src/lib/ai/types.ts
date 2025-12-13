import type { MessageRole } from '@/lib/chat/message-roles';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface CompletionOptions {
  threadId?: string;
}

export interface AICompletionService {
  generateCompletion(
    messages: Message[],
    options?: CompletionOptions,
  ): Promise<string>;
}
