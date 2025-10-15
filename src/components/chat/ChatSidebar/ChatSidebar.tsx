'use client';

import ThreadList from './ThreadList';

export default function ChatSidebar() {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - fixed */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Chat History</h2>
      </div>

      {/* Thread list - scrollable */}
      <ThreadList />

      {/* Footer section - fixed */}
      <div className="p-4 border-t">
        <button className="w-full text-left text-sm text-muted-foreground hover:text-foreground">
          + New Chat
        </button>
      </div>
    </div>
  );
}
