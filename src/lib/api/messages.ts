import type { MessageRow } from '@/db/schema';

export async function fetchThreadMessages(
  threadId: string,
): Promise<MessageRow[]> {
  const res = await fetch(`/api/chat?threadId=${threadId}`);
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error ?? 'Failed to fetch thread messages');
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error?.message
          : 'Failed to fetch thread messages';
      throw new Error(msg);
    }
  }
  return res.json();
}

