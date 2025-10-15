'use client';

import { useQuery } from '@tanstack/react-query';
import { thread } from '@/db/schema';

export default function ThreadList() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        {/* TODO: Add thread items here */}
        <div className="text-sm text-muted-foreground p-2">
          No threads created yet
        </div>
      </div>
    </div>
  );
}
