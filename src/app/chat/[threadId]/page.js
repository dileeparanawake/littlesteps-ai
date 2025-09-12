"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ThreadPage;
var ChatThread_1 = require("@/components/chat/ChatThread");
function ThreadPage(_a) {
    var params = _a.params;
    return (<div className="flex flex-col items-center justify-center h-screen">
      <ChatThread_1.ChatThread threadId={params.threadId}/>
    </div>);
}
