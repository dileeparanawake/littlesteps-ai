'use client';

import { createContext, useContext, useState } from 'react';

const AnnounceContext = createContext<(message: string) => void>(() => {});

/**
 * One polite live region for the whole chat area. It lives in the layout, so
 * it survives the move from /chat to /chat/[id] on a new chat and screen
 * readers still hear "Reply received".
 */
export function ChatStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState('');

  return (
    <AnnounceContext.Provider value={setStatus}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </AnnounceContext.Provider>
  );
}

/** Returns a function that sets the chat's screen-reader status line. */
export function useAnnounce(): (message: string) => void {
  return useContext(AnnounceContext);
}
