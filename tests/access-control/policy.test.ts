import { describe, it, expect } from 'vitest';
import {
  type AccessLevel,
  type RoutePolicy,
  routePolicy,
} from '@/lib/access-control/policy';

describe('AccessLevel type', () => {
  it('accepts "public" as a valid access level', () => {
    const level: AccessLevel = 'public';
    expect(level).toBe('public');
  });

  it('accepts "authenticated" as a valid access level', () => {
    const level: AccessLevel = 'authenticated';
    expect(level).toBe('authenticated');
  });

  it('accepts "admin" as a valid access level', () => {
    const level: AccessLevel = 'admin';
    expect(level).toBe('admin');
  });
});

describe('RoutePolicy type', () => {
  it('accepts a Record<string, AccessLevel> structure', () => {
    const policy: RoutePolicy = {
      '/api/test': 'public',
      '/api/test2': 'authenticated',
      '/api/test3': 'admin',
    };
    expect(policy).toBeDefined();
    expect(Object.keys(policy)).toHaveLength(3);
  });
});

describe('routePolicy object', () => {
  it('all values are valid AccessLevel types', () => {
    const validLevels: AccessLevel[] = ['public', 'authenticated', 'admin'];
    const values = Object.values(routePolicy);

    values.forEach((value) => {
      expect(validLevels).toContain(value);
    });
  });

  it('route keys start with "/" and do not end with a trailing slash (except bare "/")', () => {
    const keys = Object.keys(routePolicy);

    keys.forEach((key) => {
      // Should start with "/"
      expect(key.startsWith('/')).toBe(true);

      // Should not end with a slash (unless it's just '/')
      if (key !== '/') {
        expect(key.endsWith('/')).toBe(false);
      }
    });
  });

  it('excludes /api/auth/[...all] route', () => {
    const keys = Object.keys(routePolicy);
    expect(keys).not.toContain('/api/auth/[...all]');

    // Also check for common variations
    expect(keys).not.toContain('/api/auth');
    expect(keys.some((key) => key.startsWith('/api/auth/'))).toBe(false);
  });
});
