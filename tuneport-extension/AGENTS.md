# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-18
**Context:** TunePort Chrome Extension

## OVERVIEW
The core Chrome extension for TunePort. Handles Spotify auth, YouTube DOM injection, audio downloads, and matching logic.
Built with React (Popup), TypeScript, and Shadcn UI.

## STRUCTURE
```
tuneport-extension/
├── src/
│   ├── background/ # Service worker (downloads, messaging)
│   ├── content/    # Content scripts (DOM injection on YouTube)
│   ├── popup/      # React UI for extension popup
│   ├── services/   # Core business logic (Spotify, Matching, Download)
│   ├── components/ # Shared UI components (shadcn)
│   └── types/      # Shared TypeScript definitions
└── public/         # Manifest, assets
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Auth** | `src/services/SpotifyAuthService.ts` | PKCE flow, token storage |
| **Downloads** | `src/services/DownloadManager.ts` | Orchestrates Lucida/yt-dlp |
| **Matching** | `src/services/MatchingService.ts` | Jaro-Winkler string matching |
| **Messaging** | `src/services/ChromeMessageService.ts` | Typed wrapper for chrome.runtime |
| **UI State** | `src/popup/index.tsx` | Main popup entry point |

## CONVENTIONS
- **Messaging**: Use `ChromeMessageService` for all extension communication. Typesafe.
- **State**: `chrome.storage.local` for persistence. React `useState` for transient UI.
- **Styling**: Tailwind CSS + `shadcn/ui`.
- **Async**: Heavy lifting in `background` or `services`, keep UI thread light.

## ANTI-PATTERNS
- **Direct DOM**: Do not access DOM from popup. Use content scripts + messaging.
- **Blocking**: Do not block the service worker. It terminates frequently.
- **Secrets**: Do not commit client secrets. Use user-provided keys where possible.

## COMMANDS
```bash
npm run dev          # Watch mode
npm run build:chrome # Production build
```
