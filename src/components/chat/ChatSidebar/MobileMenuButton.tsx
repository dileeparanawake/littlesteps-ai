'use client';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MobileMenuButtonProps = {
  onClick: () => void;
};

export default function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden h-auto p-1"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

