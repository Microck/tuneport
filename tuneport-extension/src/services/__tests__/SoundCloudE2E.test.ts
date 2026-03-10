/**
 * E2E Tests for SoundCloud Integration
 * 
 * These tests verify the complete SoundCloud flow from URL detection
 * to metadata extraction and preparation for Spotify matching.
 */

import { SoundCloudMetadataService } from '../SoundCloudMetadataService';

describe('SoundCloud E2E - Full Integration Flow', () => {
  const mockOEmbedResponse = {
    version: 1,
    type: 'rich',
    title: 'Test Artist - Test Track Name',
    author_name: 'Test Artist',
    thumbnail_url: 'https://i1.sndcdn.com/artworks-test.jpg',
    provider_name: 'SoundCloud',
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('URL Detection and Validation', () => {
    const validSoundCloudUrls = [
      'https://soundcloud.com/artist/track-name',
      'https://soundcloud.com/artist-name/track-name',
      'https://www.soundcloud.com/user-123/my-song',
      'https://soundcloud.com/artist/track-name-with-dashes',
      'https://soundcloud.com/artist/track_name_with_underscores',
    ];

    const invalidUrls = [
      'https://youtube.com/watch?v=123',
      'https://youtu.be/abc123',
      'https://google.com',
      'https://soundcloud.com/',  // Missing track
      'https://soundcloud.com/artist',  // Missing track name
      'not-a-url',
      '',
    ];

    it('should detect all valid SoundCloud URLs', () => {
      validSoundCloudUrls.forEach((url) => {
        const result = SoundCloudMetadataService.isValidUrl(url);
        expect(result).toBe(true);
      });
    });

    it('should reject all invalid URLs', () => {
      invalidUrls.forEach((url) => {
        const result = SoundCloudMetadataService.isValidUrl(url);
        expect(result).toBe(false);
      });
    });

    it('should extract track IDs correctly', () => {
      const testCases = [
        { url: 'https://soundcloud.com/artist/track', expected: 'artist/track' },
        { url: 'https://soundcloud.com/artist-name/track-name', expected: 'artist-name/track-name' },
        { url: 'https://www.soundcloud.com/user/song', expected: 'user/song' },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(SoundCloudMetadataService.extractTrackId(url)).toBe(expected);
      });
    });
  });

  describe('oEmbed API Integration', () => {
    it('should successfully fetch and parse metadata from oEmbed API', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockOEmbedResponse),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const url = 'https://soundcloud.com/test-artist/test-track';
      const metadata = await SoundCloudMetadataService.extractMetadata(url);

      expect(metadata).not.toBeNull();
      expect(metadata?.title).toBe('Test Track Name');
      expect(metadata?.artist).toBe('Test Artist');
      expect(metadata?.thumbnail).toBe('https://i1.sndcdn.com/artworks-test.jpg');
      expect(metadata?.id).toBe('test-artist/test-track');
      expect(metadata?.duration).toBe(0);
      expect(metadata?.url).toBe(url);

      // Verify fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/nonexistent/track'
      );

      expect(metadata).toBeNull();
    });

    it('should handle network failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/artist/track'
      );

      expect(metadata).toBeNull();
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/artist/track'
      );

      expect(metadata).toBeNull();
    });
  });

  describe('Title Parsing Logic', () => {
    it('should correctly parse "Artist - Track" format', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'The Beatles - Hey Jude',
          author_name: 'The Beatles',
          thumbnail_url: 'https://example.com/thumb.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/beatles/hey-jude'
      );

      expect(metadata?.artist).toBe('The Beatles');
      expect(metadata?.title).toBe('Hey Jude');
    });

    it('should handle titles with multiple dashes', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Artist - Track - Remix',
          author_name: 'Artist',
          thumbnail_url: 'https://example.com/thumb.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/artist/track-remix'
      );

      expect(metadata?.artist).toBe('Artist');
      expect(metadata?.title).toBe('Track - Remix');
    });

    it('should handle titles without dashes', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Just A Track Name',
          author_name: 'Some Artist',
          thumbnail_url: 'https://example.com/thumb.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/artist/track'
      );

      expect(metadata?.artist).toBe('Some Artist');
      expect(metadata?.title).toBe('Just A Track Name');
    });

    it('should handle missing fields gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: '',
          author_name: '',
          thumbnail_url: '',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/artist/track'
      );

      expect(metadata).not.toBeNull();
      expect(metadata?.title).toBe('');
      expect(metadata?.artist).toBe('');
      expect(metadata?.thumbnail).toBe('');
    });
  });

  describe('DOM Extraction', () => {
    beforeEach(() => {
      // Mock DOM elements
      document.body.innerHTML = `
        <div class="soundTitle__title"><span>Test Artist - Test Track</span></div>
        <div class="soundTitle__username">Test Artist</div>
        <div class="sound__artwork">
          <img src="https://i1.sndcdn.com/artwork.jpg" />
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should extract metadata from DOM when available', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://soundcloud.com/test-artist/test-track',
          pathname: '/test-artist/test-track',
        },
        writable: true,
      });

      const metadata = SoundCloudMetadataService.extractFromDOM();

      expect(metadata).not.toBeNull();
      expect(metadata?.title).toBe('Test Track');
      expect(metadata?.artist).toBe('Test Artist');
      expect(metadata?.thumbnail).toBe('https://i1.sndcdn.com/artwork.jpg');
      // Note: source property is added by content script, not the service itself
      expect(metadata?.id).toBe('test-artist/test-track');
    });

    it('should return null when not on a track page', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://soundcloud.com',
          pathname: '/',
        },
        writable: true,
      });

      const metadata = SoundCloudMetadataService.extractFromDOM();
      expect(metadata).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long URLs', async () => {
      const longUrl = 'https://soundcloud.com/' + 'a'.repeat(100) + '/' + 'b'.repeat(100);
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Artist - Track',
          author_name: 'Artist',
          thumbnail_url: 'https://example.com/thumb.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(longUrl);
      expect(metadata).not.toBeNull();
    });

    it('should handle URLs with special characters', async () => {
      const specialUrl = 'https://soundcloud.com/artist/track%20with%20spaces';
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Artist - Track',
          author_name: 'Artist',
          thumbnail_url: 'https://example.com/thumb.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(specialUrl);
      expect(metadata).not.toBeNull();
    });

    it('should handle rate limiting responses', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata(
        'https://soundcloud.com/artist/track'
      );

      expect(metadata).toBeNull();
    });
  });
});
