import { ChromeMessageService } from './ChromeMessageService';

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export class SpotifyAuthService {
  private static readonly SPOTIFY_CLIENT_ID = 'd4f5e8d4e4f5487594f7b4b5b2b5c1e1';
  private static readonly SPOTIFY_REDIRECT_URI = chrome.runtime.getURL('src/popup/auth-callback.html');
  private static readonly SCOPES = [
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-private',
    'user-read-email'
  ].join(' ');

  /**
   * Get authorization URL
   */
  static async getAuthUrl(): Promise<string> {
    const state = this.generateState();

    // Store state for later verification
    await ChromeMessageService.setStorage({
      'spotify_auth_state': state
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.SPOTIFY_CLIENT_ID,
      scope: this.SCOPES,
      redirect_uri: this.SPOTIFY_REDIRECT_URI,
      state: state,
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Generate random state for security
   */
  private static generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const stored = await ChromeMessageService.getStorage([
        'spotify_access_token',
        'spotify_token_expiry'
      ]);

      if (!stored.spotify_access_token) {
        return null;
      }

      // Check if token is expired
      if (stored.spotify_token_expiry && Date.now() >= stored.spotify_token_expiry) {
        await this.disconnect();
        return null;
      }

      return stored.spotify_access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Check if user is connected to Spotify
   */
  static async checkConnection(): Promise<{ connected: boolean; user?: SpotifyUser }> {
    try {
      const token = await this.getAccessToken();
      
      if (!token) {
        return { connected: false };
      }

      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.disconnect();
          return { connected: false };
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const user = await response.json();
      return {
        connected: true,
        user: {
          id: user.id,
          display_name: user.display_name,
          email: user.email,
          images: user.images
        }
      };
    } catch (error) {
      console.error('Connection check failed:', error);
      return { connected: false };
    }
  }

  /**
   * Logout/disconnect from Spotify
   */
  static async disconnect(): Promise<void> {
    try {
      await ChromeMessageService.removeStorage([
        'spotify_access_token',
        'spotify_refresh_token',
        'spotify_token_expiry',
        'spotify_auth_state'
      ]);

      // Notify background script
      await ChromeMessageService.sendMessage({
        type: 'SET_SPOTIFY_TOKEN',
        token: null
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }
}