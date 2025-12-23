'use client';
import { useState, useEffect } from 'react';

import { authClient } from '@/lib/auth-client';

import { useQueryClient } from '@tanstack/react-query';

import { MessageList } from '@/components/chat/ChatThread/MessageList';
import { ChatInput } from '@/components/chat/ChatThread/ChatInput';

import { useModal } from '@/components/providers/ModalProvider';

import ThreadTitle from '@/components/chat/ChatThread/ThreadTitle';
import { useRouter } from 'next/navigation';

import SafetyBanner from '@/components/chat/ChatThread/SafetyBanner';
import { useSidebar } from '@/components/chat/ChatSidebar/SidebarContext';

type ChatThreadProps = {
  threadId?: string;
};

export default function ChatThread({ threadId }: ChatThreadProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openSidebar } = useSidebar();

  // hooks
  const { data: session } = authClient.useSession();
  const { setShowSignIn } = useModal();
  // states
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);

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
      className="h-full flex flex-col overflow-hidden bg-muted/60"
    >
      {/* Header (fixed at top) */}
      <header className="flex-shrink-0 bg-background/20 backdrop-blur-xl backdrop-saturate-150 sticky top-0 z-10">
        <ThreadTitle threadId={threadId} onMenuClick={openSidebar} />
      </header>

      {/* Messages (scrollable middle section) */}
      <div id="message-list" className="flex-1 overflow-y-auto min-h-0 -mt-0">
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
            <p className="text-sm text-center text-muted-foreground/70">
              Get guidance on your child&apos;s development and milestones
            </p>
          )}
        </div>
      </div>

      {/* Input dock (fixed at bottom) */}
      <footer className="flex-shrink-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 pt-0 pb-2">
          <ChatInput
            onPromptChange={handleInputChange}
            prompt={prompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
          <SafetyBanner />
        </div>
      </footer>
    </section>
  );
}
