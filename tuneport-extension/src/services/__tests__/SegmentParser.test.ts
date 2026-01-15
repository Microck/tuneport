import { parseDescriptionSegments, parseManualSegments } from '../SegmentParser';

describe('SegmentParser', () => {
  test('parses description timestamps into segments', () => {
    const input = [
      '0:00 guy who feels everything now',
      '2:22 save me fox girl!!!',
      '5:17 total parity or: repression years the song'
    ].join('\n');

    const segments = parseDescriptionSegments(input);

    expect(segments).toEqual([
      { start: 0, end: 142, title: 'guy who feels everything now' },
      { start: 142, end: 317, title: 'save me fox girl!!!' },
      { start: 317, end: undefined, title: 'total parity or: repression years the song' }
    ]);
  });

  test('parses manual ranges with explicit end', () => {
    const input = [
      '3:24-5:47 theme',
      '6:14 to 8:28 closing'
    ].join('\n');

    const segments = parseManualSegments(input);

    expect(segments).toEqual([
      { start: 204, end: 347, title: 'theme' },
      { start: 374, end: 508, title: 'closing' }
    ]);
  });

  test('parses manual single timestamp without end', () => {
    const input = '1:02:03 intro';

    const segments = parseManualSegments(input);

    expect(segments).toEqual([
      { start: 3723, end: undefined, title: 'intro' }
    ]);
  });
});
