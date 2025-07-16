'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ChatInput() {
  return (
    <div className="flex items-center bg-muted rounded-lg px-2 py-1 shadow-sm">
      <Input
        type="text"
        placeholder="Ask anything"
        className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-3"
      />
      <Button size="sm" className="ml-2">
        Ask
      </Button>
    </div>
  );
}
