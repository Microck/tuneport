import { buildBridgeMessage, canBridge } from '../bridge-utils';

describe('bridge-utils', () => {
  test('canBridge true when enabled, no match, filename present', () => {
    const result = canBridge(true, false, { filename: 'TunePort/a.mp3' });
    expect(result).toBe(true);
  });

  test('canBridge false when spotify match found', () => {
    const result = canBridge(true, true, { filename: 'TunePort/a.mp3' });
    expect(result).toBe(false);
  });

  test('canBridge false when disabled', () => {
    const result = canBridge(false, false, { filename: 'TunePort/a.mp3' });
    expect(result).toBe(false);
  });

  test('canBridge false when no filename', () => {
    const result = canBridge(true, false, { filename: '' });
    expect(result).toBe(false);
  });

  test('buildBridgeMessage shape', () => {
    const msg = buildBridgeMessage('TunePort/track.mp3', 'playlist:1');
    expect(msg).toEqual({
      action: 'ADD_LOCAL_TRACK',
      payload: { filename: 'TunePort/track.mp3', playlistId: 'playlist:1' }
    });
  });
});
