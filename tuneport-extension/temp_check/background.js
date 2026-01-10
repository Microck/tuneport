(() => {
  // src/services/MatchingService.ts
  var MatchingService = class {
    /**
     * Calculate Jaro similarity between two strings
     * Returns a value between 0 (no similarity) and 1 (identical)
     */
    static jaroSimilarity(s1, s2) {
      if (s1 === s2)
        return 1;
      if (s1.length === 0 || s2.length === 0)
        return 0;
      const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
      const s1Matches = new Array(s1.length).fill(false);
      const s2Matches = new Array(s2.length).fill(false);
      let matches = 0;
      let transpositions = 0;
      for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, s2.length);
        for (let j = start; j < end; j++) {
          if (s2Matches[j] || s1[i] !== s2[j])
            continue;
          s1Matches[i] = true;
          s2Matches[j] = true;
          matches++;
          break;
        }
      }
      if (matches === 0)
        return 0;
      let k = 0;
      for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i])
          continue;
        while (!s2Matches[k])
          k++;
        if (s1[i] !== s2[k])
          transpositions++;
        k++;
      }
      return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
    }
    /**
     * Calculate Jaro-Winkler similarity between two strings
     * Gives bonus weight to strings that match from the beginning
     * Returns a value between 0 (no similarity) and 1 (identical)
     */
    static jaroWinklerSimilarity(s1, s2, prefixScale = 0.1) {
      const jaroSim = this.jaroSimilarity(s1, s2);
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
    static sanitizeTitle(title) {
      let cleaned = title;
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
        /\s*\|\s*.*$/gi,
        // Remove everything after a pipe
        /\s*\/\/.*$/gi
        // Remove everything after double slash
      ];
      for (const pattern of patternsToRemove) {
        cleaned = cleaned.replace(pattern, " ");
      }
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      return cleaned;
    }
    /**
     * Extract artist from title if format is "Artist - Title"
     * Returns { artist, title } or null if not in that format
     */
    static parseArtistTitle(fullTitle) {
      const separators = [" - ", " \u2013 ", " \u2014 ", " | "];
      for (const sep of separators) {
        const parts = fullTitle.split(sep);
        if (parts.length >= 2) {
          const artist = parts[0].trim();
          const title = parts.slice(1).join(sep).trim();
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
    static normalizeFeaturing(text) {
      return text.replace(/\s+ft\.?\s+/gi, " feat. ").replace(/\s+feat\.?\s+/gi, " feat. ").replace(/\s+featuring\s+/gi, " feat. ").replace(/\s+with\s+/gi, " feat. ").replace(/\s+x\s+/gi, " & ").trim();
    }
    /**
     * Remove featuring artists from a string entirely
     * Useful for simplified matching
     */
    static removeFeaturing(text) {
      return text.replace(/\s*[([\]]\s*(ft\.?|feat\.?|featuring)\s+[^)\]]+[)\]]\s*/gi, "").replace(/\s+(ft\.?|feat\.?|featuring)\s+.+$/gi, "").trim();
    }
    /**
     * Calculate overall match score between YouTube metadata and Spotify track
     */
    static calculateMatchScore(youtubeTitle, youtubeArtist, spotifyTitle, spotifyArtists, youtubeDuration, spotifyDuration) {
      const cleanYtTitle = this.sanitizeTitle(youtubeTitle).toLowerCase();
      const cleanSpTitle = spotifyTitle.toLowerCase();
      const titleScore = this.jaroWinklerSimilarity(cleanYtTitle, cleanSpTitle);
      let artistScore = 0;
      if (youtubeArtist) {
        const cleanYtArtist = this.normalizeFeaturing(youtubeArtist).toLowerCase();
        const cleanSpArtists = spotifyArtists.map((a) => a.toLowerCase()).join(" ");
        artistScore = this.jaroWinklerSimilarity(cleanYtArtist, cleanSpArtists);
      }
      let durationScore = 0.5;
      if (youtubeDuration && spotifyDuration) {
        const spotifyDurationSec = spotifyDuration / 1e3;
        const durationDiff = Math.abs(youtubeDuration - spotifyDurationSec);
        durationScore = Math.max(0, 1 - durationDiff / 30);
      }
      const weights = {
        title: 0.5,
        artist: youtubeArtist ? 0.35 : 0,
        // If no artist, redistribute to title
        duration: 0.15
      };
      if (!youtubeArtist) {
        weights.title = 0.85;
      }
      const finalScore = titleScore * weights.title + artistScore * weights.artist + durationScore * weights.duration;
      return Math.min(1, Math.max(0, finalScore));
    }
    /**
     * Determine confidence level based on match score
     */
    static getConfidenceLevel(score) {
      if (score >= 0.8)
        return "high";
      if (score >= 0.5)
        return "medium";
      return "low";
    }
    /**
     * Check if a match score meets the threshold for auto-adding
     */
    static isAutoAddable(score) {
      return score >= 0.5;
    }
  };

  // src/services/CobaltService.ts
  var COBALT_INSTANCES = [
    "https://cobalt-api.meowing.de",
    "https://cobalt-backend.canine.tools",
    "https://kityune.imput.net",
    "https://blossom.imput.net"
  ];
  var DEFAULT_INSTANCE = COBALT_INSTANCES[0];
  var CobaltService = class {
    static {
      this.instance = DEFAULT_INSTANCE;
    }
    static {
      this.instanceIndex = 0;
    }
    static setInstance(url) {
      this.instance = url.replace(/\/$/, "");
    }
    static setApiKey(key) {
      this.apiKey = key;
    }
    static getAvailableInstances() {
      return COBALT_INSTANCES;
    }
    static async getDownloadUrl(youtubeUrl, options = {}) {
      const { format = "best", customInstance } = options;
      console.log("[CobaltService] getDownloadUrl called:", { youtubeUrl, format, customInstance });
      const instancesToTry = customInstance ? [customInstance] : COBALT_INSTANCES;
      for (const instanceUrl of instancesToTry) {
        console.log("[CobaltService] Trying instance:", instanceUrl);
        const result = await this.tryInstance(instanceUrl, youtubeUrl, format);
        console.log("[CobaltService] Instance result:", { instanceUrl, success: result.success, error: result.error });
        if (result.success) {
          return result;
        }
        if (result.error?.includes("Rate limit") || result.error?.includes("authentication")) {
          continue;
        }
        return result;
      }
      return {
        success: false,
        error: "All Cobalt instances failed. Please try again later.",
        source: "cobalt",
        quality: this.getActualYouTubeQuality(format)
      };
    }
    static async tryInstance(instanceUrl, youtubeUrl, format) {
      const requestBody = {
        url: youtubeUrl,
        downloadMode: "audio",
        audioFormat: format,
        filenameStyle: "pretty"
      };
      const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (this.apiKey) {
        headers["Authorization"] = `Api-Key ${this.apiKey}`;
      }
      console.log("[CobaltService] Request:", { instanceUrl, requestBody });
      try {
        const response = await fetch(`${instanceUrl}/`, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody)
        });
        console.log("[CobaltService] Response status:", response.status);
        if (!response.ok) {
          if (response.status === 401) {
            return {
              success: false,
              error: "Cobalt authentication required. Please configure an API key or use a different instance.",
              source: "cobalt",
              quality: this.getActualYouTubeQuality(format)
            };
          }
          if (response.status === 429) {
            return {
              success: false,
              error: "Rate limit exceeded. Please try again later.",
              source: "cobalt",
              quality: this.getActualYouTubeQuality(format)
            };
          }
          return {
            success: false,
            error: `Cobalt request failed: ${response.status}`,
            source: "cobalt",
            quality: this.getActualYouTubeQuality(format)
          };
        }
        const data = await response.json();
        console.log("[CobaltService] Response data:", data);
        if (data.status === "error") {
          return {
            success: false,
            error: this.formatError(data.error.code, data.error.context),
            source: "cobalt",
            quality: this.getActualYouTubeQuality(format)
          };
        }
        if (data.status === "tunnel" || data.status === "redirect") {
          const actualQuality = this.getActualYouTubeQuality(format);
          console.log("[CobaltService] Success - URL:", data.url?.substring(0, 100));
          return {
            success: true,
            url: data.url,
            filename: data.filename,
            source: "cobalt",
            quality: actualQuality
          };
        }
        return {
          success: false,
          error: "Unexpected response from Cobalt",
          source: "cobalt",
          quality: this.getActualYouTubeQuality(format)
        };
      } catch (error) {
        console.error("[CobaltService] Exception:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Network error",
          source: "cobalt",
          quality: this.getActualYouTubeQuality(format)
        };
      }
    }
    static async downloadAudio(youtubeUrl, downloadPath, options = {}) {
      const result = await this.getDownloadUrl(youtubeUrl, options);
      if (!result.success || !result.url) {
        return result;
      }
      try {
        const downloadId = await chrome.downloads.download({
          url: result.url,
          filename: `TunePort/${result.filename || "download.mp3"}`,
          saveAs: false
        });
        if (downloadId === void 0) {
          return {
            ...result,
            success: false,
            error: "Failed to start download"
          };
        }
        return result;
      } catch (error) {
        return {
          ...result,
          success: false,
          error: error instanceof Error ? error.message : "Download failed"
        };
      }
    }
    static formatError(code, context) {
      const errorMessages = {
        "error.api.link.invalid": "Invalid URL provided",
        "error.api.link.unsupported": "This URL is not supported",
        "error.api.rate_exceeded": "Rate limit exceeded",
        "error.api.auth.api-key.missing": "API key required",
        "error.api.auth.api-key.invalid": "Invalid API key",
        "error.api.content.unavailable": "Content is unavailable",
        "error.api.content.region_locked": "Content is region locked",
        "error.api.content.private": "Content is private",
        "error.api.content.age_restricted": "Content is age restricted",
        "error.api.youtube.codec_not_found": "Requested codec not available",
        "error.api.youtube.login": "YouTube login required",
        "error.api.youtube.no_matching_format": "No matching format found"
      };
      let message = errorMessages[code] || `Error: ${code}`;
      if (context?.limit) {
        message += ` (limit: ${context.limit}s)`;
      }
      return message;
    }
    static getQualityLabel(format) {
      if (format === "best" || format === "opus") {
        return "Opus ~128k (best)";
      }
      return `${format.toUpperCase()} (re-encoded)`;
    }
    static getActualYouTubeQuality(format) {
      if (format === "best" || format === "opus") {
        return "Opus ~128k";
      }
      return `${format.toUpperCase()} (from Opus source)`;
    }
    static getQualityPresets() {
      return [
        { format: "best", label: "Opus (Best Quality)" },
        { format: "opus", label: "Opus (Native)" },
        { format: "mp3", label: "MP3 (Re-encoded)" },
        { format: "ogg", label: "OGG (Re-encoded)" },
        { format: "wav", label: "WAV (Uncompressed)" }
      ];
    }
  };

  // src/services/LucidaService.ts
  var SOURCE_PRIORITY = ["qobuz", "tidal", "deezer"];
  var LucidaService = class {
    static {
      this.enabled = false;
    }
    static setEnabled(enabled) {
      this.enabled = enabled;
    }
    static isEnabled() {
      return this.enabled;
    }
    static setApiEndpoint(endpoint) {
      this.apiEndpoint = endpoint;
    }
    static async searchTrack(title, artist, options = {}) {
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
    static async searchOnSource(title, artist, source) {
      if (!this.apiEndpoint) {
        return { found: false };
      }
      try {
        const response = await fetch(`${this.apiEndpoint}/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
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
          if (!this.isStrictMatch(title, artist, data.title, data.artist)) {
            console.warn(`Lucida: Rejected loose match - wanted "${artist} - ${title}", got "${data.artist} - ${data.title}"`);
            return { found: false };
          }
          return {
            found: true,
            source,
            quality: data.quality || "flac",
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
    static isStrictMatch(wantTitle, wantArtist, gotTitle, gotArtist) {
      if (!gotTitle || !gotArtist) {
        return false;
      }
      const normalize = (s) => s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
      const normalizedWantTitle = normalize(wantTitle);
      const normalizedWantArtist = normalize(wantArtist);
      const normalizedGotTitle = normalize(gotTitle);
      const normalizedGotArtist = normalize(gotArtist);
      const titleMatch = normalizedWantTitle === normalizedGotTitle || normalizedGotTitle.includes(normalizedWantTitle) || normalizedWantTitle.includes(normalizedGotTitle);
      const artistMatch = normalizedWantArtist === normalizedGotArtist || normalizedGotArtist.includes(normalizedWantArtist) || normalizedWantArtist.includes(normalizedGotArtist);
      if (!titleMatch || !artistMatch) {
        return false;
      }
      const titleSimilarity = this.similarity(normalizedWantTitle, normalizedGotTitle);
      const artistSimilarity = this.similarity(normalizedWantArtist, normalizedGotArtist);
      return titleSimilarity >= 0.85 && artistSimilarity >= 0.8;
    }
    static similarity(a, b) {
      if (a === b)
        return 1;
      if (a.length === 0 || b.length === 0)
        return 0;
      const longer = a.length > b.length ? a : b;
      const shorter = a.length > b.length ? b : a;
      const longerLength = longer.length;
      if (longerLength === 0)
        return 1;
      const editDistance = this.levenshteinDistance(longer, shorter);
      return (longerLength - editDistance) / longerLength;
    }
    static levenshteinDistance(a, b) {
      const matrix = [];
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    }
    static async getDownloadUrl(title, artist, options = {}) {
      if (!this.enabled) {
        return {
          success: false,
          error: "Lucida sources not enabled"
        };
      }
      const searchResult = await this.searchTrack(title, artist, options);
      if (!searchResult.found || !searchResult.url) {
        return {
          success: false,
          error: "Track not found on lossless sources"
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
    static formatQuality(result) {
      if (result.quality === "flac") {
        if (result.bitDepth && result.sampleRate) {
          return `FLAC ${result.bitDepth}-bit/${result.sampleRate / 1e3}kHz`;
        }
        return "FLAC";
      }
      return result.quality?.toUpperCase() || "Unknown";
    }
    static getSourceLabel(source) {
      const labels = {
        qobuz: "Qobuz",
        tidal: "Tidal",
        deezer: "Deezer"
      };
      return labels[source] || source;
    }
    static async loadSettings() {
      try {
        const result = await chrome.storage.local.get([
          "lucida_enabled",
          "lucida_api_endpoint"
        ]);
        this.enabled = result.lucida_enabled || false;
        this.apiEndpoint = result.lucida_api_endpoint;
      } catch (error) {
        console.error("Failed to load Lucida settings:", error);
      }
    }
    static async saveSettings(enabled, endpoint) {
      try {
        await chrome.storage.local.set({
          lucida_enabled: enabled,
          lucida_api_endpoint: endpoint
        });
        this.enabled = enabled;
        this.apiEndpoint = endpoint;
      } catch (error) {
        console.error("Failed to save Lucida settings:", error);
      }
    }
  };

  // src/services/DownloadService.ts
  var DownloadService = class {
    static async getDownloadUrl(youtubeUrl, title, artist, options = {}) {
      const { preferLossless = true, format = "best" } = options;
      console.log("[DownloadService] getDownloadUrl called:", { youtubeUrl, title, artist, format });
      if (preferLossless && LucidaService.isEnabled()) {
        console.log("[DownloadService] Trying Lucida first...");
        const lucidaResult = await LucidaService.getDownloadUrl(
          title,
          artist,
          options.lucidaOptions
        );
        if (lucidaResult.success && lucidaResult.url) {
          console.log("[DownloadService] Lucida success:", lucidaResult);
          return {
            success: true,
            url: lucidaResult.url,
            filename: lucidaResult.filename,
            source: "lucida",
            originalSource: lucidaResult.source,
            quality: lucidaResult.quality || "FLAC",
            isLossless: true
          };
        }
        console.log("[DownloadService] Lucida failed, falling back to Cobalt");
      }
      console.log("[DownloadService] Calling Cobalt...");
      const cobaltResult = await CobaltService.getDownloadUrl(youtubeUrl, {
        format
      });
      console.log("[DownloadService] Cobalt result:", cobaltResult);
      if (cobaltResult.success && cobaltResult.url) {
        return {
          success: true,
          url: cobaltResult.url,
          filename: cobaltResult.filename,
          source: "cobalt",
          quality: cobaltResult.quality,
          isLossless: false
        };
      }
      return {
        success: false,
        source: "cobalt",
        quality: CobaltService.getQualityLabel(format),
        isLossless: false,
        error: cobaltResult.error || "Download failed"
      };
    }
    static async downloadAudio(youtubeUrl, title, artist, options = {}) {
      console.log("[DownloadService] downloadAudio called:", { youtubeUrl, title, artist, options });
      const result = await this.getDownloadUrl(youtubeUrl, title, artist, options);
      console.log("[DownloadService] getDownloadUrl result:", result);
      if (!result.success || !result.url) {
        console.error("[DownloadService] No URL to download:", result.error);
        return result;
      }
      try {
        const filename = result.filename || this.generateFilename(title, artist, result.quality);
        const sanitizedFilename = this.sanitizeFilename(filename);
        const fullPath = `TunePort/${sanitizedFilename}`;
        console.log("[DownloadService] Starting chrome.downloads.download:", {
          url: result.url.substring(0, 100) + "...",
          filename: fullPath
        });
        const downloadId = await chrome.downloads.download({
          url: result.url,
          filename: fullPath,
          saveAs: false
        });
        console.log("[DownloadService] chrome.downloads.download returned:", downloadId);
        if (downloadId === void 0) {
          const lastError = chrome.runtime.lastError;
          console.error("[DownloadService] Download failed, lastError:", lastError);
          return {
            ...result,
            success: false,
            error: lastError?.message || "Failed to start download - no download ID returned"
          };
        }
        this.monitorDownload(downloadId);
        return {
          ...result,
          filename: sanitizedFilename,
          downloadId
        };
      } catch (error) {
        console.error("[DownloadService] Download exception:", error);
        return {
          ...result,
          success: false,
          error: error instanceof Error ? error.message : "Download failed"
        };
      }
    }
    static monitorDownload(downloadId) {
      const listener = (delta) => {
        if (delta.id !== downloadId)
          return;
        console.log("[DownloadService] Download state change:", {
          id: delta.id,
          state: delta.state,
          error: delta.error,
          filename: delta.filename
        });
        if (delta.state?.current === "complete") {
          console.log("[DownloadService] Download complete!");
          chrome.downloads.onChanged.removeListener(listener);
        } else if (delta.state?.current === "interrupted") {
          console.error("[DownloadService] Download interrupted:", delta.error);
          chrome.downloads.onChanged.removeListener(listener);
        }
      };
      chrome.downloads.onChanged.addListener(listener);
      chrome.downloads.search({ id: downloadId }, (results) => {
        if (results && results[0]) {
          console.log("[DownloadService] Initial download state:", {
            id: results[0].id,
            state: results[0].state,
            filename: results[0].filename,
            error: results[0].error
          });
        }
      });
    }
    static sanitizeFilename(filename) {
      return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim().substring(0, 200);
    }
    static generateFilename(title, artist, quality) {
      const sanitize = (str) => str.replace(/[<>:"/\\|?*]/g, "").trim();
      const ext = quality.toLowerCase().includes("flac") ? "flac" : quality.toLowerCase().includes("opus") ? "opus" : "mp3";
      if (artist) {
        return `${sanitize(artist)} - ${sanitize(title)}.${ext}`;
      }
      return `${sanitize(title)}.${ext}`;
    }
    static shouldShowLosslessWarning(result) {
      return !result.isLossless && LucidaService.isEnabled();
    }
    static getQualityWarningMessage(result) {
      if (result.isLossless) {
        return "";
      }
      return "From YouTube (Opus ~128k). Enable Lucida for lossless.";
    }
  };

  // src/services/YouTubeMetadataService.ts
  var YouTubeMetadataService = class {
    /**
     * Extract metadata from the current YouTube page
     */
    static async extractFromCurrentPage() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          return null;
        }
        const videoId = this.extractVideoId(tab.url);
        if (!videoId) {
          return null;
        }
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: this.extractMetadataFromDOM
        });
        if (result && result[0]) {
          const metadata = result[0].result;
          return {
            videoId,
            title: metadata.title,
            artist: metadata.artist,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            duration: metadata.duration || 0,
            url: tab.url
          };
        }
        return null;
      } catch (error) {
        console.error("Failed to extract YouTube metadata:", error);
        return null;
      }
    }
    /**
     * Extract video ID from URL
     */
    static extractVideoId(url) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return null;
    }
    /**
     * Extract metadata from the DOM (executed in content script)
     */
    static extractMetadataFromDOM() {
      const metadata = {
        title: "",
        artist: "",
        duration: 0
      };
      const titleSelectors = [
        'meta[name="title"]',
        "h1.ytd-video-primary-info-renderer",
        "h1.title",
        "#container h1"
      ];
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.getAttribute("content") || element.textContent?.trim();
          if (text) {
            metadata.title = text;
            break;
          }
        }
      }
      if (metadata.title && metadata.title.includes(" - ")) {
        const parts = metadata.title.split(" - ");
        metadata.artist = parts[0].trim();
      } else {
        const channelSelectors = [
          "ytd-video-owner-renderer a",
          "yt-formatted-string.ytd-channel-name a",
          ".ytd-channel-name a"
        ];
        for (const selector of channelSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            metadata.artist = element.textContent.trim();
            break;
          }
        }
      }
      const durationSelectors = [
        ".ytp-time-duration",
        "span.ytd-thumbnail-overlay-time-status-renderer",
        'meta[itemprop="duration"]'
      ];
      for (const selector of durationSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.getAttribute("content") || element.textContent?.trim();
          if (text) {
            metadata.duration = this.parseDuration(text);
            break;
          }
        }
      }
      return metadata;
    }
    /**
     * Parse duration string to seconds
     */
    static parseDuration(duration) {
      const isoMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (isoMatch) {
        const hours = parseInt(isoMatch[1] || "0");
        const minutes = parseInt(isoMatch[2] || "0");
        const seconds = parseInt(isoMatch[3] || "0");
        return hours * 3600 + minutes * 60 + seconds;
      }
      const timeMatch = duration.match(/(\d+):(\d+)/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        return minutes * 60 + seconds;
      }
      return 0;
    }
    /**
     * Search YouTube metadata via oEmbed (fallback method)
     */
    static async fetchViaOEmbed(videoId) {
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) {
          throw new Error("oEmbed request failed");
        }
        const data = await response.json();
        return {
          videoId,
          title: data.title,
          artist: data.author_name || "",
          thumbnail: data.thumbnail_url || "",
          url: `https://www.youtube.com/watch?v=${videoId}`
        };
      } catch (error) {
        console.error("Failed to fetch via oEmbed:", error);
        throw error;
      }
    }
    /**
     * Validate YouTube URL
     */
    static isValidYouTubeUrl(url) {
      return this.extractVideoId(url) !== null;
    }
    /**
     * Format duration from seconds to MM:SS
     */
    static formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    static async fetchMusicMetadata(videoId) {
      console.log("[YouTubeMetadataService] fetchMusicMetadata for:", videoId);
      const ytMusicResult = await this.tryYouTubeMusicOEmbed(videoId);
      if (ytMusicResult) {
        console.log("[YouTubeMetadataService] Found via YouTube Music oEmbed:", ytMusicResult);
        return ytMusicResult;
      }
      const regularOEmbed = await this.fetchViaOEmbed(videoId);
      if (regularOEmbed.title) {
        const parsed = this.parseCleanMusicTitle(regularOEmbed.title, regularOEmbed.artist || "");
        if (parsed) {
          console.log("[YouTubeMetadataService] Parsed from title:", parsed);
          return parsed;
        }
      }
      console.log("[YouTubeMetadataService] No music metadata found");
      return null;
    }
    static async tryYouTubeMusicOEmbed(videoId) {
      try {
        const ytMusicUrl = `https://music.youtube.com/watch?v=${videoId}`;
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(ytMusicUrl)}&format=json`
        );
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        if (data.title && data.author_name) {
          const cleanTitle = this.sanitizeMusicTitle(data.title);
          if (data.title.includes(" - ")) {
            const parts = data.title.split(" - ");
            return {
              title: this.sanitizeMusicTitle(parts.slice(1).join(" - ")),
              artist: parts[0].trim(),
              source: "youtube_music",
              confidence: "high"
            };
          }
          return {
            title: cleanTitle,
            artist: data.author_name,
            source: "youtube_music",
            confidence: "medium"
          };
        }
        return null;
      } catch (error) {
        console.log("[YouTubeMetadataService] YouTube Music oEmbed failed:", error);
        return null;
      }
    }
    static parseCleanMusicTitle(title, channelName) {
      const cleanTitle = this.sanitizeMusicTitle(title);
      if (cleanTitle.includes(" - ")) {
        const parts = cleanTitle.split(" - ");
        return {
          title: parts.slice(1).join(" - ").trim(),
          artist: parts[0].trim(),
          source: "title_parse",
          confidence: "medium"
        };
      }
      if (channelName && !channelName.toLowerCase().includes("vevo") && !channelName.toLowerCase().includes("official")) {
        return {
          title: cleanTitle,
          artist: channelName,
          source: "title_parse",
          confidence: "low"
        };
      }
      return null;
    }
    static sanitizeMusicTitle(title) {
      return title.replace(/\s*\(?\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?\s*\)?\s*/gi, "").replace(/\s*\[?\s*official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?\s*\]?\s*/gi, "").replace(/\s*\(?\s*lyrics?\s*(video)?\s*\)?\s*/gi, "").replace(/\s*\[?\s*lyrics?\s*(video)?\s*\]?\s*/gi, "").replace(/\s*\(?\s*audio\s*(only)?\s*\)?\s*/gi, "").replace(/\s*\[?\s*audio\s*(only)?\s*\]?\s*/gi, "").replace(/\s*\(?\s*visualizer\s*\)?\s*/gi, "").replace(/\s*\[?\s*visualizer\s*\]?\s*/gi, "").replace(/\s*\(?\s*hd\s*\)?\s*/gi, "").replace(/\s*\[?\s*hd\s*\]?\s*/gi, "").replace(/\s*\(?\s*4k\s*\)?\s*/gi, "").replace(/\s*\[?\s*4k\s*\]?\s*/gi, "").replace(/\s*\|\s*.*$/gi, "").replace(/\s+/g, " ").trim();
    }
  };

  // src/background/index.ts
  var BackgroundService = class {
    constructor() {
      this.isContextMenuCreated = false;
      this.spotifyToken = null;
      this.activeJobs = /* @__PURE__ */ new Map();
      this.initializeService();
    }
    async initializeService() {
      try {
        await this.loadStoredData();
        this.setupMessageListeners();
        await this.createContextMenu();
        console.log("TunePort Background Service initialized");
      } catch (error) {
        console.error("Failed to initialize background service:", error);
      }
    }
    async loadStoredData() {
      try {
        const result = await chrome.storage.local.get(["spotifyToken", "spotify_access_token", "spotify_token_expiry"]);
        if (result.spotify_access_token) {
          this.spotifyToken = result.spotify_access_token;
        } else if (result.spotifyToken) {
          this.spotifyToken = result.spotifyToken;
        }
        await LucidaService.loadSettings();
      } catch (error) {
        console.error("Failed to load stored data:", error);
      }
    }
    setupMessageListeners() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      });
      chrome.contextMenus.onClicked.addListener((info) => {
        this.handleContextMenuClick(info);
      });
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.url) {
          this.handleTabUpdate(tabId, changeInfo.url);
        }
      });
    }
    async handleTabUpdate(tabId, url) {
      const redirectUri = chrome.runtime.getURL("popup/auth-callback.html");
      if (url.startsWith(redirectUri)) {
        console.log("[TunePort BG] Sniffed redirect URL:", url);
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get("code");
          const state = urlObj.searchParams.get("state");
          if (code && state) {
            console.log("[TunePort BG] Extracting code and state from sniffed URL");
            const result = await new Promise((resolve) => {
              this.handleExchangeSpotifyCode({ code, state }, (res) => resolve(res));
            });
            console.log("[TunePort BG] Exchange result:", result);
            if (result && result.success) {
              const userName = result.userName || "";
              const successUrl = chrome.runtime.getURL("popup/auth-success.html") + (userName ? `?user=${encodeURIComponent(userName)}` : "");
              chrome.tabs.update(tabId, { url: successUrl });
            } else {
              setTimeout(() => {
                chrome.tabs.remove(tabId).catch(() => {
                });
              }, 3e3);
            }
          }
        } catch (error) {
          console.error("[TunePort BG] Error handling sniffed URL:", error);
        }
      }
    }
    async createContextMenu() {
      if (this.isContextMenuCreated) {
        return;
      }
      try {
        await chrome.contextMenus.removeAll();
        chrome.contextMenus.create({
          id: "tuneport-main",
          title: "TunePort",
          contexts: ["page", "video", "link"],
          documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
        });
        chrome.contextMenus.create({
          id: "tuneport-settings",
          parentId: "tuneport-main",
          title: "Open Settings",
          contexts: ["page", "video", "link"],
          documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
        });
        this.isContextMenuCreated = true;
        console.log("Context menu created successfully");
      } catch (error) {
        console.error("Failed to create context menu:", error);
      }
    }
    async updatePlaylistMenu() {
      try {
        const token = await this.getSpotifyToken();
        if (!token) {
          return;
        }
        const response = await fetch(
          "https://api.spotify.com/v1/me/playlists?limit=20",
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        if (!response.ok) {
          console.error("Failed to fetch playlists for context menu");
          return;
        }
        const data = await response.json();
        const playlists = data.items || [];
        const settings = await this.getSettings();
        await chrome.contextMenus.removeAll();
        this.isContextMenuCreated = false;
        await this.createContextMenu();
        chrome.contextMenus.create({
          id: "tuneport-separator",
          parentId: "tuneport-main",
          type: "separator",
          contexts: ["video", "link"],
          documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
        });
        for (const playlist of playlists.slice(0, 10)) {
          chrome.contextMenus.create({
            id: `tuneport-playlist-${playlist.id}`,
            parentId: "tuneport-main",
            title: `Add to "${playlist.name}"`,
            contexts: ["video", "link"],
            documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
          });
          if (settings.enableDownload) {
            chrome.contextMenus.create({
              id: `tuneport-playlist-dl-${playlist.id}`,
              parentId: "tuneport-main",
              title: `Add + Download to "${playlist.name}"`,
              contexts: ["video", "link"],
              documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
            });
          }
        }
        console.log(`Updated playlist menu with ${playlists.length} playlists`);
      } catch (error) {
        console.error("Failed to update playlist menu:", error);
      }
    }
    async getSettings() {
      try {
        const result = await chrome.storage.local.get(["tuneport_settings"]);
        const defaults = {
          enableDownload: false,
          defaultQuality: "best",
          defaultPlaylist: "",
          spotifyFallbackMode: "auto"
        };
        return { ...defaults, ...result.tuneport_settings };
      } catch {
        return { enableDownload: false, defaultQuality: "best", defaultPlaylist: "", spotifyFallbackMode: "auto" };
      }
    }
    async handleContextMenuClick(info) {
      console.log("Context menu clicked:", info.menuItemId);
      const youtubeUrl = info.linkUrl || info.pageUrl;
      if (info.menuItemId === "tuneport-settings") {
        chrome.runtime.openOptionsPage();
        return;
      }
      if (info.menuItemId === "tuneport-add-default" || info.menuItemId === "tuneport-add-download") {
        const withDownload = info.menuItemId === "tuneport-add-download";
        if (youtubeUrl) {
          try {
            await chrome.action.openPopup();
          } catch {
          }
          const settings = await this.getSettings();
          if (settings.defaultPlaylist) {
            await this.addTrackToPlaylist(
              youtubeUrl,
              settings.defaultPlaylist,
              withDownload,
              withDownload ? { format: "best" } : void 0
            );
          } else {
            this.showNotification(
              "Select Playlist",
              "Open the popup and select a playlist first",
              "error"
            );
          }
        }
        return;
      }
      const playlistMatch = info.menuItemId?.toString().match(/^tuneport-playlist-(dl-)?(.+)$/);
      if (playlistMatch) {
        const withDownload = !!playlistMatch[1];
        const playlistId = playlistMatch[2];
        if (youtubeUrl) {
          try {
            await chrome.action.openPopup();
          } catch {
          }
          await this.addTrackToPlaylist(
            youtubeUrl,
            playlistId,
            withDownload,
            withDownload ? { format: "best" } : void 0
          );
        }
      }
    }
    handleMessage(message, sender, sendResponse) {
      const { type, data } = message;
      console.log("[TunePort BG] Message received:", type);
      switch (type) {
        case "ADD_TRACK_TO_PLAYLIST":
          this.handleAddTrackToPlaylist(data, sendResponse);
          break;
        case "SEARCH_SPOTIFY_TRACK":
          this.handleSearchSpotifyTrack(data, sendResponse);
          break;
        case "GET_SPOTIFY_PLAYLISTS":
          this.handleGetSpotifyPlaylists(sendResponse);
          break;
        case "SET_SPOTIFY_TOKEN":
          this.handleSetSpotifyToken(message.token);
          sendResponse({ success: true });
          break;
        case "EXCHANGE_SPOTIFY_CODE":
          this.handleExchangeSpotifyCode(message, sendResponse);
          break;
        case "UPDATE_CONTEXT_MENU":
          this.handleUpdateContextMenu(sendResponse);
          break;
        case "GET_ACTIVE_JOBS":
          sendResponse({ jobs: Array.from(this.activeJobs.values()) });
          break;
        case "GET_JOB_STATUS":
          this.handleGetJobStatus(message.jobId, sendResponse);
          break;
        case "CONFIRM_FALLBACK":
          this.handleConfirmFallback(message.jobId, sendResponse);
          break;
        case "REJECT_FALLBACK":
          this.handleRejectFallback(message.jobId, sendResponse);
          break;
        case "EXCHANGE_SPOTIFY_CODE_DIRECT":
          this.handleExchangeSpotifyCodeDirect(message, sendResponse);
          break;
        case "CLOSE_TAB":
          if (sender.tab?.id) {
            chrome.tabs.remove(sender.tab.id).catch(() => {
            });
          }
          break;
        default:
          console.warn("Unknown message type:", type);
          sendResponse({ error: "Unknown message type" });
      }
    }
    async handleAddTrackToPlaylist(data, sendResponse) {
      try {
        const { youtubeUrl, playlistId, download, downloadOptions } = data;
        if (!youtubeUrl || !playlistId) {
          sendResponse({ error: "YouTube URL and playlist ID are required" });
          return;
        }
        const job = await this.addTrackToPlaylist(youtubeUrl, playlistId, download, downloadOptions);
        sendResponse({ success: true, jobId: job.jobId });
      } catch (error) {
        console.error("Add track failed:", error);
        sendResponse({
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    async addTrackToPlaylist(youtubeUrl, playlistId, enableDownload = false, downloadOptions) {
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const job = {
        jobId,
        youtubeUrl,
        playlistId,
        status: "queued",
        progress: 0,
        downloadInfo: { enabled: enableDownload },
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        currentStep: "Initializing...",
        startedAt: Date.now()
      };
      this.activeJobs.set(jobId, job);
      try {
        job.status = "searching";
        job.progress = 10;
        job.currentStep = "Fetching YouTube metadata...";
        this.activeJobs.set(jobId, { ...job });
        const metadata = await this.extractYouTubeMetadata(youtubeUrl);
        if (!metadata) {
          throw new Error("Could not extract video metadata");
        }
        job.trackInfo = {
          title: metadata.title,
          artist: metadata.artist
        };
        job.currentStep = "Searching Spotify...";
        this.activeJobs.set(jobId, {
          ...job,
          trackInfo: { title: metadata.title, artist: metadata.artist },
          thumbnail: metadata.thumbnail
        });
        job.progress = 30;
        const searchResults = await this.searchOnSpotify(metadata.title, metadata.artist, metadata.duration);
        job.progress = 50;
        if (!searchResults.exactMatch) {
          const settings = await this.getSettings();
          const fallbackMode = settings.spotifyFallbackMode || "auto";
          if (fallbackMode === "never") {
            throw new Error("Could not find matching track on Spotify");
          }
          const videoId = this.extractVideoId(youtubeUrl);
          if (!videoId) {
            throw new Error("Could not find matching track on Spotify");
          }
          job.currentStep = "Trying YouTube Music metadata...";
          this.activeJobs.set(jobId, { ...job });
          const musicMetadata = await YouTubeMetadataService.fetchMusicMetadata(videoId);
          if (!musicMetadata) {
            throw new Error("Could not find matching track on Spotify");
          }
          console.log("[TunePort BG] Found YouTube Music metadata:", musicMetadata);
          if (fallbackMode === "ask") {
            job.status = "awaiting_fallback";
            job.fallbackMetadata = musicMetadata;
            job.currentStep = "Waiting for confirmation...";
            this.activeJobs.set(jobId, { ...job });
            return job;
          }
          job.currentStep = "Searching Spotify with new metadata...";
          this.activeJobs.set(jobId, { ...job });
          const fallbackResults = await this.searchOnSpotify(
            musicMetadata.title,
            musicMetadata.artist,
            metadata.duration
          );
          if (!fallbackResults.exactMatch) {
            throw new Error("Could not find matching track on Spotify (tried YouTube Music fallback)");
          }
          searchResults.exactMatch = fallbackResults.exactMatch;
          job.trackInfo = {
            title: musicMetadata.title,
            artist: musicMetadata.artist,
            spotifyTrack: fallbackResults.exactMatch
          };
        }
        job.trackInfo.spotifyTrack = searchResults.exactMatch;
        job.status = "adding";
        job.progress = 60;
        job.currentStep = "Adding to playlist...";
        this.activeJobs.set(jobId, { ...job });
        const result = await this.addToPlaylist(playlistId, searchResults.exactMatch.uri);
        job.progress = 70;
        if (enableDownload && downloadOptions) {
          job.status = "downloading";
          job.currentStep = "Downloading audio...";
          this.activeJobs.set(jobId, { ...job });
          const format = downloadOptions.format || "best";
          const downloadResult = await DownloadService.downloadAudio(
            youtubeUrl,
            metadata.title,
            metadata.artist,
            { format, preferLossless: true }
          );
          if (downloadResult.success) {
            job.downloadInfo = {
              enabled: true,
              quality: downloadResult.quality,
              source: downloadResult.source,
              filename: downloadResult.filename
            };
            if (!downloadResult.isLossless && LucidaService.isEnabled()) {
              console.info("Lossless not available, used YouTube source");
            }
          } else {
            job.downloadInfo = {
              enabled: true,
              quality: downloadResult.quality
            };
            console.warn("Download failed:", downloadResult.error);
          }
        }
        job.status = "completed";
        job.progress = 100;
        job.currentStep = void 0;
        this.activeJobs.set(jobId, { ...job });
        if (result.duplicate) {
          this.showNotification(
            "Already in Playlist",
            `"${metadata.title}" is already in this playlist`,
            "success"
          );
        } else {
          const downloadMsg = enableDownload && job.downloadInfo?.filename ? ` (Downloaded: ${job.downloadInfo.quality})` : "";
          this.showNotification(
            "Added to Spotify",
            `"${metadata.title}" added to playlist${downloadMsg}`,
            "success"
          );
        }
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.currentStep = void 0;
        this.activeJobs.set(jobId, { ...job });
        this.showNotification(
          "Failed",
          job.error,
          "error"
        );
      }
      return job;
    }
    async extractYouTubeMetadata(youtubeUrl) {
      try {
        const videoId = this.extractVideoId(youtubeUrl);
        if (!videoId) {
          return null;
        }
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          let artist = "";
          const title = data.title || "";
          if (title.includes(" - ")) {
            const parts = title.split(" - ");
            artist = parts[0].trim();
          } else {
            artist = data.author_name || "";
          }
          return {
            videoId,
            title,
            artist,
            thumbnail: data.thumbnail_url,
            duration: 0,
            url: youtubeUrl
          };
        }
        return null;
      } catch (error) {
        console.error("Failed to extract YouTube metadata:", error);
        return null;
      }
    }
    extractVideoId(url) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return null;
    }
    async searchOnSpotify(title, artist, duration) {
      const token = await this.getSpotifyToken();
      if (!token) {
        throw new Error("Not authenticated with Spotify");
      }
      const sanitizedTitle = MatchingService.sanitizeTitle(title);
      const parsed = MatchingService.parseArtistTitle(sanitizedTitle);
      const effectiveArtist = artist || parsed?.artist || "";
      const effectiveTitle = parsed?.title || sanitizedTitle;
      const primaryQuery = effectiveArtist ? `${effectiveArtist} ${effectiveTitle}` : effectiveTitle;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(primaryQuery)}&type=track&limit=20`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "1";
        await this.delay(parseInt(retryAfter, 10) * 1e3);
        throw new Error("Rate limited, please try again");
      }
      if (!response.ok) {
        throw new Error("Spotify search failed");
      }
      const data = await response.json();
      const tracks = data.tracks?.items || [];
      if (tracks.length === 0 && effectiveArtist) {
        const fallbackResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(effectiveTitle)}&type=track&limit=20`,
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackTracks = fallbackData.tracks?.items || [];
          const exactMatch2 = this.findBestMatch(fallbackTracks, effectiveTitle, effectiveArtist, duration);
          return { tracks: fallbackTracks, exactMatch: exactMatch2 };
        }
      }
      const exactMatch = this.findBestMatch(tracks, effectiveTitle, effectiveArtist, duration);
      return { tracks, exactMatch };
    }
    buildQueryChain(title, artist) {
      const queries = [];
      const titleWithoutFeat = MatchingService.removeFeaturing(title);
      if (artist) {
        queries.push(`${artist} ${title}`);
        if (titleWithoutFeat !== title) {
          queries.push(`${artist} ${titleWithoutFeat}`);
        }
      }
      queries.push(title);
      return queries;
    }
    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    findBestMatch(tracks, title, artist, duration) {
      if (tracks.length === 0) {
        return null;
      }
      let bestMatch = null;
      let bestScore = 0;
      for (const track of tracks) {
        const score = MatchingService.calculateMatchScore(
          title,
          artist || void 0,
          track.name,
          track.artists.map((a) => a.name),
          duration > 0 ? duration : void 0,
          track.duration_ms
        );
        if (score > bestScore) {
          bestScore = score;
          bestMatch = track;
        }
      }
      return MatchingService.isAutoAddable(bestScore) ? bestMatch : null;
    }
    calculateStringSimilarity(str1, str2) {
      return MatchingService.jaroWinklerSimilarity(str1.toLowerCase(), str2.toLowerCase());
    }
    async addToPlaylist(playlistId, trackUri) {
      const token = await this.getSpotifyToken();
      if (!token) {
        throw new Error("Not authenticated with Spotify");
      }
      const isDuplicate = await this.isTrackInPlaylist(playlistId, trackUri, token);
      if (isDuplicate) {
        return { added: false, duplicate: true };
      }
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uris: [trackUri],
            position: 0
          })
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add track to playlist");
      }
      return { added: true, duplicate: false };
    }
    async isTrackInPlaylist(playlistId, trackUri, token) {
      let offset = 0;
      const limit = 100;
      while (true) {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=items(track(uri)),total`,
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (!response.ok)
          return false;
        const data = await response.json();
        const tracks = data.items || [];
        for (const item of tracks) {
          if (item.track?.uri === trackUri)
            return true;
        }
        offset += limit;
        if (offset >= data.total)
          break;
      }
      return false;
    }
    async handleSearchSpotifyTrack(msgData, sendResponse) {
      try {
        const { title, artist } = msgData;
        const token = await this.getSpotifyToken();
        if (!token) {
          sendResponse({ error: "Not authenticated with Spotify" });
          return;
        }
        let searchQuery = `track:${title}`;
        if (artist) {
          searchQuery += ` artist:${artist}`;
        }
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        if (!searchResponse.ok) {
          throw new Error("Search failed");
        }
        const searchData = await searchResponse.json();
        sendResponse({ success: true, tracks: searchData.tracks?.items || [] });
      } catch (error) {
        console.error("Search failed:", error);
        sendResponse({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    async handleGetSpotifyPlaylists(sendResponse) {
      try {
        const token = await this.getSpotifyToken();
        if (!token) {
          sendResponse({ error: "Not authenticated with Spotify" });
          return;
        }
        const response = await fetch(
          "https://api.spotify.com/v1/me/playlists?limit=50",
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch playlists");
        }
        const data = await response.json();
        sendResponse({ success: true, playlists: data.items || [] });
      } catch (error) {
        console.error("Failed to get playlists:", error);
        sendResponse({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    async handleSetSpotifyToken(token) {
      this.spotifyToken = token;
      await chrome.storage.local.set({ spotifyToken: token });
      await this.updatePlaylistMenu();
    }
    async handleExchangeSpotifyCodeDirect(message, sendResponse) {
      try {
        const { code, redirectUri } = message;
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: "4aa180089db445ce8d6f762329a76f7e",
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri
          })
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
        }
        const tokens = await response.json();
        const expiryTime = Date.now() + tokens.expires_in * 1e3;
        await chrome.storage.local.set({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_token_expiry: expiryTime
        });
        this.spotifyToken = tokens.access_token;
        await this.updatePlaylistMenu();
        sendResponse({ success: true });
      } catch (error) {
        console.error("Failed to exchange Spotify code:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    async handleExchangeSpotifyCode(message, sendResponse) {
      try {
        const { code, state } = message;
        console.log("[TunePort BG] Exchange code started. Code:", code ? "exists" : "null", "State:", state);
        const stored = await chrome.storage.local.get(["spotify_auth_state", "spotify_code_verifier"]);
        console.log("[TunePort BG] Stored state:", stored.spotify_auth_state);
        if (!stored.spotify_auth_state || stored.spotify_auth_state !== state) {
          console.error("[TunePort BG] State mismatch or missing. Stored:", stored.spotify_auth_state, "Received:", state);
          throw new Error("Invalid state parameter");
        }
        if (!stored.spotify_code_verifier) {
          console.error("[TunePort BG] Missing code verifier");
          throw new Error("Missing code verifier");
        }
        const redirectUri = chrome.runtime.getURL("popup/auth-callback.html");
        console.log("[TunePort BG] Using redirect URI:", redirectUri);
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: "4aa180089db445ce8d6f762329a76f7e",
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            code_verifier: stored.spotify_code_verifier
          })
        });
        console.log("[TunePort BG] Token response status:", response.status);
        if (!response.ok) {
          const error = await response.json();
          console.error("[TunePort BG] Token exchange error:", error);
          throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
        }
        const tokens = await response.json();
        console.log("[TunePort BG] Token exchange success");
        const expiryTime = Date.now() + tokens.expires_in * 1e3;
        await chrome.storage.local.set({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_token_expiry: expiryTime
        });
        this.spotifyToken = tokens.access_token;
        await this.updatePlaylistMenu();
        let userName = "";
        try {
          const userResponse = await fetch("https://api.spotify.com/v1/me", {
            headers: { "Authorization": `Bearer ${tokens.access_token}` }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userName = userData.display_name || "";
          }
        } catch {
        }
        sendResponse({ success: true, userName });
      } catch (error) {
        console.error("Failed to exchange Spotify code:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    generateCodeVerifier() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    }
    async generateCodeChallenge(verifier) {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    }
    async handleUpdateContextMenu(sendResponse) {
      try {
        await this.updatePlaylistMenu();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    handleGetJobStatus(jobId, sendResponse) {
      const job = this.activeJobs.get(jobId);
      if (job) {
        sendResponse({ success: true, job });
      } else {
        sendResponse({ error: "Job not found" });
      }
    }
    async handleConfirmFallback(jobId, sendResponse) {
      const job = this.activeJobs.get(jobId);
      if (!job || job.status !== "awaiting_fallback" || !job.fallbackMetadata) {
        sendResponse({ error: "Invalid job state" });
        return;
      }
      try {
        job.status = "searching";
        job.currentStep = "Searching Spotify with confirmed metadata...";
        this.activeJobs.set(jobId, { ...job });
        const searchResults = await this.searchOnSpotify(
          job.fallbackMetadata.title,
          job.fallbackMetadata.artist,
          0
        );
        if (!searchResults.exactMatch) {
          job.status = "failed";
          job.error = "Could not find matching track on Spotify with confirmed metadata";
          job.currentStep = void 0;
          this.activeJobs.set(jobId, { ...job });
          sendResponse({ success: false, error: job.error });
          return;
        }
        job.trackInfo = {
          title: job.fallbackMetadata.title,
          artist: job.fallbackMetadata.artist,
          spotifyTrack: searchResults.exactMatch
        };
        job.status = "adding";
        job.progress = 60;
        job.currentStep = "Adding to playlist...";
        this.activeJobs.set(jobId, { ...job });
        const result = await this.addToPlaylist(job.playlistId, searchResults.exactMatch.uri);
        job.progress = 70;
        if (job.downloadInfo?.enabled) {
          job.status = "downloading";
          job.currentStep = "Downloading audio...";
          this.activeJobs.set(jobId, { ...job });
          const downloadResult = await DownloadService.downloadAudio(
            job.youtubeUrl,
            job.fallbackMetadata.title,
            job.fallbackMetadata.artist,
            { format: "best", preferLossless: true }
          );
          if (downloadResult.success) {
            job.downloadInfo = {
              enabled: true,
              quality: downloadResult.quality,
              source: downloadResult.source,
              filename: downloadResult.filename
            };
          }
        }
        job.status = "completed";
        job.progress = 100;
        job.currentStep = void 0;
        this.activeJobs.set(jobId, { ...job });
        const successMsg = result.duplicate ? "Already in Playlist" : "Added to Spotify";
        this.showNotification(successMsg, `"${job.fallbackMetadata.title}" by ${job.fallbackMetadata.artist}`, "success");
        sendResponse({ success: true });
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.currentStep = void 0;
        this.activeJobs.set(jobId, { ...job });
        sendResponse({ success: false, error: job.error });
      }
    }
    handleRejectFallback(jobId, sendResponse) {
      const job = this.activeJobs.get(jobId);
      if (!job) {
        sendResponse({ error: "Job not found" });
        return;
      }
      job.status = "failed";
      job.error = "Fallback rejected by user";
      job.currentStep = void 0;
      this.activeJobs.set(jobId, { ...job });
      sendResponse({ success: true });
    }
    async getSpotifyToken() {
      try {
        if (this.spotifyToken) {
          return this.spotifyToken;
        }
        const result = await chrome.storage.local.get(["spotify_access_token", "spotifyToken"]);
        if (result.spotify_access_token) {
          this.spotifyToken = result.spotify_access_token;
          return this.spotifyToken;
        } else if (result.spotifyToken) {
          this.spotifyToken = result.spotifyToken;
          return this.spotifyToken;
        }
        return null;
      } catch (error) {
        console.error("Failed to get Spotify token:", error);
        return null;
      }
    }
    showNotification(title, message, type) {
      const iconUrl = chrome.runtime.getURL("assets/icon.svg") || "/assets/icon-48.png";
      console.log(type);
      chrome.notifications.create({
        type: "basic",
        iconUrl,
        title,
        message
      });
    }
  };
  chrome.runtime.onInstalled.addListener(() => {
    console.log("[TunePort] Extension installed/updated, creating context menu");
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "tuneport-main",
        title: "TunePort",
        contexts: ["page", "video", "link"],
        documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
      });
      chrome.contextMenus.create({
        id: "tuneport-add-default",
        parentId: "tuneport-main",
        title: "Add to Spotify",
        contexts: ["page", "video", "link"],
        documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
      });
      chrome.contextMenus.create({
        id: "tuneport-add-download",
        parentId: "tuneport-main",
        title: "Add to Spotify + Download",
        contexts: ["page", "video", "link"],
        documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
      });
      chrome.contextMenus.create({
        id: "tuneport-separator",
        parentId: "tuneport-main",
        type: "separator",
        contexts: ["page", "video", "link"],
        documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
      });
      chrome.contextMenus.create({
        id: "tuneport-settings",
        parentId: "tuneport-main",
        title: "Settings",
        contexts: ["page", "video", "link"],
        documentUrlPatterns: ["*://www.youtube.com/*", "*://youtube.com/*", "*://youtu.be/*", "*://music.youtube.com/*"]
      });
      console.log("[TunePort] Context menu created");
    });
  });
  new BackgroundService();
})();
