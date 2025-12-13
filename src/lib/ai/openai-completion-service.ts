import { OpenAI } from 'openai';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import type {
  Message,
  CompletionOptions,
  AICompletionService,
} from '@/lib/ai/types';

class OpenAICompletionServiceImpl implements AICompletionService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI();
  }

  async generateCompletion(
    messages: Message[],
    options?: CompletionOptions,
  ): Promise<string> {
    // Build request parameters
    const requestParams: ChatCompletionCreateParamsNonStreaming = {
      model: 'gpt-5-nano',
      messages: messages,
      reasoning_effort: 'minimal',
    };

    // Add prompt_cache_key only when threadId is provided
    if (options?.threadId) {
      requestParams.prompt_cache_key = options.threadId;
    }

    // Call OpenAI API
    const response = await this.client.chat.completions.create(requestParams);

    // Extract content with type-safe error handling
    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No content received from OpenAI');
    }

    const message = choice.message;
    if (!message) {
      throw new Error('No content received from OpenAI');
    }

    const content = message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content;
  }
}

// Export singleton instance with static-like interface
export const OpenAICompletionService = new OpenAICompletionServiceImpl();
