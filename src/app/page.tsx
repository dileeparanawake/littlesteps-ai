import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MousePointerClick } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="w-full max-w-xl mx-auto min-h-screen flex items-center justify-center">
      {/* chat card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>LittleSteps Chat</CardTitle>
        </CardHeader>
        <CardContent>
          {/* chat history */}
          <div className="p-4 space-y-3">
            <div className="flex justify-end">
              <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
                user message
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
                ai response
              </div>
            </div>
          </div>
          {/* chat input area */}
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
        </CardContent>
      </Card>
    </div>
  );
}
