export interface SoundCloudMetadata {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export class SoundCloudMetadataService {
  /**
   * Extract track ID from SoundCloud URL
   * URL format: soundcloud.com/{artist}/{track}
   */
  static extractTrackId(url: string): string | null {
    const match = url.match(/soundcloud\.com\/([\w-]+\/[\w-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate if URL is a valid SoundCloud track URL
   */
  static isValidUrl(url: string): boolean {
    return this.extractTrackId(url) !== null;
  }

  /**
   * Extract metadata from SoundCloud using oEmbed API
   */
  static async extractMetadata(url: string): Promise<SoundCloudMetadata | null> {
    try {
      const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);

      if (!response.ok) {
        console.error('[SoundCloudMetadataService] oEmbed request failed:', response.status);
        return null;
      }

      const data = await response.json();

      // Parse "Artist - Track Name" format
      let title = data.title || '';
      let artist = data.author_name || '';

      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      return {
        id: this.extractTrackId(url) || '',
        title,
        artist,
        duration: 0, // oEmbed doesn't provide duration
        thumbnail: data.thumbnail_url || '',
        url
      };
    } catch (error) {
      console.error('[SoundCloudMetadataService] Extraction failed:', error);
      return null;
    }
  }

  /**
   * Extract metadata from SoundCloud page DOM
   * For use in content script context
   */
  static extractFromDOM(): SoundCloudMetadata | null {
    try {
      const url = window.location.href;
      const id = this.extractTrackId(url);

      if (!id) {
        return null;
      }

      // SoundCloud DOM selectors (as of 2026)
      const titleSelectors = [
        '.soundTitle__title span',
        '.sc-truncate.sc-type-h1',
        '[data-testid="track-title"]',
        'h1.soundTitle__title'
      ];

      const artistSelectors = [
        '.soundTitle__username',
        '.sc-type-light.sc-link-primary',
        '[data-testid="track-artist"]',
        '.soundTitle__usernameText'
      ];

      const artworkSelectors = [
        '.sound__artwork img',
        '.sc-artwork img',
        '.fullHero__artwork img',
        '[data-testid="track-artwork"] img'
      ];

      const titleEl = this.findFirstElement(titleSelectors);
      const artistEl = this.findFirstElement(artistSelectors);
      const artworkEl = this.findFirstElement(artworkSelectors) as HTMLImageElement | null;

      let title = titleEl?.textContent?.trim() || '';
      let artist = artistEl?.textContent?.trim() || '';

      // Parse "Artist - Track Name" format if present
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      return {
        id,
        title,
        artist,
        duration: 0,
        thumbnail: artworkEl?.src || '',
        url
      };
    } catch (error) {
      console.error('[SoundCloudMetadataService] DOM extraction failed:', error);
      return null;
    }
  }

  private static findFirstElement(selectors: string[]): Element | null {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }
}
