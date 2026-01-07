import { chrome } from 'webextension-polyfill';

// Types
interface DownloadJob {
  jobId: string;
  youtubeUrl: string;
  format: 'mp3' | 'flac';
  quality: '192' | '320';
  playlistId?: string;
  accessToken?: string;
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

interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  duration: string;
  thumbnail: string;
}

// Background service worker for TuneFlow extension
class BackgroundService {
  private isContextMenuCreated = false;
  private backendUrl = 'http://localhost:3001';
  private spotifyToken: string | null = null;

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
      const result = await chrome.storage.local.get(['backendUrl', 'spotifyToken']);
      if (result.backendUrl) {
        this.backendUrl = result.backendUrl;
      }
      if (result.spotifyToken) {
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
        case 'DOWNLOAD_VIDEO':
          this.handleDownloadVideo(message.data, sendResponse);
          return true; // Keep channel open for async response

        case 'GET_SPOTIFY_PLAYLISTS':
          this.handleGetSpotifyPlaylists(sendResponse);
          return true;

        case 'SET_SPOTIFY_TOKEN':
          this.handleSetSpotifyToken(message.token);
          sendResponse({ success: true });
          break;

        case 'GET_BACKEND_STATUS':
          this.handleGetBackendStatus(sendResponse);
          return true;

        case 'UPDATE_CONTEXT_MENU':
          this.handleUpdateContextMenu(sendResponse);
          return true;

        default:
          console.log('Unknown message type:', message.type);
      }
    });
  }

  private async createContextMenu() {
    if (this.isContextMenuCreated) {
      return;
    }

    try {
      // Remove existing context menu items
      await chrome.contextMenus.removeAll();

      // Create main menu item
      chrome.contextMenus.create({
        id: 'tuneflow-main',
        title: 'TuneFlow Download',
        contexts: ['video', 'link']
      });

      // Create submenu for save options
      chrome.contextMenus.create({
        id: 'tuneflow-save-library',
        parentId: 'tuneflow-main',
        title: 'Save to Library',
        contexts: ['video', 'link']
      });

      chrome.contextMenus.create({
        id: 'tuneflow-separator-1',
        parentId: 'tuneflow-main',
        type: 'separator',
        contexts: ['video', 'link']
      });

      // Create dynamic playlist submenu
      chrome.contextMenus.create({
        id: 'tuneflow-playlists-submenu',
        parentId: 'tuneflow-main',
        title: 'Add to Spotify Playlist',
        contexts: ['video', 'link']
      });

      // Add playlist items
      await this.updatePlaylistMenu();

      chrome.contextMenus.create({
        id: 'tuneflow-separator-2',
        parentId: 'tuneflow-main',
        type: 'separator',
        contexts: ['video', 'link']
      });

      chrome.contextMenus.create({
        id: 'tuneflow-settings',
        parentId: 'tuneflow-main',
        title: 'Configure Presets...',
        contexts: ['video', 'link']
      });

      this.isContextMenuCreated = true;
      console.log('Context menu created successfully');

    } catch (error) {
      console.error('Failed to create context menu:', error);
    }
  }

  private async updatePlaylistMenu() {
    if (!this.spotifyToken) {
      return;
    }

    try {
      const response = await fetch(`${this.backendUrl}/spotify/playlists?accessToken=${this.spotifyToken}`);
      if (response.ok) {
        const playlists: SpotifyPlaylist[] = await response.json();

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
            parentId: 'tuneflow-playlists-submenu',
            title: `${playlist.name} (${playlist.trackCount} tracks)`,
            contexts: ['video', 'link']
          });
        }

        console.log(`Updated playlist menu with ${playlists.length} playlists`);
      }
    } catch (error) {
      console.error('Failed to update playlist menu:', error);
    }
  }

  private async handleDownloadVideo(data: any, sendResponse: (response?: any) => void) {
    try {
      const { youtubeUrl, format = 'mp3', quality = '320', playlistId } = data;

      if (!youtubeUrl) {
        sendResponse({ error: 'YouTube URL is required' });
        return;
      }

      // Send processing request to backend
      const response = await fetch(`${this.backendUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          youtubeUrl,
          format,
          quality,
          playlistId,
          accessToken: this.spotifyToken
        })
      });

      if (!response.ok) {
        throw new Error(`Backend responded with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Download job created:', result);

      // Start polling for job completion
      this.pollJobStatus(result.jobId, youtubeUrl, playlistId);

      sendResponse({ 
        success: true, 
        jobId: result.jobId,
        message: 'Download started. Check progress in the popup.'
      });

    } catch (error) {
      console.error('Download failed:', error);
      sendResponse({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async handleGetSpotifyPlaylists(sendResponse: (response?: any) => void) {
    try {
      if (!this.spotifyToken) {
        sendResponse({ error: 'Not authenticated with Spotify' });
        return;
      }

      const response = await fetch(`${this.backendUrl}/spotify/playlists?accessToken=${this.spotifyToken}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
      }

      const playlists = await response.json();
      sendResponse({ success: true, playlists });

    } catch (error) {
      console.error('Failed to get Spotify playlists:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleSetSpotifyToken(token: string) {
    this.spotifyToken = token;
    await chrome.storage.local.set({ spotifyToken: token });
    await this.updatePlaylistMenu();
  }

  private async handleGetBackendStatus(sendResponse: (response?: any) => void) {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      sendResponse({ 
        backendOnline: response.ok,
        backendUrl: this.backendUrl 
      });
    } catch (error) {
      sendResponse({ 
        backendOnline: false,
        backendUrl: this.backendUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleUpdateContextMenu(sendResponse: (response?: any) => void) {
    try {
      await this.updatePlaylistMenu();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async pollJobStatus(jobId: string, youtubeUrl: string, playlistId?: string) {
    const maxAttempts = 60; // 5 minutes maximum
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const response = await fetch(`${this.backendUrl}/status/${jobId}`);
        
        if (response.ok) {
          const status = await response.json();
          
          if (status.status === 'completed') {
            console.log('Job completed, downloading file...');
            await this.downloadFile(jobId, status.filename);
            
            // If playlist is specified, add to playlist
            if (playlistId && this.spotifyToken) {
              await this.addToPlaylistAfterDelay(jobId, playlistId, status.metadata);
            }
            
          } else if (status.status === 'failed') {
            console.error('Job failed:', status.error);
            this.showNotification('Download Failed', `Failed to download: ${status.error}`, 'error');
          } else if (attempts < maxAttempts) {
            // Continue polling
            setTimeout(poll, 5000);
          } else {
            console.error('Job polling timeout');
            this.showNotification('Download Timeout', 'The download is taking longer than expected', 'warning');
          }
        } else {
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
          }
        }
      } catch (error) {
        console.error('Job status poll error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    // Start polling
    setTimeout(poll, 5000);
  }

  private async downloadFile(jobId: string, filename: string) {
    try {
      const response = await fetch(`${this.backendUrl}/download/${jobId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        await chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        });

        console.log('File downloaded successfully');
        this.showNotification('Download Complete', `Successfully downloaded ${filename}`, 'success');

        // Clean up URL object after a delay
        setTimeout(() => URL.revokeObjectURL(url), 10000);

      } else {
        throw new Error(`Download failed: ${response.status}`);
      }
    } catch (error) {
      console.error('File download error:', error);
      this.showNotification('Download Failed', 'Failed to save the downloaded file', 'error');
    }
  }

  private async addToPlaylistAfterDelay(jobId: string, playlistId: string, metadata: any) {
    // Wait for Spotify to index the local file
    setTimeout(async () => {
      try {
        console.log('Checking if local file is indexed...');
        
        // Search for the track in Spotify
        const searchQuery = `${metadata.artist} ${metadata.title}`;
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${this.spotifyToken}`
            }
          }
        );

        if (searchResponse.ok) {
          const searchResults = await searchResponse.json();
          
          if (searchResults.tracks.items.length > 0) {
            const trackUri = searchResults.tracks.items[0].uri;
            
            // Add to playlist
            const addResponse = await fetch(`${this.backendUrl}/spotify/playlist/${playlistId}/tracks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                accessToken: this.spotifyToken,
                trackUri: trackUri
              })
            });

            if (addResponse.ok) {
              console.log('Track added to playlist successfully');
              this.showNotification('Added to Playlist', `Added "${metadata.title}" to your Spotify playlist`, 'success');
            }
          } else {
            console.log('Local file not yet indexed by Spotify');
          }
        }
      } catch (error) {
        console.error('Failed to add to playlist:', error);
      }
    }, 30000); // Wait 30 seconds for Spotify to index the file
  }

  private showNotification(title: string, message: string, type: 'success' | 'error' | 'warning') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/assets/icon-48.png',
      title: title,
      message: message
    });
  }
}

// Initialize the background service
new BackgroundService();