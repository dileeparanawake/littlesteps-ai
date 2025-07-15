import { Button } from '@/components/ui/button';
import { MousePointerClick } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="h-screen flex items-center justify-center">
      <h1>Title</h1>
      <Button variant="default" size="lg">
        Click me
        <MousePointerClick />
      </Button>
    </div>
  );
}
