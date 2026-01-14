import { DownloadService } from '../DownloadService';
import { CobaltService } from '../CobaltService';
import { YtDlpService } from '../YtDlpService';
import { LucidaService } from '../LucidaService';

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
        download: jest.fn(() => Promise.resolve(1))
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
      token: undefined
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
      token: 'test-token'
    });
  });
});
