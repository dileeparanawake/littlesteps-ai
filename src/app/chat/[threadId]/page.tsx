import { ChatThread } from '@/components/chat/ChatThread';

export default function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  return <ChatThread threadId={params.threadId} />;
}
