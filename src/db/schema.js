"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = exports.thread = exports.verification = exports.account = exports.session = exports.user = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var enums_1 = require("./enums");
// Schema tables required by Better Auth adapter (user, session, account, verification)
exports.user = (0, pg_core_1.pgTable)('user', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    emailVerified: (0, pg_core_1.boolean)('email_verified')
        .$defaultFn(function () { return false; })
        .notNull(),
    image: (0, pg_core_1.text)('image'),
    createdAt: (0, pg_core_1.timestamp)('created_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
});
exports.session = (0, pg_core_1.pgTable)('session', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull(),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
});
exports.account = (0, pg_core_1.pgTable)('account', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    accountId: (0, pg_core_1.text)('account_id').notNull(),
    providerId: (0, pg_core_1.text)('provider_id').notNull(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    accessToken: (0, pg_core_1.text)('access_token'),
    refreshToken: (0, pg_core_1.text)('refresh_token'),
    idToken: (0, pg_core_1.text)('id_token'),
    accessTokenExpiresAt: (0, pg_core_1.timestamp)('access_token_expires_at'),
    refreshTokenExpiresAt: (0, pg_core_1.timestamp)('refresh_token_expires_at'),
    scope: (0, pg_core_1.text)('scope'),
    password: (0, pg_core_1.text)('password'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull(),
});
exports.verification = (0, pg_core_1.pgTable)('verification', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    identifier: (0, pg_core_1.text)('identifier').notNull(),
    value: (0, pg_core_1.text)('value').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }),
});
// Chat Threads
exports.thread = (0, pg_core_1.pgTable)('thread', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title'),
    createdAt: (0, pg_core_1.timestamp)('created_at').$defaultFn(function () { return new Date(); }),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$defaultFn(function () { return new Date(); }),
});
exports.message = (0, pg_core_1.pgTable)('message', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    threadId: (0, pg_core_1.uuid)('thread_id')
        .notNull()
        .references(function () { return exports.thread.id; }, { onDelete: 'cascade' }),
    sequence: (0, pg_core_1.integer)('sequence').notNull(), // TODO: sequence generation
    role: (0, enums_1.messageRole)('role').notNull(), // system | user | assistant
    // role: text('role').notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').$defaultFn(function () { return new Date(); }),
    promptTokens: (0, pg_core_1.integer)('prompt_tokens'),
    completionTokens: (0, pg_core_1.integer)('completion_tokens'),
    totalTokens: (0, pg_core_1.integer)('total_tokens'),
}, function (t) { return [(0, pg_core_1.unique)('thread_sequence_unique').on(t.threadId, t.sequence)]; });
