import { CobaltService, AudioFormat, AudioBitrate } from './CobaltService';
import { LucidaService, LucidaOptions } from './LucidaService';

export type DownloadSource = 'lucida' | 'cobalt';

export interface DownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  source: DownloadSource;
  originalSource?: string;
  quality: string;
  isLossless: boolean;
  error?: string;
}

export interface DownloadOptions {
  format?: AudioFormat;
  bitrate?: AudioBitrate;
  preferLossless?: boolean;
  lucidaOptions?: LucidaOptions;
}

export class DownloadService {
  static async getDownloadUrl(
    youtubeUrl: string,
    title: string,
    artist: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const { preferLossless = true, format = 'mp3', bitrate = '320' } = options;

    if (preferLossless && LucidaService.isEnabled()) {
      const lucidaResult = await LucidaService.getDownloadUrl(
        title,
        artist,
        options.lucidaOptions
      );

      if (lucidaResult.success && lucidaResult.url) {
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
    }

    const cobaltResult = await CobaltService.getDownloadUrl(youtubeUrl, {
      format,
      bitrate
    });

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
      quality: `${format} ${bitrate}kbps`,
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
    const result = await this.getDownloadUrl(youtubeUrl, title, artist, options);

    if (!result.success || !result.url) {
      return result;
    }

    try {
      const filename = result.filename || this.generateFilename(title, artist, result.quality);
      
      const downloadId = await chrome.downloads.download({
        url: result.url,
        filename: `TunePort/${filename}`,
        saveAs: false
      });

      if (downloadId === undefined) {
        return {
          ...result,
          success: false,
          error: 'Failed to start download'
        };
      }

      return {
        ...result,
        filename
      };
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  private static generateFilename(title: string, artist: string, quality: string): string {
    const sanitize = (str: string) => str.replace(/[<>:"/\\|?*]/g, '').trim();
    const ext = quality.toLowerCase().includes('flac') ? 'flac' : 'mp3';
    
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

    return `Lossless source not available. Downloaded from YouTube (${result.quality}). YouTube audio is limited to ~256kbps.`;
  }
}
