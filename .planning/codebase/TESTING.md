# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Runner:**
- Jest 29.7 - Extension tests
- Node.js native runner - Relay server tests

**Assertion Library:**
- Jest `expect`
- Node.js `node:assert`

**Run Commands:**
```bash
npm test                               # Run all tests (monorepo)
cd tuneport-extension && npm test      # Run extension tests
cd relay-server && npm test            # Run relay tests
```

## Test File Organization

**Location:**
- `__tests__/` - Colocated with services in `tuneport-extension/src/services/`
- `test/` - Separate directory in `relay-server/`

**Naming:**
- `*.test.ts` / `*.test.js`

**Structure:**
```
tuneport-extension/src/services/
  __tests__/
    MatchingService.test.ts
    DownloadManager.test.ts
relay-server/
  test/
    relay.test.js
```

## Test Structure

**Suite Organization:**
```typescript
describe('ServiceName', () => {
  it('should perform expected behavior', async () => {
    // test logic
  });
});
```

**Patterns:**
- Mock-heavy testing for Spotify API interactions
- String-match verification for `MatchingService` logic

## Mocking

**Framework:**
- `jest.mock()` - Extension service mocking
- Manual WebSocket mocks for relay testing

**What to Mock:**
- Chrome Extension APIs (`chrome.storage`, `chrome.runtime`)
- Spotify API network responses
- `yt-dlp` execution environment

## Fixtures and Factories

**Test Data:**
- Mock YouTube URLs
- Sample Spotify Track objects (JSON fixtures)

## Coverage

**Requirements:**
- High focus on `MatchingService` (string distance accuracy)
- Reliability testing for `DownloadManager` fallback logic

---

*Testing analysis: 2026-01-18*
*Update when test patterns change*
