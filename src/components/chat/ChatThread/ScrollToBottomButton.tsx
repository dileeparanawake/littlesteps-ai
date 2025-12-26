'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ScrollToBottomButtonProps = {
  onClick: () => void;
};

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="outline"
      className="rounded-full shadow-xl bg-background text-foreground hover:bg-muted border-2 border-border w-10 h-10"
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="size-5" />
    </Button>
  );
}
