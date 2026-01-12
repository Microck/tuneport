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

import { YouTubeMetadataService } from '../YouTubeMetadataService';

describe('YouTubeMetadataService', () => {
  describe('extractVideoId', () => {
    test('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(YouTubeMetadataService.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from youtu.be URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(YouTubeMetadataService.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(YouTubeMetadataService.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from v URL', () => {
      const url = 'https://youtube.com/v/dQw4w9WgXcQ';
      expect(YouTubeMetadataService.extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should return null for invalid URL', () => {
      const url = 'https://example.com/video';
      expect(YouTubeMetadataService.extractVideoId(url)).toBeNull();
    });
  });

  describe('isValidYouTubeUrl', () => {
    test('should return true for valid YouTube URLs', () => {
      expect(YouTubeMetadataService.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(YouTubeMetadataService.isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
      expect(YouTubeMetadataService.isValidYouTubeUrl('https://example.com/video')).toBe(false);
    });
  });

  describe('formatDuration', () => {
    test('should format seconds to MM:SS', () => {
      expect(YouTubeMetadataService.formatDuration(65)).toBe('1:05');
      expect(YouTubeMetadataService.formatDuration(125)).toBe('2:05');
      expect(YouTubeMetadataService.formatDuration(3661)).toBe('61:01');
    });
  });
});
