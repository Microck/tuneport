// Use global chrome
import { SoundCloudMetadataService } from '../services/SoundCloudMetadataService';

// Content script for YouTube and SoundCloud integration
class TrackContentScript {
  private currentVideoData: any = null;
  private observer: MutationObserver | null = null;

  constructor() {
    this.initializeContentScript();
  }

  private async initializeContentScript() {
    try {
      // Wait for page to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupObserver());
      } else {
        this.setupObserver();
      }

      // Listen for messages from background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
      });

      console.log('TunePort Content Script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  private setupObserver() {
    // Observe changes in the page to detect track changes
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.handlePageChange();
        }
      });
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial setup
    this.handlePageChange();
  }

  private handlePageChange() {
    const url = window.location.href;
    
    if (this.isYouTubeUrl(url)) {
      const videoData = this.extractYouTubeData();
      if (videoData && this.isNewVideo(videoData)) {
        this.currentVideoData = { ...videoData, source: 'youtube' };
        this.updateContextMenuData();
        console.log('New YouTube video detected:', videoData.title);
      }
    } else if (this.isSoundCloudUrl(url)) {
      const trackData = this.extractSoundCloudData();
      if (trackData && this.isNewTrack(trackData)) {
        this.currentVideoData = trackData;
        this.updateContextMenuData();
        console.log('New SoundCloud track detected:', trackData.title);
      }
    }
  }

  private isYouTubeUrl(url: string): boolean {
    return /youtube\.com|youtu\.be/.test(url);
  }

  private isSoundCloudUrl(url: string): boolean {
    return /soundcloud\.com\/[\w-]+\/[\w-]+/.test(url);
  }

  private extractYouTubeData() {
    try {
      // Extract video ID from URL
      const url = window.location.href;
      const videoId = this.extractYouTubeVideoId(url);
      
      if (!videoId) return null;

      // Extract title
      let title = '';
      const titleElement = document.querySelector('h1.title yt-formatted-string, h1.title') ||
                          document.querySelector('h1.ytd-video-primary-info-renderer') ||
                          document.querySelector('h1');
      
      if (titleElement) {
        title = titleElement.textContent?.trim() || '';
      }

      // Extract channel name
      let channelName = '';
      const channelElement = document.querySelector('#channel-name a, .ytd-channel-name a, a.yt-simple-endpoint');
      if (channelElement) {
        channelName = channelElement.textContent?.trim() || '';
      }

      // Extract thumbnail
      const thumbnailElement = document.querySelector('#movie_player img, .ytp-videowall-still img') as HTMLImageElement;
      const thumbnail = thumbnailElement?.src || '';

      // Extract duration
      let duration = '';
      const durationElement = document.querySelector('.ytp-time-duration');
      if (durationElement) {
        duration = durationElement.textContent || '';
      }

      return {
        videoId,
        title,
        channelName,
        duration,
        thumbnail,
        url: window.location.href
      };

    } catch (error) {
      console.error('Failed to extract YouTube data:', error);
      return null;
    }
  }

  private extractSoundCloudData() {
    try {
      // SoundCloud DOM selectors (as of 2026)
      const titleSelectors = [
        '.soundTitle__title span',
        '.sc-truncate.sc-type-h1',
        '[data-testid="track-title"]',
        'h1.soundTitle__title'
      ];

      const artistSelectors = [
        '.soundTitle__username',
        '.sc-type-light.sc-link-primary',
        '[data-testid="track-artist"]',
        '.soundTitle__usernameText'
      ];

      const artworkSelectors = [
        '.sound__artwork img',
        '.sc-artwork img',
        '.fullHero__artwork img',
        '[data-testid="track-artwork"] img'
      ];

      const titleEl = this.findFirstElement(titleSelectors);
      const artistEl = this.findFirstElement(artistSelectors);
      const artworkEl = this.findFirstElement(artworkSelectors) as HTMLImageElement | null;

      let title = titleEl?.textContent?.trim() || '';
      let artist = artistEl?.textContent?.trim() || '';

      // Parse "Artist - Track Name" format if present
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const trackId = SoundCloudMetadataService.extractTrackId(window.location.href);

      return {
        videoId: trackId || window.location.pathname.slice(1),
        title,
        channelName: artist,
        duration: '',
        thumbnail: artworkEl?.src || '',
        url: window.location.href,
        source: 'soundcloud'
      };
    } catch (error) {
      console.error('Failed to extract SoundCloud data:', error);
      return null;
    }
  }

  private findFirstElement(selectors: string[]): Element | null {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  private isNewVideo(videoData: any): boolean {
    return !this.currentVideoData || 
           this.currentVideoData.videoId !== videoData.videoId;
  }

  private isNewTrack(trackData: any): boolean {
    return !this.currentVideoData || 
           this.currentVideoData.videoId !== trackData.videoId;
  }

  private async updateContextMenuData() {
    try {
      // Store current track data for context menu
      await chrome.storage.local.set({
        currentVideoData: this.currentVideoData
      });

      // Update context menu with current track info
      chrome.runtime.sendMessage({
        type: 'CURRENT_VIDEO_UPDATED',
        data: this.currentVideoData
      });

    } catch (error) {
      console.error('Failed to update context menu data:', error);
    }
  }

  private handleMessage(message: any, _sender: any, sendResponse: (response?: any) => void) {
    switch (message.type) {
      case 'GET_CURRENT_VIDEO_DATA':
        sendResponse({
          success: true,
          data: this.currentVideoData
        });
        break;

      case 'EXTRACT_PAGE_DATA':
        sendResponse({
          success: true,
          data: {
            url: window.location.href,
            title: document.title,
            videoData: this.currentVideoData
          }
        });
        break;

      case 'GET_PAGE_METADATA': {
        const metadata = this.extractPageMetadata();
        sendResponse({
          success: true,
          metadata: metadata
        });
        break;
      }

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private extractPageMetadata() {
    try {
      const metadata: any = {
        url: window.location.href,
        title: document.title,
        description: '',
        keywords: '',
        ogImage: '',
        timestamp: new Date().toISOString()
      };

      // Extract meta description
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        metadata.description = descriptionMeta.getAttribute('content') || '';
      }

      // Extract Open Graph image
      const ogImageMeta = document.querySelector('meta[property="og:image"]');
      if (ogImageMeta) {
        metadata.ogImage = ogImageMeta.getAttribute('content') || '';
      }

      // Extract keywords
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (keywordsMeta) {
        metadata.keywords = keywordsMeta.getAttribute('content') || '';
      }

      // Extract JSON-LD structured data
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      if (jsonLdScripts.length > 0) {
        try {
          const jsonLdData = JSON.parse(jsonLdScripts[0].textContent || '{}');
          metadata.structuredData = jsonLdData;
        } catch (e) {
          console.log('Failed to parse JSON-LD data');
        }
      }

      return metadata;

    } catch (error) {
      console.error('Failed to extract page metadata:', error);
      return {};
    }
  }

  public getCurrentVideoData() {
    return this.currentVideoData;
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize content script
const tuneportContentScript = new TrackContentScript();

// Handle context menu clicks
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CONTEXT_MENU_CLICKED') {
    const { menuItemId, sourceUrl } = message.data;
    
    // Get current track data
    const trackData = tuneportContentScript.getCurrentVideoData();
    
    if (trackData && trackData.url) {
      // Send download request to background script
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_VIDEO',
        data: {
          sourceUrl: trackData.url,
          menuItemId: menuItemId,
          videoData: trackData
        }
      });
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  tuneportContentScript.destroy();
});