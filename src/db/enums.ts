import { pgEnum } from 'drizzle-orm/pg-core';
import { MESSAGE_ROLES } from '@/lib/chat/message-roles';

export const messageRole = pgEnum('message_role', MESSAGE_ROLES);
