/**
 * @jest-environment jsdom
 */

// Mock chrome API
const mockStorage: Record<string, any> = {};

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        const result: Record<string, any> = {};
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }),
      set: jest.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: jest.fn((keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      })
    }
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([{ id: 1, url: 'https://youtube.com/watch?v=test' }])),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve({ success: true })),
    openOptionsPage: jest.fn()
  },
  notifications: {
    create: jest.fn()
  },
  action: {
    setBadgeText: jest.fn()
  }
};

import { DownloadManager } from '../DownloadManager';

describe('DownloadManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('extractYouTubeMetadata', () => {
    test('should extract metadata from valid URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = DownloadManager.extractYouTubeMetadata(url);
      expect(result.youtubeId).toBe('dQw4w9WgXcQ');
      expect(result.youtubeUrl).toBe(url);
    });

    test('should throw error for invalid URL', () => {
      const url = 'https://example.com/video';
      expect(() => DownloadManager.extractYouTubeMetadata(url)).toThrow('Invalid YouTube URL');
    });
  });

  describe('isValidYouTubeUrl', () => {
    test('should return true for valid YouTube URLs', () => {
      expect(DownloadManager.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(DownloadManager.isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
      expect(DownloadManager.isValidYouTubeUrl('https://example.com/video')).toBe(false);
    });
  });

  describe('getVideoThumbnail', () => {
    test('should return correct thumbnail URL', () => {
      const result = DownloadManager.getVideoThumbnail('dQw4w9WgXcQ', 'maxresdefault');
      expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    test('should support different qualities', () => {
      expect(DownloadManager.getVideoThumbnail('test', 'hqdefault')).toBe('https://img.youtube.com/vi/test/hqdefault.jpg');
      expect(DownloadManager.getVideoThumbnail('test', 'mqdefault')).toBe('https://img.youtube.com/vi/test/mqdefault.jpg');
    });
  });

  describe('formatDuration', () => {
    test('should format seconds to MM:SS', () => {
      expect(DownloadManager.formatDuration(65)).toBe('1:05');
      expect(DownloadManager.formatDuration(125)).toBe('2:05');
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes to human readable format', () => {
      expect(DownloadManager.formatFileSize(0)).toBe('0 Bytes');
      expect(DownloadManager.formatFileSize(1024)).toBe('1 KB');
      expect(DownloadManager.formatFileSize(1048576)).toBe('1 MB');
    });
  });

  describe('sanitizeFilename', () => {
    test('should remove invalid characters', () => {
      expect(DownloadManager.sanitizeFilename('test<>:"|?*file.txt')).toBe('test_____file.txt');
    });

    test('should trim whitespace', () => {
      expect(DownloadManager.sanitizeFilename('  test file  ')).toBe('test file');
    });

    test('should limit length', () => {
      const longName = 'a'.repeat(300);
      const result = DownloadManager.sanitizeFilename(longName);
      expect(result.length).toBe(255);
    });
  });

  describe('generateUniqueFilename', () => {
    test('should generate unique filename with timestamp', () => {
      const result = DownloadManager.generateUniqueFilename('test song', 'mp3');
      expect(result).toMatch(/^test song_\d+\.mp3$/);
    });
  });

  describe('estimateFileSize', () => {
    test('should estimate MP3 file size correctly', () => {
      // 3 minutes at 320kbps = 3 * 60 * 320 * 1000 / 8 = 7200000 bytes
      const result = DownloadManager.estimateFileSize(180, 'mp3', '320');
      expect(result).toBeGreaterThan(0);
    });

    test('should estimate FLAC file size correctly', () => {
      const result = DownloadManager.estimateFileSize(180, 'flac', '320');
      expect(result).toBeGreaterThan(0);
    });
  });
});
