const axios = require('axios');
const crypto = require('crypto');

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE() {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate random code verifier
   */
  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate code challenge from verifier
   */
  generateCodeChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Get Spotify authorization URL
   */
  getAuthUrl(codeChallenge, state) {
    const scope = [
      'playlist-read-private',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-read-private',
      'user-read-email'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scope,
      redirect_uri: this.redirectUri,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, codeVerifier) {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get user profile failed:', error.response?.data || error.message);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Get user playlists
   */
  async getUserPlaylists(accessToken, limit = 50) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          limit: limit,
          offset: 0
        }
      });

      return response.data.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackCount: playlist.tracks.total,
        isPublic: playlist.public,
        owner: playlist.owner.display_name,
        imageUrl: playlist.images[0]?.url || null
      }));

    } catch (error) {
      console.error('Get playlists failed:', error.response?.data || error.message);
      throw new Error('Failed to fetch playlists');
    }
  }

  /**
   * Get playlist tracks
   */
  async getPlaylistTracks(playlistId, accessToken, limit = 100) {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          limit: limit,
          offset: 0
        }
      });

      return response.data.items.map(item => ({
        id: item.track?.id,
        name: item.track?.name,
        artists: item.track?.artists?.map(artist => artist.name).join(', '),
        uri: item.track?.uri,
        duration: item.track?.duration_ms,
        addedAt: item.added_at
      }));

    } catch (error) {
      console.error('Get playlist tracks failed:', error.response?.data || error.message);
      throw new Error('Failed to fetch playlist tracks');
    }
  }

  /**
   * Add tracks to playlist
   */
  async addToPlaylist(playlistId, trackUris, accessToken) {
    try {
      const response = await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        snapshotId: response.data.snapshot_id
      };

    } catch (error) {
      console.error('Add to playlist failed:', error.response?.data || error.message);
      throw new Error('Failed to add tracks to playlist');
    }
  }

  /**
   * Search for tracks
   */
  async searchTracks(query, accessToken, limit = 10) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: query,
          type: 'track',
          limit: limit
        }
      });

      return response.data.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        uri: track.uri,
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        imageUrl: track.album.images[0]?.url
      }));

    } catch (error) {
      console.error('Search tracks failed:', error.response?.data || error.message);
      throw new Error('Failed to search tracks');
    }
  }

  /**
   * Check if local file exists in library
   */
  async checkLocalFileExists(metadata, accessToken) {
    try {
      // Search for the track using metadata
      const searchQuery = `${metadata.artist} ${metadata.title}`;
      const searchResults = await this.searchTracks(searchQuery, accessToken, 5);
      
      // Check if any result matches our metadata
      for (const track of searchResults) {
        if (this.tracksMatch(track, metadata)) {
          return {
            found: true,
            track: track,
            uri: track.uri
          };
        }
      }

      return { found: false };

    } catch (error) {
      console.error('Check local file failed:', error.message);
      return { found: false, error: error.message };
    }
  }

  /**
   * Check if Spotify track matches our metadata
   */
  tracksMatch(spotifyTrack, metadata) {
    const titleMatch = this.normalizeString(spotifyTrack.name) === this.normalizeString(metadata.title);
    const artistMatch = this.normalizeString(spotifyTrack.artists) === this.normalizeString(metadata.artist);
    
    // Allow some tolerance for title matching
    const titleSimilarity = this.calculateSimilarity(
      this.normalizeString(spotifyTrack.name),
      this.normalizeString(metadata.title)
    );
    
    return (titleMatch || titleSimilarity > 0.8) && artistMatch;
  }

  /**
   * Normalize string for comparison
   */
  normalizeString(str) {
    return str.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = {
  spotifyService: new SpotifyService()
};