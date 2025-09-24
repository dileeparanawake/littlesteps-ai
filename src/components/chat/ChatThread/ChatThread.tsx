'use client';
import { useState, useEffect } from 'react';

import { authClient } from '@/lib/auth-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageList } from '@/components/chat/ChatThread/MessageList';
import { ChatInput } from '@/components/chat/ChatThread/ChatInput';
import { Separator } from '@/components/ui/separator';
import { useModal } from '@/components/layout/ModalProvider';

type ChatThreadProps = {
  threadId?: string;
};

export default function ChatThread({ threadId }: ChatThreadProps) {
  // hooks
  const { data: session } = authClient.useSession();
  const { setShowSignIn } = useModal();
  // states
  // NOTE:consider message history state array
  const [prompt, setPrompt] = useState<string>(''); // prompt is the input value (may be array in future?)
  const [response, setResponse] = useState<string>(''); // ai response value (may be array in future?)
  const [isLoading, setIsLoading] = useState<boolean>(false); // disable button for api call
  const [error, setError] = useState<null | string>(null); // handles error for api call
  // effects
  useEffect(() => {
    const cachedPrompt = sessionStorage.getItem('savedPrompt');
    if (cachedPrompt) {
      setPrompt(cachedPrompt);
      sessionStorage.removeItem('savedPrompt'); // optional cleanup
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(`Server error: ${error}`);
      }

      const responseData = await response.json();

      setResponse(responseData.response);
      setPrompt(''); // NOTE: consider prompt history state array
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
      className="flex h-full flex-col"
    >
      {/* Header (fixed at top) */}
      <header className="flex-shrink-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-3xl px-4 py-3">
          <h2
            id="thread-title"
            className="text-sm font-medium text-muted-foreground"
          >
            {threadId ? 'Untitled thread' : 'New chat'}
          </h2>
        </div>
        <Separator />
      </header>

      {/* Messages (scrollable middle section) */}
      <div id="message-list" className="flex-1 overflow-y-auto min-h-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          {/* TODO: render messages; ephemeral empty state if none */}
          <MessageList response={response} />
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
