import { chrome } from 'webextension-polyfill';

interface AddTrackJob {
  jobId: string;
  youtubeUrl: string;
  playlistId: string;
  status: 'queued' | 'searching' | 'adding' | 'completed' | 'failed';
  progress: number;
  trackInfo?: {
    title: string;
    artist: string;
    spotifyTrack?: any;
  };
  error?: string;
  createdAt: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  isPublic: boolean;
  owner: string;
  imageUrl?: string;
}

// Background service worker for TuneFlow extension
class BackgroundService {
  private isContextMenuCreated = false;
  private spotifyToken: string | null = null;
  private activeJobs: Map<string, AddTrackJob> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      // Load stored data
      await this.loadStoredData();
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Create context menu
      await this.createContextMenu();
      
      console.log('TuneFlow Background Service initialized');
    } catch (error) {
      console.error('Failed to initialize background service:', error);
    }
  }

  private async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(['spotifyToken', 'spotify_access_token', 'spotify_token_expiry']);
      if (result.spotify_access_token) {
        this.spotifyToken = result.spotify_access_token;
      } else if (result.spotifyToken) {
        // Legacy support for old key name
        this.spotifyToken = result.spotifyToken;
      }
    } catch (error) {
      console.error('Failed to load stored data:', error);
    }
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Background received message:', message);

      switch (message.type) {
        case 'ADD_TRACK_TO_PLAYLIST':
          this.handleAddTrackToPlaylist(message.data, sendResponse);
          return true; // Keep channel open for async response

        case 'SEARCH_SPOTIFY_TRACK':
          this.handleSearchSpotifyTrack(message.data, sendResponse);
          return true;

        case 'GET_SPOTIFY_PLAYLISTS':
          this.handleGetSpotifyPlaylists(sendResponse);
          return true;

        case 'SET_SPOTIFY_TOKEN':
          this.handleSetSpotifyToken(message.token);
          sendResponse({ success: true });
          break;

        case 'EXCHANGE_SPOTIFY_CODE':
          this.handleExchangeSpotifyCode(message, sendResponse);
          return true;

        case 'UPDATE_CONTEXT_MENU':
          this.handleUpdateContextMenu(sendResponse);
          return true;

        case 'GET_JOB_STATUS':
          this.handleGetJobStatus(message.jobId, sendResponse);
          return true;

        case 'GET_ACTIVE_JOBS':
          sendResponse({ jobs: Array.from(this.activeJobs.values()) });
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  private async createContextMenu() {
    if (this.isContextMenuCreated) {
      return;
    }

    try {
      // Remove existing context menu items
      await chrome.contextMenus.removeAll();

      // Main menu item
      chrome.contextMenus.create({
        id: 'tuneflow-main',
        title: 'Add to Spotify Playlist',
        contexts: ['video', 'link']
      });

      // Dynamic playlist submenu will be added when Spotify is connected

      this.isContextMenuCreated = true;
      console.log('Context menu created successfully');

    } catch (error) {
      console.error('Failed to create context menu:', error);
    }
  }

  private async updatePlaylistMenu() {
    try {
      const token = await this.getSpotifyToken();
      if (!token) {
        return;
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
        console.error('Failed to fetch playlists for context menu');
        return;
      }

      const data = await response.json();
      const playlists: SpotifyPlaylist[] = data.items || [];

      // Remove existing playlist items
      const existingItems = await chrome.contextMenus.getAll();
      for (const item of existingItems) {
        if (item.id?.startsWith('tuneflow-playlist-')) {
          chrome.contextMenus.remove(item.id!);
        }
      }

      // Add playlist items
      for (const playlist of playlists) {
        chrome.contextMenus.create({
          id: `tuneflow-playlist-${playlist.id}`,
          parentId: 'tuneflow-main',
          title: playlist.name,
          contexts: ['video', 'link']
        });
      }

      console.log(`Updated playlist menu with ${playlists.length} playlists`);
    } catch (error) {
      console.error('Failed to update playlist menu:', error);
    }
  }

  private async handleContextMenuClick(info: any, tab: any) {
    console.log('Context menu clicked:', info.menuItemId);

    // Check if it's a playlist item
    const playlistIdMatch = info.menuItemId?.toString().match(/^tuneflow-playlist-(.+)$/);
    if (playlistIdMatch) {
      const playlistId = playlistIdMatch[1];
      const youtubeUrl = info.linkUrl || info.pageUrl;

      if (youtubeUrl) {
        // Show popup with progress
        chrome.action.openPopup();

        // Start adding track
        await this.addTrackToPlaylist(youtubeUrl, playlistId);
      }
    }
  }

  private async handleAddTrackToPlaylist(data: any, sendResponse: (response?: any) => void) {
    try {
      const { youtubeUrl, playlistId } = data;

      if (!youtubeUrl || !playlistId) {
        sendResponse({ error: 'YouTube URL and playlist ID are required' });
        return;
      }

      const job = await this.addTrackToPlaylist(youtubeUrl, playlistId);
      sendResponse({ success: true, jobId: job.jobId });

    } catch (error) {
      console.error('Add track failed:', error);
      sendResponse({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async addTrackToPlaylist(youtubeUrl: string, playlistId: string): Promise<AddTrackJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: AddTrackJob = {
      jobId,
      youtubeUrl,
      playlistId,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    this.activeJobs.set(jobId, job);

    try {
      // Step 1: Extract YouTube metadata
      job.status = 'searching';
      job.progress = 10;
      
      const metadata = await this.extractYouTubeMetadata(youtubeUrl);
      
      if (!metadata) {
        throw new Error('Could not extract video metadata');
      }

      job.trackInfo = {
        title: metadata.title,
        artist: metadata.artist
      };
      job.progress = 30;

      // Step 2: Search on Spotify
      const searchResults = await this.searchOnSpotify(metadata.title, metadata.artist, metadata.duration);
      job.progress = 60;

      if (!searchResults.exactMatch) {
        throw new Error('Could not find matching track on Spotify');
      }

      job.trackInfo.spotifyTrack = searchResults.exactMatch;

      // Step 3: Add to playlist
      job.status = 'adding';
      job.progress = 70;

      await this.addToPlaylist(playlistId, searchResults.exactMatch.uri);

      // Complete
      job.status = 'completed';
      job.progress = 100;

      this.showNotification(
        'Added to Spotify',
        `"${metadata.title}" added to playlist`,
        'success'
      );

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.showNotification(
        'Failed',
        job.error,
        'error'
      );
    }

    return job;
  }

  private async extractYouTubeMetadata(youtubeUrl: string) {
    try {
      const videoId = this.extractVideoId(youtubeUrl);
      if (!videoId) {
        return null;
      }

      // Try oEmbed API first
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );

      if (response.ok) {
        const data = await response.json();
        
        // Extract artist from title if possible
        let artist = '';
        let title = data.title || '';
        
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          artist = parts[0].trim();
          // Keep the rest as title
        } else {
          artist = data.author_name || '';
        }

        return {
          videoId,
          title,
          artist,
          thumbnail: data.thumbnail_url,
          duration: 0,
          url: youtubeUrl
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to extract YouTube metadata:', error);
      return null;
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private async searchOnSpotify(title: string, artist: string, duration: number) {
    const token = await this.getSpotifyToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }

    let query = `track:${title}`;
    if (artist) {
      query += ` artist:${artist}`;
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Spotify search failed');
    }

    const data = await response.json();
    const tracks = data.tracks?.items || [];

    // Find best match
    const exactMatch = this.findBestMatch(tracks, title, artist, duration);
    
    return {
      tracks,
      exactMatch
    };
  }

  private findBestMatch(tracks: any[], title: string, artist: string, duration: number) {
    if (tracks.length === 0) {
      return null;
    }

    // Simple scoring
    const scored = tracks.map(track => ({
      track,
      score: this.calculateMatchScore(track, title, artist, duration)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0].score > 0.3 ? scored[0].track : null;
  }

  private calculateMatchScore(track: any, title: string, artist: string, duration: number): number {
    let score = 0;

    // Title similarity
    const titleSim = this.calculateStringSimilarity(
      title.toLowerCase(),
      track.name.toLowerCase()
    );
    score += titleSim * 0.5;

    // Artist similarity
    if (artist) {
      const artistNames = track.artists.map((a: any) => a.name.toLowerCase()).join(' ');
      const artistSim = this.calculateStringSimilarity(
        artist.toLowerCase(),
        artistNames
      );
      score += artistSim * 0.3;
    }

    // Duration
    if (duration > 0) {
      const durationDiff = Math.abs(duration - track.duration_ms / 1000);
      score += Math.max(0, 1 - durationDiff / 60) * 0.2;
    }

    return Math.min(score, 1);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private async addToPlaylist(playlistId: string, trackUri: string) {
    const token = await this.getSpotifyToken();
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
          position: 0
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add track to playlist');
    }
  }

  private async handleSearchSpotifyTrack(data: any, sendResponse: (response?: any) => void) {
    try {
      const { title, artist } = data;
      const token = await this.getSpotifyToken();
      
      if (!token) {
        sendResponse({ error: 'Not authenticated with Spotify' });
        return;
      }

      let query = `track:${title}`;
      if (artist) {
        query += ` artist:${artist}`;
      }

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      sendResponse({ success: true, tracks: data.tracks?.items || [] });

    } catch (error) {
      console.error('Search failed:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleGetSpotifyPlaylists(sendResponse: (response?: any) => void) {
    try {
      const token = await this.getSpotifyToken();
      
      if (!token) {
        sendResponse({ error: 'Not authenticated with Spotify' });
        return;
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
        throw new Error('Failed to fetch playlists');
      }

      const data = await response.json();
      sendResponse({ success: true, playlists: data.items || [] });

    } catch (error) {
      console.error('Failed to get playlists:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSetSpotifyToken(token: string) {
    this.spotifyToken = token;
    await chrome.storage.local.set({ spotifyToken: token });
    await this.updatePlaylistMenu();
  }

  private async handleExchangeSpotifyCode(message: any, sendResponse: (response?: any) => void) {
    try {
      const { code, state } = message;

      // Generate code verifier and challenge (PKCE)
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      // Verify state
      const storedState = await chrome.storage.local.get(['spotify_auth_state']);
      if (!storedState.spotify_auth_state || storedState.spotify_auth_state !== state) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for token
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: 'd4f5e8d4e4f5487594f7b4b5b2b5c1e1',
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: chrome.runtime.getURL('src/popup/auth-callback.html'),
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
      }

      const tokens = await response.json();
      
      // Calculate expiry time
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      
      // Store tokens
      await chrome.storage.local.set({
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expiry: expiryTime
      });

      // Set current token
      this.spotifyToken = tokens.access_token;
      
      // Update context menu
      await this.updatePlaylistMenu();

      sendResponse({ success: true });

    } catch (error) {
      console.error('Failed to exchange Spotify code:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async handleUpdateContextMenu(sendResponse: (response?: any) => void) {
    try {
      await this.updatePlaylistMenu();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private handleGetJobStatus(jobId: string, sendResponse: (response?: any) => void) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      sendResponse({ success: true, job });
    } else {
      sendResponse({ error: 'Job not found' });
    }
  }

  private async getSpotifyToken(): Promise<string | null> {
    try {
      // First check in-memory token
      if (this.spotifyToken) {
        return this.spotifyToken;
      }
      
      const result = await chrome.storage.local.get(['spotify_access_token', 'spotifyToken']);
      if (result.spotify_access_token) {
        this.spotifyToken = result.spotify_access_token;
        return this.spotifyToken;
      } else if (result.spotifyToken) {
        // Legacy support
        this.spotifyToken = result.spotifyToken;
        return this.spotifyToken;
      }
      return null;
    } catch (error) {
      console.error('Failed to get Spotify token:', error);
      return null;
    }
  }

  private showNotification(title: string, message: string, type: 'success' | 'error') {
    // Use extension's default icon or fallback to a simple colored icon
    const iconUrl = chrome.runtime.getURL('assets/icon.svg') || '/assets/icon-48.png';
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl,
      title,
      message
    });
  }
}

// Initialize the background service
new BackgroundService();
