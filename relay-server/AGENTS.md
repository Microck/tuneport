# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-18
**Context:** Relay Server

## OVERVIEW
Minimal WebSocket relay server for the "Local Files" bridge feature.
Connects the Chrome extension to a local Spicetify script to bypass Spotify API restrictions.
Built with Node.js (Vanilla) and `ws`.

## STRUCTURE
```
relay-server/
├── src/
│   └── index.js    # Main server logic
└── test/           # Integration tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Server Logic** | `src/index.js` | HTTP + WS server |
| **Message Routing** | `src/index.js` -> `ws.on('message')` | Broadcasts to channel |

## CONVENTIONS
- **Simple**: No heavy frameworks. Just `ws` and `http`.
- **Channels**: Token-based channels for secure pairing.

## COMMANDS
```bash
npm start   # Run server
npm test    # Run tests
```
