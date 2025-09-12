'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatThread;
var react_1 = require("react");
var auth_client_1 = require("@/lib/auth-client");
var separator_1 = require("@/components/ui/separator");
var ModalProvider_1 = require("@/components/layout/ModalProvider");
function ChatThread(_a) {
    var _this = this;
    var threadId = _a.threadId;
    // hooks
    var session = auth_client_1.authClient.useSession().data;
    var setShowSignIn = (0, ModalProvider_1.useModal)().setShowSignIn;
    // states
    // NOTE:consider message history state array
    var _b = (0, react_1.useState)(''), prompt = _b[0], setPrompt = _b[1]; // prompt is the input value (may be array in future?)
    var _c = (0, react_1.useState)(''), response = _c[0], setResponse = _c[1]; // ai response value (may be array in future?)
    var _d = (0, react_1.useState)(false), isLoading = _d[0], setIsLoading = _d[1]; // disable button for api call
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1]; // handles error for api call
    // effects
    (0, react_1.useEffect)(function () {
        var cachedPrompt = sessionStorage.getItem('savedPrompt');
        if (cachedPrompt) {
            setPrompt(cachedPrompt);
            sessionStorage.removeItem('savedPrompt'); // optional cleanup
        }
    }, []);
    //handlers
    var handleInputChange = function (value) {
        setPrompt(value);
        if (error)
            setError(null);
    };
    var handleSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        var response_1, error_2, responseData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    if (!(session === null || session === void 0 ? void 0 : session.user)) {
                        sessionStorage.setItem('savedPrompt', prompt);
                        setIsLoading(false);
                        setShowSignIn(true);
                        return [2 /*return*/];
                    }
                    if (!prompt.trim()) {
                        console.log("Whitespace validation:[".concat(prompt, "]"), "[".concat(prompt.trim(), "]"));
                        setError('Please enter a prompt.');
                        setIsLoading(false);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch('/api/prompt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ prompt: prompt }),
                        })];
                case 2:
                    response_1 = _a.sent();
                    if (!!response_1.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response_1.json()];
                case 3:
                    error_2 = (_a.sent()).error;
                    throw new Error("Server error: ".concat(error_2));
                case 4: return [4 /*yield*/, response_1.json()];
                case 5:
                    responseData = _a.sent();
                    setResponse(responseData.response);
                    setPrompt(''); // NOTE: consider prompt history state array
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    if (error_1 instanceof Error) {
                        setError(error_1.message || 'Something went wrong.');
                    }
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (
    // <div className="w-full max-w-xl mx-auto min-h-screen flex items-center justify-center">
    //   {/* chat card */}
    //   <Card className="w-full">
    //     <CardHeader>
    //       <CardTitle>Chat Title</CardTitle>
    //     </CardHeader>
    //     <CardContent>
    //       <MessageList response={response} />
    //       <ChatInput
    //         onPromptChange={handleInputChange}
    //         prompt={prompt}
    //         onSubmit={handleSubmit}
    //         isLoading={isLoading}
    //         error={error}
    //       />
    //     </CardContent>
    //   </Card>
    // </div>
    <section id="chat-thread" aria-labelledby="thread-title" className="flex h-full flex-col">
      <header className="sticky top-0 ...">
        <h2 id="thread-title" className="text-sm text-muted-foreground">
          {threadId ? 'Untitled Thread' : 'New chat'}
          <separator_1.Separator />
        </h2>
      </header>

      <div className="flex-1 overflow-auto">…messages…</div>

      <footer className="border-t">…input…</footer>
    </section>);
}
