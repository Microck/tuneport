// Use global chrome
import { MatchingService } from '../services/MatchingService';
import { DownloadService } from '../services/DownloadService';
import { LucidaService } from '../services/LucidaService';
import { AudioFormat } from '../services/CobaltService';
import { YouTubeMetadataService, YouTubeMusicMetadata } from '../services/YouTubeMetadataService';
import { applyDownloadCompletion, applyDownloadInterruption } from './download-utils';


interface DownloadOptions {
  format: string;
}

interface AddTrackJob {
  jobId: string;
  youtubeUrl: string;
  playlistId: string;
  status: 'queued' | 'searching' | 'adding' | 'downloading' | 'completed' | 'failed' | 'awaiting_fallback';
  progress: number;
  trackInfo?: {
    title: string;
    artist: string;
    spotifyTrack?: any;
  };
  thumbnail?: string;
  downloadInfo?: {
    enabled: boolean;
    quality?: string;
    source?: string;
    filename?: string;
  };
  error?: string;
  createdAt: string;
  currentStep?: string;
  startedAt?: number;
  fallbackMetadata?: YouTubeMusicMetadata;
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

// Background service worker for TunePort extension
export class BackgroundService {
  private isContextMenuCreated = false;
  private spotifyToken: string | null = null;
  private activeJobs: Map<string, AddTrackJob> = new Map();
  private debugLogs: Array<{ time: string; message: string; type: 'info' | 'error' | 'warn' }> = [];
  private readonly MAX_DEBUG_LOGS = 100;

  private log(message: string, type: 'info' | 'error' | 'warn' = 'info') {
    const entry = { time: new Date().toISOString(), message, type };
    this.debugLogs.push(entry);
    if (this.debugLogs.length > this.MAX_DEBUG_LOGS) {
      this.debugLogs.shift();
    }
    if (type === 'error') console.error(message);
    else if (type === 'warn') console.warn(message);
    else console.log(message);
  }

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
      
      console.log('TunePort Background Service initialized');
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
        this.spotifyToken = result.spotifyToken;
      }

