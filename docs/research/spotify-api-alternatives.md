# Research: Unofficial Spotify API Alternatives

**Date:** 2026-03-10  
**Status:** Research Complete - Deferred for Future Implementation  
**Related:** Issue #XX - Spotify API 25-user limit concerns

---

## Executive Summary

This document contains comprehensive research on replacing Spotify's official Web API with unofficial alternatives to bypass the 25-user development mode limit.

**Key Finding:** The [SpotAPI](https://github.com/Aran404/SpotAPI) project by Aran404 CAN technically replace the official Spotify Web API for all TunePort operations, but requires significant infrastructure changes (backend service) and accepts Terms of Service violation risks.

**Recommendation:** Deferred for future consideration. Current official API implementation with PKCE is the safest approach for production.

---

## The Problem

Spotify's 2025 API changes impose a 25-user limit on apps in development mode. Extended quota mode now requires:
- Legally registered business entity
- Minimum 250,000 monthly active users
- Commercial viability proof
- Spotify approval (not guaranteed)

This makes the official API unsuitable for indie projects like TunePort.

---

## Solution Found: SpotAPI

### What is SpotAPI?

[SpotAPI](https://github.com/Aran404/SpotAPI) is a Python library that reverse-engineers Spotify's **private Partner API** (GraphQL endpoints) used by the official web player.

- **Stars:** 385
- **Commits:** 162
- **License:** GPL-3.0
- **Last Updated:** December 2025 (active)

### Verified Capabilities

| TunePort Feature | SpotAPI Method | Status |
|------------------|----------------|---------|
| Search tracks | `query_songs()`, `paginate_songs()` | ✅ Working |
| Create playlists | `create_playlist()` | ✅ Working |
| Add tracks to playlist | `add_song_to_playlist()` | ✅ Working |
| List user's playlists | `get_library()` | ✅ Working |
| Remove tracks | `remove_song_from_playlist()` | ✅ Working |
| Get track info | `get_track_info()` | ✅ Working |

### How It Works

```python
# Uses Spotify's private GraphQL API
url = "https://api-partner.spotify.com/pathfinder/v1/query"
payload = {
    "variables": {
        "uris": ["spotify:track:TRACK_ID"],
        "playlistUri": "spotify:playlist:PLAYLIST_ID",
        "newPosition": {"moveType": "BOTTOM_OF_PLAYLIST"},
    },
    "operationName": "addToPlaylist",
    # GraphQL persisted query hash
}
```

### Authentication Method

SpotAPI uses **email/password login** (NOT OAuth):

```python
from spotapi import Login, Config
from spotapi.solvers import Capsolver

# Requires CAPTCHA solving service
cfg = Config(solver=Capsolver("API_KEY"))
login = Login(cfg, "password", email="user@email.com")
login.login()  # Solves reCAPTCHA v3, submits credentials
```

**Requirements:**
- User's Spotify email and password
- CAPTCHA solving service (paid, ~$3-5 per 1000 solves)
- Session cookie persistence

---

## Why Other Projects Don't Work

### librespot / go-librespot

**What they do:** Implement Spotify Connect protocol (like a smart speaker)

**What they CANNOT do:**
- ❌ Create playlists
- ❌ Add tracks to playlists
- ❌ Search catalog
- ❌ Manage library

**Why:** Connect protocol is playback-control only. It's designed for speakers/devices, not playlist management.

### spotify-zeroconf

**What it does:** Authenticate via Spotify Connect device discovery

**Limitations:**
- Only obtains authentication token
- Still requires client_secret for code exchange
- No playlist management endpoints
- Inactive project (30 stars, no releases)

---

## Implementation Requirements

### Required Architecture

SpotAPI is Python-based. Browser extensions cannot run Python directly.

```
┌─────────────────────────────────────────────────┐
│  TunePort Extension (JavaScript)               │
│  - UI Components                                │
│  - YouTube detection                            │
│  - Communicates with backend API                │
└──────────────┬──────────────────────────────────┘
               │ HTTP/WebSocket
               ▼
┌─────────────────────────────────────────────────┐
│  Backend Server (Python)                        │
│  - SpotAPI integration                          │
│  - CAPTCHA solving (Capsolver/Anti-Captcha)     │
│  - Session/cookie management                    │
│  - User credential storage (encrypted)          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  Spotify Private API                            │
│  - api-partner.spotify.com                      │
│  - GraphQL endpoints                            │
└─────────────────────────────────────────────────┘
```

### Why Browser Extension Can't Run It Directly

1. **Language:** SpotAPI is Python, extensions are JavaScript
2. **CAPTCHA:** Requires server-side API calls to solving services
3. **CORS:** Private API endpoints block cross-origin requests from extensions
4. **TLS Fingerprinting:** SpotAPI uses specific TLS signatures to avoid detection (hard in JS)

### Alternative: Port to JavaScript

**Feasibility:** Possible but extremely difficult

**Challenges:**
- Replicate GraphQL client with exact headers/fingerprints
- Handle CAPTCHA solving in browser context
- Manage CORS restrictions
- Maintain as Spotify updates their API

**Effort Estimate:** 6+ months full-time

---

## Risk Assessment

| Risk | Level | Impact |
|------|-------|--------|
| **ToS Violation** | HIGH | Account suspension, legal action |
| **API Changes** | HIGH | Will break when Spotify updates internals |
| **CAPTCHA Costs** | MEDIUM | Ongoing operational expense |
| **Rate Limiting** | UNKNOWN | No documented limits |
| **Security** | MEDIUM | Storing user credentials/passwords |

---

## Cost Analysis

### Official API Approach
- **Cost:** Free
- **Limit:** 25 users (or 250K MAU requirement)
- **Maintenance:** Low

### SpotAPI Approach
- **CAPTCHA Solving:** ~$3-5 per 1000 logins
- **Backend Hosting:** $5-50/month (depending on users)
- **Development:** High (backend service needed)
- **Maintenance:** High (chasing Spotify API changes)

---

## Decision

### Status: DEFERRED

**Rationale:**
1. Current PKCE implementation is correct and stable
2. 25-user limit may be acceptable for initial release
3. ToS violation risks outweigh benefits at this stage
4. Infrastructure requirements (backend, CAPTCHA) add complexity
5. Official API may relax restrictions in future

### Future Triggers for Reconsideration

- [ ] Spotify extends 25-user limit to paid tier
- [ ] App reaches 25 active users and needs to scale
- [ ] Official API endpoints are deprecated
- [ ] SpotAPI gains significant adoption and stability
- [ ] Resources available for backend infrastructure

---

## Resources

### Source Code
- **SpotAPI:** https://github.com/Aran404/SpotAPI
- **Key File:** `spotapi/song.py` (add_song_to_playlist method)
- **Key File:** `spotapi/login.py` (authentication flow)

### Documentation
- **Spotify API Changes:** https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access
- **State of API Report 2025:** https://spotify.leemartin.com/

### CAPTCHA Services
- **Capsolver:** https://www.capsolver.com/
- **Anti-Captcha:** https://anti-captcha.com/

---

## Related Research

- Reddit r/spotifyapi discussions on API changes
- GitHub Issues in librespot-org/librespot
- Community reports of unofficial API breakage (2024-2025)

---

**Document Maintained By:** Development Team  
**Next Review:** When app approaches 25 users OR Spotify announces API changes
