import { SpotifyAuthService } from './SpotifyAuthService';
import { MatchingService } from './MatchingService';

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
  bestMatch: SpotifyTrack | null;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
}

interface SearchOptions {
  duration?: number;
  limit?: number;
}

export class SpotifySearchService {
  static async searchTrack(
    title: string,
    artist?: string,
    options: SearchOptions = {}
  ): Promise<SearchResults> {
    const token = await SpotifyAuthService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }

    const { limit = 10, duration } = options;
    const sanitizedTitle = MatchingService.sanitizeTitle(title);
    const parsed = MatchingService.parseArtistTitle(sanitizedTitle);
    
    const effectiveArtist = artist || parsed?.artist;
    const effectiveTitle = parsed?.title || sanitizedTitle;

    const queries = this.buildQueryChain(effectiveTitle, effectiveArtist);
    
    let allTracks: SpotifyTrack[] = [];
    
    for (const query of queries) {
      const tracks = await this.executeSearch(token, query, limit);
      if (tracks.length > 0) {
        allTracks = tracks;
        break;
      }
    }

    const { bestMatch, score } = this.findBestMatch(
      allTracks,
      effectiveTitle,
      effectiveArtist,
      duration
    );

    return {
      tracks: allTracks,
      bestMatch,
      matchScore: score,
      confidence: MatchingService.getConfidenceLevel(score)
    };
  }

  private static buildQueryChain(title: string, artist?: string): string[] {
    const queries: string[] = [];
    const titleWithoutFeat = MatchingService.removeFeaturing(title);
    
    if (artist) {
      queries.push(`track:${title} artist:${artist}`);
      queries.push(`${artist} ${title}`);
      if (titleWithoutFeat !== title) {
        queries.push(`track:${titleWithoutFeat} artist:${artist}`);
      }
    }
    
    queries.push(`track:${title}`);
    queries.push(title);
    
    if (titleWithoutFeat !== title) {
      queries.push(titleWithoutFeat);
    }

    return queries;
  }

  private static async executeSearch(
    token: string,
    query: string,
    limit: number
  ): Promise<SpotifyTrack[]> {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '1';
        await this.delay(parseInt(retryAfter, 10) * 1000);
        return this.executeSearch(token, query, limit);
      }
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.tracks?.items || [];
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static findBestMatch(
    tracks: SpotifyTrack[],
    title: string,
    artist?: string,
    duration?: number
  ): { bestMatch: SpotifyTrack | null; score: number } {
    if (tracks.length === 0) {
      return { bestMatch: null, score: 0 };
    }

    let bestMatch: SpotifyTrack | null = null;
    let bestScore = 0;

    for (const track of tracks) {
      const score = MatchingService.calculateMatchScore(
        title,
        artist,
        track.name,
        track.artists.map(a => a.name),
        duration,
        track.duration_ms
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = track;
      }
    }

    if (!MatchingService.isAutoAddable(bestScore)) {
      return { bestMatch: null, score: bestScore };
    }

    return { bestMatch, score: bestScore };
  }

  static async isTrackInPlaylist(playlistId: string, trackUri: string): Promise<boolean> {
    const token = await SpotifyAuthService.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');

    let offset = 0;
    const limit = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=items(track(uri)),total`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error(`Failed to fetch playlist tracks: ${response.status}`);

      const data = await response.json();
      const tracks = data.items || [];

      for (const item of tracks) {
        if (item.track?.uri === trackUri) return true;
      }

      offset += limit;
      if (offset >= data.total) break;
    }

    return false;
  }

  static async addTrackToPlaylist(
    playlistId: string,
    trackUri: string,
    checkDuplicate: boolean = true
  ): Promise<{ success: boolean; duplicate: boolean }> {
    const token = await SpotifyAuthService.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');

    if (checkDuplicate) {
      const isDuplicate = await this.isTrackInPlaylist(playlistId, trackUri);
      if (isDuplicate) {
        return { success: false, duplicate: true };
      }
    }

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [trackUri], position: 0 })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to add track: ${error.error?.message || response.statusText}`);
    }

    return { success: true, duplicate: false };
  }

  static async getPlaylists(): Promise<SpotifyPlaylist[]> {
    const token = await SpotifyAuthService.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');

    const response = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error(`Failed to fetch playlists: ${response.status}`);

    const data = await response.json();
    return data.items || [];
  }

  static async createPlaylist(
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<SpotifyPlaylist> {
    const token = await SpotifyAuthService.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');

    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) throw new Error('Failed to get user info');
    const user = await userResponse.json();

    const response = await fetch(
      `https://api.spotify.com/v1/users/${user.id}/playlists`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, public: isPublic })
      }
    );

    if (!response.ok) throw new Error(`Failed to create playlist: ${response.status}`);
    return await response.json();
  }

  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{ url: string; width: number; height: number }>;
  owner: { id: string; display_name: string };
  tracks: { total: number };
  public: boolean;
  uri: string;
}
