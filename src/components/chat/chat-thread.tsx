'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatHistory } from '@/components/chat/chat-history';
import { ChatInput } from '@/components/chat/chat-input';

export function ChatThread() {
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
