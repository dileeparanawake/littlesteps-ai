'use client';

import { useQuery } from '@tanstack/react-query';

import { getThreads } from '@/lib/chat/read-thread';
import { authClient } from '@/lib/auth-client';

export default function ThreadList() {
  const { data: session } = authClient.useSession();
  if (!session?.user) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* TODO: Add thread items here */}
          <div className="text-sm text-muted-foreground p-2">
            Sign in to view chat history.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {/* TODO: Add thread items here */}
        <div className="text-sm text-muted-foreground p-2">
          No threads created yet
        </div>
      </div>
    </div>
  );
}
