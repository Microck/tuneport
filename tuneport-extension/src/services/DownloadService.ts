import { CobaltService, AudioFormat } from './CobaltService';
import { YtDlpService } from './YtDlpService';
import { LucidaService, LucidaOptions } from './LucidaService';
import { DEFAULT_COBALT_INSTANCE, DEFAULT_YTDLP_INSTANCE } from '../config/defaults';


export type DownloadSource = 'lucida' | 'cobalt' | 'yt-dlp';

export interface DownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  source: DownloadSource;
  originalSource?: string;
  quality: string;
  isLossless: boolean;
  error?: string;
  downloadId?: number;
}

export interface DownloadOptions {
  format?: AudioFormat;
  preferLossless?: boolean;
  lucidaOptions?: LucidaOptions;
  customInstance?: string;
  downloadProvider?: 'cobalt' | 'yt-dlp';
  ytDlpInstance?: string;
  ytDlpToken?: string;
}


export class DownloadService {
  static async getDownloadUrl(
    youtubeUrl: string,
    title: string,
    artist: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const {
      preferLossless = true,
      format = 'best',
      customInstance,
      downloadProvider = 'yt-dlp',
      ytDlpInstance,
      ytDlpToken
    } = options;


    console.log('[DownloadService] getDownloadUrl called:', { youtubeUrl, title, artist, format });

    if (preferLossless && LucidaService.isEnabled()) {
      console.log('[DownloadService] Trying Lucida first...');
      const lucidaResult = await LucidaService.getDownloadUrl(
        title,
        artist,
        options.lucidaOptions
      );

      if (lucidaResult.success && lucidaResult.url) {
        console.log('[DownloadService] Lucida success:', lucidaResult);
        return {
          success: true,
          url: lucidaResult.url,
          filename: lucidaResult.filename,
          source: 'lucida',
          originalSource: lucidaResult.source,
          quality: lucidaResult.quality || 'FLAC',
          isLossless: true
        };
      }
      console.log('[DownloadService] Lucida failed, falling back to download provider');

    }

    if (downloadProvider === 'yt-dlp') {
      console.log('[DownloadService] Calling yt-dlp...');
      const ytDlpResult = await YtDlpService.getDownloadUrl(youtubeUrl, {
        format,
        instance: ytDlpInstance || DEFAULT_YTDLP_INSTANCE,
        token: ytDlpToken
      });

      console.log('[DownloadService] yt-dlp result:', ytDlpResult);
      return ytDlpResult;
    }

    console.log('[DownloadService] Calling Cobalt...');
    const cobaltResult = await CobaltService.getDownloadUrl(youtubeUrl, {
      format,
      customInstance
    });

    console.log('[DownloadService] Cobalt result:', cobaltResult);

    if (cobaltResult.success && cobaltResult.url) {
      return {
        success: true,
        url: cobaltResult.url,
        filename: cobaltResult.filename,
        source: 'cobalt',
        quality: cobaltResult.quality,
        isLossless: false
      };
    }

    return {
      success: false,
      source: 'cobalt',
      quality: CobaltService.getQualityLabel(format),
      isLossless: false,
      error: cobaltResult.error || 'Download failed'
    };
  }

