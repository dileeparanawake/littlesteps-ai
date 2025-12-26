'use client';

import { useQuery } from '@tanstack/react-query';

import ReactMarkdown from 'react-markdown';
import { fetchThreadMessages } from '@/lib/api/messages';

function normalizeAssistantContent(s: string): string {
  // Turn Unicode bullets into markdown list items
  let out = s.replace(/^\s*•\s?/gm, '- ');
  // Remove empty list items that are just a bullet with no text
  out = out.replace(/^\s*-\s*$/gm, '');
  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
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
              <span className="text-xs text-muted-foreground/70 mb-1 capitalize">
                {m.role}
              </span>

              <div className="rounded-lg px-4 py-2 max-w-full w-fit text-[0.8rem] bg-primary/97 text-primary-foreground">
                <div className="text-[0.8rem] [&_*]:text-primary-foreground [&_p]:text-[0.8rem] [&_li]:text-[0.8rem] [&_a]:underline [&_strong]:text-primary-foreground [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-3 [&_li]:pl-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium [&_h4]:font-medium [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-1 [&_h4]:mb-1">
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
