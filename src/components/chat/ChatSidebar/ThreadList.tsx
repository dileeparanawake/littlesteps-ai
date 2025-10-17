'use client';

import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/lib/auth-client';
import type { ThreadRow } from '@/db/schema';

async function fetchThreads() {
  const res = await fetch(`/api/threads`);
  if (!res.ok) {
    throw new Error('Failed to fetch threads');
  }
  return res.json() as Promise<ThreadRow[]>;
}

export default function ThreadList() {
  const { data: session } = authClient.useSession();
  const {
    data: threads,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['threads', session?.user?.id],
    queryFn: () => fetchThreads(),
    enabled: !!session?.user?.id,
  });

  if (!session?.user) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* TODO: Add thread items here */}
          <div className="text-sm text-muted-foreground p-2">
            Sign in to view chat history.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-sm text-muted-foreground p-2">
            Loading threads...
          </div>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-sm text-muted-foreground p-2">
            Error loading threads.
          </div>
        </div>
      </div>
    );
  }
  if (threads?.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-sm text-muted-foreground p-2">
            No threads created yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {/* TODO: Add thread items here */}
        <div className="text-sm text-muted-foreground p-2">
          {threads.map((thread) => (
            <div key={thread.id}>{thread.title}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
