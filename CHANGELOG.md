# changelog

## unreleased

bridge automation: relay server + spicetify script for local file playlist adds.

### changes

- **bridge relay**: added websocket relay and spicetify bridge script.
- **bridge settings**: new settings section for token, relay url, and enable toggle.

## v4.1.0

**release date:** 2026-01-16

major architecture change: bring your own key (byok).

### changes

- **byok architecture**: removed embedded api keys. users must now provide their own spotify client id.
- **security**: enhanced security by removing shared credentials from the codebase.

## v3.0.8

**release date:** 2026-01-14

advanced configuration for matching logic.

### changes

- **configurable matching**: added a slider in advanced settings to adjust the matching confidence threshold (0.5 - 1.0). useful for fine-tuning false positives vs. missing matches. default is 0.7.

---

## v3.0.7

**release date:** 2026-01-14

stricter matching to prevent false positives.

### changes

- **matching algorithm**: increased confidence threshold for auto-adding tracks (0.5 -> 0.7). this prevents adding incorrect covers or remixes when the artist doesn't match.

---

## v3.0.6

**release date:** 2026-01-14

documentation link fixes.

### changes

- **docs**: updated self-hosting guide link to point to the correct domain (`tuneport.micr.dev`).

---

## v3.0.5

**release date:** 2026-01-14

improved metadata, smarter filenames, and flexible playlist sync.

### changes

- **metadata**: downloads now include full id3 metadata (artist, title, album art) embedded in the file.
- **filenames**: fixed "artist - artist - title" duplication issue in downloaded files.
- **smart sync**: if a track isn't found on spotify but download is enabled, it now downloads the local file instead of failing.
- **debug console**: hidden by default in activity tab; added toggle in settings > advanced.

---

## v3.0.4

**release date:** 2026-01-14

ui improvements for download provider selection and filename fixes.

### changes

- **filename fix**: forced downloads to use consistent "artist - title" format instead of server-generated hashes.
- **settings ui**: simplified provider selection (yt-dlp default vs cobalt), added self-host tooltip, and hid api token field for default instance.

---

## v3.0.2

**release date:** 2026-01-14

fixed yt-dlp authentication for default instance. downloads now work out of the box.

### changes

- **yt-dlp auth**: added default api token for the bundled yt-dlp instance. no configuration required.
- **server fixes**: upgraded yt-dlp service to python 3.12, added deno for js challenge solving, fixed cookie handling.

---

## v3.0.1

**release date:** 2026-01-14

default download provider is now yt-dlp (self-hosted). chrome build label renamed; firefox build documented.

### changes

- **download provider**: default to yt-dlp, keep cobalt available via settings.
- **build targets**: rename webstore build to chrome (keep alias).

---

## v3.0.0

**release date:** 2026-01-13

download completion now tracks chrome downloads. quality labels cleaned, descriptions restored.

### changes

- **download status**: wait for chrome download completion and mark failures on interruption.
- **quality labels**: opus label simplified and default quality descriptions shown in popup and settings.

---

## v2.2.7

**release date:** 2026-01-11

improved download reliability with self-hosted cobalt instances and authenticated access.

### changes

- **cobalt authentication**: added support for jwt-based authentication to prevent rate limiting and improve stability.
- **self-hosted infrastructure**: switched default download instances to self-hosted servers for better performance.
- **context menu fix**: resolved an issue where the right-click menu might not initialize correctly after an update.

---

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
