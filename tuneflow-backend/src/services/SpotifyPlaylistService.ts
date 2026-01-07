/**
 * TuneFlow Spotify Service
 * TypeScript function to handle the Playlist addition workflow
 */

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: string;
  duration: number;
}

interface AddToPlaylistOptions {
  playlistId: string;
  trackUri: string;
  accessToken: string;
  metadata: {
    title: string;
    artist: string;
    duration: number;
  };
}

interface PlaylistAddResult {
  success: boolean;
  trackAdded?: SpotifyTrack;
  error?: string;
  spotifyTrack?: SpotifyTrack;
}

export class SpotifyPlaylistService {
  private static readonly SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
  private static readonly LOCAL_FILE_FOLDER = 'TuneFlow Downloads';

  /**
   * Main function to add track to Spotify playlist after local file download
   * This handles the entire workflow: local file detection -> playlist addition
   */
  static async addTrackToPlaylist(options: AddToPlaylistOptions): Promise<PlaylistAddResult> {
    const { playlistId, trackUri, accessToken, metadata } = options;

    try {
      console.log(`Adding track to playlist ${playlistId}: ${metadata.title} by ${metadata.artist}`);

      // Step 1: Wait for Spotify to index the local file (with retry logic)
      const indexedTrack = await this.waitForLocalFileIndexing(metadata, accessToken);
      
      if (!indexedTrack) {
        return {
          success: false,
          error: 'Local file not found in Spotify library after waiting period'
        };
      }

      // Step 2: Add the indexed track to the playlist
      const addResult = await this.addIndexedTrackToPlaylist(playlistId, indexedTrack.uri, accessToken);

      if (addResult.success) {
        console.log(`Successfully added track to playlist: ${metadata.title}`);
        return {
          success: true,
          trackAdded: indexedTrack,
          spotifyTrack: indexedTrack
        };
      } else {
        return {
          success: false,
          error: addResult.error
        };
      }

    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Wait for Spotify to index the local file with retry logic
   * This is crucial because there's a delay between saving the file and Spotify detecting it
   */
  private static async waitForLocalFileIndexing(
    metadata: { title: string; artist: string; duration: number },
    accessToken: string,
    maxAttempts: number = 12, // 2 minutes with 10-second intervals
    intervalMs: number = 10000
  ): Promise<SpotifyTrack | null> {
    
    console.log(`Waiting for Spotify to index local file: ${metadata.title}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxAttempts}: Searching for local file in Spotify`);

        // Search for the track in user's library
        const searchQuery = `${metadata.artist} ${metadata.title}`;
        const searchResults = await this.searchUserLibrary(searchQuery, accessToken);

        // Look for exact matches or very close matches
        const matchingTrack = this.findMatchingTrack(searchResults, metadata);

        if (matchingTrack) {
          console.log(`Found matching track in Spotify: ${matchingTrack.name} by ${matchingTrack.artists}`);
          return matchingTrack;
        }

        // Wait before next attempt
        if (attempt < maxAttempts) {
          console.log(`Track not found yet, waiting ${intervalMs}ms before retry...`);
          await this.delay(intervalMs);
        }

      } catch (error) {
        console.error(`Error during attempt ${attempt}:`, error);
        
        // Continue retrying on search errors
        if (attempt < maxAttempts) {
          await this.delay(intervalMs);
        }
      }
    }

    console.log(`Local file not indexed after ${maxAttempts} attempts`);
    return null;
  }

