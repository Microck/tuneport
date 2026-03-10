# SoundCloud Support Implementation Plan

**Status:** ✅ COMPLETE  
**Created:** 2026-03-10  
**Completed:** 2026-03-10  
**Goal:** Add SoundCloud -> Spotify sync capability alongside existing YouTube support

---

## Executive Summary

TunePort now supports YouTube AND SoundCloud -> Spotify sync. This implementation adds SoundCloud as a second source platform, following the same pipeline:
1. Check if track exists on Spotify (matching)
2. If not found, download and add as local file

**Decision:** Use simple inline approach (not abstract interface). Skip duration extraction initially.

**✅ Implementation Status:** All phases complete. SoundCloud support is now live.

---

## Current Architecture (YouTube)

### Data Flow
```
YouTube URL -> Metadata Extraction -> Spotify Search -> Match Found?
                                                       |
                                    YES: Add to playlist
                                    NO:  Download -> Add as local file
```

### Key Files

| Component | File | Purpose |
|-----------|------|---------|
| URL Detection | `src/background/index.ts:extractVideoId()` | YouTube URL pattern matching |
| Metadata | `src/services/YouTubeMetadataService.ts` | oEmbed + DOM extraction |
| Matching | `src/services/MatchingService.ts` | Jaro-Winkler fuzzy matching |
| Download | `src/services/DownloadService.ts` | Orchestrates Lucida -> yt-dlp -> Cobalt |
| yt-dlp API | `yt-dlp-service/app.py` | Self-hosted download backend |
| Content Script | `src/content/index.ts` | DOM observation for YouTube pages |
| Manifest | `src/manifest.json` | Host permissions |

---

## Implementation Strategy

### Decision: Simple Inline Approach (NOT Abstract Interface)

Instead of creating a complex abstraction layer, we will:
1. Add SoundCloud detection alongside existing YouTube detection
2. Add SoundCloud metadata extraction function
3. Keep existing YouTube code unchanged
4. Branch logic based on detected source

**Why:** Easier to understand, less refactoring, faster to implement.

---

## Task Breakdown

### Phase 1: SoundCloud Service

#### Task 1.1: Create SoundCloudMetadataService

**Files:**
- Create: `tuneport-extension/src/services/SoundCloudMetadataService.ts`

**SoundCloud oEmbed API:**

```
GET https://soundcloud.com/oembed?url=<TRACK_URL>&format=json
```

Response:
```json
{
  "version": 1,
  "type": "rich",
  "title": "Artist - Track Name",
  "author_name": "Artist",
  "thumbnail_url": "https://i1.sndcdn.com/...",
  "provider_name": "SoundCloud"
}
```

**Implementation:**

```typescript
export interface SoundCloudMetadata {
  id: string;
  title: string;
  artist: string;
  duration: number;  // Always 0 initially (not provided by oEmbed)
  thumbnail: string;
  url: string;
}

export class SoundCloudMetadataService {
  static extractTrackId(url: string): string | null {
    const match = url.match(/soundcloud\.com\/([\w-]+\/[\w-]+)/);
    return match ? match[1] : null;
  }

  static isValidUrl(url: string): boolean {
    return this.extractTrackId(url) !== null;
  }

  static async extractMetadata(url: string): Promise<SoundCloudMetadata | null> {
    try {
      const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) return null;
      
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
        duration: 0,  // DECISION: Skip duration extraction initially
        thumbnail: data.thumbnail_url || '',
        url
      };
    } catch (error) {
      console.error('[SoundCloudMetadataService] Extraction failed:', error);
      return null;
    }
  }
}
```

---

### Phase 2: Background Integration

#### Task 2.1: Update Background Service

**Files:**
- Modify: `tuneport-extension/src/background/index.ts`

**Changes:**

1. **Add SoundCloud detection function:**

```typescript
// Add after existing extractVideoId function
private detectSource(url: string): { type: 'youtube' | 'soundcloud'; id: string } | null {
  // YouTube patterns (existing)
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of ytPatterns) {
    const match = url.match(pattern);
    if (match) return { type: 'youtube', id: match[1] };
  }
  
  // SoundCloud patterns (new)
  const scMatch = url.match(/soundcloud\.com\/([\w-]+\/[\w-]+)/);
  if (scMatch) return { type: 'soundcloud', id: scMatch[1] };
  
  return null;
}
```

2. **Update metadata extraction in `addTrackToPlaylist()`:**

Replace:
```typescript
// OLD
const metadata = await this.extractYouTubeMetadata(youtubeUrl);
```