      await LucidaService.loadSettings();
    } catch (error) {
      console.error('Failed to load stored data:', error);
    }
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });


    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info) => {
      this.handleContextMenuClick(info);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.url) {
        this.handleTabUpdate(tabId, changeInfo.url);
      }
    });
  }

  private async handleTabUpdate(tabId: number, url: string) {
    const redirectUri = chrome.runtime.getURL('popup/auth-callback.html');
    if (url.startsWith(redirectUri)) {
      console.log('[TunePort BG] Sniffed redirect URL:', url);
      try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');

        if (code && state) {
          console.log('[TunePort BG] Extracting code and state from sniffed URL');
          const result = await new Promise<any>((resolve) => {
            this.handleExchangeSpotifyCode({ code, state }, (res) => resolve(res));
          });

          console.log('[TunePort BG] Exchange result:', result);
          
          if (result && result.success) {
            const userName = result.userName || '';
            const successUrl = chrome.runtime.getURL('popup/auth-success.html') + 
              (userName ? `?user=${encodeURIComponent(userName)}` : '');
            chrome.tabs.update(tabId, { url: successUrl });
          } else {
            setTimeout(() => {
              chrome.tabs.remove(tabId).catch(() => {});
            }, 3000);
          }
        }
      } catch (error) {
        console.error('[TunePort BG] Error handling sniffed URL:', error);
      }
    }
  }

  private async createContextMenu() {
    if (this.isContextMenuCreated) {
      return;
    }

    try {
      await new Promise<void>((resolve) => {
        chrome.contextMenus.removeAll(() => resolve());
      });

      chrome.contextMenus.create({
        id: 'tuneport-main',
        title: 'TunePort',
        contexts: ['page', 'video', 'link'],
        documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
      });

      chrome.contextMenus.create({
        id: 'tuneport-settings',
        parentId: 'tuneport-main',
        title: 'Open Settings',
        contexts: ['page', 'video', 'link'],
        documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
      });

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
        'https://api.spotify.com/v1/me/playlists?limit=20',
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
      const settings = await this.getSettings();

      await new Promise<void>((resolve) => {
        chrome.contextMenus.removeAll(() => resolve());
      });
      this.isContextMenuCreated = false;
      await this.createContextMenu();

      chrome.contextMenus.create({
        id: 'tuneport-separator',
        parentId: 'tuneport-main',
        type: 'separator',
        contexts: ['video', 'link'],
        documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
      });

      for (const playlist of playlists.slice(0, 10)) {
        chrome.contextMenus.create({
          id: `tuneport-playlist-${playlist.id}`,
          parentId: 'tuneport-main',
          title: `Add to "${playlist.name}"`,
          contexts: ['video', 'link'],
          documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
        });

        if (settings.enableDownload) {
          chrome.contextMenus.create({
            id: `tuneport-playlist-dl-${playlist.id}`,
            parentId: 'tuneport-main',
            title: `Add + Download to "${playlist.name}"`,
            contexts: ['video', 'link'],
            documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
          });
        }
      }

      console.log(`Updated playlist menu with ${playlists.length} playlists`);
    } catch (error) {
      console.error('Failed to update playlist menu:', error);
    }
  }

  private async getSettings(): Promise<{ 
    enableDownload: boolean; 
    defaultQuality: string; 
    defaultPlaylist: string;
    spotifyFallbackMode: 'auto' | 'ask' | 'never';
  }> {
    try {
      const result = await chrome.storage.local.get(['tuneport_settings']);
      const defaults = { 
        enableDownload: false, 
        defaultQuality: 'best', 
        defaultPlaylist: '',
        spotifyFallbackMode: 'auto' as const
      };
      return { ...defaults, ...result.tuneport_settings };
    } catch {
      return { enableDownload: false, defaultQuality: 'best', defaultPlaylist: '', spotifyFallbackMode: 'auto' };
    }
  }

  private async handleContextMenuClick(info: any) {
    console.log('Context menu clicked:', info.menuItemId);
    const youtubeUrl = info.linkUrl || info.pageUrl;

    if (info.menuItemId === 'tuneport-settings') {
      chrome.runtime.openOptionsPage();
      return;
    }

    if (info.menuItemId === 'tuneport-add-default' || info.menuItemId === 'tuneport-add-download') {
      const withDownload = info.menuItemId === 'tuneport-add-download';
      
      if (youtubeUrl) {
        try {
          await chrome.action.openPopup();
        } catch {}

        const settings = await this.getSettings();
        if (settings.defaultPlaylist) {
          await this.addTrackToPlaylist(
            youtubeUrl, 
            settings.defaultPlaylist, 
            withDownload,
            withDownload ? { format: 'best' } : undefined
          );
        } else {
          this.showNotification(
            'Select Playlist',
            'Open the popup and select a playlist first',
            'error'
          );
        }
      }
      return;
    }

    const playlistMatch = info.menuItemId?.toString().match(/^tuneport-playlist-(dl-)?(.+)$/);
    if (playlistMatch) {
      const withDownload = !!playlistMatch[1];
      const playlistId = playlistMatch[2];

      if (youtubeUrl) {
        try {
          await chrome.action.openPopup();
        } catch {}

        await this.addTrackToPlaylist(
          youtubeUrl, 
          playlistId, 
          withDownload,
          withDownload ? { format: 'best' } : undefined
        );
      }
    }
  }

  private handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    const { type, data } = message;
    console.log('[TunePort BG] Message received:', type);

    switch (type) {
      case 'ADD_TRACK_TO_PLAYLIST':
        this.handleAddTrackToPlaylist(data, sendResponse);
        break;
      case 'SEARCH_SPOTIFY_TRACK':
        this.handleSearchSpotifyTrack(data, sendResponse);
        break;
      case 'GET_SPOTIFY_PLAYLISTS':
        this.handleGetSpotifyPlaylists(sendResponse);
        break;
      case 'SET_SPOTIFY_TOKEN':
        this.handleSetSpotifyToken(message.token);
        sendResponse({ success: true });
        break;
      case 'EXCHANGE_SPOTIFY_CODE':
        this.handleExchangeSpotifyCode(message, sendResponse);
        break;
      case 'UPDATE_CONTEXT_MENU':
        this.handleUpdateContextMenu(sendResponse);
        break;
      case 'GET_ACTIVE_JOBS':
        sendResponse({ jobs: Array.from(this.activeJobs.values()) });
        break;
      case 'GET_DEBUG_LOGS':
        sendResponse({ logs: this.debugLogs });
        break;
      case 'CLEAR_DEBUG_LOGS':
        this.debugLogs = [];
        sendResponse({ success: true });
        break;
      case 'GET_JOB_STATUS':
        this.handleGetJobStatus(message.jobId, sendResponse);
        break;
      case 'CONFIRM_FALLBACK':
        this.handleConfirmFallback(message.jobId, sendResponse);
        break;
      case 'REJECT_FALLBACK':
        this.handleRejectFallback(message.jobId, sendResponse);
        break;
      case 'EXCHANGE_SPOTIFY_CODE_DIRECT':
        this.handleExchangeSpotifyCodeDirect(message, sendResponse);
        break;
      case 'CLOSE_TAB':
        if (sender.tab?.id) {
          chrome.tabs.remove(sender.tab.id).catch(() => {});
        }
        break;
      default:
        console.warn('Unknown message type:', type);
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private async handleAddTrackToPlaylist(data: any, sendResponse: (response?: any) => void) {
    try {
      const { youtubeUrl, playlistId, download, downloadOptions } = data;

      if (!youtubeUrl || !playlistId) {
        sendResponse({ error: 'YouTube URL and playlist ID are required' });
        return;
      }

      const job = await this.addTrackToPlaylist(youtubeUrl, playlistId, download, downloadOptions);
      sendResponse({ success: true, jobId: job.jobId });

    } catch (error) {
      console.error('Add track failed:', error);
      sendResponse({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async addTrackToPlaylist(
    youtubeUrl: string, 
    playlistId: string,
    enableDownload: boolean = false,
    downloadOptions?: DownloadOptions
  ): Promise<AddTrackJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: AddTrackJob = {
      jobId,
      youtubeUrl,
      playlistId,
      status: 'queued',
      progress: 0,
      downloadInfo: { enabled: enableDownload },
      createdAt: new Date().toISOString(),
      currentStep: 'Initializing...',
      startedAt: Date.now()
    };

    this.activeJobs.set(jobId, job);

    try {
      job.status = 'searching';
      job.progress = 10;
      job.currentStep = 'Fetching YouTube metadata...';
      this.activeJobs.set(jobId, { ...job });
      
      const metadata = await this.extractYouTubeMetadata(youtubeUrl);
      
      if (!metadata) {
        throw new Error('Could not extract video metadata');
      }

      job.trackInfo = {
        title: metadata.title,
        artist: metadata.artist
      };
      
      job.currentStep = 'Searching Spotify...';
      this.activeJobs.set(jobId, { 
        ...job, 
        trackInfo: { title: metadata.title, artist: metadata.artist }, 
        thumbnail: metadata.thumbnail 
      });
      
      job.progress = 30;

      const searchResults = await this.searchOnSpotify(metadata.title, metadata.artist, metadata.duration);
      job.progress = 50;

      let spotifyMatchFound = !!searchResults.exactMatch;

      if (!spotifyMatchFound) {
        // Try YouTube Music fallback
        const settings = await this.getSettings();
        const fallbackMode = settings.spotifyFallbackMode || 'auto';
        
        if (fallbackMode !== 'never') {
          const videoId = this.extractVideoId(youtubeUrl);
          if (videoId) {
            job.currentStep = 'Trying YouTube Music metadata...';
            this.activeJobs.set(jobId, { ...job });
            
            const musicMetadata = await YouTubeMetadataService.fetchMusicMetadata(videoId);
            
            if (musicMetadata) {
              console.log('[TunePort BG] Found YouTube Music metadata:', musicMetadata);
              
              if (fallbackMode === 'ask') {
                // Set job to awaiting_fallback and wait for user confirmation
                job.status = 'awaiting_fallback';
                job.fallbackMetadata = musicMetadata;
                job.currentStep = 'Waiting for confirmation...';
                this.activeJobs.set(jobId, { ...job });
                return job; // Return early, user will confirm/reject via message
              }
              
              // Auto mode - try searching with new metadata
              job.currentStep = 'Searching Spotify with new metadata...';
              this.activeJobs.set(jobId, { ...job });
              
              const fallbackResults = await this.searchOnSpotify(
                musicMetadata.title,
                musicMetadata.artist,
                metadata.duration
              );
              
              if (fallbackResults.exactMatch) {
                searchResults.exactMatch = fallbackResults.exactMatch;
                job.trackInfo = {
                  title: musicMetadata.title,
                  artist: musicMetadata.artist,
                  spotifyTrack: fallbackResults.exactMatch
                };
                spotifyMatchFound = true;
              }
            }
          }
        }

        if (!spotifyMatchFound && !enableDownload) {
          throw new Error('Could not find matching track on Spotify');
        }
      }

      let result = { added: false, duplicate: false };

      if (spotifyMatchFound) {
        job.trackInfo!.spotifyTrack = searchResults.exactMatch;
        job.status = 'adding';
        job.progress = 60;
        job.currentStep = 'Adding to playlist...';
        this.activeJobs.set(jobId, { ...job });

        result = await this.addToPlaylist(playlistId, searchResults.exactMatch.uri);
        job.progress = 70;
      } else {
        console.log('[TunePort BG] Spotify match failed, proceeding to download logic');
      }

      if (enableDownload && downloadOptions) {
        job.status = 'downloading';
        job.currentStep = 'Downloading audio...';
        this.activeJobs.set(jobId, { ...job });

        const format = (downloadOptions.format || 'best') as AudioFormat;
        this.log(`[Download] Starting download: ${youtubeUrl}, format: ${format}`);

        const downloadResult = await DownloadService.downloadAudio(
          youtubeUrl,
          metadata.title,
          metadata.artist,
          { format, preferLossless: true }
        );

        this.log(`[Download] Result: success=${downloadResult.success}, source=${downloadResult.source}, quality=${downloadResult.quality}${downloadResult.error ? ', error=' + downloadResult.error : ''}`);

        if (downloadResult.success && downloadResult.downloadId !== undefined) {
          job.downloadInfo = {
            enabled: true,
            quality: downloadResult.quality,
            source: downloadResult.source,
            filename: downloadResult.filename
          };

          if (!downloadResult.isLossless && LucidaService.isEnabled()) {
            console.info('Lossless not available, used YouTube source');
          }

          job.progress = 85;
          this.activeJobs.set(jobId, { ...job });
          this.monitorDownloadJob(jobId, downloadResult.downloadId, result.duplicate, spotifyMatchFound);
          return job;
        }

        job.downloadInfo = {
          enabled: true,
          quality: downloadResult.quality,
          source: downloadResult.source
        };

        const { updatedJob, notice } = applyDownloadInterruption(job, downloadResult.error);
        Object.assign(job, updatedJob);
        this.activeJobs.set(jobId, { ...job });
        if (notice) {
          this.showNotification(notice.title, notice.message, notice.type);
        }
        this.log(`[Download] Failed: ${downloadResult.error}`, 'error');
        return job;
      }

      job.status = 'completed';
      job.progress = 100;
      job.currentStep = undefined;
      this.activeJobs.set(jobId, { ...job });

      if (result.duplicate) {
        this.showNotification(
          'Already in Playlist',
          `"${metadata.title}" is already in this playlist`,
          'success'
        );
      } else {
        const downloadMsg = enableDownload && job.downloadInfo?.filename
          ? ` (Downloaded: ${job.downloadInfo.quality})`
          : '';
        this.showNotification(
          'Added to Spotify',
          `"${metadata.title}" added to playlist${downloadMsg}`,
          'success'
        );
      }


    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.currentStep = undefined;
      this.activeJobs.set(jobId, { ...job });
      
      this.showNotification(
        'Failed',
        job.error,
        'error'
      );
    }

    return job;
  }

  private monitorDownloadJob(jobId: string, downloadId: number, duplicate: boolean, spotifyMatchFound: boolean) {
    const finalizeSuccess = () => {
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      const { updatedJob } = applyDownloadCompletion(job);
      Object.assign(job, updatedJob);
      this.activeJobs.set(jobId, { ...job });

      if (duplicate) {
        this.showNotification(
          'Already in Playlist',
          `"${job.trackInfo?.title || 'Track'}" is already in this playlist`,
          'success'
        );
        return;
      }

      if (!spotifyMatchFound) {
        this.showNotification(
          'Downloaded (Local File)',
          `"${job.trackInfo?.title || 'Track'}" not found on Spotify. Saved to Downloads.`,
          'success'
        );
        return;
      }

      const downloadMsg = job.downloadInfo?.filename
        ? ` (Downloaded: ${job.downloadInfo.quality})`
        : '';

      this.showNotification(
        'Added to Spotify',
        `"${job.trackInfo?.title || 'Track'}" added to playlist${downloadMsg}`,
        'success'
      );
    };

    const finalizeFailure = (error?: string) => {
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      const { updatedJob, notice } = applyDownloadInterruption(job, error);
      Object.assign(job, updatedJob);
      this.activeJobs.set(jobId, { ...job });

      if (notice) {
        this.showNotification(notice.title, notice.message, notice.type);
      }
    };

    const listener = (delta: chrome.downloads.DownloadDelta) => {
      if (delta.id !== downloadId) return;

      if (delta.state?.current === 'complete') {
        chrome.downloads.onChanged.removeListener(listener);
        finalizeSuccess();
      } else if (delta.state?.current === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
        finalizeFailure(delta.error?.current);
      }
    };

    chrome.downloads.onChanged.addListener(listener);

    chrome.downloads.search({ id: downloadId }, (results) => {
      const item = results?.[0];
      if (!item) return;

      if (item.state === 'complete') {
        chrome.downloads.onChanged.removeListener(listener);
        finalizeSuccess();
      } else if (item.state === 'interrupted') {
        chrome.downloads.onChanged.removeListener(listener);
        finalizeFailure(item.error);
      }
    });
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
        const title = data.title || '';
        
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

    const sanitizedTitle = MatchingService.sanitizeTitle(title);
    const parsed = MatchingService.parseArtistTitle(sanitizedTitle);
    
    const effectiveArtist = artist || parsed?.artist || '';
    const effectiveTitle = parsed?.title || sanitizedTitle;
    
    const primaryQuery = effectiveArtist 
      ? `${effectiveArtist} ${effectiveTitle}`
      : effectiveTitle;
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(primaryQuery)}&type=track&limit=20`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '1';
      await this.delay(parseInt(retryAfter, 10) * 1000);
      throw new Error('Rate limited, please try again');
    }

    if (!response.ok) {
      throw new Error('Spotify search failed');
    }

    const data = await response.json();
    const tracks = data.tracks?.items || [];
    
    if (tracks.length === 0 && effectiveArtist) {
      const fallbackResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(effectiveTitle)}&type=track&limit=20`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackTracks = fallbackData.tracks?.items || [];
        const exactMatch = this.findBestMatch(fallbackTracks, effectiveTitle, effectiveArtist, duration);
        return { tracks: fallbackTracks, exactMatch };
      }
    }

    const exactMatch = this.findBestMatch(tracks, effectiveTitle, effectiveArtist, duration);
    
    return { tracks, exactMatch };
  }

  private buildQueryChain(title: string, artist: string): string[] {
    const queries: string[] = [];
    const titleWithoutFeat = MatchingService.removeFeaturing(title);
    
    if (artist) {
      queries.push(`${artist} ${title}`);
      if (titleWithoutFeat !== title) {
        queries.push(`${artist} ${titleWithoutFeat}`);
      }
    }
    
    queries.push(title);

    return queries;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private findBestMatch(tracks: any[], title: string, artist: string, duration: number) {
    if (tracks.length === 0) {
      return null;
    }

    let bestMatch: any = null;
    let bestScore = 0;

    for (const track of tracks) {
      const score = MatchingService.calculateMatchScore(
        title,
        artist || undefined,
        track.name,
        track.artists.map((a: any) => a.name),
        duration > 0 ? duration : undefined,
        track.duration_ms
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = track;
      }
    }

    return MatchingService.isAutoAddable(bestScore) ? bestMatch : null;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    return MatchingService.jaroWinklerSimilarity(str1.toLowerCase(), str2.toLowerCase());
  }

  private async addToPlaylist(playlistId: string, trackUri: string): Promise<{ added: boolean; duplicate: boolean }> {
    const token = await this.getSpotifyToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }

    const isDuplicate = await this.isTrackInPlaylist(playlistId, trackUri, token);
    if (isDuplicate) {
      return { added: false, duplicate: true };
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

    return { added: true, duplicate: false };
  }

  private async isTrackInPlaylist(playlistId: string, trackUri: string, token: string): Promise<boolean> {
    let offset = 0;
    const limit = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=items(track(uri)),total`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) return false;

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

  private async handleSearchSpotifyTrack(msgData: any, sendResponse: (response?: any) => void) {
    try {
      const { title, artist } = msgData;
      const token = await this.getSpotifyToken();
      
      if (!token) {
        sendResponse({ error: 'Not authenticated with Spotify' });
        return;
      }

      let searchQuery = `track:${title}`;
      if (artist) {
        searchQuery += ` artist:${artist}`;
      }

      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const searchData = await searchResponse.json();
      sendResponse({ success: true, tracks: searchData.tracks?.items || [] });

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

  private async handleExchangeSpotifyCodeDirect(message: any, sendResponse: (response?: any) => void) {
    try {
      const { code, redirectUri } = message;

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: '4aa180089db445ce8d6f762329a76f7e',
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
      }

      const tokens = await response.json();
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      
      await chrome.storage.local.set({
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expiry: expiryTime
      });

      this.spotifyToken = tokens.access_token;
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

  private async handleExchangeSpotifyCode(message: any, sendResponse: (response?: any) => void) {
    try {
      const { code, state } = message;
      console.log('[TunePort BG] Exchange code started. Code:', code ? 'exists' : 'null', 'State:', state);

      const stored = await chrome.storage.local.get(['spotify_auth_state', 'spotify_code_verifier']);
      console.log('[TunePort BG] Stored state:', stored.spotify_auth_state);
      
      if (!stored.spotify_auth_state || stored.spotify_auth_state !== state) {
        console.error('[TunePort BG] State mismatch or missing. Stored:', stored.spotify_auth_state, 'Received:', state);
        throw new Error('Invalid state parameter');
      }

      if (!stored.spotify_code_verifier) {
        console.error('[TunePort BG] Missing code verifier');
        throw new Error('Missing code verifier');
      }

      const redirectUri = chrome.runtime.getURL('popup/auth-callback.html');
      console.log('[TunePort BG] Using redirect URI:', redirectUri);

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: '4aa180089db445ce8d6f762329a76f7e',
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: stored.spotify_code_verifier
        })
      });

      console.log('[TunePort BG] Token response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[TunePort BG] Token exchange error:', error);
        throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
      }

      const tokens = await response.json();
      console.log('[TunePort BG] Token exchange success');
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      
      await chrome.storage.local.set({
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expiry: expiryTime
      });

      this.spotifyToken = tokens.access_token;
      await this.updatePlaylistMenu();

      let userName = '';
      try {
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userName = userData.display_name || '';
        }
      } catch {
        // ignore
      }

      sendResponse({ success: true, userName });

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

  private async handleConfirmFallback(jobId: string, sendResponse: (response?: any) => void) {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status !== 'awaiting_fallback' || !job.fallbackMetadata) {
      sendResponse({ error: 'Invalid job state' });
      return;
    }

    try {
      job.status = 'searching';
      job.currentStep = 'Searching Spotify with confirmed metadata...';
      this.activeJobs.set(jobId, { ...job });

      const searchResults = await this.searchOnSpotify(
        job.fallbackMetadata.title,
        job.fallbackMetadata.artist,
        0
      );

      if (!searchResults.exactMatch) {
        job.status = 'failed';
        job.error = 'Could not find matching track on Spotify with confirmed metadata';
        job.currentStep = undefined;
        this.activeJobs.set(jobId, { ...job });
        sendResponse({ success: false, error: job.error });
        return;
      }

      job.trackInfo = {
        title: job.fallbackMetadata.title,
        artist: job.fallbackMetadata.artist,
        spotifyTrack: searchResults.exactMatch
      };

      job.status = 'adding';
      job.progress = 60;
      job.currentStep = 'Adding to playlist...';
      this.activeJobs.set(jobId, { ...job });

      const result = await this.addToPlaylist(job.playlistId, searchResults.exactMatch.uri);
      job.progress = 70;

      if (job.downloadInfo?.enabled) {
        job.status = 'downloading';
        job.currentStep = 'Downloading audio...';
        this.activeJobs.set(jobId, { ...job });

        const downloadResult = await DownloadService.downloadAudio(
          job.youtubeUrl,
          job.fallbackMetadata.title,
          job.fallbackMetadata.artist,
          { format: 'best' as AudioFormat, preferLossless: true }
        );

        if (downloadResult.success && downloadResult.downloadId !== undefined) {
          job.downloadInfo = {
            enabled: true,
            quality: downloadResult.quality,
            source: downloadResult.source,
            filename: downloadResult.filename
          };
          job.progress = 85;
          this.activeJobs.set(jobId, { ...job });
          this.monitorDownloadJob(jobId, downloadResult.downloadId, result.duplicate, true);
          sendResponse({ success: true });
          return;
        }

        job.downloadInfo = {
          enabled: true,
          quality: downloadResult.quality,
          source: downloadResult.source
        };

        const { updatedJob, notice } = applyDownloadInterruption(job, downloadResult.error);
        Object.assign(job, updatedJob);
        this.activeJobs.set(jobId, { ...job });
        if (notice) {
          this.showNotification(notice.title, notice.message, notice.type);
        }
        console.warn('Download failed:', downloadResult.error);
      }

      job.status = 'completed';
      job.progress = 100;
      job.currentStep = undefined;
      this.activeJobs.set(jobId, { ...job });

      const successMsg = result.duplicate ? 'Already in Playlist' : 'Added to Spotify';
      this.showNotification(successMsg, `"${job.fallbackMetadata.title}" by ${job.fallbackMetadata.artist}`, 'success');
      sendResponse({ success: true });


    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.currentStep = undefined;
      this.activeJobs.set(jobId, { ...job });
      sendResponse({ success: false, error: job.error });
    }
  }

  private handleRejectFallback(jobId: string, sendResponse: (response?: any) => void) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      sendResponse({ error: 'Job not found' });
      return;
    }

    job.status = 'failed';
    job.error = 'Fallback rejected by user';
    job.currentStep = undefined;
    this.activeJobs.set(jobId, { ...job });
    sendResponse({ success: true });
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
    console.log(type);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl,
      title,
      message
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TunePort] Extension installed/updated, creating context menu');
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'tuneport-main',
      title: 'TunePort',
      contexts: ['page', 'video', 'link'],
      documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
    });

    chrome.contextMenus.create({
      id: 'tuneport-add-default',
      parentId: 'tuneport-main',
      title: 'Add to Spotify',
      contexts: ['page', 'video', 'link'],
      documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
    });

    chrome.contextMenus.create({
      id: 'tuneport-add-download',
      parentId: 'tuneport-main',
      title: 'Add to Spotify + Download',
      contexts: ['page', 'video', 'link'],
      documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
    });

    chrome.contextMenus.create({
      id: 'tuneport-separator',
      parentId: 'tuneport-main',
      type: 'separator',
      contexts: ['page', 'video', 'link'],
      documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
    });

    chrome.contextMenus.create({
      id: 'tuneport-settings',
      parentId: 'tuneport-main',
      title: 'Settings',
      contexts: ['page', 'video', 'link'],
      documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*', '*://youtu.be/*', '*://music.youtube.com/*']
    });

    console.log('[TunePort] Context menu created');
  });
});

new BackgroundService();
