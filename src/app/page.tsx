// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/chat');
}

// 'use client';

// import { ChatThread } from '@/components/chat/ChatThread';

// export default function ChatPage() {
//   return (
//     <div>
//       <main className="flex flex-col items-center justify-center h-screen">
//         <ChatThread />
//       </main>
//     </div>
//   );
// }
