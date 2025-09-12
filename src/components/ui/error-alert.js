'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorAlert = ErrorAlert;
var alert_1 = require("@/components/ui/alert");
function ErrorAlert(_a) {
    var error = _a.error;
    return (<div className="mb-2">
      <alert_1.Alert variant="destructive">
        <alert_1.AlertTitle>Error</alert_1.AlertTitle>
        <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
      </alert_1.Alert>
    </div>);
}
