import { resolveSegmentMetadata } from '../SegmentMetadata';

describe('resolveSegmentMetadata', () => {
  test('prefers parsed artist from title', () => {
    const result = resolveSegmentMetadata('Artist - Song', 'Fallback');
    expect(result).toEqual({ artist: 'Artist', title: 'Song' });
  });

  test('uses fallback artist when none provided', () => {
    const result = resolveSegmentMetadata('Just Song', 'Fallback');
    expect(result).toEqual({ artist: 'Fallback', title: 'Just Song' });
  });

  test('returns null for empty title', () => {
    const result = resolveSegmentMetadata('   ', 'Fallback');
    expect(result).toBeNull();
  });
});
