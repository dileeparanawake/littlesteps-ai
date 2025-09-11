import { ChatSidebar } from '@/components/chat/ChatSidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r">
        <ChatSidebar />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
