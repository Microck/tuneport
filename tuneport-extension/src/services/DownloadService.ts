import { CobaltService, AudioFormat } from './CobaltService';
import { YtDlpService } from './YtDlpService';
import { LucidaService, LucidaOptions } from './LucidaService';
import { DEFAULT_COBALT_INSTANCE, DEFAULT_YTDLP_INSTANCE, DEFAULT_YTDLP_TOKEN } from '../config/defaults';
import type { Segment, SegmentMode } from './SegmentParser';
import { resolveSegmentMetadata } from './SegmentMetadata';



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
  downloadIds?: number[];
  filenames?: string[];
}

export interface DownloadOptions {
  format?: AudioFormat;
  preferLossless?: boolean;
  lucidaOptions?: LucidaOptions;
  customInstance?: string;
  downloadProvider?: 'cobalt' | 'yt-dlp';
  ytDlpInstance?: string;
  ytDlpToken?: string;
  segments?: Segment[];
  segmentMode?: SegmentMode;
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
      const effectiveInstance = ytDlpInstance || DEFAULT_YTDLP_INSTANCE;
      // Use default token only when using the default instance and no custom token is set
      const effectiveToken = ytDlpToken || (effectiveInstance === DEFAULT_YTDLP_INSTANCE ? DEFAULT_YTDLP_TOKEN : undefined);
      
