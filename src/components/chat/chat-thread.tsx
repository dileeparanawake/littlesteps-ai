'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatHistory } from '@/components/chat/chat-history';
import { ChatInput } from '@/components/chat/chat-input';
import { useState } from 'react';

/* 

- `prompt: string`
- `response: string`
- `isLoading: boolean`
- `error: string | null`

ChatThread.tsx
│
├── manages: prompt, response, isLoading, error
│
├── <ChatHistory response={response} />
└── <ChatInput
      promptInput={promptInput}
      onPromptChange={setPromptInput}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  */

export function ChatThread() {
  // state
  const [prompt, setPrompt] = useState(''); // prompt is the input value (may be array in future?)
  const [response, setResponse] = useState(''); // ai response value (may be array in future?)
  const [isLoading, setIsLoading] = useState(false); // disable button for api call
  const [error, setError] = useState(null); // handles error for api call

  //handlers

  const handleInputChange = (value: string) => {
    setPrompt(value);
  };

  const handleSubmit = async () => {
    // handle submit > api call
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 seconds

      alert(`Submitting prompt: ${prompt}`);
      setPrompt('');
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
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
          <ChatHistory />
          {/* chat input area */}
          <ChatInput
            onPromptChange={handleInputChange}
            prompt={prompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            // error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
