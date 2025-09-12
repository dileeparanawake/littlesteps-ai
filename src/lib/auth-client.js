"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authClient = void 0;
var react_1 = require("better-auth/react");
exports.authClient = (0, react_1.createAuthClient)({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: 'http://localhost:3000',
});
