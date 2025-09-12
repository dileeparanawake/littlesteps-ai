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
exports.createMessage = createMessage;
exports.addMessageToThread = addMessageToThread;
var db_1 = require("@/db");
var schema_1 = require("@/db/schema");
var guards_1 = require("@/db/guards");
var validation_1 = require("@/lib/validation");
var drizzle_orm_1 = require("drizzle-orm");
var system_message_1 = require("./system-message");
// create a new message in a thread
function createMessage(threadId, sequence, role, content) {
    return __awaiter(this, void 0, void 0, function () {
        var newMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, validation_1.throwIfMissingFields)({ threadId: threadId, sequence: sequence, role: role, content: content });
                    return [4 /*yield*/, (0, guards_1.throwIfThreadDoesNotExist)(threadId)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.message)
                            .values({ threadId: threadId, sequence: sequence, role: role, content: content })
                            .returning()];
                case 2:
                    newMessage = (_a.sent())[0];
                    console.log('newMessage Created', newMessage);
                    return [2 /*return*/, newMessage];
            }
        });
    });
}
// add a new message to a thread
function generateNextSequence(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var lastMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.db
                        .select()
                        .from(schema_1.message)
                        .where((0, drizzle_orm_1.eq)(schema_1.message.threadId, threadId))
                        .orderBy((0, drizzle_orm_1.desc)(schema_1.message.sequence))
                        .limit(1)];
                case 1:
                    lastMessage = (_a.sent())[0];
                    // If there’s no message, start at 0, otherwise increment
                    return [2 /*return*/, lastMessage ? lastMessage.sequence + 1 : 0];
            }
        });
    });
}
function addMessageToThread(threadId, role, content) {
    return __awaiter(this, void 0, void 0, function () {
        var nextSequence, systemRole;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, validation_1.throwIfMissingFields)({ threadId: threadId, role: role, content: content });
                    return [4 /*yield*/, (0, guards_1.throwIfThreadDoesNotExist)(threadId)];
                case 1:
                    _a.sent();
                    if (role === 'system') {
                        throw new Error('System messages are not allowed');
                    }
                    return [4 /*yield*/, generateNextSequence(threadId)];
                case 2:
                    nextSequence = _a.sent();
                    if (!(nextSequence === 0)) return [3 /*break*/, 5];
                    systemRole = 'system';
                    return [4 /*yield*/, createMessage(threadId, 0, systemRole, system_message_1.SYSTEM_MESSAGE)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, createMessage(threadId, 1, role, content)];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: return [4 /*yield*/, createMessage(threadId, nextSequence, role, content)];
                case 6: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