With:
```typescript
// NEW
const source = this.detectSource(youtubeUrl);
if (!source) {
  throw new Error('Unsupported URL. Please provide a YouTube or SoundCloud link.');
}

let metadata;
if (source.type === 'youtube') {
  metadata = await this.extractYouTubeMetadata(youtubeUrl);
} else {
  metadata = await SoundCloudMetadataService.extractMetadata(youtubeUrl);
}
```

3. **Update context menu patterns:**

```typescript
// In createContextMenu()
documentUrlPatterns: [
  '*://www.youtube.com/*',
  '*://youtube.com/*',
  '*://youtu.be/*',
  '*://music.youtube.com/*',
  '*://soundcloud.com/*',      // ADD
  '*://*.soundcloud.com/*',    // ADD
]
```

---

#### Task 2.2: Update Manifest Permissions

**Files:**
- Modify: `tuneport-extension/src/manifest.json`

Add SoundCloud to host_permissions:

```json
"host_permissions": [
  "https://youtube.com/*",
  "https://music.youtube.com/*",
  "https://www.youtube.com/*",
  "https://soundcloud.com/*",           // ADD
  "https://*.soundcloud.com/*",         // ADD
  // ... existing permissions
]
```

---

### Phase 3: Download Pipeline

#### Task 3.1: No Backend Changes Needed

yt-dlp natively supports SoundCloud downloads:
```bash
yt-dlp "https://soundcloud.com/artist/track" -f bestaudio
```

