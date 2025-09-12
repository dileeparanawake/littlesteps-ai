"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("vitest/config");
var vite_tsconfig_paths_1 = require("vite-tsconfig-paths");
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
exports.default = (0, config_1.defineConfig)({
    plugins: [(0, vite_tsconfig_paths_1.default)()],
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        // runs tests sequentially
        pool: 'threads',
        poolOptions: {
            threads: { minThreads: 1, maxThreads: 1 },
        },
        // runs tests in files sequentially
        sequence: { concurrent: false },
    },
});
