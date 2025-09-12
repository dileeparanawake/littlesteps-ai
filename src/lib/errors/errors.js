"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadNotFoundError = exports.UserNotFoundError = exports.ValidationError = exports.AppError = void 0;
// src/lib/errors.ts
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, opts) {
        var _newTarget = this.constructor;
        var _a, _b, _c;
        var _this = _super.call(this, message) || this;
        _this.name = _newTarget.name;
        _this.code = (_a = opts === null || opts === void 0 ? void 0 : opts.code) !== null && _a !== void 0 ? _a : 'APP_ERROR';
        _this.status = (_b = opts === null || opts === void 0 ? void 0 : opts.status) !== null && _b !== void 0 ? _b : 500;
        if (opts === null || opts === void 0 ? void 0 : opts.cause) {
            (_c = Error.captureStackTrace) === null || _c === void 0 ? void 0 : _c.call(Error, _this, _newTarget);
            _this.cause = opts.cause;
        }
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message) {
        return _super.call(this, message, { code: 'VALIDATION_ERROR', status: 400 }) || this;
    }
    return ValidationError;
}(AppError));
exports.ValidationError = ValidationError;
var UserNotFoundError = /** @class */ (function (_super) {
    __extends(UserNotFoundError, _super);
    function UserNotFoundError(userId) {
        return _super.call(this, "User does not exist: ".concat(userId), {
            code: 'USER_NOT_FOUND',
            status: 404,
        }) || this;
    }
    return UserNotFoundError;
}(AppError));
exports.UserNotFoundError = UserNotFoundError;
var ThreadNotFoundError = /** @class */ (function (_super) {
    __extends(ThreadNotFoundError, _super);
    function ThreadNotFoundError(threadId) {
        return _super.call(this, "Thread does not exist: ".concat(threadId), {
            code: 'THREAD_NOT_FOUND',
            status: 404,
        }) || this;
    }
    return ThreadNotFoundError;
}(AppError));
exports.ThreadNotFoundError = ThreadNotFoundError;
