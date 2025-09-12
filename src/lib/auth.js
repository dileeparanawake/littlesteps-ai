"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
var better_auth_1 = require("better-auth");
var drizzle_1 = require("better-auth/adapters/drizzle");
var db_1 = require("@/db");
var schema = require("@/db/schema");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, drizzle_1.drizzleAdapter)(db_1.db, {
        provider: 'pg',
        schema: schema,
    }),
    emailAndPassword: {
        enabled: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            prompt: 'select_account+consent',
        },
    },
});
