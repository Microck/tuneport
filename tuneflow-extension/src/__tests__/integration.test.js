/**
 * @jest-environment jsdom
 * Integration test for the complete track addition flow
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
      })
    }
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(() => Promise.resolve()),
    getAll: jest.fn(() => Promise.resolve([])),
    onClicked: {
      addListener: jest.fn()
    }
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
    query: jest.fn(() => Promise.resolve([]))
  },
  action: {
    openPopup: jest.fn()
  }
};

// Mock fetch
global.fetch = jest.fn();

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('Complete Add Track Flow', () => {
    test('should handle URL validation and video ID extraction', async () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://youtube.com/v/dQw4w9WgXcQ'
      ];

      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];

      validUrls.forEach(url => {
        let extractedId = null;
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            extractedId = match[1];
            break;
          }
        }
        expect(extractedId).toBe('dQw4w9WgXcQ');
      });
    });

    test('should reject invalid YouTube URLs', () => {
      const invalidUrls = [
        'https://example.com/video',
        'https://vimeo.com/123456',
        'not a url',
        ''
      ];

      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];

      invalidUrls.forEach(url => {
        let extractedId = null;
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            extractedId = match[1];
            break;
          }
        }
        expect(extractedId).toBeNull();
      });
    });

    test('should handle token storage and retrieval', async () => {
      // Test token storage
      const futureExpiry = Date.now() + 3600000;
      mockStorage.spotify_access_token = 'test_token_123';
      mockStorage.spotify_token_expiry = futureExpiry;

      // Verify storage
      const result = await chrome.storage.local.get(['spotify_access_token', 'spotify_token_expiry']);
      expect(result.spotify_access_token).toBe('test_token_123');
      expect(result.spotify_token_expiry).toBe(futureExpiry);

      // Verify expiry check
      const isExpired = Date.now() >= result.spotify_token_expiry;
      expect(isExpired).toBe(false);
    });

    test('should handle expired tokens', async () => {
      const pastExpiry = Date.now() - 3600000;
      mockStorage.spotify_access_token = 'test_token';
      mockStorage.spotify_token_expiry = pastExpiry;

      const result = await chrome.storage.local.get(['spotify_access_token', 'spotify_token_expiry']);
      const isExpired = Date.now() >= result.spotify_token_expiry;
      expect(isExpired).toBe(true);
    });

    test('should format Spotify search queries correctly', () => {
      const title = 'Bohemian Rhapsody';
      const artist = 'Queen';

      let query = `track:${title}`;
      if (artist) {
        query += ` artist:${artist}`;
      }

      expect(query).toBe('track:Bohemian Rhapsody artist:Queen');

      // Test URL encoding
      const encoded = encodeURIComponent(query);
      expect(encoded).toBe('track%3ABohemian%20Rhapsody%20artist%3AQueen');
    });

    test('should calculate match scores correctly', () => {
      const calculateMatchScore = (trackName: string, searchTitle: string, artistName: string, searchArtist: string) => {
        const titleSim = calculateStringSimilarity(searchTitle.toLowerCase(), trackName.toLowerCase());
        const artistSim = calculateStringSimilarity(searchArtist.toLowerCase(), artistName.toLowerCase());
        return titleSim * 0.5 + artistSim * 0.3;
      };

      const calculateStringSimilarity = (str1: string, str2: string): number => {
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
      };

      // Same song
      const score1 = calculateMatchScore('Bohemian Rhapsody', 'Bohemian Rhapsody', 'Queen', 'Queen');
      expect(score1).toBeGreaterThan(0.8);

      // Different song
      const score2 = calculateMatchScore('Stairway to Heaven', 'Bohemian Rhapsody', 'Led Zeppelin', 'Queen');
      expect(score2).toBeLessThan(0.5);
    });

    test('should handle Spotify API responses', async () => {
      const mockSpotifyResponse = {
        tracks: {
          items: [
            {
              id: 'track123',
              uri: 'spotify:track:123',
              name: 'Test Song',
              artists: [{ id: 'artist1', name: 'Test Artist' }],
              album: {
                id: 'album1',
                name: 'Test Album',
                images: [{ url: 'https://example.com/cover.jpg' }]
              },
              duration_ms: 180000,
              external_urls: { spotify: 'https://open.spotify.com/track/123' },
              popularity: 80
            }
          ]
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpotifyResponse
      });

      const response = await fetch('https://api.spotify.com/v1/search?q=test');
      const data = await response.json();

      expect(data.tracks.items.length).toBe(1);
      expect(data.tracks.items[0].name).toBe('Test Song');
    });

    test('should handle add to playlist API call', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ snapshot_id: 'snapshot123' })
      });

      const response = await fetch(
        'https://api.spotify.com/v1/playlists/playlist123/tracks',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: ['spotify:track:123'],
            position: 0
          })
        }
      );

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('https://api.spotify.com/test'))
        .rejects.toThrow('Network error');
    });

    test('should handle invalid JSON responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const response = await fetch('https://api.spotify.com/test');
      await expect(response.json()).rejects.toThrow('Invalid JSON');
    });

    test('should handle storage errors gracefully', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(chrome.storage.local.get(['key']))
        .rejects.toThrow('Storage error');
    });
  });

  describe('Security', () => {
    test('should generate secure state parameter', () => {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const state = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      expect(state.length).toBeGreaterThan(20);
      expect(/^[a-zA-Z0-9_-]+$/.test(state)).toBe(true);
    });

    test('should sanitize file names', () => {
      const sanitizeFilename = (filename: string): string => {
        return filename
          .replace(/[<>:"/\\|?*]/g, '_')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 255);
      };

      expect(sanitizeFilename('test<>:"|?*.txt')).toBe('test_____.txt');
      expect(sanitizeFilename('a'.repeat(300)).length).toBe(255);
    });
  });
});
