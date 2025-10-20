import type { ThreadRow } from '@/db/schema';

export async function patchThreadTitle(args: {
  threadId: string;
  title: string;
}): Promise<ThreadRow> {
  const res = await fetch('/api/threads', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'Failed to rename thread');
  }

  return (await res.json()) as ThreadRow;
}

export async function fetchThreads(): Promise<ThreadRow[]> {
  const res = await fetch(`/api/threads`);
  if (!res.ok) {
    throw new Error('Failed to fetch threads');
  }
  return res.json() as Promise<ThreadRow[]>;
}
