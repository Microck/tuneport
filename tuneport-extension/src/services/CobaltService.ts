export type AudioFormat = 'best' | 'mp3' | 'ogg' | 'wav' | 'opus';
export type AudioBitrate = '320' | '256' | '128' | '96' | '64' | '8';

export interface CobaltRequest {
  url: string;
  downloadMode: 'audio';
  audioFormat: AudioFormat;
  audioBitrate: AudioBitrate;
  disableMetadata?: boolean;
  filenameStyle?: 'classic' | 'pretty' | 'basic' | 'nerdy';
}

export interface CobaltTunnelResponse {
  status: 'tunnel' | 'redirect';
  url: string;
  filename: string;
}

export interface CobaltErrorResponse {
  status: 'error';
  error: {
    code: string;
    context?: {
      service?: string;
      limit?: number;
    };
  };
}

export type CobaltResponse = CobaltTunnelResponse | CobaltErrorResponse;

export interface DownloadOptions {
  format?: AudioFormat;
  bitrate?: AudioBitrate;
  customInstance?: string;
}

export interface DownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  source: 'cobalt';
  quality: string;
}

const DEFAULT_INSTANCE = 'https://api.cobalt.tools';

export class CobaltService {
  private static instance: string = DEFAULT_INSTANCE;
  private static apiKey?: string;

  static setInstance(url: string): void {
    this.instance = url.replace(/\/$/, '');
  }

  static setApiKey(key: string): void {
    this.apiKey = key;
  }

  static async getDownloadUrl(
    youtubeUrl: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const { format = 'mp3', bitrate = '320', customInstance } = options;
    
    const instanceUrl = customInstance || this.instance;

    const requestBody: CobaltRequest = {
      url: youtubeUrl,
      downloadMode: 'audio',
      audioFormat: format,
      audioBitrate: bitrate,
      filenameStyle: 'pretty'
    };

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Api-Key ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${instanceUrl}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Cobalt authentication required. Please configure an API key or use a different instance.',
            source: 'cobalt',
            quality: `${format} ${bitrate}kbps`
          };
        }
        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
            source: 'cobalt',
            quality: `${format} ${bitrate}kbps`
          };
        }
        return {
          success: false,
          error: `Cobalt request failed: ${response.status}`,
          source: 'cobalt',
          quality: `${format} ${bitrate}kbps`
        };
      }

      const data: CobaltResponse = await response.json();

      if (data.status === 'error') {
        return {
          success: false,
          error: this.formatError(data.error.code, data.error.context),
          source: 'cobalt',
          quality: `${format} ${bitrate}kbps`
        };
      }

      if (data.status === 'tunnel' || data.status === 'redirect') {
        return {
          success: true,
          url: data.url,
          filename: data.filename,
          source: 'cobalt',
          quality: `${format} ${bitrate}kbps`
        };
      }

      return {
        success: false,
        error: 'Unexpected response from Cobalt',
        source: 'cobalt',
        quality: `${format} ${bitrate}kbps`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        source: 'cobalt',
        quality: `${format} ${bitrate}kbps`
      };
    }
  }

  static async downloadAudio(
    youtubeUrl: string,
    downloadPath: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const result = await this.getDownloadUrl(youtubeUrl, options);
    
    if (!result.success || !result.url) {
      return result;
    }

    try {
      const downloadId = await chrome.downloads.download({
        url: result.url,
        filename: `TunePort/${result.filename || 'download.mp3'}`,
        saveAs: false
      });

      if (downloadId === undefined) {
        return {
          ...result,
          success: false,
          error: 'Failed to start download'
        };
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  private static formatError(code: string, context?: { service?: string; limit?: number }): string {
    const errorMessages: Record<string, string> = {
      'error.api.link.invalid': 'Invalid URL provided',
      'error.api.link.unsupported': 'This URL is not supported',
      'error.api.rate_exceeded': 'Rate limit exceeded',
      'error.api.auth.api-key.missing': 'API key required',
      'error.api.auth.api-key.invalid': 'Invalid API key',
      'error.api.content.unavailable': 'Content is unavailable',
      'error.api.content.region_locked': 'Content is region locked',
      'error.api.content.private': 'Content is private',
      'error.api.content.age_restricted': 'Content is age restricted',
      'error.api.youtube.codec_not_found': 'Requested codec not available',
      'error.api.youtube.login': 'YouTube login required',
      'error.api.youtube.no_matching_format': 'No matching format found'
    };

    let message = errorMessages[code] || `Error: ${code}`;
    
    if (context?.limit) {
      message += ` (limit: ${context.limit}s)`;
    }
    
    return message;
  }

  static getQualityLabel(format: AudioFormat, bitrate: AudioBitrate): string {
    if (format === 'best') {
      return 'Best Quality';
    }
    return `${format.toUpperCase()} ${bitrate}kbps`;
  }

  static getQualityPresets(): Array<{ format: AudioFormat; bitrate: AudioBitrate; label: string }> {
    return [
      { format: 'best', bitrate: '320', label: 'Best Quality (Auto)' },
      { format: 'mp3', bitrate: '320', label: 'MP3 320kbps' },
      { format: 'mp3', bitrate: '256', label: 'MP3 256kbps' },
      { format: 'mp3', bitrate: '128', label: 'MP3 128kbps' },
      { format: 'opus', bitrate: '256', label: 'Opus 256kbps' },
      { format: 'ogg', bitrate: '256', label: 'OGG 256kbps' }
    ];
  }
}