**Key points:**
- SoundCloud typically provides 128k Opus (lower quality than YouTube's ~160k)
- yt-dlp handles metadata embedding
- No changes needed to `yt-dlp-service/app.py`

#### Task 3.2: Update DownloadService Parameter Names

**Files:**
- Modify: `tuneport-extension/src/services/DownloadService.ts`
- Modify: `tuneport-extension/src/services/YtDlpService.ts`

**Changes:**
Rename `youtubeUrl` to `sourceUrl` in function signatures:

```typescript
// DownloadService.ts
static async getDownloadUrl(
  sourceUrl: string,  // Changed from youtubeUrl
  title: string,
  artist: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  // ... existing logic works for both platforms
}

// YtDlpService.ts
static async getDownloadUrl(
  sourceUrl: string,  // Changed from youtubeUrl
  options: YtDlpOptions
): Promise<DownloadResult> {
  // ... existing logic
}
```

**Note:** Do NOT skip Lucida for SoundCloud. Lucida searches Qobuz/Tidal/Deezer by title/artist, which works regardless of source platform. If the track exists on streaming services, Lucida will find it.

---

### Phase 4: Content Script

#### Task 4.1: Add SoundCloud to Content Script

**Files:**
- Modify: `tuneport-extension/src/content/index.ts`

**Changes:**

Add SoundCloud detection to existing content script:

```typescript
private handlePageChange() {
  const url = window.location.href;
  
  if (this.isYouTubeUrl(url)) {
    const videoData = this.extractYouTubeData();
    if (videoData && this.isNewVideo(videoData)) {
      this.currentVideoData = { ...videoData, source: 'youtube' };
      this.updateContextMenuData();
    }
  } else if (this.isSoundCloudUrl(url)) {
    const trackData = this.extractSoundCloudData();
    if (trackData && this.isNewTrack(trackData)) {
      this.currentVideoData = trackData;
      this.updateContextMenuData();
    }
  }
}

private isSoundCloudUrl(url: string): boolean {
  return /soundcloud\.com\/[\w-]+\/[\w-]+/.test(url);
}

private extractSoundCloudData() {
  // SoundCloud DOM selectors (may need adjustment based on actual DOM)
  const titleEl = document.querySelector('.soundTitle__title span');
  const artistEl = document.querySelector('.soundTitle__username');
  const artworkEl = document.querySelector('.sound__artwork img, .sc-artwork img');
  
  return {
    videoId: window.location.pathname.slice(1), // Use path as ID
    title: titleEl?.textContent?.trim() || '',
    artist: artistEl?.textContent?.trim() || '',
    thumbnail: artworkEl?.getAttribute('src') || '',
    url: window.location.href,
    source: 'soundcloud'
  };
}

private isNewTrack(trackData: any): boolean {
  return !this.currentVideoData || 
         this.currentVideoData.videoId !== trackData.videoId;
}
```

---

### Phase 5: UI Updates

#### Task 5.1: Update Popup for Equal Treatment

**Files:**
- Modify: `tuneport-extension/src/popup/index.tsx`

**Changes:**
1. Detect source and show appropriate icon
2. Update labels to be source-agnostic

```tsx
const detectSource = (url: string): 'youtube' | 'soundcloud' | null => {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/soundcloud\.com/.test(url)) return 'soundcloud';
  return null;
};

// In render:
{source === 'youtube' && <YouTubeIcon />}
{source === 'soundcloud' && <SoundCloudIcon />}

// Generic labels:
// "Add to Spotify" instead of "Add YouTube to Spotify"
// "Sync Track" instead of "Sync YouTube Video"
```

#### Task 5.2: Rebrand to "Anything to Spotify"

**Files to update branding:**
- `tuneport-extension/src/manifest.json` - Update name/description
- `tuneport-extension/package.json` - Update description
- Root `package.json` - Update description
- Popup UI - Update title/header

**New branding:**
```json
{
  "name": "TunePort - Anything to Spotify",
  "description": "Sync YouTube and SoundCloud to Spotify playlists. Download high-quality audio."
}
```

---

## Playlist Support (DEFERRED)

**Decision:** SoundCloud sets/playlists will NOT be supported in v1.

**Reason:** Complex handling, lower priority. Can be added later.

**Future implementation:**
- Parse set URLs: `soundcloud.com/user/sets/set-name`
- Extract track list via SoundCloud API or yt-dlp
- Batch process each track

---

## Testing Plan

### Unit Tests

1. **SoundCloudMetadataService.test.ts**
   - URL validation (valid/invalid patterns)
   - ID extraction
   - oEmbed response parsing

2. **Background integration**
   - Test `detectSource()` with various URLs
   - Verify correct service is called

### Manual Testing Checklist

- [ ] SoundCloud track that exists on Spotify (should add)
- [ ] SoundCloud track NOT on Spotify (should download)
- [ ] YouTube tracks still work (regression test)
- [ ] Invalid URLs show proper error
- [ ] Context menu appears on SoundCloud pages
- [ ] Downloaded files have correct metadata

---

## File Change Summary

### New Files
- `tuneport-extension/src/services/SoundCloudMetadataService.ts`
- `tuneport-extension/src/services/__tests__/SoundCloudMetadataService.test.ts`

### Modified Files
- `tuneport-extension/src/background/index.ts` - Add SoundCloud detection
- `tuneport-extension/src/content/index.ts` - Add SoundCloud DOM extraction
- `tuneport-extension/src/services/DownloadService.ts` - Rename youtubeUrl -> sourceUrl
- `tuneport-extension/src/services/YtDlpService.ts` - Rename youtubeUrl -> sourceUrl
- `tuneport-extension/src/manifest.json` - Add SoundCloud permissions + rebrand
- `tuneport-extension/src/popup/index.tsx` - UI updates
- `tuneport-extension/package.json` - Update description
- `package.json` - Update description

### Unchanged Files
- `yt-dlp-service/app.py` - Already supports SoundCloud
- `tuneport-extension/src/services/MatchingService.ts` - Source-agnostic
- `tuneport-extension/src/services/SpotifyAuthService.ts` - Unchanged
- `tuneport-extension/src/services/LucidaService.ts` - Works with any source

---

## Implementation Order

```
Phase 1:     Create SoundCloudMetadataService
             Test oEmbed extraction manually
             
Phase 2:     Update Background service (detectSource + extract)
             Update manifest.json (permissions + branding)
             
Phase 3:     Rename parameters in DownloadService/YtDlpService
             Test downloads with SoundCloud URLs
             
Phase 4:     Update content script for SoundCloud
             
Phase 5:     Update popup UI
             Rebrand to "Anything to Spotify"
             
Final:       Full regression test
             Update documentation
```

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| SoundCloud oEmbed rate limiting | Medium | Add basic caching, show error message |
| No duration (matching accuracy) | Low | MatchingService works without it |
| SoundCloud DOM changes | Medium | Test selectors, fall back to oEmbed only |
| yt-dlp SoundCloud changes | Low | yt-dlp is stable, well-maintained |
| YouTube regression | High | Full regression test before release |

---

## Decision Summary

| Question | Decision |
|----------|----------|
| Architecture | Simple inline (no abstraction) |
| Duration | Skip initially (not provided by API) |
| Playlist support | Defer to v2 |
| UI placement | Equal citizen with YouTube |
| Branding | "TunePort - Anything to Spotify" |

---

## References

- SoundCloud oEmbed: https://developers.soundcloud.com/docs/api/oembed
- yt-dlp SoundCloud extractor: https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/soundcloud.py
- SoundCloud URL patterns: `soundcloud.com/{artist}/{track}`
