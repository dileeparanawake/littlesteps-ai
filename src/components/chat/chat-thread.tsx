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
    /* 
    TODO:

  •	Prompt is validated before submission.
	•	fetch() POSTs to /api/prompt.
	•	Response is parsed and saved to state.
	•	Errors are caught and handled.
	•	isLoading, error, and response are wired into the UI.
    
  
    */
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    // handle submit > api call
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 seconds

      alert(`Submitting prompt: ${prompt}`);
      setPrompt(''); // NOTE: consider prompt history state array
      // TODO: add err handling
    } catch (err: unknown) {
      if (err instanceof Error) {
        // test after api call setup - no error handling yet
        // console.error(err);
        // setError('Something went wrong.');
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
            error={error} // not used yet
          />
        </CardContent>
      </Card>
    </div>
  );
}
