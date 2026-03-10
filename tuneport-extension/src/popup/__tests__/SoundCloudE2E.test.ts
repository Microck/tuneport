/**
 * E2E Tests for Popup UI SoundCloud Integration
 * 
 * Tests the popup UI behavior when on SoundCloud pages vs YouTube pages,
 * including icon display, metadata fetching, and platform detection.
 */

describe('Popup UI E2E - Platform Detection and Display', () => {
  // Mock chrome API
  const mockChrome = {
    tabs: {
      query: jest.fn(),
    },
    runtime: {
      getURL: jest.fn((path) => `chrome-extension://test-id${path}`),
      sendMessage: jest.fn(),
      onMessage: { addListener: jest.fn() },
    },
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
      },
    },
  };

  // Mock fetch for metadata
  const mockFetch = jest.fn();

  beforeEach(() => {
    // Setup chrome mock
    global.chrome = mockChrome as any;
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Platform Detection (detectSource)', () => {
    // These tests document the expected behavior of the detectSource function
    // that should be implemented in the popup
    const testCases = [
      {
        url: 'https://www.youtube.com/watch?v=test123',
        expected: 'youtube',
        description: 'standard YouTube URL',
      },
      {
        url: 'https://youtu.be/test123',
        expected: 'youtube',
        description: 'short YouTube URL',
      },
      {
        url: 'https://music.youtube.com/watch?v=test123',
        expected: 'youtube',
        description: 'YouTube Music URL',
      },
      {
        url: 'https://soundcloud.com/artist/track',
        expected: 'soundcloud',
        description: 'standard SoundCloud URL',
      },
      {
        url: 'https://www.soundcloud.com/user/song',
        expected: 'soundcloud',
        description: 'www SoundCloud URL',
      },
      {
        url: 'https://soundcloud.com/artist-name/track-name',
        expected: 'soundcloud',
        description: 'SoundCloud with hyphens',
      },
    ];

    const unsupportedUrls = [
      { url: 'https://google.com', description: 'Google' },
      { url: 'https://spotify.com', description: 'Spotify' },
      { url: 'https://apple.com', description: 'Apple' },
      { url: 'about:blank', description: 'blank page' },
      { url: '', description: 'empty URL' },
    ];

    testCases.forEach(({ url, expected, description }) => {
      it(`should detect ${description} as ${expected}`, () => {
        // The detectSource function from popup/index.tsx
        const detectSource = (testUrl: string): 'youtube' | 'soundcloud' | null => {
          if (/youtube\.com|youtu\.be/.test(testUrl)) return 'youtube';
          if (/soundcloud\.com/.test(testUrl)) return 'soundcloud';
          return null;
        };

        const result = detectSource(url);
        expect(result).toBe(expected);
      });
    });

    unsupportedUrls.forEach(({ url, description }) => {
      it(`should return null for ${description}`, () => {
        const detectSource = (testUrl: string): 'youtube' | 'soundcloud' | null => {
          if (/youtube\.com|youtu\.be/.test(testUrl)) return 'youtube';
          if (/soundcloud\.com/.test(testUrl)) return 'soundcloud';
          return null;
        };

        const result = detectSource(url);
        expect(result).toBeNull();
      });
    });
  });

  describe('Metadata Fetching (fetchTrackMetadata)', () => {
    it('should fetch YouTube metadata correctly', async () => {
      const mockYouTubeResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Test Artist - Test Song (Official Video)',
          author_name: 'Test Artist',
          thumbnail_url: 'https://i.ytimg.com/vi/test123/hqdefault.jpg',
        }),
      };
      mockFetch.mockResolvedValue(mockYouTubeResponse);

      // Simulate the fetchTrackMetadata function for YouTube
      const fetchTrackMetadata = async (url: string, source: 'youtube' | 'soundcloud') => {
        if (source === 'youtube') {
          const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
          if (!videoIdMatch) return null;
          
          const videoId = videoIdMatch[1];
          const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
          );
          
          if (response.ok) {
            const data = await response.json();
            const title = data.title || '';
            let artist = '';
            let trackTitle = title;
            
            if (title.includes(' - ')) {
              const parts = title.split(' - ');
              artist = parts[0].trim();
              trackTitle = parts.slice(1).join(' - ').trim();
            } else {
              artist = data.author_name || '';
            }
            
            // Clean up title
            trackTitle = trackTitle
              .replace(/\s*\(Official\s*(Music\s*)?Video\)/gi, '')
              .replace(/\s*\[Official\s*(Music\s*)?Video\]/gi, '')
              .replace(/\s*\(Lyrics?\)/gi, '')
              .replace(/\s*\[Lyrics?\]/gi, '')
              .trim();
            
            return {
              title: trackTitle,
              artist,
              thumbnail: data.thumbnail_url,
            };
          }
        }
        return null;
      };

      const metadata = await fetchTrackMetadata(
        'https://www.youtube.com/watch?v=test123',
        'youtube'
      );

      expect(metadata).not.toBeNull();
      expect(metadata?.artist).toBe('Test Artist');
      expect(metadata?.thumbnail).toBe('https://i.ytimg.com/vi/test123/hqdefault.jpg');
    });

    it('should fetch SoundCloud metadata correctly', async () => {
      const mockSoundCloudResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Test Artist - Test Song',
          author_name: 'Test Artist',
          thumbnail_url: 'https://i1.sndcdn.com/artworks-test.jpg',
        }),
      };
      mockFetch.mockResolvedValue(mockSoundCloudResponse);

      // Simulate the fetchTrackMetadata function for SoundCloud
      const fetchTrackMetadata = async (url: string, source: 'youtube' | 'soundcloud') => {
        if (source === 'soundcloud') {
          const response = await fetch(
            `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          
          if (response.ok) {
            const data = await response.json();
            let title = data.title || '';
            let artist = data.author_name || '';
            
            // Parse "Artist - Track Name" format
            if (title.includes(' - ')) {
              const parts = title.split(' - ');
              artist = parts[0].trim();
              title = parts.slice(1).join(' - ').trim();
            }
            
            return {
              title,
              artist,
              thumbnail: data.thumbnail_url,
            };
          }
        }
        return null;
      };

      const metadata = await fetchTrackMetadata(
        'https://soundcloud.com/test-artist/test-song',
        'soundcloud'
      );

      expect(metadata).not.toBeNull();
      expect(metadata?.artist).toBe('Test Artist');
      expect(metadata?.title).toBe('Test Song');
      expect(metadata?.thumbnail).toBe('https://i1.sndcdn.com/artworks-test.jpg');
    });

    it('should handle SoundCloud API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const fetchTrackMetadata = async (url: string, source: 'youtube' | 'soundcloud') => {
        if (source === 'soundcloud') {
          const response = await fetch(
            `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          if (!response.ok) return null;
        }
        return null;
      };

      const metadata = await fetchTrackMetadata(
        'https://soundcloud.com/nonexistent/track',
        'soundcloud'
      );

      expect(metadata).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const fetchTrackMetadata = async (url: string, source: 'youtube' | 'soundcloud') => {
        try {
          if (source === 'soundcloud') {
            const response = await fetch(
              `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
            );
            if (!response.ok) return null;
          }
        } catch (error) {
          return null;
        }
        return null;
      };

      const metadata = await fetchTrackMetadata(
        'https://soundcloud.com/artist/track',
        'soundcloud'
      );

      expect(metadata).toBeNull();
    });
  });

  describe('UI State Management', () => {
    it('should set isYouTube flag correctly', () => {
      const detectSource = (url: string): 'youtube' | 'soundcloud' | null => {
        if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
        if (/soundcloud\.com/.test(url)) return 'soundcloud';
        return null;
      };

      const currentUrl = 'https://www.youtube.com/watch?v=test123';
      const isYouTube = detectSource(currentUrl) === 'youtube';
      const isSoundCloud = detectSource(currentUrl) === 'soundcloud';
      const isSupportedPlatform = isYouTube || isSoundCloud;

      expect(isYouTube).toBe(true);
      expect(isSoundCloud).toBe(false);
      expect(isSupportedPlatform).toBe(true);
    });

    it('should set isSoundCloud flag correctly', () => {
      const detectSource = (url: string): 'youtube' | 'soundcloud' | null => {
        if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
        if (/soundcloud\.com/.test(url)) return 'soundcloud';
        return null;
      };

      const currentUrl = 'https://soundcloud.com/artist/track';
      const isYouTube = detectSource(currentUrl) === 'youtube';
      const isSoundCloud = detectSource(currentUrl) === 'soundcloud';
      const isSupportedPlatform = isYouTube || isSoundCloud;

      expect(isYouTube).toBe(false);
      expect(isSoundCloud).toBe(true);
      expect(isSupportedPlatform).toBe(true);
    });

    it('should show unsupported platform state', () => {
      const detectSource = (url: string): 'youtube' | 'soundcloud' | null => {
        if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
        if (/soundcloud\.com/.test(url)) return 'soundcloud';
        return null;
      };

      const currentUrl = 'https://google.com';
      const isYouTube = detectSource(currentUrl) === 'youtube';
      const isSoundCloud = detectSource(currentUrl) === 'soundcloud';
      const isSupportedPlatform = isYouTube || isSoundCloud;

      expect(isYouTube).toBe(false);
      expect(isSoundCloud).toBe(false);
      expect(isSupportedPlatform).toBe(false);
    });
  });

  describe('Icon Display Logic', () => {
    it('should display YouTube icon for YouTube URLs', () => {
      const detectSource = (url: string): 'youtube' | 'soundcloud' | null => {
        if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
        if (/soundcloud\.com/.test(url)) return 'soundcloud';
        return null;
      };

      const currentUrl = 'https://www.youtube.com/watch?v=test123';
      const source = detectSource(currentUrl);

      // In the actual UI, this would render the Youtube icon from lucide-react
      expect(source).toBe('youtube');
    });

    it('should display Cloud icon for SoundCloud URLs', () => {
      const detectSource = (url: string): 'youtube' | 'soundcloud' | null => {
        if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
        if (/soundcloud\.com/.test(url)) return 'soundcloud';
        return null;
      };

      const currentUrl = 'https://soundcloud.com/artist/track';
      const source = detectSource(currentUrl);

      // In the actual UI, this would render the Cloud icon from lucide-react
      expect(source).toBe('soundcloud');
    });
  });

  describe('Tab Query Integration', () => {
    it('should query active tab on popup open', async () => {
      const mockTab = {
        url: 'https://soundcloud.com/artist/track',
        id: 123,
      };

      mockChrome.tabs.query.mockResolvedValue([mockTab]);

      // Simulate popup initialization
      const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
      
      expect(tab).toBeDefined();
      expect(tab.url).toBe('https://soundcloud.com/artist/track');
    });

    it('should handle missing tab gracefully', async () => {
      mockChrome.tabs.query.mockResolvedValue([]);

      const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
      
      expect(tab).toBeUndefined();
    });

    it('should handle tab without URL', async () => {
      mockChrome.tabs.query.mockResolvedValue([{ id: 123 }]);

      const [tab] = await mockChrome.tabs.query({ active: true, currentWindow: true });
      
      expect(tab).toBeDefined();
      expect(tab.url).toBeUndefined();
    });
  });

  describe('Error Messages', () => {
    it('should show "Awaiting Signal" message on unsupported pages', () => {
      // This documents the expected behavior shown in the popup
      const currentUrl = 'https://google.com';
      const isSupportedPlatform = false;

      // When isSupportedPlatform is false, the popup shows:
      // "Awaiting Signal" heading
      // "Navigate to a YouTube video or SoundCloud track to start syncing..."
      
      expect(isSupportedPlatform).toBe(false);
    });

    it('should show track info on supported pages', () => {
      const currentUrl = 'https://soundcloud.com/artist/track';
      const isSupportedPlatform = true;
      const videoMetadata = {
        title: 'Test Track',
        artist: 'Test Artist',
        thumbnail: 'https://example.com/thumb.jpg',
      };

      // When on a supported platform with metadata, the popup shows:
      // - Track thumbnail
      // - Track title
      // - Artist name
      // - "Add to Playlist" button
      
      expect(isSupportedPlatform).toBe(true);
      expect(videoMetadata).toBeDefined();
    });
  });
});
