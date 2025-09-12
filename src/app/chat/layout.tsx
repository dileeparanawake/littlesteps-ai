import { ChatSidebar } from '@/components/chat/ChatSidebar';

export default function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { threadId?: string };
}) {
  return (
    <div className="flex h-full">
      <aside className="w-64 border-r flex-shrink-0">
        <ChatSidebar /* activeThreadId={params.threadId ?? null} */ />
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
