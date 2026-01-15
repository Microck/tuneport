import { DownloadService } from '../DownloadService';
import { CobaltService } from '../CobaltService';
import { YtDlpService } from '../YtDlpService';
import { LucidaService } from '../LucidaService';
import { DEFAULT_YTDLP_TOKEN } from '../../config/defaults';

describe('DownloadService.downloadAudio', () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(() => Promise.resolve({
            tuneport_settings: {}
          }))
        }
      },
      downloads: {
        download: jest.fn(() => Promise.resolve(1)),
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        },
        search: jest.fn((_query, callback) => callback([]))
      },
      runtime: {
        lastError: undefined
      }
    } as unknown as typeof chrome;

  });

  test('defaults to yt-dlp when setting missing', async () => {
    jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
    jest.spyOn(CobaltService, 'ensureAuthenticated').mockResolvedValue(true);
    jest.spyOn(CobaltService, 'getDownloadUrl').mockResolvedValue({
      success: false,
      source: 'cobalt',
      quality: 'Opus ~128k',
      error: 'fail'
    });

    const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
      success: false,
      source: 'yt-dlp',
      quality: 'Opus ~128k',
      isLossless: false,
      error: 'fail'
    });

    await DownloadService.downloadAudio('https://youtube.com/watch?v=test', 'title', 'artist', { format: 'best' });

    expect(ytDlpSpy).toHaveBeenCalledWith('https://youtube.com/watch?v=test', {
      format: 'best',
      instance: 'https://yt.micr.dev',
      token: DEFAULT_YTDLP_TOKEN,
      metadata: { title: 'title', artist: 'artist' }
    });
  });

  test('uses yt-dlp when provider is set', async () => {
    jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
    jest.spyOn(CobaltService, 'ensureAuthenticated').mockResolvedValue(true);

    global.chrome.storage.local.get = jest.fn(() => Promise.resolve({
      tuneport_settings: {
        downloadProvider: 'yt-dlp',
        ytDlpInstance: 'https://yt.micr.dev',
        ytDlpToken: 'test-token'
      }
    }));

    const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
      success: false,
      source: 'yt-dlp',
      quality: 'Opus ~128k',
      isLossless: false,
      error: 'fail'
    });

    await DownloadService.downloadAudio('https://youtube.com/watch?v=test', 'title', 'artist', { format: 'best' });

    expect(ytDlpSpy).toHaveBeenCalledWith('https://youtube.com/watch?v=test', {
      format: 'best',
      instance: 'https://yt.micr.dev',
      token: 'test-token',
      metadata: { title: 'title', artist: 'artist' }
    });
  });

  test('passes segments to yt-dlp when provided', async () => {
    jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
    jest.spyOn(CobaltService, 'ensureAuthenticated').mockResolvedValue(true);

    global.chrome.storage.local.get = jest.fn(() => Promise.resolve({
      tuneport_settings: {
        downloadProvider: 'yt-dlp',
        ytDlpInstance: 'https://yt.micr.dev',
        ytDlpToken: 'test-token'
      }
    }));

    const segments = [{ start: 0, end: 10, title: 'intro' }];

    const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
      success: false,
      source: 'yt-dlp',
      quality: 'Opus ~128k',
      isLossless: false,
      error: 'fail'
    });

    await DownloadService.downloadAudio('https://youtube.com/watch?v=test', 'title', 'artist', {
      format: 'best',
      segments
    });

    expect(ytDlpSpy).toHaveBeenCalledWith('https://youtube.com/watch?v=test', {
      format: 'best',
      instance: 'https://yt.micr.dev',
      token: 'test-token',
      segments,
      metadata: { title: 'intro', artist: 'artist' }
    });
  });

  test('downloads each segment when multiple provided', async () => {
    jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
    jest.spyOn(CobaltService, 'ensureAuthenticated').mockResolvedValue(true);

    global.chrome.storage.local.get = jest.fn(() => Promise.resolve({
      tuneport_settings: {
        downloadProvider: 'yt-dlp',
        ytDlpInstance: 'https://yt.micr.dev',
        ytDlpToken: 'test-token'
      }
    }));

    const segments = [
      { start: 0, end: 10, title: 'intro' },
      { start: 10, end: 20, title: 'verse' }
    ];

    const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
      success: true,
      source: 'yt-dlp',
      quality: 'Opus ~128k',
      isLossless: false,
      url: 'https://yt.micr.dev/file/abc',
      filename: 'file.opus'
    });

    global.chrome.downloads.download = jest.fn()
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(11);

    const result = await DownloadService.downloadAudio('https://youtube.com/watch?v=test', 'title', 'artist', {
      format: 'best',
      segments
    });

    expect(ytDlpSpy).toHaveBeenNthCalledWith(1, 'https://youtube.com/watch?v=test', {
      format: 'best',
      instance: 'https://yt.micr.dev',
      token: 'test-token',
      segments: [segments[0]],
      metadata: { title: 'intro', artist: 'artist' }
    });
    expect(ytDlpSpy).toHaveBeenNthCalledWith(2, 'https://youtube.com/watch?v=test', {
      format: 'best',
      instance: 'https://yt.micr.dev',
      token: 'test-token',
      segments: [segments[1]],
      metadata: { title: 'verse', artist: 'artist' }
    });
    expect(global.chrome.downloads.download).toHaveBeenCalledTimes(2);
    expect(result.downloadIds).toEqual([10, 11]);
  });

  test('merges segments when segmentMode is single', async () => {
    jest.spyOn(LucidaService, 'isEnabled').mockReturnValue(false);
    jest.spyOn(CobaltService, 'ensureAuthenticated').mockResolvedValue(true);

    global.chrome.storage.local.get = jest.fn(() => Promise.resolve({
      tuneport_settings: {
        downloadProvider: 'yt-dlp',
        ytDlpInstance: 'https://yt.micr.dev',
        ytDlpToken: 'test-token'
      }
    }));

    const segments = [
      { start: 0, end: 10 },
      { start: 12, end: 20 }
    ];

    const ytDlpSpy = jest.spyOn(YtDlpService, 'getDownloadUrl').mockResolvedValue({
      success: true,
      source: 'yt-dlp',
      quality: 'Opus ~128k',
      isLossless: false,
      url: 'https://yt.micr.dev/file/abc',
      filename: 'file.opus'
    });

    const result = await DownloadService.downloadAudio('https://youtube.com/watch?v=test', 'title', 'artist', {
      format: 'best',
      segments,
      segmentMode: 'single'
    });

    expect(ytDlpSpy).toHaveBeenCalledWith('https://youtube.com/watch?v=test', {
      format: 'best',
      instance: 'https://yt.micr.dev',
      token: 'test-token',
      segments,
      segmentMode: 'single',
      metadata: { title: 'title', artist: 'artist' }
    });
    expect(global.chrome.downloads.download).toHaveBeenCalledTimes(1);
    expect(result.downloadId).toBe(1);
  });
});

