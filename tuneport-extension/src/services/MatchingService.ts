/**
 * MatchingService - Provides string similarity and metadata matching utilities
 * Uses Jaro-Winkler algorithm for better fuzzy matching than Jaccard
 */

export class MatchingService {
  /**
   * Calculate Jaro similarity between two strings
   * Returns a value between 0 (no similarity) and 1 (identical)
   */
  static jaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return (
      (matches / s1.length +
        matches / s2.length +
        (matches - transpositions / 2) / matches) /
      3
    );
  }

  /**
   * Calculate Jaro-Winkler similarity between two strings
   * Gives bonus weight to strings that match from the beginning
   * Returns a value between 0 (no similarity) and 1 (identical)
   */
  static jaroWinklerSimilarity(s1: string, s2: string, prefixScale: number = 0.1): number {
    const jaroSim = this.jaroSimilarity(s1, s2);

    // Find common prefix (up to 4 characters)
    let prefixLength = 0;
    const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
    
    for (let i = 0; i < maxPrefix; i++) {
      if (s1[i] === s2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    return jaroSim + prefixLength * prefixScale * (1 - jaroSim);
  }

  /**
   * Sanitize a title by removing common noise patterns
   * Used to clean YouTube titles before matching against Spotify
   */
  static sanitizeTitle(title: string): string {
    let cleaned = title;

    // Remove video-specific markers (case insensitive)
    const patternsToRemove = [
      /\s*\(?\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?\s*\)?\s*/gi,
      /\s*\[?\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?\s*\]?\s*/gi,
      /\s*\(?\s*lyrics?\s*(video)?\s*\)?\s*/gi,
      /\s*\[?\s*lyrics?\s*(video)?\s*\]?\s*/gi,
      /\s*\(?\s*audio\s*(only)?\s*\)?\s*/gi,
      /\s*\[?\s*audio\s*(only)?\s*\]?\s*/gi,
      /\s*\(?\s*visualizer\s*\)?\s*/gi,
      /\s*\[?\s*visualizer\s*\]?\s*/gi,
      /\s*\(?\s*hd\s*\)?\s*/gi,
      /\s*\[?\s*hd\s*\]?\s*/gi,
      /\s*\(?\s*hq\s*\)?\s*/gi,
      /\s*\[?\s*hq\s*\]?\s*/gi,
      /\s*\(?\s*4k\s*\)?\s*/gi,
      /\s*\[?\s*4k\s*\]?\s*/gi,
      /\s*\(?\s*1080p\s*\)?\s*/gi,
      /\s*\[?\s*1080p\s*\]?\s*/gi,
      /\s*\(?\s*remaster(ed)?\s*\)?\s*/gi,
      /\s*\[?\s*remaster(ed)?\s*\]?\s*/gi,
      /\s*\(?\s*explicit\s*\)?\s*/gi,
      /\s*\[?\s*explicit\s*\]?\s*/gi,
      /\s*\(?\s*clean\s*(version)?\s*\)?\s*/gi,
      /\s*\[?\s*clean\s*(version)?\s*\]?\s*/gi,
      /\s*\(?\s*radio\s*edit\s*\)?\s*/gi,
      /\s*\[?\s*radio\s*edit\s*\]?\s*/gi,
      /\s*\(?\s*extended\s*(mix|version)?\s*\)?\s*/gi,
      /\s*\[?\s*extended\s*(mix|version)?\s*\]?\s*/gi,
      /\s*\|\s*.*$/gi, // Remove everything after a pipe
      /\s*\/\/.*$/gi, // Remove everything after double slash
    ];

    for (const pattern of patternsToRemove) {
      cleaned = cleaned.replace(pattern, ' ');
    }

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Extract artist from title if format is "Artist - Title"
   * Returns { artist, title } or null if not in that format
   */
  static parseArtistTitle(fullTitle: string): { artist: string; title: string } | null {
    // Common separators: " - ", " – ", " — ", " | "
    const separators = [' - ', ' – ', ' — ', ' | '];
    
    for (const sep of separators) {
      const parts = fullTitle.split(sep);
      if (parts.length >= 2) {
        const artist = parts[0].trim();
        const title = parts.slice(1).join(sep).trim();
        
        // Basic validation - both parts should have content
        if (artist.length > 0 && title.length > 0) {
          return { artist, title };
        }
      }
    }

    return null;
  }

  /**
   * Normalize featuring artists in a string
   * Converts "ft.", "feat.", "featuring", "with" to a standard format
   */
  static normalizeFeaturing(text: string): string {
    return text
      .replace(/\s+ft\.?\s+/gi, ' feat. ')
      .replace(/\s+feat\.?\s+/gi, ' feat. ')
      .replace(/\s+featuring\s+/gi, ' feat. ')
      .replace(/\s+with\s+/gi, ' feat. ')
      .replace(/\s+x\s+/gi, ' & ') // "Artist x Artist" -> "Artist & Artist"
      .trim();
  }

  /**
   * Remove featuring artists from a string entirely
   * Useful for simplified matching
   */
  static removeFeaturing(text: string): string {
    return text
      .replace(/\s*[([\]]\s*(ft\.?|feat\.?|featuring)\s+[^)\]]+[)\]]\s*/gi, '')
      .replace(/\s+(ft\.?|feat\.?|featuring)\s+.+$/gi, '')
      .trim();
  }

  /**
   * Calculate overall match score between YouTube metadata and Spotify track
   */
  static calculateMatchScore(
    youtubeTitle: string,
    youtubeArtist: string | undefined,
    spotifyTitle: string,
    spotifyArtists: string[],
    youtubeDuration?: number, // seconds
    spotifyDuration?: number // milliseconds
  ): number {
    // Sanitize inputs
    const cleanYtTitle = this.sanitizeTitle(youtubeTitle).toLowerCase();
    const cleanSpTitle = spotifyTitle.toLowerCase();
    
    // Calculate title similarity
    const titleScore = this.jaroWinklerSimilarity(cleanYtTitle, cleanSpTitle);

    // Calculate artist similarity
    let artistScore = 0;
    if (youtubeArtist) {
      const cleanYtArtist = this.normalizeFeaturing(youtubeArtist).toLowerCase();
      const cleanSpArtists = spotifyArtists.map(a => a.toLowerCase()).join(' ');
      artistScore = this.jaroWinklerSimilarity(cleanYtArtist, cleanSpArtists);
    }

    // Calculate duration similarity (if available)
    let durationScore = 0.5; // Default to neutral if not available
    if (youtubeDuration && spotifyDuration) {
      const spotifyDurationSec = spotifyDuration / 1000;
      const durationDiff = Math.abs(youtubeDuration - spotifyDurationSec);
      // Full score if within 5 seconds, decreasing linearly up to 30 seconds
      durationScore = Math.max(0, 1 - durationDiff / 30);
    }

    // Weighted combination
    // Title: 50%, Artist: 35%, Duration: 15%
    const weights = {
      title: 0.5,
      artist: youtubeArtist ? 0.35 : 0, // If no artist, redistribute to title
      duration: 0.15
    };

    // Redistribute artist weight to title if no artist provided
    if (!youtubeArtist) {
      weights.title = 0.85;
    }

    const finalScore = 
      titleScore * weights.title +
      artistScore * weights.artist +
      durationScore * weights.duration;

    return Math.min(1, Math.max(0, finalScore));
  }

  /**
   * Determine confidence level based on match score
   */
  static getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Check if a match score meets the threshold for auto-adding
   */
  static isAutoAddable(score: number): boolean {
    return score >= 0.5;
  }
}
