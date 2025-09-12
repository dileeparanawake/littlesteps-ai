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
exports.POST = POST;
var server_1 = require("next/server");
var openai_1 = require("openai");
var server_session_1 = require("@/lib/server-session");
var isMock = process.env['MOCK_API'] === 'true';
var client = new openai_1.OpenAI({
    apiKey: isMock
        ? process.env['OPENAI_API_KEY_MOCK']
        : process.env['OPENAI_API_KEY'],
    baseURL: isMock
        ? 'https://api.openai-mock.com/v1'
        : 'https://api.openai.com/v1',
});
console.log('Using mock:', isMock);
console.log('Base URL:', client.baseURL);
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, session, completion, response, error_1, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, req.json()];
                case 1:
                    prompt = (_c.sent()).prompt;
                    return [4 /*yield*/, (0, server_session_1.default)()];
                case 2:
                    session = _c.sent();
                    console.log('User session:', (_b = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.email) !== null && _b !== void 0 ? _b : 'no session');
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    if (!(session === null || session === void 0 ? void 0 : session.user)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })];
                    }
                    // throw new Error('Simulated server failure'); // test server error
                    if (typeof prompt !== 'string' || prompt.trim() === '') {
                        return [2 /*return*/, server_1.NextResponse.json({ error: 'Invalid request body' }, { status: 400 })];
                    }
                    return [4 /*yield*/, client.chat.completions.create({
                            model: 'gpt-5-nano',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a UK‑based child development specialist (birth to 24 months). Use up‑to‑date NHS guidance and high‑quality scientific research to help parents understand, track and support their child’s developmental milestones. Never hallucinate. Use friendly, supportive language, explain technical terms, keep tone clear  (UK English). Respond in plain text. Use plain textbullet points and paragraphs, where possible. Keep your response short and concise. Ask clarifying questions when needed. Tailor advice to age and individual needs.',
                                },
                                { role: 'user', content: "".concat(prompt) },
                            ],
                        })];
                case 4:
                    completion = _c.sent();
                    console.log('Open AI response:', completion.choices[0].message.content);
                    response = "Response: ".concat(completion.choices[0].message.content, " Prompt: \"").concat(prompt, "\"");
                    return [2 /*return*/, server_1.NextResponse.json({ response: response }, { status: 200 })];
                case 5:
                    error_1 = _c.sent();
                    message = error_1 instanceof Error ? error_1.message : 'Internal server error';
                    return [2 /*return*/, server_1.NextResponse.json({ error: message }, { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
