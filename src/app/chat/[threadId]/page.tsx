'use client';

import { ChatThread } from '@/components/chat/ChatThread';

export default function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <ChatThread /* threadId={params.threadId} */ />
    </div>
  );
}
