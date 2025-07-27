# Known Issues

### 🔧 Disabled Mock API Flow

- The `MOCK_API` environment toggle and mock base URL are currently disabled.
- Reason: `https://api.openai-mock.com/v1` is not a valid endpoint (TLS errors on request).
- Future: Replace with a local mock server or MSW.
