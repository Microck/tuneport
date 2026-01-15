import { MatchingService } from './MatchingService';

export interface SegmentTrackMetadata {
  title: string;
  artist: string;
}

export const resolveSegmentMetadata = (
  title: string,
  fallbackArtist: string
): SegmentTrackMetadata | null => {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return null;

  const parsed = MatchingService.parseArtistTitle(trimmedTitle);
  if (parsed) {
    return { artist: parsed.artist, title: parsed.title };
  }

  return { artist: fallbackArtist, title: trimmedTitle };
};
