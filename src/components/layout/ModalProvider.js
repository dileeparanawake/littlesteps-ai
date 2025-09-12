// src/components/layout/ModalProvider.tsx
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModal = useModal;
exports.default = ModalProvider;
var react_1 = require("react");
var SignInModal_1 = require("@/components/sign-in/SignInModal");
var ModalContext = (0, react_1.createContext)(null);
function useModal() {
    var ctx = (0, react_1.useContext)(ModalContext);
    if (!ctx)
        throw new Error('useModal must be used inside ModalProvider');
    return ctx;
}
function ModalProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(false), showSignIn = _b[0], setShowSignIn = _b[1];
    return (<ModalContext.Provider value={{ showSignIn: showSignIn, setShowSignIn: setShowSignIn }}>
      {/* Render the modal once at the root */}
      <SignInModal_1.default />
      {children}
    </ModalContext.Provider>);
}
