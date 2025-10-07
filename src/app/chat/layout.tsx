import { ChatSidebar } from '@/components/chat/ChatSidebar';

export default function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { threadId?: string };
}) {
  return (
    <div className="h-full w-full flex overflow-hidden">
      <aside className="w-64 border-r flex-shrink-0 overflow-y-auto">
        <ChatSidebar /* activeThreadId={params.threadId ?? null} */ />
      </aside>
      <main className="flex-1 min-w-0 h-full overflow-hidden">{children}</main>
    </div>
  );
}
