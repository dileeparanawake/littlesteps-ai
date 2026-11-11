'use client';

import type { HTMLAttributes, ReactNode } from 'react';
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

type Role = 'user' | 'assistant';

type MessageBubbleProps = HTMLAttributes<HTMLDivElement> & {
  sender: Role;
  children: ReactNode;
};

/** One message's layout. Sent, pending and thinking bubbles share it, so
 * swapping a pending bubble for the saved message doesn't shift the page. */
function MessageBubble({ sender, children, ...rest }: MessageBubbleProps) {
  return (
    <div
      {...rest}
      className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`${
          sender === 'user' ? 'items-end text-right' : 'items-start text-left'
        } flex flex-col max-w-full w-fit`}
      >
        <span className="text-xs text-muted-foreground/70 mb-1 capitalize">
          {sender}
        </span>

        <div className="rounded-lg px-4 py-2 max-w-full w-fit text-[0.8rem] bg-primary/97 text-primary-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function MessageBody({ content }: { content: string }) {
  return (
    <div
      data-message-body
      className="text-[0.8rem] [&_*]:text-primary-foreground [&_p]:text-[0.8rem] [&_li]:text-[0.8rem] [&_a]:underline [&_strong]:text-primary-foreground [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-3 [&_li]:pl-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium [&_h4]:font-medium [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-1 [&_h4]:mb-1"
    >
      <ReactMarkdown>{normalizeAssistantContent(content)}</ReactMarkdown>
    </div>
  );
}

const DOT_DELAYS = ['[animation-delay:-0.3s]', '[animation-delay:-0.15s]', ''];

/** Shown while the reply is on its way. Screen readers hear the chat's
 * status line instead (ChatStatusProvider), so this stays visual only. */
function ThinkingBubble() {
  return (
    <MessageBubble sender="assistant" data-thinking aria-hidden="true">
      <div className="flex items-center gap-2 text-[0.8rem] min-h-5">
        <span className="flex gap-1">
          {DOT_DELAYS.map((delay, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full bg-primary-foreground animate-bounce motion-reduce:animate-none ${delay}`}
            />
          ))}
        </span>
        <span>Thinking…</span>
      </div>
    </MessageBubble>
  );
}

type MessageListProps = {
  /** Absent on a new chat that has no thread yet. */
  threadId?: string;
  /** The message just sent, shown until the saved copy arrives. */
  pendingPrompt?: string | null;
};

export function MessageList({ threadId, pendingPrompt }: MessageListProps) {
  // query
  const {
    data: messages,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['threadMessages', threadId],
    queryFn: () =>
      threadId ? fetchThreadMessages(threadId) : Promise.resolve([]),
    enabled: !!threadId, // only runs if threadId is defined
  });

  if (threadId && isLoading) {
    return <p className="text-muted-foreground text-sm">Loading messages...</p>;
  }

  if (threadId && (isError || !messages)) {
    return (
      <p className="text-destructive text-sm">
        {isError
          ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          : 'Failed to load messages.'}
      </p>
    );
  }

  const visible = (messages ?? []).filter(
    (m): m is typeof m & { role: Role } =>
      m.role === 'user' || m.role === 'assistant',
  );

  if (visible.length === 0 && !pendingPrompt) {
    return (
      <p className="text-muted-foreground text-center">
        Ask a question to start a conversation
      </p>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {visible.map((m) => (
        <MessageBubble key={m.id} sender={m.role} data-message-role={m.role}>
          <MessageBody content={m.content} />
        </MessageBubble>
      ))}
      {pendingPrompt && (
        <>
          <MessageBubble sender="user" data-message-role="user" data-pending>
            <MessageBody content={pendingPrompt} />
          </MessageBubble>
          <ThinkingBubble />
        </>
      )}
    </div>
  );
}