      const ytDlpResult = await YtDlpService.getDownloadUrl(youtubeUrl, {
        format,
        instance: effectiveInstance,
        token: effectiveToken,
        metadata: { title, artist }
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

    const normalizedSegments = this.normalizeSegments(options.segments);
    const segmentMode: SegmentMode = options.segmentMode || 'multiple';
    const effectiveYtDlpToken = ytDlpToken || (ytDlpInstance === DEFAULT_YTDLP_INSTANCE ? DEFAULT_YTDLP_TOKEN : undefined);

    if (normalizedSegments.length > 0) {
      if (segmentMode === 'single') {
        return await this.downloadMergedSegments(
          youtubeUrl,
          title,
          artist,
          normalizedSegments,
          {
            format: (options.format || 'best') as AudioFormat,
            ytDlpInstance,
            ytDlpToken: effectiveYtDlpToken
          }
        );
      }

      return await this.downloadSegments(
        youtubeUrl,
        title,
        artist,
        normalizedSegments,
        {
          format: (options.format || 'best') as AudioFormat,
          ytDlpInstance,
          ytDlpToken: effectiveYtDlpToken
        }
      );
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
      // Prioritize generating consistent filenames from metadata over server filenames (which might be random hashes)
      // Exception: Lucida returns correct filenames
      let filename = result.filename;
      if (!filename || result.source === 'yt-dlp' || result.source === 'cobalt') {
        filename = this.generateFilename(title, artist, result.quality);
      }
      
      const sanitizedFilename = this.sanitizeFilename(filename!);
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


  private static normalizeSegments(segments?: Segment[]): Segment[] {
    if (!segments) return [];

    return segments
      .filter((segment) => typeof segment.start === 'number' && !Number.isNaN(segment.start))
      .map((segment) => {
        const normalizedEnd = typeof segment.end === 'number' && !Number.isNaN(segment.end)
          ? Math.max(0, Math.floor(segment.end))
          : undefined;
        return {
          start: Math.max(0, Math.floor(segment.start)),
          end: normalizedEnd,
          title: segment.title?.trim() || undefined
        };
      })
      .filter((segment) => segment.end === undefined || segment.end > segment.start);
  }

  private static formatTimestamp(seconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private static formatSegmentRange(segment: Segment): string | undefined {
    if (segment.end === undefined) {
      return this.formatTimestamp(segment.start);
    }

    return `${this.formatTimestamp(segment.start)}-${this.formatTimestamp(segment.end)}`;
  }

  private static generateSegmentFilename(
    title: string,
    artist: string,
    segment: Segment,
    quality: string
  ): string {
    const rangeLabel = this.formatSegmentRange(segment);
    const baseTitle = segment.title || (rangeLabel ? `${title} (${rangeLabel})` : title);
    
    const q = quality.toLowerCase();
    const ext = q.includes('flac') ? 'flac' : 
                q.includes('opus') ? 'opus' : 
                q.includes('ogg') ? 'ogg' :
                q.includes('wav') ? 'wav' :
                q.includes('m4a') ? 'm4a' : 'mp3';

    if (artist) {
      return `${artist} - ${baseTitle}.${ext}`;
    }
    return `${baseTitle}.${ext}`;
  }

  private static async downloadSegments(
    youtubeUrl: string,
    title: string,
    artist: string,
    segments: Segment[],
    options: {
      format: AudioFormat;
      ytDlpInstance: string;
      ytDlpToken?: string;
    }
  ): Promise<DownloadResult> {
    const downloadIds: number[] = [];
    const filenames: string[] = [];
    let lastQuality = CobaltService.getQualityLabel(options.format);

    for (const segment of segments) {
      const resolvedMetadata = segment.title
        ? resolveSegmentMetadata(segment.title, artist)
        : null;
      const metadata = resolvedMetadata
        ? { title: resolvedMetadata.title, artist: resolvedMetadata.artist }
        : { title, artist };

      const ytDlpResult = await YtDlpService.getDownloadUrl(youtubeUrl, {
        format: options.format,
        instance: options.ytDlpInstance,
        token: options.ytDlpToken,
        segments: [segment],
        metadata
      });

      if (!ytDlpResult.success || !ytDlpResult.url) {
        return {
          success: false,
          source: 'yt-dlp',
          quality: ytDlpResult.quality || lastQuality,
          isLossless: false,
          error: ytDlpResult.error || 'Download failed',
          downloadIds: downloadIds.length > 0 ? downloadIds : undefined,
          filenames: filenames.length > 0 ? filenames : undefined
        };
      }

      lastQuality = ytDlpResult.quality || lastQuality;

      const filename = this.generateSegmentFilename(title, artist, segment, lastQuality);
      const sanitizedFilename = this.sanitizeFilename(filename);
      const fullPath = `TunePort/${sanitizedFilename}`;

      const downloadId = await chrome.downloads.download({
        url: ytDlpResult.url,
        filename: fullPath,
        saveAs: false
      });

      if (downloadId === undefined) {
        const lastError = chrome.runtime.lastError;
        return {
          success: false,
          source: 'yt-dlp',
          quality: lastQuality,
          isLossless: false,
          error: lastError?.message || 'Failed to start download - no download ID returned',
          downloadIds: downloadIds.length > 0 ? downloadIds : undefined,
          filenames: filenames.length > 0 ? filenames : undefined
        };
      }

      this.monitorDownload(downloadId);
      downloadIds.push(downloadId);
      filenames.push(sanitizedFilename);
    }

    return {
      success: true,
      source: 'yt-dlp',
      quality: lastQuality,
      isLossless: false,
      downloadIds,
      filenames,
      filename: filenames.length === 1 ? filenames[0] : undefined
    };
  }

  private static async downloadMergedSegments(
    youtubeUrl: string,
    title: string,
    artist: string,
    segments: Segment[],
    options: {
      format: AudioFormat;
      ytDlpInstance: string;
      ytDlpToken?: string;
    }
  ): Promise<DownloadResult> {
    const ytDlpResult = await YtDlpService.getDownloadUrl(youtubeUrl, {
      format: options.format,
      instance: options.ytDlpInstance,
      token: options.ytDlpToken,
      segments,
      segmentMode: 'single',
      metadata: { title, artist }
    });

    if (!ytDlpResult.success || !ytDlpResult.url) {
      return {
        success: false,
        source: 'yt-dlp',
        quality: ytDlpResult.quality || CobaltService.getQualityLabel(options.format),
        isLossless: false,
        error: ytDlpResult.error || 'Download failed'
      };
    }

    const filename = this.generateFilename(title, artist, ytDlpResult.quality || CobaltService.getQualityLabel(options.format));
    const sanitizedFilename = this.sanitizeFilename(filename);
    const fullPath = `TunePort/${sanitizedFilename}`;

    const downloadId = await chrome.downloads.download({
      url: ytDlpResult.url,
      filename: fullPath,
      saveAs: false
    });

    if (downloadId === undefined) {
      const lastError = chrome.runtime.lastError;
      return {
        ...ytDlpResult,
        success: false,
        error: lastError?.message || 'Failed to start download - no download ID returned'
      };
    }

    this.monitorDownload(downloadId);

    return {
      ...ytDlpResult,
      filename: sanitizedFilename,
      downloadId
    };
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
    
    const q = quality.toLowerCase();
    const ext = q.includes('flac') ? 'flac' : 
                q.includes('opus') ? 'opus' : 
                q.includes('ogg') ? 'ogg' :
                q.includes('wav') ? 'wav' :
                q.includes('m4a') ? 'm4a' : 'mp3';
    
    let cleanTitle = sanitize(title);
    const cleanArtist = sanitize(artist);

    if (cleanArtist && cleanTitle.toLowerCase().startsWith(cleanArtist.toLowerCase())) {
      cleanTitle = cleanTitle.substring(cleanArtist.length).trim();
      cleanTitle = cleanTitle.replace(/^[\s-:]+/, '');
    }
    
    if (cleanArtist) {
      return `${cleanArtist} - ${cleanTitle}.${ext}`;
    }
    return `${cleanTitle}.${ext}`;
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
