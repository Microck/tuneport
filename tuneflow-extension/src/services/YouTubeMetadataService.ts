import { ChromeMessageService } from './ChromeMessageService';

interface YouTubeMetadata {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  url: string;
}

export class YouTubeMetadataService {
  /**
   * Extract metadata from the current YouTube page
   */
  static async extractFromCurrentPage(): Promise<YouTubeMetadata | null> {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        return null;
      }

      // Check if it's a YouTube video page
      const videoId = this.extractVideoId(tab.url);
      if (!videoId) {
        return null;
      }

      // Execute script in the content script to get metadata
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: this.extractMetadataFromDOM
      });

      if (result && result[0]) {
        const metadata = result[0].result as any;
        return {
          videoId,
          title: metadata.title,
          artist: metadata.artist,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: metadata.duration || 0,
          url: tab.url
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to extract YouTube metadata:', error);
      return null;
    }
  }

  /**
   * Extract video ID from URL
   */
  static extractVideoId(url: string): string | null {
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

  /**
   * Extract metadata from the DOM (executed in content script)
   */
  private static extractMetadataFromDOM() {
    const metadata = {
      title: '',
      artist: '',
      duration: 0
    };

    // Try multiple selectors for title
    const titleSelectors = [
      'meta[name="title"]',
      'h1.ytd-video-primary-info-renderer',
      'h1.title',
      '#container h1'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.getAttribute('content') || element.textContent?.trim();
        if (text) {
          metadata.title = text;
          break;
        }
      }
    }

    // Extract artist from title (common format: "Artist - Song Name")
    if (metadata.title && metadata.title.includes(' - ')) {
      const parts = metadata.title.split(' - ');
      metadata.artist = parts[0].trim();
      // Keep the full title, but note the artist
    } else {
      // Try to find channel name as artist fallback
      const channelSelectors = [
        'ytd-video-owner-renderer a',
        'yt-formatted-string.ytd-channel-name a',
        '.ytd-channel-name a'
      ];

      for (const selector of channelSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          metadata.artist = element.textContent.trim();
          break;
        }
      }
    }

    // Try to get duration
    const durationSelectors = [
      '.ytp-time-duration',
      'span.ytd-thumbnail-overlay-time-status-renderer',
      'meta[itemprop="duration"]'
    ];

    for (const selector of durationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.getAttribute('content') || element.textContent?.trim();
        if (text) {
          metadata.duration = this.parseDuration(text);
          break;
        }
      }
    }

    return metadata;
  }

  /**
   * Parse duration string to seconds
   */
  private static parseDuration(duration: string): number {
    // Handle ISO 8601 duration (PT4M30S)
    const isoMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (isoMatch) {
      const hours = parseInt(isoMatch[1] || '0');
      const minutes = parseInt(isoMatch[2] || '0');
      const seconds = parseInt(isoMatch[3] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    }

    // Handle MM:SS format
    const timeMatch = duration.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      return minutes * 60 + seconds;
    }

    return 0;
  }

  /**
   * Search YouTube metadata via oEmbed (fallback method)
   */
  static async fetchViaOEmbed(videoId: string): Promise<Partial<YouTubeMetadata>> {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      
      if (!response.ok) {
        throw new Error('oEmbed request failed');
      }

      const data = await response.json();
      return {
        videoId,
        title: data.title,
        artist: data.author_name || '',
        thumbnail: data.thumbnail_url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (error) {
      console.error('Failed to fetch via oEmbed:', error);
      throw error;
    }
  }

  /**
   * Validate YouTube URL
   */
  static isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Format duration from seconds to MM:SS
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
