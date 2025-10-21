'use client';
import { authClient } from '@/lib/auth-client';

import { useQuery } from '@tanstack/react-query';

import { useState } from 'react';

import { fetchThreads } from '@/lib/api/threads';

import EditTitleForm from '@/components/chat/ChatThread/EditTitleForm';
import DeletedThreadButton from '@/components/chat/ChatThread/DeletedThreadButton';

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
        <div className="flex items-baseline gap-2 group">
          <h2
            id="thread-title"
            className={`text-sm font-medium text-muted-foreground ${threadId ? 'hover:text-primary hover:cursor-text transition-colors' : ''}`}
            onDoubleClick={() => threadId && setEditing(true)}
            title={threadId ? 'Double-click to edit thread title' : ''}
          >
            {displayTitle}
          </h2>
          {threadId && userId && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
              <DeletedThreadButton threadId={threadId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
