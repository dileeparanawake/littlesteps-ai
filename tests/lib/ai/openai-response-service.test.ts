// tests for Block C — OpenAI adapter with caching (updated for Block D — provider-agnostic naming)

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
// OpenAIResponseService unit tests
// --------------------------------------------------------------------------

describe('OpenAIResponseService', () => {
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
    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act
    const result = await OpenAIResponseService.generateResponse(sampleMessages);

    // Assert: returns AIResponse with content
    expect(result.content).toBe(expectedContent);

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

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act
    await OpenAIResponseService.generateResponse(sampleMessages, {
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

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act: call without options
    await OpenAIResponseService.generateResponse(sampleMessages);

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

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act: call with empty options object
    await OpenAIResponseService.generateResponse(sampleMessages, {});

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

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAIResponseService.generateResponse(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });

  it('throws when choices[0].message.content is undefined', async () => {
    // Arrange: OpenAI returns undefined content
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: {} }],
    });

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAIResponseService.generateResponse(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });

  it('throws when choices[0].message is missing', async () => {
    // Arrange: OpenAI returns malformed response
    mockCreateCompletion.mockResolvedValue({
      choices: [{}],
    });

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAIResponseService.generateResponse(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });

  it('throws when choices array is empty', async () => {
    // Arrange: OpenAI returns empty choices
    mockCreateCompletion.mockResolvedValue({
      choices: [],
    });

    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act & Assert: should throw descriptive error
    await expect(
      OpenAIResponseService.generateResponse(sampleMessages),
    ).rejects.toThrow('No content received from OpenAI');
  });
});

// --------------------------------------------------------------------------
// OpenAIResponseService usage mapping tests
// --------------------------------------------------------------------------

describe('OpenAIResponseService.generateResponse usage mapping', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns usage with correctly mapped tokens when OpenAI response includes usage', async () => {
    // Arrange
    const expectedContent = 'Test response with usage';
    const openAIUsage = {
      prompt_tokens: 15,
      completion_tokens: 25,
      total_tokens: 40,
    };
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: expectedContent } }],
      usage: openAIUsage,
    });

    // Import fresh to apply mocks
    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act
    const result = await OpenAIResponseService.generateResponse(sampleMessages);

    // Assert: returns AIResponse with correctly mapped usage
    expect(result.content).toBe(expectedContent);
    expect(result.usage).toEqual({
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
    });
  });

  it('returns undefined usage when OpenAI response has no usage object', async () => {
    // Arrange
    const expectedContent = 'Test response without usage';
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: expectedContent } }],
      // No usage field
    });

    // Import fresh to apply mocks
    const { OpenAIResponseService } = await import(
      '@/lib/ai/openai-response-service'
    );

    // Act
    const result = await OpenAIResponseService.generateResponse(sampleMessages);

    // Assert: returns AIResponse with undefined usage
    expect(result.content).toBe(expectedContent);
    expect(result.usage).toBeUndefined();
  });
});
