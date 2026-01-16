import { ChromeMessageService } from './ChromeMessageService';

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export class SpotifyAuthService {
  private static readonly SPOTIFY_CLIENT_ID = '4aa180089db445ce8d6f762329a76f7e';

  private static readonly SCOPES = [
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-private',
    'user-read-email'
  ].join(' ');

  private static getRedirectUri(): string {
    return chrome.runtime.getURL('popup/auth-callback.html');
  }

  static async getAuthUrl(clientId?: string): Promise<string> {
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const redirectUri = this.getRedirectUri();
    const effectiveClientId = clientId || this.SPOTIFY_CLIENT_ID;

    await ChromeMessageService.setStorage({ 
      'spotify_auth_state': state,
      'spotify_code_verifier': codeVerifier,
      'spotify_client_id': effectiveClientId
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: effectiveClientId,
      scope: this.SCOPES,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    return `https://accounts.spotify.com/authorize?${params.toString().replace(/\+/g, '%20')}`;
  }

  static async connect(clientId?: string): Promise<void> {
    const authUrl = await this.getAuthUrl(clientId);
    chrome.tabs.create({ url: authUrl });
  }

  private static generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      const stored = await ChromeMessageService.getStorage([
        'spotify_access_token',
        'spotify_token_expiry'
      ]);

      if (!stored.spotify_access_token) {
        return null;
      }

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

  static async disconnect(): Promise<void> {
    try {
      await ChromeMessageService.removeStorage([
        'spotify_access_token',
        'spotify_refresh_token',
        'spotify_token_expiry',
        'spotify_auth_state'
      ]);

      await ChromeMessageService.sendMessage({
        type: 'SET_SPOTIFY_TOKEN',
        token: null
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }
}
