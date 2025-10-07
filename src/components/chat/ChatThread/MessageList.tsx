'use client';

import { useQuery } from '@tanstack/react-query';
import type { MessageRow } from '@/db/schema';

async function fetchThreadMessages(threadId: string): Promise<MessageRow[]> {
  const res = await fetch(`/api/chat?threadId=${threadId}`);
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error ?? 'Failed to fetch thread messages');
    } catch (_e) {
      throw new Error('Failed to fetch thread messages');
    }
  }
  return res.json();
}

type MessageListProps = {
  threadId: string;
};

export function MessageList({ threadId }: MessageListProps) {
  // query
  const {
    data: messages,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['threadMessages', threadId],
    queryFn: () => fetchThreadMessages(threadId),
    enabled: !!threadId, // only runs if threadId is defined
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading messages...</p>;
  }

  if (isError || !messages) {
    return (
      <p className="text-destructive text-sm">
        {isError
          ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          : 'Failed to load messages.'}
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-center">
        Ask a question to start a conversation
      </p>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`${
                m.role === 'user'
                  ? 'items-end text-right'
                  : 'items-start text-left'
              } flex flex-col max-w-full w-fit`}
            >
              <span className="text-[11px] text-muted-foreground mb-1 capitalize">
                {m.role}
              </span>
              <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
                {m.content}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
