import { OpenAI } from 'openai';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import type { ReasoningEffort } from 'openai/resources/shared';
import type {
  Message,
  ResponseOptions,
  AIResponseService,
  AIResponse,
  AIResponseUsage,
} from '@/lib/ai/types';

class OpenAIResponseServiceImpl implements AIResponseService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI();
  }

  async generateResponse(
    messages: Message[],
    options?: ResponseOptions,
  ): Promise<AIResponse> {
    // Build request parameters
    // gpt-5-nano shuts down 11 Dec 2026; gpt-6-luna is OpenAI's current
    // cost-sensitive model. It has no 'minimal' effort; 'none' is the closest.
    // The pinned SDK's ReasoningEffort type predates 'none', hence the cast.
    const requestParams: ChatCompletionCreateParamsNonStreaming = {
      model: 'gpt-6-luna',
      messages: messages,
      reasoning_effort: 'none' as unknown as ReasoningEffort,
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

    // Map usage if present
    let usage: AIResponseUsage | undefined;
    if (response.usage) {
      usage = {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      };
    }

    return { content, usage };
  }
}

// Export singleton instance with static-like interface
export const OpenAIResponseService = new OpenAIResponseServiceImpl();
