"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRole = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.messageRole = (0, pg_core_1.pgEnum)('message_role', [
    'user',
    'assistant',
    'system',
]);
