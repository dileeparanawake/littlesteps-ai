'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatInput = ChatInput;
var input_1 = require("@/components/ui/input");
var button_1 = require("@/components/ui/button");
var error_alert_1 = require("@/components/ui/error-alert");
function ChatInput(_a) {
    var onPromptChange = _a.onPromptChange, prompt = _a.prompt, onSubmit = _a.onSubmit, isLoading = _a.isLoading, error = _a.error;
    return (<div>
      {/* error alert */}
      {error && <error_alert_1.ErrorAlert error={error}/>}
      <div className="flex items-center bg-muted rounded-lg px-2 py-1 shadow-sm">
        <input_1.Input type="text" placeholder="Ask anything" value={prompt} onChange={function (e) { return onPromptChange(e.target.value); }} className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-3"/>
        <button_1.Button size="sm" className="ml-2" onClick={onSubmit} disabled={isLoading}>
          Ask
        </button_1.Button>
      </div>
    </div>);
}
