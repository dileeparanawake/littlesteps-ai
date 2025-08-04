import { pgEnum } from 'drizzle-orm/pg-core';

export const messageRole = pgEnum('message_role', [
  'user',
  'assistant',
  'system',
]);

export type MessageRole = (typeof messageRole.enumValues)[number];
