# Architecture

**Analysis Date:** 2026-01-18

## Pattern Overview

**Overall:** Distributed Browser Ecosystem (Monorepo)

**Key Characteristics:**
- **Hybrid Architecture:** Local browser extension + remote/local microservices
- **Parallel Pipeline:** Simultaneous Spotify metadata matching and audio downloading
- **Relay-Bridge Pattern:** Bypassing extension sandboxing via local WebSocket relay
- **Fuzzy Orchestration:** String-matching based reconciliation between disparate platforms (YouTube/Spotify)

## Layers

**UI Layer (Extension/Website):**
- Purpose: User interface and direct interaction
- Contains: React components, hooks, styling
- Location: `tuneport-extension/src/popup/`, `website/src/app/`
- Depends on: Service layer (extension), Next.js (website)

**Service Layer (Extension):**
- Purpose: Business logic for auth, matching, and download management
- Contains: `SpotifyAuthService`, `MatchingService`, `DownloadManager`
- Location: `tuneport-extension/src/services/`
- Used by: Popup UI and Background worker

**Background Layer (Extension):**
- Purpose: Persistent operations and message routing
- Contains: Service worker logic, notification handling
- Location: `tuneport-extension/src/background/`
- Depends on: Service layer

**Processing Layer (Services):**
- Purpose: Heavy lifting (downloads, transcoding, relaying)
- Contains: FastAPI endpoints, WebSocket handlers
- Location: `yt-dlp-service/`, `relay-server/`

## Data Flow

**Sync Request:**

1. User clicks "Add to Playlist" on YouTube.
2. `Background Service` fetches metadata from current tab.
3. `Matching Service` (`jaroWinkler` algorithm) queries Spotify API.
4. If found: Spotify API adds track to playlist.
5. If download enabled: `DownloadManager` triggers pipeline.
6. `yt-dlp-service` extracts audio and embeds metadata.
7. `Relay Server` receives WebSocket signal.
8. `Spicetify Extension` picks up signal and adds local file to Spotify Desktop.

**State Management:**
- `chrome.storage.local`: Extension persistence (tokens, settings, history)
- React State: Transient UI state
- File-based: `yt-dlp-service` uses temporary disk storage for downloads

## Key Abstractions

**Download Provider:**
- Purpose: Abstracting different download backends (Cobalt, yt-dlp, Lucida)
- Pattern: Strategy Pattern

**ChromeMessageService:**
- Purpose: Typed wrapper for cross-context communication (popup <-> background <-> content)
- Pattern: Facade / Messenger

**Matching Strategy:**
- Purpose: Logic for title sanitization and fuzzy matching
- Implementation: `tuneport-extension/src/services/MatchingService.ts`

## Entry Points

**Extension Background:**
- Location: `tuneport-extension/src/background/index.ts`
- Triggers: Extension install, browser startup, context menu clicks

**Extension Popup:**
- Location: `tuneport-extension/src/popup/index.tsx`
- Triggers: Click on extension icon

**Downloader API:**
- Location: `yt-dlp-service/app.py`
- Triggers: POST requests to `/download`

**Relay Server:**
- Location: `relay-server/src/index.js`
- Triggers: WebSocket connections

## Error Handling

**Strategy:** Fail-over with fallback providers

**Patterns:**
- Provider Fallback: `Lucida` -> `Cobalt` -> `yt-dlp`
- Diagnostic Notifications: Informing user of specific failures (Auth, No Match, Download Error)

---

*Architecture analysis: 2026-01-18*
*Update when major patterns change*
