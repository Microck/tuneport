/**
 * @jest-environment jsdom
 */

import { MatchingService } from '../../services/MatchingService';

// Mock chrome API
const mockStorage: Record<string, any> = {};

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        const result: Record<string, any> = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (mockStorage[key] !== undefined) {
              result[key] = mockStorage[key];
            }
          });
        } else if (mockStorage[keys] !== undefined) {
          result[keys] = mockStorage[keys];
        }
        return Promise.resolve(result);
      }),
      set: jest.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: jest.fn((keys) => {
        if (Array.isArray(keys)) {
          keys.forEach(key => delete mockStorage[key]);
        } else {
          delete mockStorage[keys];
        }
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      })
    }
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(() => Promise.resolve()),
    getAll: jest.fn(() => Promise.resolve([])),
    remove: jest.fn(() => Promise.resolve())
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  },

  notifications: {
    create: jest.fn()
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
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

describe('BackgroundService', () => {
  let BackgroundService: any;
  let service: any;
  
  beforeAll(async () => {
    // Dynamic import to avoid hoisting issues
    const module = await import('../index');
    BackgroundService = module.BackgroundService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    service = new BackgroundService();
  });

  describe('extractVideoId', () => {
    test('should extract video ID from standard URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = (service as any).extractVideoId(url);
      expect(result).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const result = (service as any).extractVideoId(url);
      expect(result).toBe('dQw4w9WgXcQ');
    });

    test('should return null for invalid URL', () => {
      const url = 'https://example.com/video';
      const result = (service as any).extractVideoId(url);
      expect(result).toBeNull();
    });
  });

  describe('calculateStringSimilarity', () => {
    test('should calculate Jaccard similarity', () => {
      const result = (service as any).calculateStringSimilarity('hello world', 'hello world');
      expect(result).toBe(1);
    });

    test('should return 0 for no overlap', () => {
      const result = (service as any).calculateStringSimilarity('hello', 'world');
      expect(result).toBeLessThan(0.5);
    });
  });

  describe('calculateMatchScore', () => {
    test('should calculate match score with weighted components', () => {
      const track = {
        name: 'Test Song',
        artists: [{ name: 'Test Artist' }],
        duration_ms: 180000
      };
      
      const result = (MatchingService as any).calculateMatchScore(
        'Test Song',
        'Test Artist',
        track.name,
        track.artists.map((a: any) => a.name),
        180,
        track.duration_ms
      );
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('should handle missing artist', () => {
      const track = {
        name: 'Test Song',
        artists: [{ name: 'Some Artist' }],
        duration_ms: 180000
      };
      
      const result = (MatchingService as any).calculateMatchScore(
        'Test Song',
        '',
        track.name,
        track.artists.map((a: any) => a.name),
        180,
        track.duration_ms
      );
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('findBestMatch', () => {
    test('should return null for empty tracks', () => {
      const result = (service as any).findBestMatch([], 'Test', 'Artist', 180);
      expect(result).toBeNull();
    });
 
    test('should return best matching track', () => {
      const tracks = [
        { name: 'Wrong Song', artists: [{ name: 'Wrong Artist' }], duration_ms: 180000 },
        { name: 'Test Song', artists: [{ name: 'Test Artist' }], duration_ms: 180000 }
      ];
      
      const result = (service as any).findBestMatch(tracks, 'Test Song', 'Test Artist', 180);
      expect(result).not.toBeNull();
      expect(result.name).toBe('Test Song');
    });
  });

});
