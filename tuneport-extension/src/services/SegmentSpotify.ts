import { Segment } from './SegmentParser';
import { resolveSegmentMetadata } from './SegmentMetadata';

export interface SegmentSummary {
  total: number;
  added: number;
  duplicates: number;
  failed: number;
}

export interface SegmentTrackInfo {
  title: string;
  artist: string;
  spotifyTrack?: any;
}

export interface SegmentSearchResult {
  exactMatch?: { uri: string } | null;
}

export interface SegmentSpotifyArgs {
  segments: Segment[];
  fallbackArtist: string;
  matchThreshold: number;
  search: (title: string, artist: string, duration: number, threshold: number) => Promise<SegmentSearchResult>;
  add: (trackUri: string) => Promise<{ added: boolean; duplicate: boolean }>;
}

export const addSegmentsToSpotify = async (
  args: SegmentSpotifyArgs
): Promise<{ summary: SegmentSummary; firstTrackInfo?: SegmentTrackInfo }> => {
  const summary: SegmentSummary = {
    total: args.segments.length,
    added: 0,
    duplicates: 0,
    failed: 0
  };

  let firstTrackInfo: SegmentTrackInfo | undefined;

  for (const segment of args.segments) {
    if (!segment.title) {
      summary.failed += 1;
      continue;
    }

    const resolved = resolveSegmentMetadata(segment.title, args.fallbackArtist);
    if (!resolved) {
      summary.failed += 1;
      continue;
    }

    const searchResult = await args.search(resolved.title, resolved.artist, 0, args.matchThreshold);
    if (!searchResult.exactMatch) {
      summary.failed += 1;
      continue;
    }

    const addResult = await args.add(searchResult.exactMatch.uri);
    if (addResult.duplicate) {
      summary.duplicates += 1;
    } else {
      summary.added += 1;
    }

    if (!firstTrackInfo && !addResult.duplicate) {
      firstTrackInfo = {
        title: resolved.title,
        artist: resolved.artist,
        spotifyTrack: searchResult.exactMatch
      };
    }
  }

  return { summary, firstTrackInfo };
};
