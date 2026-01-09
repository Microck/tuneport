export type LucidaSource = 'qobuz' | 'tidal' | 'deezer';
export type LucidaQuality = 'flac' | 'mp3-320' | 'mp3-256' | 'mp3-128';

export interface LucidaSearchResult {
  found: boolean;
  source?: LucidaSource;
  quality?: LucidaQuality;
  url?: string;
  filename?: string;
  bitDepth?: number;
  sampleRate?: number;
}

export interface LucidaDownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  source?: LucidaSource;
  quality?: string;
  error?: string;
}

export interface LucidaOptions {
  preferredSource?: LucidaSource;
  preferredQuality?: LucidaQuality;
  enabled?: boolean;
}

const SOURCE_PRIORITY: LucidaSource[] = ['qobuz', 'tidal', 'deezer'];

export class LucidaService {
  private static enabled: boolean = false;
  private static apiEndpoint?: string;

  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  static isEnabled(): boolean {
    return this.enabled;
  }

  static setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
  }

  static async searchTrack(
    title: string,
    artist: string,
    options: LucidaOptions = {}
  ): Promise<LucidaSearchResult> {
    if (!this.enabled) {
      return { found: false };
    }

    for (const source of SOURCE_PRIORITY) {
      if (options.preferredSource && source !== options.preferredSource) {
        continue;
      }

      const result = await this.searchOnSource(title, artist, source);
      if (result.found) {
        return result;
      }
    }

    return { found: false };
  }

  private static async searchOnSource(
    title: string,
    artist: string,
    source: LucidaSource
  ): Promise<LucidaSearchResult> {
    if (!this.apiEndpoint) {
      return { found: false };
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          artist,
          source
        })
      });

      if (!response.ok) {
        return { found: false };
      }

      const data = await response.json();
      
      if (data.found && data.url) {
        return {
          found: true,
          source,
          quality: data.quality || 'flac',
          url: data.url,
          filename: data.filename,
          bitDepth: data.bitDepth,
          sampleRate: data.sampleRate
        };
      }

      return { found: false };
    } catch (error) {
      console.warn(`Lucida search failed for ${source}:`, error);
      return { found: false };
    }
  }

  static async getDownloadUrl(
    title: string,
    artist: string,
    options: LucidaOptions = {}
  ): Promise<LucidaDownloadResult> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Lucida sources not enabled'
      };
    }

    const searchResult = await this.searchTrack(title, artist, options);

    if (!searchResult.found || !searchResult.url) {
      return {
        success: false,
        error: 'Track not found on lossless sources'
      };
    }

    return {
      success: true,
      url: searchResult.url,
      filename: searchResult.filename,
      source: searchResult.source,
      quality: this.formatQuality(searchResult)
    };
  }

  private static formatQuality(result: LucidaSearchResult): string {
    if (result.quality === 'flac') {
      if (result.bitDepth && result.sampleRate) {
        return `FLAC ${result.bitDepth}-bit/${result.sampleRate / 1000}kHz`;
      }
      return 'FLAC';
    }
    return result.quality?.toUpperCase() || 'Unknown';
  }

  static getSourceLabel(source: LucidaSource): string {
    const labels: Record<LucidaSource, string> = {
      qobuz: 'Qobuz',
      tidal: 'Tidal',
      deezer: 'Deezer'
    };
    return labels[source] || source;
  }

  static async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([
        'lucida_enabled',
        'lucida_api_endpoint'
      ]);
      
      this.enabled = result.lucida_enabled || false;
      this.apiEndpoint = result.lucida_api_endpoint;
    } catch (error) {
      console.error('Failed to load Lucida settings:', error);
    }
  }

  static async saveSettings(enabled: boolean, endpoint?: string): Promise<void> {
    try {
      await chrome.storage.local.set({
        lucida_enabled: enabled,
        lucida_api_endpoint: endpoint
      });
      
      this.enabled = enabled;
      this.apiEndpoint = endpoint;
    } catch (error) {
      console.error('Failed to save Lucida settings:', error);
    }
  }
}
