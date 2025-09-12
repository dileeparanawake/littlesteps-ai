"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
// app/page.tsx
var navigation_1 = require("next/navigation");
function HomePage() {
    (0, navigation_1.redirect)('/chat');
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
