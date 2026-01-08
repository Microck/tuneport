/**
 * @jest-environment jsdom
 */

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
    getAll: jest.fn(),
    remove: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  },
  notifications: {
    create: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  action: {
    openPopup: jest.fn()
  }
};

// Mock fetch
global.fetch = jest.fn();

import { SpotifySearchService } from '../services/SpotifySearchService';

describe('SpotifySearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateStringSimilarity', () => {
    test('should return 1 for identical strings', () => {
      const result = (SpotifySearchService as any).calculateStringSimilarity('hello world', 'hello world');
      expect(result).toBe(1);
    });

    test('should return 0 for completely different strings', () => {
      const result = (SpotifySearchService as any).calculateStringSimilarity('hello', 'world');
      expect(result).toBe(0);
    });

    test('should handle partial matches', () => {
      const result = (SpotifySearchService as any).calculateStringSimilarity('hello world', 'hello');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });
  });

  describe('calculateMatchScore', () => {
    test('should calculate match score for track', () => {
      const track = {
        name: 'Test Song',
        artists: [{ name: 'Test Artist' }],
        duration_ms: 180000
      };
      
      const result = (SpotifySearchService as any).calculateMatchScore(track, 'Test Song', 'Test Artist', 180);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('should weight title similarity highest', () => {
      const track1 = { name: 'Different Song', artists: [{ name: 'Test Artist' }], duration_ms: 180000 };
      const track2 = { name: 'Test Song', artists: [{ name: 'Different Artist' }], duration_ms: 180000 };
      
      const result1 = (SpotifySearchService as any).calculateMatchScore(track1, 'Test Song', 'Test Artist', 180);
      const result2 = (SpotifySearchService as any).calculateMatchScore(track2, 'Test Song', 'Test Artist', 180);
      
      expect(result2).toBeGreaterThan(result1);
    });
  });

  describe('findBestMatch', () => {
    test('should return null for empty tracks', () => {
      const result = (SpotifySearchService as any).findBestMatch([], 'Test', 'Artist');
      expect(result).toBeNull();
    });

    test('should return best matching track', () => {
      const tracks = [
        { name: 'Wrong Song', artists: [{ name: 'Wrong Artist' }], duration_ms: 180000 },
        { name: 'Test Song', artists: [{ name: 'Test Artist' }], duration_ms: 180000 }
      ];
      
      const result = (SpotifySearchService as any).findBestMatch(tracks, 'Test Song', 'Test Artist', 180);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Song');
    });

    test('should return null if no track meets threshold', () => {
      const tracks = [
        { name: 'Completely Wrong', artists: [{ name: 'Unknown' }], duration_ms: 60000 }
      ];
      
      const result = (SpotifySearchService as any).findBestMatch(tracks, 'Test Song', 'Test Artist', 180);
      expect(result).toBeNull();
    });
  });

  describe('formatDuration', () => {
    test('should format milliseconds to MM:SS', () => {
      expect(SpotifySearchService.formatDuration(180000)).toBe('3:00');
      expect(SpotifySearchService.formatDuration(90000)).toBe('1:30');
      expect(SpotifySearchService.formatDuration(65000)).toBe('1:05');
    });
  });
});
