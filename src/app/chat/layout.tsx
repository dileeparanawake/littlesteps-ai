import { ChatSidebar } from '@/components/chat/ChatSidebar';

export default function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { threadId?: string };
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r">
        <ChatSidebar /* activeThreadId={params.threadId ?? null} */ />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