  /**
   * Search user's Spotify library for tracks
   */
  private static async searchUserLibrary(query: string, accessToken: string): Promise<SpotifyTrack[]> {
    try {
      const response = await fetch(`${this.SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tracks || !data.tracks.items) {
        return [];
      }

      return data.tracks.items.map((track: any) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists: track.artists.map((artist: any) => artist.name).join(', '),
        duration: track.duration_ms
      }));

    } catch (error) {
      console.error('Failed to search user library:', error);
      throw error;
    }
  }

  /**
   * Find the best matching track from search results
   */
  private static findMatchingTrack(
    tracks: SpotifyTrack[],
    metadata: { title: string; artist: string; duration: number }
  ): SpotifyTrack | null {
    const targetTitle = this.normalizeString(metadata.title);
    const targetArtist = this.normalizeString(metadata.artist);
    const targetDuration = metadata.duration;

    for (const track of tracks) {
      const trackTitle = this.normalizeString(track.name);
      const trackArtists = this.normalizeString(track.artists);
      const durationDiff = Math.abs(track.duration - (targetDuration * 1000)); // Convert to milliseconds

      // Check title similarity
      const titleMatch = this.calculateStringSimilarity(targetTitle, trackTitle);
      
      // Check artist similarity
      const artistMatch = this.calculateStringSimilarity(targetArtist, trackArtists);
      
      // Check duration similarity (allow 10% difference)
      const durationMatch = durationDiff <= (targetDuration * 1000 * 0.1);

      // Consider it a match if title and artist are very similar and duration is close
      if (titleMatch > 0.85 && artistMatch > 0.8 && durationMatch) {
        return track;
      }

      // Special case for exact title matches even with different artists
      if (titleMatch > 0.9 && artistMatch > 0.6) {
        return track;
      }
    }

    return null;
  }

  /**
   * Add indexed track to Spotify playlist
   */
  private static async addIndexedTrackToPlaylist(
    playlistId: string,
    trackUri: string,
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        return {
          success: false,
          error: `Failed to add track to playlist: ${errorMessage}`
        };
      }

      const data = await response.json();
      console.log('Track added to playlist successfully:', data.snapshot_id);

      return { success: true };

    } catch (error) {
      console.error('Error adding track to playlist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Utility function to normalize strings for comparison
   */
  private static normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1       // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Utility function to delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user's playlists for context menu population
   */
  static async getUserPlaylists(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    trackCount: number;
    isPublic: boolean;
    owner: string;
    imageUrl?: string;
  }>> {
    try {
      const response = await fetch(`${this.SPOTIFY_API_BASE}/me/playlists?limit=50`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.statusText}`);
      }

      const data = await response.json();

      return data.items.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackCount: playlist.tracks.total,
        isPublic: playlist.public,
        owner: playlist.owner.display_name,
        imageUrl: playlist.images[0]?.url || null
      }));

    } catch (error) {
      console.error('Failed to get user playlists:', error);
      throw error;
    }
  }

  /**
   * Create a dedicated TuneFlow playlist if it doesn't exist
   */
  static async ensureTuneFlowPlaylist(accessToken: string): Promise<string> {
    try {
      // First, try to find existing TuneFlow playlist
      const playlists = await this.getUserPlaylists(accessToken);
      const tuneflowPlaylist = playlists.find(p => p.name === this.LOCAL_FILE_FOLDER);

      if (tuneflowPlaylist) {
        return tuneflowPlaylist.id;
      }

      // Create new playlist if it doesn't exist
      const response = await fetch(`${this.SPOTIFY_API_BASE}/users/me/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.LOCAL_FILE_FOLDER,
          description: 'Downloaded by TuneFlow - High-fidelity YouTube to Spotify bridge',
          public: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create playlist: ${response.statusText}`);
      }

      const playlist = await response.json();
      console.log('Created TuneFlow playlist:', playlist.id);

      return playlist.id;

    } catch (error) {
      console.error('Failed to ensure TuneFlow playlist:', error);
      throw error;
    }
  }
}

// Example usage:
/*
const result = await SpotifyPlaylistService.addTrackToPlaylist({
  playlistId: 'spotify:playlist:123456789',
  trackUri: 'spotify:track:abcdef123456',
  accessToken: 'BQA...',
  metadata: {
    title: 'Amazing Song',
    artist: 'Great Artist',
    duration: 240 // seconds
  }
});

if (result.success) {
  console.log('Track added successfully:', result.trackAdded);
} else {
  console.error('Failed to add track:', result.error);
}
*/