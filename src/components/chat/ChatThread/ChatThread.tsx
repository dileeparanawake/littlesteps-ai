'use client';
import { useState, useEffect } from 'react';

import { authClient } from '@/lib/auth-client';

import { useQueryClient } from '@tanstack/react-query';

import { MessageList } from '@/components/chat/ChatThread/MessageList';
import { ChatInput } from '@/components/chat/ChatThread/ChatInput';
import { Separator } from '@/components/ui/separator';
import { useModal } from '@/components/providers/ModalProvider';

import ThreadTitle from '@/components/chat/ChatThread/ThreadTitle';
import { useRouter } from 'next/navigation';
import type { ThreadRow } from '@/db/schema';

type ChatThreadProps = {
  threadId?: string;
};

export default function ChatThread({ threadId }: ChatThreadProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // hooks
  const { data: session } = authClient.useSession();
  const { setShowSignIn } = useModal();
  // states
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);
  // derived data
  const threads = queryClient.getQueryData(['threads', session?.user?.id]) as
    | ThreadRow[]
    | undefined;
  const currentThread = threads?.find((t) => t.id === threadId);
  const threadTitle =
    currentThread?.title ?? (threadId ? 'Untitled thread' : 'New chat');
  // effects
  useEffect(() => {
    const cachedPrompt = sessionStorage.getItem('savedPrompt');
    if (cachedPrompt) {
      setPrompt(cachedPrompt);
      sessionStorage.removeItem('savedPrompt');
    }
  }, []);

  //handlers

  const handleInputChange = (value: string): void => {
    setPrompt(value);
    if (error) setError(null);
  };

  const handleSubmit = async (): Promise<void> => {
    setIsLoading(true);

    if (!session?.user) {
      sessionStorage.setItem('savedPrompt', prompt);
      setIsLoading(false);
      setShowSignIn(true);
      return;
    }

    if (!prompt.trim()) {
      console.log(`Whitespace validation:[${prompt}]`, `[${prompt.trim()}]`);
      setError('Please enter a prompt.');
      setIsLoading(false);
      return;
    }

    // handle submit > api call

    try {
      const response = await fetch(
        `/api/chat${threadId ? `?threadId=${threadId}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        },
      );

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(`Server error: ${error}`);
      }

      if (response.ok) {
        const { threadID } = await response.json();
        setPrompt('');

        if (!threadId && session?.user?.id) {
          queryClient.invalidateQueries({
            queryKey: ['threads', session.user.id],
          });
        }
        router.push(`/chat/${threadID}`);

        queryClient.invalidateQueries({
          queryKey: ['threadMessages', threadID],
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="chat-thread"
      aria-labelledby="thread-title"
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header (fixed at top) */}
      <header className="flex-shrink-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ThreadTitle threadId={threadId} />
        <Separator />
      </header>

      {/* Messages (scrollable middle section) */}
      <div id="message-list" className="flex-1 overflow-y-auto min-h-0">
        <div
          className={
            threadId
              ? 'mx-auto w-full max-w-3xl px-4 py-4 min-h-full'
              : 'mx-auto w-full max-w-3xl px-4 py-4 min-h-full flex items-center justify-center'
          }
        >
          {threadId ? (
            // Render the message list when there’s an existing thread
            <MessageList threadId={threadId} />
          ) : (
            // Empty state: centered between header and footer
            <p className="text-base text-center text-muted-foreground">
              Ask a question to get advice
            </p>
          )}
        </div>
      </div>

      {/* Input dock (fixed at bottom) */}
      <footer className="flex-shrink-0 bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <ChatInput
            onPromptChange={handleInputChange}
            prompt={prompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </footer>
    </section>
  );
}
