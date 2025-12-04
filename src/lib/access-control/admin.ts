import { z } from 'zod';

const emailSchema = z.email();

export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;

  if (!adminEmailsEnv || adminEmailsEnv.trim() === '') {
    return [];
  }

  // Parse comma-separated string, trim whitespace, and normalize to lowercase
  const emails = adminEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase());

  // Filter to only include valid email addresses
  const validEmails = emails.filter((email) => {
    const result = emailSchema.safeParse(email);
    return result.success;
  });

  return validEmails;
}
