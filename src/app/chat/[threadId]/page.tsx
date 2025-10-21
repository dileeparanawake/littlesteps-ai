import { ChatThread } from '@/components/chat/ChatThread';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <ChatThread threadId={threadId} />;
}
