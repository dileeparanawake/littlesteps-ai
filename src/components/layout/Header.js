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
exports.default = Header;
var react_1 = require("react");
var button_1 = require("../ui/button");
var auth_client_1 = require("@/lib/auth-client");
var ModalProvider_1 = require("./ModalProvider");
function Header() {
    var _this = this;
    // hooks
    var _a = auth_client_1.authClient.useSession(), session = _a.data, isPending = _a.isPending, sessionError = _a.error;
    var setShowSignIn = (0, ModalProvider_1.useModal)().setShowSignIn;
    // states
    var _b = (0, react_1.useState)(false), isSigningOut = _b[0], setIsSigningOut = _b[1];
    // effects
    (0, react_1.useEffect)(function () {
        // If the modal is open, and we finished loading, and there's no session — show error
        if (!isPending && sessionError) {
            setShowSignIn(true);
            console.log("session: ".concat(session === null || session === void 0 ? void 0 : session.user));
            console.log("isPending: ".concat(isPending));
            console.log("sessionError: ".concat(sessionError));
        }
    }, [isPending, sessionError, session === null || session === void 0 ? void 0 : session.user]);
    // handlers
    var handleClick = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(session === null || session === void 0 ? void 0 : session.user)) return [3 /*break*/, 5];
                    setIsSigningOut(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, auth_client_1.authClient.signOut()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    setIsSigningOut(false);
                    return [7 /*endfinally*/];
                case 4: return [3 /*break*/, 6];
                case 5:
                    setShowSignIn(true);
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var label = (session === null || session === void 0 ? void 0 : session.user) ? 'Log out' : 'Log in';
    var disabled = isPending || isSigningOut;
    return (<header className="sticky top-0 z-40 flex justify-between p-4">
      <h1 className="text-lg font-semibold leading-none">LittleSteps AI</h1>
      <button_1.Button variant="link" className="text-muted-foreground p-0 h-auto leading-none" onClick={handleClick} disabled={disabled} aria-busy={disabled}>
        {label}
      </button_1.Button>
    </header>);
}
