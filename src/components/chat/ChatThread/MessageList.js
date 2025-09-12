'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageList = MessageList;
function MessageList(_a) {
    var response = _a.response;
    return (<div className="p-4 space-y-3">
      <div className="flex justify-end">
        <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
          user message
        </div>
      </div>
      <div className="flex justify-start">
        <div className="rounded-lg px-4 py-2 max-w-full w-fit text-sm bg-primary text-primary-foreground">
          {response ? response : 'ai response'}
        </div>
      </div>
    </div>);
}
