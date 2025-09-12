"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.POST = void 0;
var auth_1 = require("@/lib/auth"); // path to your auth file
var next_js_1 = require("better-auth/next-js");
exports.POST = (_a = (0, next_js_1.toNextJsHandler)(auth_1.auth), _a.POST), exports.GET = _a.GET;
