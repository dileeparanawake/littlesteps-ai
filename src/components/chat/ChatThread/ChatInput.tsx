'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';

type ChatInputProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
};

export function ChatInput({
  onPromptChange,
  prompt,
  onSubmit,
  isLoading,
  error,
}: ChatInputProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={handleFormSubmit}>
      {/* error alert */}
      {error && <ErrorAlert error={error} />}
      <div className="flex items-center bg-muted rounded-lg px-2 py-1 shadow-sm">
        <Input
          type="text"
          placeholder="Ask anything"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-3"
        />
        <Button size="sm" className="ml-2" type="submit" disabled={isLoading}>
          Ask
        </Button>
      </div>
    </form>
  );
}
