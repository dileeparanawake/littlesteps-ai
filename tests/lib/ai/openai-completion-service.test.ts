// tests for Block C — OpenAI adapter with caching

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Message } from '@/lib/ai/types';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

const mockCreateCompletion = vi.fn();

const mockOpenAIInstance = {
  chat: {
    completions: {
      create: mockCreateCompletion,
    },
  },
};

// Mock OpenAI client
vi.mock('openai', () => ({
  __esModule: true,
  OpenAI: vi.fn().mockImplementation(() => mockOpenAIInstance),
}));

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

const sampleMessages: Message[] = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' },
];

// --------------------------------------------------------------------------
// OpenAICompletionService unit tests
// --------------------------------------------------------------------------

describe('OpenAICompletionService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: successful response
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: 'AI response' } }],
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns string content when OpenAI returns a normal completion', async () => {
    // Arrange
    const expectedContent = 'This is a test response from OpenAI';
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: expectedContent } }],
    });

    // Import fresh to apply mocks
    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act
    const result =
      await OpenAICompletionService.generateCompletion(sampleMessages);

    // Assert: returns the content string
    expect(result).toBe(expectedContent);

    // Assert: OpenAI SDK called with correct base parameters
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
    expect(mockCreateCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-nano',
        messages: sampleMessages,
        reasoning_effort: 'minimal',
      }),
    );
  });

  it('adds prompt_cache_key when threadId is provided', async () => {
    // Arrange
    const threadId = 'test-thread-123';
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Cached response' } }],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act
    await OpenAICompletionService.generateCompletion(sampleMessages, {
      threadId,
    });

    // Assert: OpenAI SDK called with prompt_cache_key
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
    expect(mockCreateCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-nano',
        messages: sampleMessages,
        reasoning_effort: 'minimal',
        prompt_cache_key: threadId,
      }),
    );
  });

  it('omits prompt_cache_key when threadId is not provided', async () => {
    // Arrange
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Uncached response' } }],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act: call without options
    await OpenAICompletionService.generateCompletion(sampleMessages);

    // Assert: OpenAI SDK called without prompt_cache_key
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
    const callArgs = mockCreateCompletion.mock.calls[0][0];
    expect(callArgs).toEqual({
      model: 'gpt-5-nano',
      messages: sampleMessages,
      reasoning_effort: 'minimal',
    });
    expect(callArgs).not.toHaveProperty('prompt_cache_key');
  });

  it('omits prompt_cache_key when options provided but threadId is undefined', async () => {
    // Arrange
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: 'Uncached response' } }],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act: call with empty options object
    await OpenAICompletionService.generateCompletion(sampleMessages, {});

    // Assert: OpenAI SDK called without prompt_cache_key
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
    const callArgs = mockCreateCompletion.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('prompt_cache_key');
  });

  it('throws when choices[0].message.content is null', async () => {
    // Arrange: OpenAI returns null content
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAICompletionService.generateCompletion(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });

  it('throws when choices[0].message.content is undefined', async () => {
    // Arrange: OpenAI returns undefined content
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: {} }],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAICompletionService.generateCompletion(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });

  it('throws when choices[0].message is missing', async () => {
    // Arrange: OpenAI returns malformed response
    mockCreateCompletion.mockResolvedValue({
      choices: [{}],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAICompletionService.generateCompletion(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });

  it('throws when choices array is empty', async () => {
    // Arrange: OpenAI returns empty choices
    mockCreateCompletion.mockResolvedValue({
      choices: [],
    });

    const { OpenAICompletionService } = await import(
      '@/lib/ai/openai-completion-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAICompletionService.generateCompletion(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });
});
