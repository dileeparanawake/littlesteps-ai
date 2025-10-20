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

function SidebarNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="text-sm text-muted-foreground p-2">{children}</div>
      </div>
    </div>
  );
}

function ThreadItem({
  thread,
  active,
}: {
  thread: ThreadRow;
  active: boolean;
}) {
  return (
    <div
      className={`p-2 rounded cursor-pointer ${
        active
          ? 'bg-muted font-medium border-l-2 border-primary'
          : 'hover:bg-accent'
      }`}
    >
      <Link
        className="text-sm text-muted-foreground hover:text-primary no-underline block"
        href={`/chat/${thread.id}`}
      >
        {thread.title}
      </Link>
    </div>
  );
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

  if (!session?.user)
    return <SidebarNotice>Sign in to view chat history.</SidebarNotice>;
  if (isLoading) return <SidebarNotice>Loading threads…</SidebarNotice>;
  if (isError) return <SidebarNotice>Error loading threads.</SidebarNotice>;
  if (!threads || threads.length === 0)
    return <SidebarNotice>No threads created yet.</SidebarNotice>;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="text-sm text-muted-foreground p-2">
          {sortedThreads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              active={thread.id === activeThreadId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
