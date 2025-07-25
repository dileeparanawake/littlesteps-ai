'use client';

import { ChatThread } from '@/components/chat/chat-thread';
import LoginModal from '@/components/login/login-modal';
import { useState } from 'react';

export default function ChatPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  return (
    <div>
      <LoginModal />
      <ChatThread />
    </div>
  );
}
