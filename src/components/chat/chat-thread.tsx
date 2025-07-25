'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatHistory } from '@/components/chat/chat-history';
import { ChatInput } from '@/components/chat/chat-input';

import { useState } from 'react';

export function ChatThread() {
  // state

  // consider message history state array
  const [prompt, setPrompt] = useState<string>(''); // prompt is the input value (may be array in future?)
  const [response, setResponse] = useState<string>(''); // ai response value (may be array in future?)
  const [isLoading, setIsLoading] = useState<boolean>(false); // disable button for api call
  const [error, setError] = useState<null | string>(null); // handles error for api call

  //handlers

  const handleInputChange = (value: string): void => {
    setPrompt(value);
    if (error) setError(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!prompt.trim()) {
      console.log(`Whitespace validation:[${prompt}]`, `[${prompt.trim()}]`);
      setError('Please enter a prompt.');
      return;
    }

    // handle submit > api call
    setIsLoading(true);

    try {
      const response = await fetch('/api/prompt', {
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
    <div className="w-full max-w-xl mx-auto min-h-screen flex items-center justify-center">
      {/* chat card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>LittleSteps Chat</CardTitle>
        </CardHeader>
        <CardContent>
          {/* chat history */}
          <ChatHistory response={response} />

          {/* chat input area */}
          <ChatInput
            onPromptChange={handleInputChange}
            prompt={prompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
