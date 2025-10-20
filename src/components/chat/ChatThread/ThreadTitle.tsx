'use client';
import { authClient } from '@/lib/auth-client';

import { useQuery } from '@tanstack/react-query';

import { useState } from 'react';

import { fetchThreads } from '@/lib/api/threads';

import type { ThreadRow } from '@/db/schema';

import EditTitleForm from '@/components/chat/ChatThread/EditTitleForm';

export default function ThreadTitle({ threadId }: { threadId: string }) {
  const { data: session } = authClient.useSession();

  const userId = session?.user?.id;

  const { data: threads } = useQuery({
    queryKey: ['threads', userId],
    queryFn: fetchThreads,
    enabled: !!userId,
  });

  const currentThread = threads?.find((t) => t.id === threadId);
  const displayTitle =
    currentThread?.title ?? (threadId ? 'Untitled thread' : 'New chat');

  const [editing, setEditing] = useState(false);

  return (
    <div className="w-full max-w-3xl px-4 py-3">
      {editing && threadId ? (
        <EditTitleForm
          threadId={threadId}
          displayTitle={displayTitle}
          setEditing={setEditing}
        />
      ) : (
        <h2
          id="thread-title"
          className="text-sm font-medium text-muted-foreground"
          onDoubleClick={() => setEditing(true)}
        >
          {displayTitle}
        </h2>
      )}
    </div>
  );
}
