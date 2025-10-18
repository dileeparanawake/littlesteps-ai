'use client';

import ThreadList from './ThreadList';
import Link from 'next/link';

export default function ChatSidebar() {
  return (
    <div className="h-full flex flex-col">
      {/* Header section - fixed */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-baseline">
          <p className="text-sm font-bold leading-none tracking-tight">
            Chat History
          </p>
          <Link
            href="/chat"
            className="text-xs font-light text-muted-foreground hover:text-primary no-underline leading-none"
          >
            New Chat +
          </Link>
        </div>
      </div>

      {/* Thread list - scrollable */}
      <ThreadList />

      {/* Footer section - fixed */}
      <div className="p-4 border-t"></div>
    </div>
  );
}
