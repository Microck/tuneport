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
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve({ success: true })),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  }
};

// Mock fetch
global.fetch = jest.fn();

import { SpotifyAuthService } from '../services/SpotifyAuthService';

describe('SpotifyAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('getAuthUrl', () => {
    test('should generate valid authorization URL', async () => {
      const authUrl = await SpotifyAuthService.getAuthUrl();
      
      expect(authUrl).toContain('https://accounts.spotify.com/authorize');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('state=');
    });

    test('should include required scopes', async () => {
      const authUrl = await SpotifyAuthService.getAuthUrl();
      
      expect(authUrl).toContain('playlist-read-private');
      expect(authUrl).toContain('playlist-modify-private');
      expect(authUrl).toContain('playlist-modify-public');
    });

    test('should store state in storage', async () => {
      await SpotifyAuthService.getAuthUrl();
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
      const setCall = (chrome.storage.local.set as jest.Mock).mock.calls[0][0];
      expect(setCall.spotify_auth_state).toBeDefined();
      expect(setCall.spotify_auth_state.length).toBeGreaterThan(0);
    });
  });

  describe('getAccessToken', () => {
    test('should return null when no token stored', async () => {
      const token = await SpotifyAuthService.getAccessToken();
      expect(token).toBeNull();
    });

    test('should return stored access token', async () => {
      const futureExpiry = Date.now() + 3600000; // 1 hour from now
      mockStorage.spotify_access_token = 'test_token_123';
      mockStorage.spotify_token_expiry = futureExpiry;
      
      const token = await SpotifyAuthService.getAccessToken();
      expect(token).toBe('test_token_123');
    });

    test('should return null when token is expired', async () => {
      const pastExpiry = Date.now() - 3600000; // 1 hour ago
      mockStorage.spotify_access_token = 'test_token_123';
      mockStorage.spotify_token_expiry = pastExpiry;
      
      const token = await SpotifyAuthService.getAccessToken();
      expect(token).toBeNull();
    });

    test('should disconnect and return null when expired', async () => {
      const pastExpiry = Date.now() - 3600000;
      mockStorage.spotify_access_token = 'test_token_123';
      mockStorage.spotify_token_expiry = pastExpiry;
      mockStorage.spotify_refresh_token = 'refresh_token';
      
      await SpotifyAuthService.getAccessToken();
      
      expect(chrome.storage.local.remove).toHaveBeenCalled();
    });
  });

  describe('checkConnection', () => {
    test('should return connected:false when no token', async () => {
      const result = await SpotifyAuthService.checkConnection();
      expect(result.connected).toBe(false);
    });

    test('should return connected:false when token is expired', async () => {
      mockStorage.spotify_access_token = 'test_token';
      mockStorage.spotify_token_expiry = Date.now() - 3600000;
      
      const result = await SpotifyAuthService.checkConnection();
      expect(result.connected).toBe(false);
    });

    test('should return connected:true when API responds OK', async () => {
      const futureExpiry = Date.now() + 3600000;
      mockStorage.spotify_access_token = 'valid_token';
      mockStorage.spotify_token_expiry = futureExpiry;
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          images: []
        })
      });
      
      const result = await SpotifyAuthService.checkConnection();
      expect(result.connected).toBe(true);
      expect(result.user?.id).toBe('user123');
      expect(result.user?.display_name).toBe('Test User');
    });

    test('should return connected:false when API returns 401', async () => {
      mockStorage.spotify_access_token = 'invalid_token';
      mockStorage.spotify_token_expiry = Date.now() + 3600000;
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });
      
      const result = await SpotifyAuthService.checkConnection();
      expect(result.connected).toBe(false);
    });
  });

  describe('disconnect', () => {
    test('should remove all Spotify-related storage keys', async () => {
      mockStorage.spotify_access_token = 'token';
      mockStorage.spotify_refresh_token = 'refresh';
      mockStorage.spotify_token_expiry = Date.now();
      mockStorage.spotify_auth_state = 'state';
      
      await SpotifyAuthService.disconnect();
      
      expect(chrome.storage.local.remove).toHaveBeenCalled();
      const removeCall = (chrome.storage.local.remove as jest.Mock).mock.calls[0][0];
      expect(removeCall).toContain('spotify_access_token');
      expect(removeCall).toContain('spotify_refresh_token');
      expect(removeCall).toContain('spotify_token_expiry');
      expect(removeCall).toContain('spotify_auth_state');
    });

    test('should send message to background script', async () => {
      await SpotifyAuthService.disconnect();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SET_SPOTIFY_TOKEN',
        token: null
      });
    });
  });
});
