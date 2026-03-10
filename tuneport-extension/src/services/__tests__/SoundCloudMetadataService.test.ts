import { SoundCloudMetadataService } from '../SoundCloudMetadataService';

describe('SoundCloudMetadataService', () => {
  describe('extractTrackId', () => {
    it('should extract track ID from valid SoundCloud URLs', () => {
      const urls = [
        { url: 'https://soundcloud.com/artist/track-name', expected: 'artist/track-name' },
        { url: 'https://soundcloud.com/artist-name/track-name', expected: 'artist-name/track-name' },
        { url: 'https://www.soundcloud.com/artist/track-name', expected: 'artist/track-name' },
        { url: 'https://soundcloud.com/user-123/my-song', expected: 'user-123/my-song' },
      ];

      urls.forEach(({ url, expected }) => {
        expect(SoundCloudMetadataService.extractTrackId(url)).toBe(expected);
      });
    });

    it('should return null for invalid URLs', () => {
      const urls = [
        'https://youtube.com/watch?v=123',
        'https://google.com',
        'not-a-url',
        'https://soundcloud.com/',  // Missing track
        'https://soundcloud.com/artist',  // Missing track name
      ];

      urls.forEach((url) => {
        expect(SoundCloudMetadataService.extractTrackId(url)).toBeNull();
      });
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid SoundCloud URLs', () => {
      expect(SoundCloudMetadataService.isValidUrl('https://soundcloud.com/artist/track')).toBe(true);
      expect(SoundCloudMetadataService.isValidUrl('https://www.soundcloud.com/user/song')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(SoundCloudMetadataService.isValidUrl('https://youtube.com/watch?v=123')).toBe(false);
      expect(SoundCloudMetadataService.isValidUrl('')).toBe(false);
      expect(SoundCloudMetadataService.isValidUrl('https://soundcloud.com/artist')).toBe(false);
    });
  });

  describe('extractMetadata', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should extract metadata from oEmbed response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Artist Name - Track Title',
          author_name: 'Artist Name',
          thumbnail_url: 'https://i1.sndcdn.com/artwork.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const url = 'https://soundcloud.com/artist/track';
      const metadata = await SoundCloudMetadataService.extractMetadata(url);

      expect(metadata).not.toBeNull();
      expect(metadata?.id).toBe('artist/track');
      expect(metadata?.title).toBe('Track Title');
      expect(metadata?.artist).toBe('Artist Name');
      expect(metadata?.thumbnail).toBe('https://i1.sndcdn.com/artwork.jpg');
      expect(metadata?.duration).toBe(0);
      expect(metadata?.url).toBe(url);
    });

    it('should handle oEmbed response without artist in title', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Just a Track Name',
          author_name: 'The Artist',
          thumbnail_url: 'https://i1.sndcdn.com/artwork.jpg',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const url = 'https://soundcloud.com/artist/track';
      const metadata = await SoundCloudMetadataService.extractMetadata(url);

      expect(metadata).not.toBeNull();
      expect(metadata?.title).toBe('Just a Track Name');
      expect(metadata?.artist).toBe('The Artist');
    });

    it('should return null when fetch fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const metadata = await SoundCloudMetadataService.extractMetadata('https://soundcloud.com/artist/track');
      expect(metadata).toBeNull();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const metadata = await SoundCloudMetadataService.extractMetadata('https://soundcloud.com/artist/track');
      expect(metadata).toBeNull();
    });

    it('should encode URL properly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Track',
          author_name: 'Artist',
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const url = 'https://soundcloud.com/artist/track name with spaces';
      await SoundCloudMetadataService.extractMetadata(url);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain(encodeURIComponent(url));
    });
  });
});
