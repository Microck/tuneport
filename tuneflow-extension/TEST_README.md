# TuneFlow Test Suite

This document describes the test coverage for the TuneFlow browser extension.

## Test Structure

```
src/
├── background/
│   └── __tests__/
│       └── index.test.js     # Background service worker tests
├── content/
│   └── __tests__/
│       └── index.test.js     # Content script tests
├── services/
│   └── __tests__/
│       ├── YouTubeMetadataService.test.ts    # YouTube metadata extraction
│       ├── SpotifySearchService.test.ts      # Spotify search & matching
│       ├── ChromeMessageService.test.ts      # Chrome API messaging
│       ├── SpotifyAuthService.test.ts        # Spotify OAuth flow
│       └── DownloadManager.test.ts           # Download utilities
└── types/
    └── __tests__/
        └── index.test.ts      # Type definitions tests
```

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/services/__tests__/YouTubeMetadataService.test.ts
```

## Test Coverage

### YouTubeMetadataService
- Video ID extraction from various URL formats
- YouTube URL validation
- Duration formatting

### SpotifySearchService
- String similarity calculations
- Match score calculations
- Best match finding algorithm
- Duration formatting

### ChromeMessageService
- Message sending and receiving
- Tab queries
- Storage operations
- Notification creation
- Badge text updates

### SpotifyAuthService
- Authorization URL generation
- Token retrieval and caching
- Connection checking
- Disconnect/logout handling

### DownloadManager
- YouTube metadata extraction
- URL validation
- Thumbnail URL generation
- File size estimation
- Filename sanitization
- Duration formatting

### BackgroundService
- Video ID extraction
- String similarity calculations
- Match score calculations
- Best match finding

### ContentScript
- Video ID extraction
- Metadata extraction
- Page change detection
- Message handling

### Type Definitions
- Interface validation
- Enum value validation
- Configuration constants

## Mock Configuration

Tests use Jest with jsdom environment. Chrome APIs are mocked using global mocks in setup files. Fetch is mocked to simulate API responses.

## Best Practices

1. Each service should have comprehensive unit tests
2. Tests should be isolated and not depend on external APIs
3. Use meaningful test descriptions
4. Test both success and failure paths
5. Maintain high code coverage for critical paths
