import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { OidcVerificationResult } from './types';

const GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const GITHUB_JWKS_URL = new URL(
  `${GITHUB_OIDC_ISSUER}/.well-known/jwks`,
);

export async function verifyGitHubOidc(
  token: string,
): Promise<OidcVerificationResult> {
  if (!token) {
    return { success: false, status: 401, error: 'Missing token' };
  }

  try {
    const jwks = createRemoteJWKSet(GITHUB_JWKS_URL);
    const { payload } = await jwtVerify(token, jwks, {
      issuer: GITHUB_OIDC_ISSUER,
      audience: 'api://littlesteps-ai',
    });

    const expectedRepo = process.env.GITHUB_REPOSITORY;
    if (payload.repository !== expectedRepo) {
      return { success: false, status: 403, error: 'Repository mismatch' };
    }

    return { success: true };
  } catch {
    return { success: false, status: 401, error: 'Token verification failed' };
  }
}
