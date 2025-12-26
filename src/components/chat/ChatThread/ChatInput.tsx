'use client';

import { useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight, but respect max-height (128px = max-h-32)
    const newHeight = Math.min(textarea.scrollHeight, 128);
    textarea.style.height = `${newHeight}px`;
  }, [prompt]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* error alert */}
      {error && <ErrorAlert error={error} />}
      <div className="flex items-end bg-muted/30 border border-input rounded-lg px-3 py-2 shadow-sm hover:bg-muted/80 transition-colors">
        <textarea
          ref={textareaRef}
          placeholder="What would you like to know?"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-3 resize-none overflow-hidden min-h-9 max-h-32 leading-5 py-1"
          rows={1}
        />
        <Button
          size="sm"
          className="ml-2 font-medium shrink-0"
          type="submit"
          disabled={isLoading}
        >
          Ask
        </Button>
      </div>
    </form>
  );
}
