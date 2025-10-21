'use client';

import { useQuery } from '@tanstack/react-query';
import type { MessageRow } from '@/db/schema';

import ReactMarkdown from 'react-markdown';

function normalizeAssistantContent(s: string): string {
  // Turn Unicode bullets into markdown list items
  let out = s.replace(/^\s*•\s?/gm, '- ');
  // Remove empty list items that are just a bullet with no text
  out = out.replace(/^\s*-\s*$/gm, '');
  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

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
              <span className="text-xs text-muted-foreground mb-1 capitalize">
                {m.role}
              </span>

              <div className="rounded-lg px-4 py-2 max-w-full w-fit text-xs bg-primary text-primary-foreground">
                <div className="[&_*]:text-primary-foreground [&_a]:underline [&_strong]:text-primary-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium [&_h4]:font-medium [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-1 [&_h4]:mb-1">
                  <ReactMarkdown>
                    {normalizeAssistantContent(m.content)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
