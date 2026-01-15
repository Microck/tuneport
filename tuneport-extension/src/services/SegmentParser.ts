export interface Segment {
  start: number;
  end?: number;
  title?: string;
}

const TIMESTAMP_REGEX = /\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/g;

const cleanTitle = (value: string): string =>
  value.replace(/^[-–—|]+/, '').trim();

const parseTimestamp = (value: string): number | null => {
  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
};

const withImplicitEnds = (segments: Segment[]): Segment[] =>
  segments.map((segment, index) => {
    if (segment.end !== undefined) return segment;
    const next = segments[index + 1];
    if (!next) return segment;
    return { ...segment, end: next.start };
  });

export const parseDescriptionSegments = (input: string): Segment[] => {
  const lines = input.split(/\r?\n/);
  const segments: Segment[] = [];

  for (const line of lines) {
    const match = line.match(TIMESTAMP_REGEX)?.[0];
    if (!match) continue;

    const start = parseTimestamp(match);
    if (start === null) continue;

    const title = cleanTitle(line.slice(line.indexOf(match) + match.length));

    segments.push({ start, title: title || undefined });
  }

  return withImplicitEnds(segments);
};

export const parseManualSegments = (input: string): Segment[] => {
  const lines = input.split(/\r?\n/);
  const segments: Segment[] = [];

  for (const line of lines) {
    const matches = line.match(TIMESTAMP_REGEX) || [];
    if (matches.length === 0) continue;

    const start = parseTimestamp(matches[0]);
    if (start === null) continue;

    let end: number | undefined;
    let titleStartIndex = line.indexOf(matches[0]) + matches[0].length;

    if (matches.length >= 2) {
      const secondIndex = line.indexOf(matches[1], titleStartIndex);
      if (secondIndex >= 0) {
        const parsedEnd = parseTimestamp(matches[1]);
        if (parsedEnd !== null) {
          end = parsedEnd;
        }
        titleStartIndex = secondIndex + matches[1].length;
      }
    }

    const title = cleanTitle(line.slice(titleStartIndex));

    segments.push({ start, end, title: title || undefined });
  }

  return segments;
};
