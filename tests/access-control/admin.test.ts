import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAdminEmails } from '@/lib/access-control/admin';

describe('getAdminEmails', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalEnv;
    }
  });

  it('returns empty array when ADMIN_EMAILS is not set', () => {
    delete process.env.ADMIN_EMAILS;
    const result = getAdminEmails();
    expect(result).toEqual([]);
  });

  it('parses comma-separated email string into array', () => {
    process.env.ADMIN_EMAILS = 'admin1@example.com,admin2@example.com';
    const result = getAdminEmails();
    expect(result).toEqual(['admin1@example.com', 'admin2@example.com']);
  });

  it('trims whitespace from email addresses', () => {
    process.env.ADMIN_EMAILS = ' admin@example.com , admin2@example.com ';
    const result = getAdminEmails();
    expect(result).toEqual(['admin@example.com', 'admin2@example.com']);
  });

  it('filters out invalid email addresses', () => {
    process.env.ADMIN_EMAILS =
      'not-an-email,admin@example.com,@example.com,admin@';
    const result = getAdminEmails();
    // Only valid email should be included
    expect(result).toEqual(['admin@example.com']);
  });

  it('handles single email correctly', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const result = getAdminEmails();
    expect(result).toEqual(['admin@example.com']);
  });
});
