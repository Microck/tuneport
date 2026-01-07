import { chrome } from 'webextension-polyfill';

// Content script for YouTube integration
class YouTubeContentScript {
  private currentVideoData: any = null;
  private observer: MutationObserver | null = null;

  constructor() {
    this.initializeContentScript();
  }

  private async initializeContentScript() {
    try {
      // Wait for YouTube to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupYouTubeObserver());
      } else {
        this.setupYouTubeObserver();
      }

      // Listen for messages from background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
      });

      console.log('TuneFlow Content Script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  private setupYouTubeObserver() {
    // Observe changes in the page to detect video changes
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
    // Detect if we're on a video page
    const videoElement = this.getVideoElement();
    const videoData = this.extractVideoData();

    if (videoData && this.isNewVideo(videoData)) {
      this.currentVideoData = videoData;
      this.updateContextMenuData();
      console.log('New video detected:', videoData.title);
    }
  }

  private getVideoElement(): HTMLVideoElement | null {
    return document.querySelector('video');
  }

  private extractVideoData() {
    try {
      // Extract video ID from URL
      const url = window.location.href;
      const videoId = this.extractVideoId(url);
      
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
      console.error('Failed to extract video data:', error);
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
      if (match) return match[1];
    }

    return null;
  }

  private isNewVideo(videoData: any): boolean {
    return !this.currentVideoData || 
           this.currentVideoData.videoId !== videoData.videoId;
  }

  private async updateContextMenuData() {
    try {
      // Store current video data for context menu
      await chrome.storage.local.set({
        currentVideoData: this.currentVideoData
      });

      // Update context menu with current video info
      chrome.runtime.sendMessage({
        type: 'CURRENT_VIDEO_UPDATED',
        data: this.currentVideoData
      });

    } catch (error) {
      console.error('Failed to update context menu data:', error);
    }
  }

  private handleMessage(message: any, sender: any, sendResponse: (response?: any) => void) {
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

      case 'GET_PAGE_METADATA':
        const metadata = this.extractPageMetadata();
        sendResponse({
          success: true,
          metadata: metadata
        });
        break;

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
const tuneflowContentScript = new YouTubeContentScript();

// Handle context menu clicks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTEXT_MENU_CLICKED') {
    const { menuItemId, youtubeUrl } = message.data;
    
    // Get current video data
    const videoData = tuneflowContentScript.getCurrentVideoData();
    
    if (videoData && videoData.url) {
      // Send download request to background script
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_VIDEO',
        data: {
          youtubeUrl: videoData.url,
          menuItemId: menuItemId,
          videoData: videoData
        }
      });
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  tuneflowContentScript.destroy();
});