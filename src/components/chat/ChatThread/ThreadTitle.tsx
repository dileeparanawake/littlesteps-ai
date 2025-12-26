'use client';
import { authClient } from '@/lib/auth-client';

import { useQuery } from '@tanstack/react-query';

import { useState, useRef } from 'react';

import { fetchThreads } from '@/lib/api/threads';

import EditTitleForm from '@/components/chat/ChatThread/EditTitleForm';
import DeletedThreadButton from '@/components/chat/ChatThread/DeletedThreadButton';
import MobileMenuButton from '@/components/chat/ChatSidebar/MobileMenuButton';
import { Pencil } from 'lucide-react';

type ThreadTitleProps = {
  threadId?: string;
  onMenuClick?: () => void;
};

export default function ThreadTitle({
  threadId,
  onMenuClick,
}: ThreadTitleProps) {
  const { data: session } = authClient.useSession();

  const userId = session?.user?.id;

  const { data: threads } = useQuery({
    queryKey: ['threads', userId],
    queryFn: () => {
      // Guard inside queryFn instead of disabling the query
      // This prevents the query from being disabled during navigation on iOS
      // when userId might temporarily be undefined
      if (!userId) {
        return Promise.resolve([]);
      }
      return fetchThreads();
    },
    // Removed enabled: !!userId to prevent query from being disabled
    // during iOS navigation when session might temporarily be unavailable
  });

  const currentThread = threads?.find((t) => t.id === threadId);
  const displayTitle =
    currentThread?.title ?? (threadId ? 'Loading...' : 'New chat');

  const [editing, setEditing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleEdit = () => {
    if (threadId) {
      setEditing(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!threadId) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      handleEdit();
    }, 500); // 500ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if user is scrolling
    if (touchStartPosRef.current && longPressTimerRef.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);
      // If moved more than 10px, cancel long press
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  return (
    <div className="w-full max-w-3xl px-4 py-3">
      {editing && threadId ? (
        <EditTitleForm
          threadId={threadId}
          displayTitle={displayTitle}
          setEditing={setEditing}
        />
      ) : (
        <div className="flex items-center gap-1.5 group">
          {onMenuClick && <MobileMenuButton onClick={onMenuClick} />}
          <h2
            id="thread-title"
            className={`text-sm font-medium text-muted-foreground leading-none mb-0 ${threadId ? 'hover:text-primary hover:cursor-text transition-colors' : ''}`}
            onDoubleClick={handleEdit}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            title={
              threadId ? 'Double-click or long-press to edit thread title' : ''
            }
          >
            {displayTitle}
          </h2>
          {threadId && userId && (
            <>
              {/* Mobile: both edit and delete buttons */}
              <div className="md:hidden flex items-center gap-1">
                <button
                  type="button"
                  className="opacity-70 hover:opacity-100 transition-opacity p-1"
                  onClick={handleEdit}
                  aria-label="Edit thread title"
                >
                  <Pencil
                    className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors duration-200"
                    strokeWidth={1.5}
                  />
                </button>
                <DeletedThreadButton threadId={threadId} />
              </div>
              {/* Desktop: delete button on hover */}
              <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                <DeletedThreadButton threadId={threadId} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
