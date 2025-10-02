'use client';

import type { MessageRow } from '@/db/schema';

// TODO: fix type
type MessageListProps = {
  response: MessageRow[];
};

export function MessageList({ response }: MessageListProps) {
  if (response.length < 2) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex justify-end">
          <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
            Ask a question
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-3">
      {response
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
              {m.content}
            </div>
          </div>
        ))}
    </div>
  );
}
