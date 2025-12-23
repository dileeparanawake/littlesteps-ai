'use client';
import { useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SidebarProvider } from '@/components/chat/ChatSidebar/SidebarContext';

type ChatLayoutClientProps = {
  children: React.ReactNode;
};

export default function ChatLayoutClient({ children }: ChatLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <SidebarProvider value={{ closeSidebar, openSidebar }}>
      <div className="h-full w-full flex overflow-hidden">
        {/* Desktop sidebar - always visible */}
        <aside className="hidden md:block w-64 border-r border-border/50 flex-shrink-0 overflow-y-auto">
          <ChatSidebar />
        </aside>

        {/* Mobile sidebar - Sheet overlay */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Chat History</SheetTitle>
            <ChatSidebar />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 min-w-0 h-full overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
