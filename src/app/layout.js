"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
require("./globals.css");
var ModalProvider_1 = require("@/components/layout/ModalProvider");
var Header_1 = require("@/components/layout/Header");
exports.metadata = {
    title: 'LittleSteps AI',
    description: 'AI child development assistant',
    icons: {
        icon: '/littlesteps_favicon.png',
    },
};
function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="en">
      <body>
        <ModalProvider_1.default>
          <Header_1.default />
          {children}
        </ModalProvider_1.default>
      </body>
    </html>);
}
