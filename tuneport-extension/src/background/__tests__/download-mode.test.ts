/**
 * @jest-environment jsdom
 */

export {};

import { resolveDownloadMode } from '../download-mode';

describe('resolveDownloadMode', () => {
  test('returns override when provided', () => {
    expect(resolveDownloadMode('missing_only', 'always')).toBe('always');
  });

  test('returns setting when no override', () => {
    expect(resolveDownloadMode('missing_only')).toBe('missing_only');
  });
});
