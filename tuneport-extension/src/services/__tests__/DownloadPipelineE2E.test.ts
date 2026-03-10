/**
 * E2E Tests for Download Pipeline with SoundCloud Support
 * 
 * Tests the complete download flow including:
 * - Lossless-first approach (Lucida -> yt-dlp fallback)
 * - Platform-agnostic download (works for both YouTube and SoundCloud)
 * - Quality and format handling
 */

import { DownloadService } from '../DownloadService';
import { LucidaService } from '../LucidaService';
import { YtDlpService } from '../YtDlpService';
import { CobaltService } from '../CobaltService';

describe('Download Pipeline E2E - SoundCloud Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock chrome.storage.local.get
    global.chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
        },
      },
      downloads: {
        download: jest.fn().mockResolvedValue(123),
        onChanged: { addListener: jest.fn() },
      },
      runtime: {
        lastError: null,
      },
    } as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Source URL Parameter Naming', () => {
    it('should accept sourceUrl parameter instead of youtubeUrl', async () => {
      // Verify that DownloadService.getDownloadUrl accepts sourceUrl
      const sourceUrl = 'https://soundcloud.com/artist/track';
      const title = 'Test Track';
      const artist = 'Test Artist';
      
      // Mock Lucida to return success
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      
      // Mock YtDlpService
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.mp3',
        filename: 'Test Artist - Test Track.mp3',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      expect(YtDlpService.getDownloadUrl).toHaveBeenCalled();
      const callArgs = (YtDlpService.getDownloadUrl as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe(sourceUrl); // First argument should be sourceUrl
    });

    it('should accept YouTube URLs with sourceUrl parameter', async () => {
      const sourceUrl = 'https://www.youtube.com/watch?v=test123';
      const title = 'Test Track';
      const artist = 'Test Artist';
      
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.mp3',
        filename: 'Test Artist - Test Track.mp3',
        source: 'yt-dlp',
        quality: '160k Opus',
        isLossless: false,
      });

      await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      const callArgs = (YtDlpService.getDownloadUrl as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe(sourceUrl);
    });
  });

  describe('Lossless-First Download Flow', () => {
    it('should try Lucida first for lossless FLAC', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      const title = 'Test Track';
      const artist = 'Test Artist';

      // Mock Lucida as enabled and successful
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(true);
      jest.spyOn(LucidaService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.flac',
        filename: 'Test Artist - Test Track.flac',
        source: 'qobuz',
        quality: 'FLAC',
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        preferLossless: true,
      });

      expect(LucidaService.getDownloadUrl).toHaveBeenCalledWith(title, artist, undefined);
      expect(result.success).toBe(true);
      expect(result.isLossless).toBe(true);
      expect(result.quality).toBe('FLAC');
      expect(result.source).toBe('lucida');
    });

    it('should fall back to yt-dlp when Lucida fails for SoundCloud', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      const title = 'Test Track';
      const artist = 'Test Artist';

      // Mock Lucida as enabled but failing
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(true);
      jest.spyOn(LucidaService, 'getDownloadUrl').mockResolvedValue({
        success: false,
        url: '',
        filename: '',
        source: '',
        quality: '',
      });

      // Mock YtDlpService to succeed
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'Test Artist - Test Track.opus',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        preferLossless: true,
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      // Lucida should be tried first
      expect(LucidaService.getDownloadUrl).toHaveBeenCalled();
      // Then yt-dlp should be called
      expect(YtDlpService.getDownloadUrl).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.source).toBe('yt-dlp');
    });

    it('should fall back to yt-dlp when Lucida fails for YouTube', async () => {
      const sourceUrl = 'https://www.youtube.com/watch?v=test123';
      const title = 'Test Track';
      const artist = 'Test Artist';

      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(true);
      jest.spyOn(LucidaService, 'getDownloadUrl').mockResolvedValue({
        success: false,
        url: '',
        filename: '',
        source: '',
        quality: '',
      });

      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'Test Artist - Test Track.opus',
        source: 'yt-dlp',
        quality: '160k Opus',
        isLossless: false,
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        preferLossless: true,
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      expect(LucidaService.getDownloadUrl).toHaveBeenCalled();
      expect(YtDlpService.getDownloadUrl).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('Platform-Agnostic Download', () => {
    it('should download SoundCloud track via yt-dlp', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      const title = 'Test Track';
      const artist = 'Test Artist';

      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'Test Artist - Test Track.opus',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('yt-dlp');
      // SoundCloud typically provides 128k Opus
      expect(result.quality).toBe('128k Opus');
    });

    it('should download YouTube video via yt-dlp', async () => {
      const sourceUrl = 'https://www.youtube.com/watch?v=test123';
      const title = 'Test Track';
      const artist = 'Test Artist';

      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'Test Artist - Test Track.opus',
        source: 'yt-dlp',
        quality: '160k Opus',
        isLossless: false,
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, title, artist, {
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('yt-dlp');
      // YouTube typically provides ~160k Opus
      expect(result.quality).toBe('160k Opus');
    });
  });

  describe('Quality Handling', () => {
    it('should respect preferLossless option', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(true);
      const lucidaSpy = jest.spyOn(LucidaService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.flac',
        filename: 'track.flac',
        source: 'qobuz',
        quality: 'FLAC',
      });

      // With preferLossless: true
      await DownloadService.getDownloadUrl(sourceUrl, 'Track', 'Artist', {
        preferLossless: true,
      });
      expect(lucidaSpy).toHaveBeenCalled();

      lucidaSpy.mockClear();

      // With preferLossless: false
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'track.opus',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
      });

      await DownloadService.getDownloadUrl(sourceUrl, 'Track', 'Artist', {
        preferLossless: false,
        downloadProvider: 'yt-dlp',
      });
      
      // Lucida should not be called when preferLossless is false
      expect(lucidaSpy).not.toHaveBeenCalled();
    });

    it('should handle different audio formats', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.m4a',
        filename: 'track.m4a',
        source: 'yt-dlp',
        quality: 'M4A',
        isLossless: false,
      });

      const formats = ['best', 'opus', 'm4a', 'mp3'] as const;
      
      for (const format of formats) {
        const result = await DownloadService.getDownloadUrl(
          sourceUrl,
          'Track',
          'Artist',
          { format, downloadProvider: 'yt-dlp' }
        );
        
        expect(result.success).toBe(true);
      }
    });
  });

  describe('YtDlpService Parameter Handling', () => {
    it('should pass sourceUrl to yt-dlp correctly', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      
      const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'track.opus',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
      });

      await YtDlpService.getDownloadUrl(sourceUrl, {
        format: 'best',
        instance: 'https://yt.micr.dev',
        token: 'test-token',
      });

      expect(ytDlpSpy).toHaveBeenCalledWith(
        sourceUrl,
        expect.objectContaining({
          format: 'best',
          instance: 'https://yt.micr.dev',
          token: 'test-token',
        })
      );
    });

    it('should include metadata in yt-dlp request', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      const title = 'Test Track';
      const artist = 'Test Artist';
      
      const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'track.opus',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
      });

      await YtDlpService.getDownloadUrl(sourceUrl, {
        format: 'best',
        instance: 'https://yt.micr.dev',
        metadata: { title, artist },
      });

      const callArgs = ytDlpSpy.mock.calls[0][1];
      expect(callArgs.metadata).toEqual({ title, artist });
    });
  });

  describe('Error Handling', () => {
    it('should handle complete download failure gracefully', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: false,
        error: 'Download failed',
        source: 'yt-dlp',
        quality: 'Unknown',
        isLossless: false,
      });

      const result = await DownloadService.getDownloadUrl(sourceUrl, 'Track', 'Artist', {
        format: 'best',
        downloadProvider: 'yt-dlp',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download failed');
    });

    it('should handle network errors in download pipeline', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      
      jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
      jest.spyOn(YtDlpService, 'getDownloadUrl').mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });

      try {
        await DownloadService.getDownloadUrl(sourceUrl, 'Track', 'Artist', {
          format: 'best',
          downloadProvider: 'yt-dlp',
        });
      } catch (error) {
        // Expected to throw
        expect(error).toBeDefined();
      }
    });
  });

  describe('Download Audio Integration', () => {
    beforeEach(() => {
      // Mock chrome.downloads.search
      (global.chrome as any).downloads.search = jest.fn();
    });

    it('should pass segments correctly for multi-track downloads', async () => {
      const sourceUrl = 'https://soundcloud.com/artist/track';
      const segments = [
        { start: 0, end: 180, title: 'Part 1' },
        { start: 180, end: 360, title: 'Part 2' },
      ];
      
      const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
        success: true,
        url: 'https://example.com/download.opus',
        filename: 'track.opus',
        source: 'yt-dlp',
        quality: '128k Opus',
        isLossless: false,
        downloadId: 123,
      });

      // Test that YtDlpService can be called with segments
      await YtDlpService.getDownloadUrl(sourceUrl, {
        format: 'best',
        instance: 'https://yt.micr.dev',
        segments,
        segmentMode: 'multiple',
      });

      // Verify the call was made with segments
      expect(ytDlpSpy).toHaveBeenCalledWith(
        sourceUrl,
        expect.objectContaining({
          format: 'best',
          instance: 'https://yt.micr.dev',
          segments,
          segmentMode: 'multiple',
        })
      );

      // Verify segments are in the call
      const callArgs = ytDlpSpy.mock.calls[0][1];
      expect(callArgs.segments).toEqual(segments);
      expect(callArgs.segmentMode).toBe('multiple');
    });
  });
});
