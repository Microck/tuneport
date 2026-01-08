import { SpotifyAuthService } from './SpotifyAuthService';

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  popularity: number;
}

interface SearchResults {
  tracks: SpotifyTrack[];
  exactMatch: SpotifyTrack | null;
  confidence: 'high' | 'medium' | 'low';
}

export class SpotifySearchService {
  /**
   * Search for a track on Spotify based on YouTube metadata
   */
  static async searchTrack(
    title: string,
    artist?: string,
    options: {
      duration?: number; // in seconds, for matching
      limit?: number;
    } = {}
  ): Promise<SearchResults> {
    try {
      const token = await SpotifyAuthService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated with Spotify');
      }

      const { limit = 10, duration } = options;

      // Build search query
      let query = `track:${title}`;
      if (artist) {
        query += ` artist:${artist}`;
      }

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const tracks: SpotifyTrack[] = data.tracks?.items || [];

      // Find best match
      const exactMatch = this.findBestMatch(tracks, title, artist, duration);
      const confidence = this.calculateConfidence(exactMatch, tracks, title, artist, duration);

      return {
        tracks,
        exactMatch,
        confidence
      };

    } catch (error) {
      console.error('Spotify search failed:', error);
      throw error;
    }
  }

  /**
   * Find the best matching track from search results
   */
  private static findBestMatch(
    tracks: SpotifyTrack[],
    title: string,
    artist?: string,
    duration?: number
  ): SpotifyTrack | null {
    if (tracks.length === 0) {
      return null;
    }

    // Score each track based on similarity
    const scoredTracks = tracks.map(track => ({
      track,
      score: this.calculateMatchScore(track, title, artist, duration)
    }));

    // Sort by score (highest first)
    scoredTracks.sort((a, b) => b.score - a.score);

    // Return the top match if it has a decent score
    const topMatch = scoredTracks[0];
    return topMatch.score > 0.3 ? topMatch.track : null;
  }

  /**
   * Calculate a match score (0-1) for a track
   */
  private static calculateMatchScore(
    track: SpotifyTrack,
    title: string,
    artist?: string,
    duration?: number
  ): number {
    let score = 0;

    // Title similarity (weighted heavily)
    const titleSimilarity = this.calculateStringSimilarity(
      title.toLowerCase(),
      track.name.toLowerCase()
    );
    score += titleSimilarity * 0.5;

    // Artist similarity
    if (artist) {
      const artistNames = track.artists.map(a => a.name.toLowerCase()).join(' ');
      const artistSimilarity = this.calculateStringSimilarity(
        artist.toLowerCase(),
        artistNames
      );
      score += artistSimilarity * 0.3;
    }

    // Duration similarity (if provided)
    if (duration) {
      const durationDiff = Math.abs(duration - track.duration_ms / 1000);
      const durationScore = Math.max(0, 1 - durationDiff / 60); // Penalty increases with difference
      score += durationScore * 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    // Remove common words and punctuation
    const normalize = (s: string) => {
      return s
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\b(the|a|an|and|or|but|ft|feat|feat\.|featuring)\b/g, '')
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0);
    };

    const set1 = new Set(normalize(str1));
    const set2 = new Set(normalize(str2));

    if (set1.size === 0 && set2.size === 0) {
      return 1;
    }

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate overall confidence in search results
   */
  private static calculateConfidence(
    exactMatch: SpotifyTrack | null,
    tracks: SpotifyTrack[],
    title: string,
    artist?: string,
    duration?: number
  ): 'high' | 'medium' | 'low' {
    if (!exactMatch) {
      return 'low';
    }

    const score = this.calculateMatchScore(exactMatch, title, artist, duration);

    if (score > 0.7) {
      return 'high';
    } else if (score > 0.4) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Add a track to a Spotify playlist
   */
  static async addTrackToPlaylist(
    playlistId: string,
    trackUri: string
  ): Promise<void> {
    try {
      const token = await SpotifyAuthService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated with Spotify');
      }

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [trackUri],
            position: 0 // Add to the beginning
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to add track: ${error.error?.message || response.statusText}`);
      }

      console.log('Track added to playlist successfully');

    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      throw error;
    }
  }

  /**
   * Get user's playlists
   */
  static async getPlaylists(): Promise<any[]> {
    try {
      const token = await SpotifyAuthService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated with Spotify');
      }

      const response = await fetch(
        'https://api.spotify.com/v1/me/playlists?limit=50',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];

    } catch (error) {
      console.error('Failed to get playlists:', error);
      throw error;
    }
  }

  /**
   * Create a new playlist
   */
  static async createPlaylist(
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<any> {
    try {
      const token = await SpotifyAuthService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated with Spotify');
      }

      // Get user ID
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const user = await userResponse.json();

      // Create playlist
      const response = await fetch(
        `https://api.spotify.com/v1/users/${user.id}/playlists`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description,
            public: isPublic
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create playlist: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  /**
   * Format duration from milliseconds to MM:SS
   */
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
