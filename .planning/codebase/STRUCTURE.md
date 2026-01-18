# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
tuneport/
├── tuneport-extension/  # React/TS Chrome & Firefox Extension
│   ├── src/
│   │   ├── background/  # Service worker logic
│   │   ├── components/  # Shared React components
│   │   ├── content/     # DOM injection scripts
│   │   ├── popup/       # Main extension UI
│   │   ├── services/    # Business logic (Spotify, Matching, DL)
│   │   ├── settings/    # Configuration UI
│   │   └── types/       # Shared TS definitions
│   └── scripts/         # Build and packaging scripts
├── website/             # Next.js marketing and documentation site
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   └── components/  # UI and layout components
├── yt-dlp-service/      # Python/FastAPI downloader backend
├── relay-server/        # Node.js WebSocket relay for Bridge mode
├── spicetify-extension/ # Mod script for Spotify Desktop integration
└── docs/                # Research and technical planning
```

## Directory Purposes

**tuneport-extension/src/services/:**
- Purpose: Core application logic independent of UI
- Contains: `SpotifyAuthService.ts`, `MatchingService.ts`, `DownloadManager.ts`
- Key files: `MatchingService.ts` - handles Jaro-Winkler logic

**yt-dlp-service/:**
- Purpose: Self-hostable API for high-quality audio extraction
- Contains: Python backend, Dockerfile
- Key files: `app.py` - FastAPI implementation

**relay-server/src/:**
- Purpose: Bridges the browser extension to the local filesystem/app
- Contains: WebSocket server
- Key files: `index.js`

**spicetify-extension/:**
- Purpose: Client-side patch for Spotify Desktop to receive files
- Key files: `tuneport.js`

## Key File Locations

**Entry Points:**
- `tuneport-extension/src/background/index.ts`: Extension lifecycle
- `tuneport-extension/src/popup/index.tsx`: Extension UI entry
- `website/src/app/page.tsx`: Landing page
- `yt-dlp-service/app.py`: Downloader service entry

**Configuration:**
- `package.json`: Monorepo scripts
- `tuneport-extension/manifest.json`: Extension capabilities
- `relay-server/.env.example`: Relay server config

## Naming Conventions

**Files:**
- `PascalCase.tsx`: React components
- `camelCase.ts`: Services and utilities
- `kebab-case.js`: Build scripts

**Directories:**
- `kebab-case`: All directories

**Special Patterns:**
- `__tests__/`: Colocated test directories in extension
- `*.test.ts`: Jest test files

## Where to Add New Code

**New Matching Logic:**
- Primary code: `tuneport-extension/src/services/MatchingService.ts`
- Tests: `tuneport-extension/src/services/__tests__/MatchingService.test.ts`

**New Extension Page:**
- Implementation: `tuneport-extension/src/popup/pages/` or similar
- Router: Update `tuneport-extension/src/popup/App.tsx`

**New Download Provider:**
- Logic: `tuneport-extension/src/services/DownloadManager.ts`
- Backend support: `yt-dlp-service/app.py`

## Special Directories

**tuneport-extension/dist/:**
- Purpose: Compiled extension files
- Committed: No (ignored)

**docs/plans/:**
- Purpose: Historical planning and roadmap context
- Committed: Yes

---

*Structure analysis: 2026-01-18*
*Update when directory structure changes*
