import { z } from 'zod';

export const threadTitleSchema = z.object({
  threadId: z.uuid('Invalid thread ID'),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(60, 'Title must be 60 characters or fewer'),
});
export type ThreadTitleInput = z.infer<typeof threadTitleSchema>;
