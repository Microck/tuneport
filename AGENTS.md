# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-18
**Context:** TunePort Monorepo (Extension + Website + Services)

## OVERVIEW
TunePort is a browser extension ecosystem that syncs YouTube to Spotify and manages downloads.
Monorepo contains the Chrome extension, marketing website, Python downloader service, and WebSocket relay.

## STRUCTURE
```
.
├── tuneport-extension/ # React/TS Chrome Extension (Core Product)
├── website/            # Next.js App Router + shadcn/ui (Marketing/Docs)
├── yt-dlp-service/     # Python/FastAPI wrapper for yt-dlp (Self-hosted API)
├── relay-server/       # Node.js WebSocket relay (Local files bridge)
└── docs/               # Architecture and plans
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Extension Logic** | `tuneport-extension/src` | Popup, Background, Content Scripts |
| **UI Components** | `tuneport-extension/src/components` | shadcn/ui based |
| **Web Pages** | `website/src/app` | Next.js App Router |
| **Web UI** | `website/src/components/ui` | Heavy use of animations/framer-motion |
| **Download API** | `yt-dlp-service/app.py` | FastAPI endpoints |
| **Relay Logic** | `relay-server/src/index.js` | Simple WS server |

## CONVENTIONS
- **Frontend**: TypeScript, React, Tailwind CSS.
- **Backend (Downloader)**: Python 3.10+, FastAPI, AsyncIO.
- **Backend (Relay)**: Node.js (Vanilla JS), ws library.
- **Styling**: `shadcn/ui` components (found in both extension and website).
- **Testing**: Jest for extension (`__tests__` dirs), `unittest` for Python.

## ANTI-PATTERNS
- **Do not mix**: Extension types with Website types. They are separate projects.
- **Do not import**: Across project boundaries (except via shared config if established, but currently separate).

## COMMANDS
```bash
# Setup
npm install          # Root (installs dependencies)

# Extension
cd tuneport-extension
npm run dev          # Watch mode
npm run build:chrome # Build for Chrome

# Website
cd website
npm run dev

# Services
cd yt-dlp-service
docker-compose up    # Run downloader service
```

## NOTES
- **Relay Server**: Essential for "Local Files" bridge feature.
- **Authentication**: Spotify Auth flow is handled in the extension (`SpotifyAuthService`).
- **Data Flow**: Extension -> Background Script -> Matching Service -> Spotify API / Downloader Service.
