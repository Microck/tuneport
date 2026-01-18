# Codebase Concerns

**Analysis Date:** 2026-01-18

## Tech Debt

**Monolithic Build Script:**
- Issue: `tuneport-extension/scripts/build.js` handles too many responsibilities (Chrome vs Firefox vs GitHub)
- Fix: Break into smaller, task-specific modules

**Manual Token Management:**
- Issue: Bridge mode requires manual copy-pasting of tokens between extension and Spotify
- Impact: Friction for non-technical users
- Fix approach: Implement auto-handshake if possible

## Known Bugs

**Fuzzy Matching False Positives:**
- Symptoms: Occasional matching of wrong tracks for very short titles
- Root cause: Jaro-Winkler distance alone can be too aggressive on short strings

## Security Considerations

**API Key Exposure:**
- Risk: Users providing own keys might accidentally share them in logs
- Current mitigation: Basic sanitization
- Recommendations: Implement stricter log scrubbing

**Local Relay Access:**
- Risk: Unauthorized local apps connecting to `relay-server`
- Mitigation: Token-based WebSocket handshake

## Performance Bottlenecks

**Large Playlist Sync:**
- Problem: Syncing 100+ tracks sequentially can be slow
- Cause: Serial matching/adding to respect Spotify rate limits

## Fragile Areas

**YouTube DOM Selectors:**
- File: `tuneport-extension/src/content/`
- Why fragile: YouTube frequently changes CSS classes/IDs
- Safe modification: Use robust data attributes or structural selectors where possible

## Test Coverage Gaps

**Relay Bridge Integration:**
- What's not tested: End-to-end flow from Extension -> Relay -> Spicetify
- Difficulty: Requires mocked browser environment and local WebSocket infrastructure

---

*Concerns audit: 2026-01-18*
*Update as issues are fixed or new ones discovered*
