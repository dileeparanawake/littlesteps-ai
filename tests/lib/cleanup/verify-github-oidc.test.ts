// tests for F2, Block B — verify-github-oidc

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

const mockJwtVerify = vi.fn();
const mockCreateRemoteJWKSet = vi.fn();

vi.mock('jose', () => ({
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
  createRemoteJWKSet: (...args: unknown[]) => mockCreateRemoteJWKSet(...args),
}));

// Import after mocks are declared (vi.mock is hoisted)
import { verifyGitHubOidc } from '@/lib/cleanup/verify-github-oidc';

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('verifyGitHubOidc', () => {
  let savedGithubRepository: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    savedGithubRepository = process.env.GITHUB_REPOSITORY;
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    mockCreateRemoteJWKSet.mockReturnValue('mock-jwks');
  });

  afterEach(() => {
    if (savedGithubRepository === undefined) {
      delete process.env.GITHUB_REPOSITORY;
    } else {
      process.env.GITHUB_REPOSITORY = savedGithubRepository;
    }
    vi.resetAllMocks();
  });

  it('returns success when JWT is valid and repository claim matches', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        iss: 'https://token.actions.githubusercontent.com',
        repository: 'owner/repo',
      },
    });

    const result = await verifyGitHubOidc('valid-token');

    expect(result.success).toBe(true);
    expect(mockJwtVerify).toHaveBeenCalledWith(
      'valid-token',
      'mock-jwks',
      expect.objectContaining({
        issuer: 'https://token.actions.githubusercontent.com',
        audience: 'api://littlesteps-ai',
      }),
    );
  });

  it('returns failure when no token is provided', async () => {
    const result = await verifyGitHubOidc('');

    expect(result).toEqual({
      success: false,
      status: 401,
      error: 'Missing token',
    });
  });

  it('returns failure when JWT verification fails (invalid/expired)', async () => {
    mockJwtVerify.mockRejectedValue(new Error('JWT expired'));

    const result = await verifyGitHubOidc('expired-token');

    expect(result).toEqual({
      success: false,
      status: 401,
      error: 'Token verification failed',
    });
  });

  it('returns 401 when audience claim does not match', async () => {
    mockJwtVerify.mockRejectedValue(new Error('unexpected "aud" claim value'));

    const result = await verifyGitHubOidc('wrong-audience-token');

    expect(result).toEqual({
      success: false,
      status: 401,
      error: 'Token verification failed',
    });
  });

  it('returns failure when repository claim does not match GITHUB_REPOSITORY', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        iss: 'https://token.actions.githubusercontent.com',
        repository: 'other-owner/other-repo',
      },
    });

    const result = await verifyGitHubOidc('wrong-repo-token');

    expect(result).toEqual({
      success: false,
      status: 403,
      error: 'Repository mismatch',
    });
  });
});
