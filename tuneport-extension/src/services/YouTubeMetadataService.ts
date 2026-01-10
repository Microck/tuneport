

interface YouTubeMetadata {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  url: string;
}

export interface YouTubeMusicMetadata {
  title: string;
  artist: string;
  source: 'youtube_music' | 'description_parse' | 'title_parse';
  confidence: 'high' | 'medium' | 'low';
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

  static async fetchMusicMetadata(videoId: string): Promise<YouTubeMusicMetadata | null> {
    console.log('[YouTubeMetadataService] fetchMusicMetadata for:', videoId);
    
    const ytMusicResult = await this.tryYouTubeMusicOEmbed(videoId);
    if (ytMusicResult) {
      console.log('[YouTubeMetadataService] Found via YouTube Music oEmbed:', ytMusicResult);
      return ytMusicResult;
    }
    
    const regularOEmbed = await this.fetchViaOEmbed(videoId);
    if (regularOEmbed.title) {
      const parsed = this.parseCleanMusicTitle(regularOEmbed.title, regularOEmbed.artist || '');
      if (parsed) {
        console.log('[YouTubeMetadataService] Parsed from title:', parsed);
        return parsed;
      }
    }
    
    console.log('[YouTubeMetadataService] No music metadata found');
    return null;
  }

  private static async tryYouTubeMusicOEmbed(videoId: string): Promise<YouTubeMusicMetadata | null> {
    try {
      const ytMusicUrl = `https://music.youtube.com/watch?v=${videoId}`;
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(ytMusicUrl)}&format=json`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.title && data.author_name) {
        const cleanTitle = this.sanitizeMusicTitle(data.title);
        
        if (data.title.includes(' - ')) {
          const parts = data.title.split(' - ');
          return {
            title: this.sanitizeMusicTitle(parts.slice(1).join(' - ')),
            artist: parts[0].trim(),
            source: 'youtube_music',
            confidence: 'high'
          };
        }
        
        return {
          title: cleanTitle,
          artist: data.author_name,
          source: 'youtube_music',
          confidence: 'medium'
        };
      }
      
      return null;
    } catch (error) {
      console.log('[YouTubeMetadataService] YouTube Music oEmbed failed:', error);
      return null;
    }
  }

  private static parseCleanMusicTitle(title: string, channelName: string): YouTubeMusicMetadata | null {
    const cleanTitle = this.sanitizeMusicTitle(title);
    
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      return {
        title: parts.slice(1).join(' - ').trim(),
        artist: parts[0].trim(),
        source: 'title_parse',
        confidence: 'medium'
      };
    }
    
    if (channelName && !channelName.toLowerCase().includes('vevo') && 
        !channelName.toLowerCase().includes('official')) {
      return {
        title: cleanTitle,
        artist: channelName,
        source: 'title_parse',
        confidence: 'low'
      };
    }
    
    return null;
  }

  private static sanitizeMusicTitle(title: string): string {
    return title
      .replace(/\s*\(?\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?\s*\)?\s*/gi, '')
      .replace(/\s*\[?\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?\s*\]?\s*/gi, '')
      .replace(/\s*\(?\s*lyrics?\s*(video)?\s*\)?\s*/gi, '')
      .replace(/\s*\[?\s*lyrics?\s*(video)?\s*\]?\s*/gi, '')
      .replace(/\s*\(?\s*audio\s*(only)?\s*\)?\s*/gi, '')
      .replace(/\s*\[?\s*audio\s*(only)?\s*\]?\s*/gi, '')
      .replace(/\s*\(?\s*visualizer\s*\)?\s*/gi, '')
      .replace(/\s*\[?\s*visualizer\s*\]?\s*/gi, '')
      .replace(/\s*\(?\s*hd\s*\)?\s*/gi, '')
      .replace(/\s*\[?\s*hd\s*\]?\s*/gi, '')
      .replace(/\s*\(?\s*4k\s*\)?\s*/gi, '')
      .replace(/\s*\[?\s*4k\s*\]?\s*/gi, '')
      .replace(/\s*\|\s*.*$/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
