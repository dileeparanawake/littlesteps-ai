import ChatLayoutClient from '@/components/chat/ChatLayoutClient';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatLayoutClient>{children}</ChatLayoutClient>;
}
