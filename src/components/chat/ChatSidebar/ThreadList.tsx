'use client';

import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/lib/auth-client';
import type { ThreadRow } from '@/db/schema';

import { useParams } from 'next/navigation';
import Link from 'next/link';

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

  const params = useParams();
  const activeThreadId = params?.threadId as string | undefined;

  const sortedThreads = [...(threads ?? [])].sort((a, b) => {
    if (a.id === activeThreadId) return -1;
    if (b.id === activeThreadId) return 1;
    return 0;
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
          {sortedThreads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                className={`p-2 rounded cursor-pointer ${
                  isActive
                    ? 'bg-muted font-medium border-l-2 border-primary'
                    : 'hover:bg-accent'
                }`}
              >
                <Link
                  className="text-sm text-muted-foreground hover:text-primary no-underline"
                  href={`/chat/${thread.id}`}
                >
                  {thread.title}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
