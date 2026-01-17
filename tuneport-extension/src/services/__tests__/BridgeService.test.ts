import { buildRelayUrl, generateBridgeToken, sendBridgeMessage } from '../BridgeService';

describe('BridgeService', () => {
  test('buildRelayUrl encodes token', () => {
    const url = buildRelayUrl('a b');
    expect(url).toBe('wss://relay.micr.dev?token=a%20b');
  });

  test('generateBridgeToken returns non-empty string', () => {
    const token = generateBridgeToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(8);
  });

  test('sendBridgeMessage sends payload', async () => {
    const sent: string[] = [];
    class MockWebSocket {
      url: string;
      readyState = 1;
      onopen?: () => void;
      onerror?: (event?: unknown) => void;
      onclose?: () => void;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => this.onopen?.(), 0);
      }
      send(data: string) {
        sent.push(data);
      }
      close() {
        this.onclose?.();
      }
    }

    await sendBridgeMessage('token-123', { action: 'ADD_LOCAL_TRACK', payload: { filename: 'a.mp3', playlistId: 'p' } }, {
      WebSocketImpl: MockWebSocket
    });

    expect(sent).toEqual([
      JSON.stringify({ action: 'ADD_LOCAL_TRACK', payload: { filename: 'a.mp3', playlistId: 'p' } })
    ]);
  });

  test('sendBridgeMessage rejects without token', async () => {
    class ThrowingSocket {
      readyState = 0;
      constructor(_url: string) {
        throw new Error('should not construct');
      }
      send() {}
      close() {}
    }

    await expect(sendBridgeMessage('', { action: 'ADD_LOCAL_TRACK', payload: { filename: 'a.mp3', playlistId: 'p' } }, {
      WebSocketImpl: ThrowingSocket
    })).rejects.toThrow('Missing bridge token');
  });
});
