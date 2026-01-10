# changelog

## v2.0.0

**release date:** 2026-01-10

tuneport v2.0.0 is a complete rewrite and rebrand of the project (formerly tuneflow). it transitions to a fully client-side architecture and introduces high-quality audio downloading.

### ✨ features

- **instant sync**: right-click youtube videos to add them directly to spotify playlists.
- **dual pipeline**: simultaneously downloads audio while syncing.
- **lossless support**: added experimental support for lucida (qobuz/tidal/deezer) sources.
- **youtube fallback**: reliable mp3 downloads via cobalt.tools when lossless isn't available.
- **smart matching**: implemented jaro-winkler fuzzy matching for cleaner artist/title detection.
- **ui overhaul**: complete redesign of the popup and settings page with tailwind/shadcn.
- **privacy**: removed backend requirement; all logic now runs in the browser.

### 🔧 fixes & improvements

- **branding**: renamed project to "tuneport" to avoid conflicts.
- **security**: implemented pkce flow for spotify oauth.
- **performance**: optimized content script observers for lower memory usage.
- **cleanup**: removed legacy backend code and unused assets.

### 📦 build & ci

- added github actions for automated linting and testing.
- added auto-release workflow for building webstore (restricted) and github (unlocked) versions.
