import { AudioFormat, CobaltService } from './CobaltService';
import { DownloadResult } from './DownloadService';
import { Segment, SegmentMode } from './SegmentParser';

export interface YtDlpMetadata {
  title: string;
  artist: string;
}

export interface YtDlpOptions {
  format: AudioFormat;
  instance: string;
  token?: string;
  segments?: Segment[];
  segmentMode?: SegmentMode;
  metadata?: YtDlpMetadata;
}


interface YtDlpResponse {
  status: 'ok' | 'error';
  url?: string;
  filename?: string;
  quality?: string;
  error?: string;
}

export class YtDlpService {
  static async getDownloadUrl(youtubeUrl: string, options: YtDlpOptions): Promise<DownloadResult> {
    const { format, instance, token } = options;
    const endpoint = new URL('/download', instance).toString();

    console.log('[YtDlpService] Request details:', {
      endpoint,
      instance,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      format
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[YtDlpService] Using auth header: Bearer <token>');
    } else {
      console.log('[YtDlpService] WARNING: No token provided');
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: youtubeUrl,
          format,
          segments: options.segments,
          segment_mode: options.segmentMode,
          title: options.metadata?.title,
          artist: options.metadata?.artist
        })

      });

      const data: YtDlpResponse = await response.json().catch(() => ({ status: 'error', error: 'Invalid response' }));

      if (!response.ok || data.status !== 'ok' || !data.url) {
        return {
          success: false,
          source: 'yt-dlp',
          quality: data.quality || CobaltService.getQualityLabel(format),
          isLossless: false,
          error: data.error || `yt-dlp request failed: ${response.status}`
        };
      }

      return {
        success: true,
        url: data.url,
        filename: data.filename,
        source: 'yt-dlp',
        quality: data.quality || CobaltService.getQualityLabel(format),
        isLossless: false
      };
    } catch (error) {
      return {
        success: false,
        source: 'yt-dlp',
        quality: CobaltService.getQualityLabel(format),
        isLossless: false,
        error: error instanceof Error ? error.message : 'yt-dlp request failed'
      };
    }
  }
}
