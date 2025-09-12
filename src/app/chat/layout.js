"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatLayout;
var ChatSidebar_1 = require("@/components/chat/ChatSidebar");
function ChatLayout(_a) {
    var children = _a.children, params = _a.params;
    return (<div className="flex min-h-screen">
      <aside className="w-64 border-r">
        <ChatSidebar_1.ChatSidebar /* activeThreadId={params.threadId ?? null} */ />
      </aside>
      <main className="flex-1">{children}</main>
    </div>);
}
