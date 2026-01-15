import { addSegmentsToSpotify } from '../SegmentSpotify';
import { Segment } from '../SegmentParser';

const makeSearch = (results: Array<{ hasMatch: boolean }>) => {
  const queue = [...results];
  return jest.fn().mockImplementation(async () => {
    const next = queue.shift() || { hasMatch: false };
    return { exactMatch: next.hasMatch ? { uri: 'spotify:track:test' } : null };
  });
};

const makeAdd = (duplicates: boolean[] = []) => {
  const queue = [...duplicates];
  return jest.fn().mockImplementation(async () => {
    const isDuplicate = queue.shift() || false;
    return { added: !isDuplicate, duplicate: isDuplicate };
  });
};

describe('addSegmentsToSpotify', () => {
  test('adds segments and returns summary', async () => {
    const segments: Segment[] = [
      { start: 0, title: 'Artist - Song' },
      { start: 10, title: 'Track Two' }
    ];

    const search = makeSearch([{ hasMatch: true }, { hasMatch: true }]);
    const add = makeAdd([false, false]);

    const result = await addSegmentsToSpotify({
      segments,
      fallbackArtist: 'Fallback',
      matchThreshold: 0.7,
      search,
      add
    });

    expect(result.summary).toEqual({ total: 2, added: 2, duplicates: 0, failed: 0 });
    expect(result.firstTrackInfo?.title).toBe('Song');
    expect(add).toHaveBeenCalledTimes(2);
  });

  test('tracks duplicates and failures', async () => {
    const segments: Segment[] = [
      { start: 0, title: 'Song One' },
      { start: 10, title: 'Song Two' },
      { start: 20, title: 'Song Three' }
    ];

    const search = makeSearch([{ hasMatch: true }, { hasMatch: false }, { hasMatch: true }]);
    const add = makeAdd([true, false]);

    const result = await addSegmentsToSpotify({
      segments,
      fallbackArtist: 'Fallback',
      matchThreshold: 0.7,
      search,
      add
    });

    expect(result.summary).toEqual({ total: 3, added: 1, duplicates: 1, failed: 1 });
  });

  test('skips segments without titles', async () => {
    const segments: Segment[] = [
      { start: 0 },
      { start: 10, title: 'Song' }
    ];

    const search = makeSearch([{ hasMatch: true }]);
    const add = makeAdd([false]);

    const result = await addSegmentsToSpotify({
      segments,
      fallbackArtist: 'Fallback',
      matchThreshold: 0.7,
      search,
      add
    });

    expect(result.summary).toEqual({ total: 2, added: 1, duplicates: 0, failed: 1 });
  });
});
