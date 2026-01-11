# changelog

## v2.2.5

**release date:** 2026-01-11

ui polish and improved preset descriptions.

### changes

- **preset descriptions**: quality presets now show detailed descriptions in settings (e.g., "native youtube quality, ~128kbps opus, equivalent to mp3 320kbps").
- **saved indicator**: moved "saved" notification to header to prevent layout shifts.
- **spotify tutorial**: updated wording to clarify that local files is disabled by default and improved step-by-step instructions for adding custom folders.

---

## v2.2.0

**release date:** 2026-01-10

youtube music fallback, custom presets, and download debugging.

### changes

- **youtube music fallback**: when spotify search fails, tries youtube music metadata for better matching. three modes: auto (default), ask (prompts user), never.
- **custom quality presets**: create up to 5 custom download presets. presets now include descriptions visible in settings.
- **spotify local files tutorial**: added collapsible in-app guide explaining how to enable local files scanning in spotify desktop.
- **square thumbnails**: all thumbnails now display as 1:1 center-cropped squares.
- **download debugging**: added comprehensive logging throughout download pipeline for troubleshooting.
- **fallback ui**: activity tab shows confirmation prompt when awaiting user decision on fallback metadata.

---

## v2.1.0

**release date:** 2026-01-10

audio quality overhaul and strict matching for lossless sources.

### changes

- **opus-first audio**: default to youtube's native opus stream (~128kbps) without re-encoding. opus at this bitrate is perceptually equivalent to mp3 320kbps.
- **honest quality labels**: removed misleading "320kbps" claims. now shows actual quality like "opus ~128k".
- **strict lucida matching**: added levenshtein-based validation (85% title / 80% artist threshold) to prevent false positive downloads.
- **technical documentation**: added `docs/report.tex` covering youtube's audio infrastructure, codec analysis, and quality recommendations.
- **ui improvements**: centered sync card text, added download folder info in settings, job step tracking in activity tab.
- **updated cobalt defaults**: changed default instance to `cobalt-api.meowing.de` with alternatives listed.

---

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
