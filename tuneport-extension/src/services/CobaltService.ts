export type AudioFormat = 'best' | 'mp3' | 'ogg' | 'wav' | 'opus';
export type AudioBitrate = '320' | '256' | '128' | '96' | '64' | '8';

export interface CobaltRequest {
  url: string;
  downloadMode: 'audio';
  audioFormat: AudioFormat;
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

const COBALT_INSTANCES = [
  'https://cobalt-api.meowing.de',
  'https://cobalt-backend.canine.tools',
  'https://kityune.imput.net',
  'https://blossom.imput.net'
];

const DEFAULT_INSTANCE = COBALT_INSTANCES[0];

export class CobaltService {
  private static instance: string = DEFAULT_INSTANCE;
  private static instanceIndex: number = 0;
  private static apiKey?: string;

  static setInstance(url: string): void {
    this.instance = url.replace(/\/$/, '');
  }

  static setApiKey(key: string): void {
    this.apiKey = key;
  }

  static getAvailableInstances(): string[] {
    return COBALT_INSTANCES;
  }

  static async getDownloadUrl(
    youtubeUrl: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const { format = 'best', customInstance } = options;
    
    const instancesToTry = customInstance 
      ? [customInstance] 
      : COBALT_INSTANCES;

    for (const instanceUrl of instancesToTry) {
      const result = await this.tryInstance(instanceUrl, youtubeUrl, format);
      if (result.success) {
        return result;
      }
      if (result.error?.includes('Rate limit') || result.error?.includes('authentication')) {
        continue;
      }
      return result;
    }

    return {
      success: false,
      error: 'All Cobalt instances failed. Please try again later.',
      source: 'cobalt',
      quality: this.getActualYouTubeQuality(format)
    };
  }

  private static async tryInstance(
    instanceUrl: string,
    youtubeUrl: string,
    format: AudioFormat
  ): Promise<DownloadResult> {
    const requestBody: CobaltRequest = {
      url: youtubeUrl,
      downloadMode: 'audio',
      audioFormat: format,
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
            quality: this.getActualYouTubeQuality(format)
          };
        }
        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
            source: 'cobalt',
            quality: this.getActualYouTubeQuality(format)
          };
        }
        return {
          success: false,
          error: `Cobalt request failed: ${response.status}`,
          source: 'cobalt',
          quality: this.getActualYouTubeQuality(format)
        };
      }

      const data: CobaltResponse = await response.json();

      if (data.status === 'error') {
        return {
          success: false,
          error: this.formatError(data.error.code, data.error.context),
          source: 'cobalt',
          quality: this.getActualYouTubeQuality(format)
        };
      }

      if (data.status === 'tunnel' || data.status === 'redirect') {
        const actualQuality = this.getActualYouTubeQuality(format);
        return {
          success: true,
          url: data.url,
          filename: data.filename,
          source: 'cobalt',
          quality: actualQuality
        };
      }

      return {
        success: false,
        error: 'Unexpected response from Cobalt',
        source: 'cobalt',
        quality: this.getActualYouTubeQuality(format)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        source: 'cobalt',
        quality: this.getActualYouTubeQuality(format)
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

  static getQualityLabel(format: AudioFormat): string {
    if (format === 'best' || format === 'opus') {
      return 'Opus ~128k (best)';
    }
    return `${format.toUpperCase()} (re-encoded)`;
  }

  private static getActualYouTubeQuality(format: AudioFormat): string {
    if (format === 'best' || format === 'opus') {
      return 'Opus ~128k';
    }
    return `${format.toUpperCase()} (from Opus source)`;
  }

  static getQualityPresets(): Array<{ format: AudioFormat; label: string }> {
    return [
      { format: 'best', label: 'Opus (Best Quality)' },
      { format: 'opus', label: 'Opus (Native)' },
      { format: 'mp3', label: 'MP3 (Re-encoded)' },
      { format: 'ogg', label: 'OGG (Re-encoded)' },
      { format: 'wav', label: 'WAV (Uncompressed)' }
    ];
  }
}
