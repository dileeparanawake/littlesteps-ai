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
  const [promptInput, setPromptInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  //handlers

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
          <ChatInput />
        </CardContent>
      </Card>
    </div>
  );
}
