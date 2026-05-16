# Logging Middleware

## Purpose
A reusable, zero-dependency asynchronous logging utility designed for internal backend services. It provides standardized, timestamped JSON payloads that cleanly integrate with log aggregators and avoids blocking the Node.js event loop.

## Setup
From any neighboring microservice within the monorepo:
```bash
npm install ../logging_middleware
```

## Run Instructions
No standalone execution required. Import it into your active services.

## Key Functionality
- **Non-blocking Execution**: Uses `async` APIs to ensure the event loop is never blocked by large payload stringification.
- **Failsafe Wrapper**: Includes an internal `try/catch` mechanism so logging errors (e.g., circular JSON) never crash the parent process.
- **Centralized Configuration**: Supports environments and severity levels (`INFO`, `WARN`, `ERROR`, `DEBUG`).

## Folder Structure
```text
logging_middleware/
├── config.js      # Severity levels and environment context
├── index.js       # Main logger function export
└── package.json   # Local module definitions
```

## API Overview
```javascript
const { Log } = require('logging_middleware');

// Signature: Log(stackTrace, level, packageName, messageOrObject)
await Log('', 'INFO', 'api-gateway', { status: 'Service Starting' });
await Log(err.stack, 'ERROR', 'database', 'Connection timeout');
```
