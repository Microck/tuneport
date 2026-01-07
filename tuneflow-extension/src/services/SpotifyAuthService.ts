import { ChromeMessageService } from './ChromeMessageService';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export class SpotifyAuthService {
  private static readonly SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'your-spotify-client-id';
  private static readonly SPOTIFY_REDIRECT_URI = chrome.runtime.getURL('src/popup/auth-callback.html');
  private static readonly SCOPES = [
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-private',
    'user-read-email'
  ].join(' ');

  /**
   * Generate PKCE code verifier and challenge
   */
  private static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate SHA256 hash of code verifier
   */
  private static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Get authorization URL with PKCE
   */
  static async getAuthUrl(): Promise<string> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    // Store verifier and state for later use
    await ChromeMessageService.setStorage({
      'spotify_code_verifier': codeVerifier,
      'spotify_auth_state': state,
      'spotify_auth_timestamp': Date.now()
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.SPOTIFY_CLIENT_ID,
      scope: this.SCOPES,
      redirect_uri: this.SPOTIFY_REDIRECT_URI,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
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
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForToken(code: string, state: string): Promise<SpotifyTokenResponse> {
    try {
      // Verify state
      const stored = await ChromeMessageService.getStorage(['spotify_auth_state', 'spotify_code_verifier']);
      
      if (!stored.spotify_auth_state || stored.spotify_auth_state !== state) {
        throw new Error('Invalid state parameter');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.SPOTIFY_REDIRECT_URI,
          code_verifier: stored.spotify_code_verifier
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
      }

      const tokens = await response.json();
      
      // Store tokens
      await this.storeTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<SpotifyTokenResponse> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.SPOTIFY_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      
      // Store updated tokens
      await this.storeTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Store authentication tokens
   */
  private static async storeTokens(tokens: SpotifyTokenResponse): Promise<void> {
    const expiryTime = Date.now() + (tokens.expires_in * 1000);
    
    await ChromeMessageService.setStorage({
      'spotify_access_token': tokens.access_token,
      'spotify_refresh_token': tokens.refresh_token,
      'spotify_token_expiry': expiryTime,
      'spotify_token_type': tokens.token_type,
      'spotify_scopes': tokens.scope
    });

    // Send token to background script
    await ChromeMessageService.sendMessage({
      type: 'SET_SPOTIFY_TOKEN',
      token: tokens.access_token
    });
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const stored = await ChromeMessageService.getStorage([
        'spotify_access_token',
        'spotify_token_expiry',
        'spotify_refresh_token'
      ]);

      if (!stored.spotify_access_token) {
        return null;
      }

      // Check if token is expired
      if (stored.spotify_token_expiry && Date.now() >= stored.spotify_token_expiry) {
        if (stored.spotify_refresh_token) {
          // Try to refresh token
          try {
            const refreshedTokens = await this.refreshToken(stored.spotify_refresh_token);
            return refreshedTokens.access_token;
          } catch (error) {
            console.error('Failed to refresh token:', error);
            await this.disconnect();
            return null;
          }
        } else {
          await this.disconnect();
          return null;
        }
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
   * Get user profile
   */
  static async getUserProfile(): Promise<SpotifyUser | null> {
    try {
      const token = await this.getAccessToken();
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.statusText}`);
      }

      const user = await response.json();
      return {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        images: user.images
      };
    } catch (error) {
      console.error('Get user profile failed:', error);
      return null;
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
        'spotify_token_type',
        'spotify_scopes',
        'spotify_code_verifier',
        'spotify_auth_state',
        'spotify_auth_timestamp'
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

  /**
   * Get scopes granted by user
   */
  static async getGrantedScopes(): Promise<string[]> {
    try {
      const stored = await ChromeMessageService.getStorage('spotify_scopes');
      return stored.spotify_scopes ? stored.spotify_scopes.split(' ') : [];
    } catch (error) {
      console.error('Failed to get granted scopes:', error);
      return [];
    }
  }

  /**
   * Check if specific scope is granted
   */
  static async hasScope(scope: string): Promise<boolean> {
    const scopes = await this.getGrantedScopes();
    return scopes.includes(scope);
  }
}