# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**
- TypeScript 5.3 - Extension and Website application code
- Python 3.10+ - Downloader service backend

**Secondary:**
- JavaScript (ESM) - Relay server and Spicetify extension
- CSS (Tailwind) - Styling across all frontend components

## Runtime

**Environment:**
- Node.js 18.x+ - Tooling, Website, and Relay server
- Python 3.10+ - `yt-dlp-service`
- Browser (Chrome/Firefox) - Extension runtime

**Package Manager:**
- npm 10.x - Root and individual project management
- pip - Python dependency management for `yt-dlp-service`

## Frameworks

**Core:**
- React 18.2 (Extension) / 19.2 (Website) - UI components
- Next.js 16.1 - Website framework
- FastAPI (Python) - Downloader service API

**Testing:**
- Jest 29.7 - Extension unit and integration tests
- Playwright 1.57 - E2E testing infrastructure
- Node.js native test runner - `relay-server`

**Build/Dev:**
- esbuild 0.20 - Extension bundling
- Tailwind CSS 3/4 - Styling engine
- Vite - Extension development server

## Key Dependencies

**Critical:**
- `yt-dlp` - Core video/audio extraction engine
- `spotify-web-api-node` / Official Web API - Music matching and playlist management
- `ws` - WebSocket implementation for the Relay bridge
- `framer-motion` / `motion` - Animations for Website and Extension

**Infrastructure:**
- `fastapi` / `uvicorn` - Python service infrastructure
- `shadcn/ui` - Component primitives
- `lucide-react` - Iconography

## Configuration

**Environment:**
- `.env` / `.env.example` - Used in `relay-server` and `website`
- `YTDLP_TOKEN` - Auth for the downloader service
- `COOKIE_PATH` - YouTube authentication bypass config

**Build:**
- `tuneport-extension/tsconfig.json` - Extension TS config
- `website/tsconfig.json` - Website TS config
- `tuneport-extension/scripts/build.js` - Custom build and packaging logic

## Platform Requirements

**Development:**
- Docker - Required for running `yt-dlp-service` locally
- Node.js & npm

**Production:**
- Chrome Web Store / Firefox Add-ons - Extension distribution
- Vercel - Website hosting
- Self-hosted Docker - `yt-dlp-service` and `relay-server` (optional)

---

*Stack analysis: 2026-01-18*
*Update after major dependency changes*