  static async downloadAudio(
    youtubeUrl: string,
    title: string,
    artist: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    console.log('[DownloadService] downloadAudio called:', { youtubeUrl, title, artist, options });

    let customInstance = DEFAULT_COBALT_INSTANCE;
    let downloadProvider: 'cobalt' | 'yt-dlp' = 'yt-dlp';
    let ytDlpInstance = DEFAULT_YTDLP_INSTANCE;
    let ytDlpToken: string | undefined;

    try {
      const stored = await chrome.storage.local.get(['tuneport_settings']);
      const rawInstance = stored?.tuneport_settings?.cobaltInstance;
      const rawProvider = stored?.tuneport_settings?.downloadProvider;
      const rawYtDlpInstance = stored?.tuneport_settings?.ytDlpInstance;
      const rawYtDlpToken = stored?.tuneport_settings?.ytDlpToken;

      if (typeof rawInstance === 'string' && rawInstance.trim().length > 0) {
        customInstance = rawInstance.trim();
      }

      if (rawProvider === 'yt-dlp' || rawProvider === 'cobalt') {
        downloadProvider = rawProvider;
      }

      if (typeof rawYtDlpInstance === 'string' && rawYtDlpInstance.trim().length > 0) {
        ytDlpInstance = rawYtDlpInstance.trim();
      }

      if (typeof rawYtDlpToken === 'string' && rawYtDlpToken.trim().length > 0) {
        ytDlpToken = rawYtDlpToken.trim();
      }
    } catch (error) {
      console.warn('[DownloadService] Failed to load download settings:', error);
    }

    if (downloadProvider === 'cobalt') {
      await CobaltService.ensureAuthenticated();
    }

    const result = await this.getDownloadUrl(youtubeUrl, title, artist, {
      ...options,
      customInstance,
      downloadProvider,
      ytDlpInstance,
      ytDlpToken
    });

    console.log('[DownloadService] getDownloadUrl result:', result);

    if (!result.success || !result.url) {
      console.error('[DownloadService] No URL to download:', result.error);
      return result;
    }

    try {
      const filename = result.filename || this.generateFilename(title, artist, result.quality);
      const sanitizedFilename = this.sanitizeFilename(filename);
      const fullPath = `TunePort/${sanitizedFilename}`;
      
      console.log('[DownloadService] Starting chrome.downloads.download:', {
        url: result.url.substring(0, 100) + '...',
        filename: fullPath
      });
      
      const downloadId = await chrome.downloads.download({
        url: result.url,
        filename: fullPath,
        saveAs: false
      });

      console.log('[DownloadService] chrome.downloads.download returned:', downloadId);

      if (downloadId === undefined) {
        const lastError = chrome.runtime.lastError;
        console.error('[DownloadService] Download failed, lastError:', lastError);
        return {
          ...result,
          success: false,
          error: lastError?.message || 'Failed to start download - no download ID returned'
        };
      }

      this.monitorDownload(downloadId);

      return {
        ...result,
        filename: sanitizedFilename,
        downloadId
      };
    } catch (error) {
      console.error('[DownloadService] Download exception:', error);
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  private static monitorDownload(downloadId: number): void {
    const listener = (delta: chrome.downloads.DownloadDelta) => {
      if (delta.id !== downloadId) return;
      
      console.log('[DownloadService] Download state change:', {
        id: delta.id,
        state: delta.state,
        error: delta.error,
        filename: delta.filename
      });

      if (delta.state?.current === 'complete') {
        console.log('[DownloadService] Download complete!');
        chrome.downloads.onChanged.removeListener(listener);
      } else if (delta.state?.current === 'interrupted') {
        console.error('[DownloadService] Download interrupted:', delta.error);
        chrome.downloads.onChanged.removeListener(listener);
      }
    };
    
    chrome.downloads.onChanged.addListener(listener);

    chrome.downloads.search({ id: downloadId }, (results) => {
      if (results && results[0]) {
        console.log('[DownloadService] Initial download state:', {
          id: results[0].id,
          state: results[0].state,
          filename: results[0].filename,
          error: results[0].error
        });
      }
    });
  }

  private static sanitizeFilename(filename: string): string {
    return filename
// eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  private static generateFilename(title: string, artist: string, quality: string): string {
    const sanitize = (str: string) => str.replace(/[<>:"/\\|?*]/g, '').trim();
    const ext = quality.toLowerCase().includes('flac') ? 'flac' : 
                quality.toLowerCase().includes('opus') ? 'opus' : 'mp3';
    
    if (artist) {
      return `${sanitize(artist)} - ${sanitize(title)}.${ext}`;
    }
    return `${sanitize(title)}.${ext}`;
  }

  static shouldShowLosslessWarning(result: DownloadResult): boolean {
    return !result.isLossless && LucidaService.isEnabled();
  }

  static getQualityWarningMessage(result: DownloadResult): string {
    if (result.isLossless) {
      return '';
    }

    return 'From YouTube (Opus ~128k). Enable Lucida for lossless.';
  }
}
