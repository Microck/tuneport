# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Music Metadata:**
- Spotify Web API - Search, playlist management, and user library access
  - SDK: REST API via `fetch`
  - Auth: OAuth2 (PKCE) for extension, user-provided Client ID
- YouTube Music API - Fallback metadata retrieval when Spotify match fails

**Audio Extraction:**
- Cobalt API - Primary web-based download provider
- yt-dlp - Advanced extraction engine (used via self-hosted service)
- Lucida - Lossless extraction bridge (Qobuz/Tidal/Deezer)

## Data Storage

**Client-Side Storage:**
- `chrome.storage.local` - Extension settings, auth tokens, and job history
- `localStorage` - Used in Spicetify extension for bridge tokens

**Server-Side Storage:**
- Ephemeral - `yt-dlp-service` stores files temporarily on disk before cleanup

## Authentication & Identity

**Spotify Auth:**
- Implementation: `SpotifyAuthService.ts` using PKCE flow
- Flow: Extension triggers tab -> Spotify Authorize -> Callback to extension
- Identity: Scopes for `playlist-modify`, `user-read-private`, `user-read-email`

**Relay Bridge Auth:**
- Implementation: Token-based WebSocket handshake
- Pattern: User generates 32-char token in extension, pastes into Spicetify settings

## CI/CD & Deployment

**Hosting:**
- Vercel - Website deployment
- GitHub Releases - Extension ZIP distributions (Chrome/Firefox)

**CI Pipeline:**
- GitHub Actions - (Inferred) packaging and release automation

## Environment Configuration

**Development:**
- Required env vars: `YTDLP_TOKEN` for service auth
- Secrets: Managed by user (Spotify Client ID/Secret)

**Production:**
- Secrets management: Extension allows users to "Bring Your Own Key" to avoid central rate limits

## Webhooks & Callbacks

**Incoming:**
- `auth-callback.html` - Static page in extension to receive Spotify OAuth codes

**Outgoing:**
- WebSocket signals - `Relay Server` sending track payloads to `Spicetify`

---

*Integration audit: 2026-01-18*
*Update when adding/removing external services*
