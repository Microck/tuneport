const ytdl = require('yt-dlp-exec');
const axios = require('axios');

class MetadataExtractor {
  /**
   * Extract comprehensive metadata from YouTube video
   */
  async extractFromYouTube(youtubeUrl) {
    try {
      console.log(`Extracting metadata from: ${youtubeUrl}`);
      
      // Get video information using yt-dlp
      const info = await ytdl(youtubeUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true
      });

      // Parse and clean metadata
      const metadata = {
        title: this.cleanTitle(info.title || ''),
        artist: this.extractArtist(info.title || '', info.uploader || ''),
        album: this.extractAlbum(info.title || ''),
        duration: info.duration || 0,
        uploader: info.uploader || '',
        uploadDate: info.upload_date || '',
        viewCount: info.view_count || 0,
        description: info.description || '',
        thumbnail: this.getHighestQualityThumbnail(info.thumbnail),
        youtubeId: info.id,
        youtubeUrl: youtubeUrl,
        tags: info.tags || []
      };

      // Enhance metadata with additional processing
      metadata.title = this.enhanceTitle(metadata.title);
      metadata.artist = this.enhanceArtist(metadata.artist);

      console.log('Metadata extracted:', metadata);
      return metadata;

    } catch (error) {
      console.error('Metadata extraction failed:', error);
      throw new Error(`Failed to extract metadata: ${error.message}`);
    }
  }

  /**
   * Clean title from YouTube formatting
   */
  cleanTitle(title) {
    // Remove common YouTube suffixes
    return title
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/official video/gi, '')
      .replace(/official music video/gi, '')
      .replace(/ft\.?/gi, 'ft.')
      .replace(/feat\.?/gi, 'feat.')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract artist from title and uploader
   */
  extractArtist(title, uploader) {
    // Common patterns for artist extraction
    const patterns = [
      /^([^-]+?)\s*-\s*/i,  // "Artist - Song"
      /^(.+?)\s*\|\s*/i,     // "Artist | Song"
      /^([^(]+?)\s*\(/i,     // "Artist (Year/Song)"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[1].length < 50) {
        return this.cleanArtistName(match[1]);
      }
    }

    // Fallback to uploader if it looks like an artist
    if (uploader && uploader.length < 50 && !uploader.includes('VEVO')) {
      return this.cleanArtistName(uploader);
    }

    return 'Unknown Artist';
  }

  /**
   * Extract album from title
   */
  extractAlbum(title) {
    // Look for album indicators
    const albumPatterns = [
      /\(([^)]*?(?:album|ep|single)[^)]*?)\)/i,
      /\[([^]]*?(?:album|ep|single)[^]]*?)\]/i
    ];

    for (const pattern of albumPatterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Clean artist name
   */
  cleanArtistName(artist) {
    return artist
      .replace(/\s*-\s*VEVO\s*$/i, '')
      .replace(/\s*official\s*$/i, '')
      .replace(/\s*channel\s*$/i, '')
      .replace(/\s*tv\s*$/i, '')
      .replace(/[^\w\s'-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Enhance title for better search results
   */
  enhanceTitle(title) {
    // Remove extra whitespace and clean formatting
    return title
      .replace(/\s*-\s*official\s*video\s*$/i, '')
      .replace(/\s*-\s*official\s*music\s*video\s*$/i, '')
      .replace(/\s*-\s*lyric\s*video\s*$/i, '')
      .replace(/\s*-\s*lyrics\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Enhance artist name
   */
  enhanceArtist(artist) {
    // Fix common formatting issues
    return artist
      .replace(/^by\s+/i, '')
      .replace(/\s+feat\.?\s+.+$/i, '') // Remove featuring artists for cleaner search
      .trim();
  }

  /**
   * Get highest quality thumbnail URL
   */
  getHighestQualityThumbnail(thumbnail) {
    if (!thumbnail) return null;
    
    // YouTube thumbnails come in different qualities
    const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];
    
    // Return the highest quality (maxresdefault if available)
    if (thumbnail.includes('maxresdefault')) {
      return thumbnail;
    }
    
    // Extract base URL and add highest quality
    const baseUrl = thumbnail.split('?')[0];
    return `${baseUrl}?v=${this.extractVideoId(thumbnail)}`;
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  /**
   * Search for track on music platforms
   */
  async searchMusicPlatforms(metadata) {
    const searchQuery = `${metadata.artist} ${metadata.title}`;
    
    try {
      // This would integrate with actual music platform APIs
      // For now, we'll simulate the search process
      
      const platforms = ['spotify', 'apple-music', 'deezer', 'tidal'];
      const results = [];
      
      for (const platform of platforms) {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In production, you would make actual API calls here
          // For demonstration, we'll return empty results
          results.push({
            platform,
            found: false,
            confidence: 0
          });
        } catch (error) {
          console.log(`${platform} search failed:`, error.message);
          results.push({
            platform,
            found: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Music platform search failed:', error);
      return [];
    }
  }
}

module.exports = {
  metadataExtractor: new MetadataExtractor()
};