const DEFAULT_RELAY_URL = 'wss://relay.micr.dev';

export type BridgeMessage = {
  action: 'ADD_LOCAL_TRACK';
  payload: {
    filename: string;
    playlistId: string;
  };
};

type WebSocketLike = {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  onopen?: () => void;
  onerror?: (event?: unknown) => void;
  onclose?: () => void;
};

type WebSocketCtor = new (url: string) => WebSocketLike;

type SendOptions = {
  WebSocketImpl?: WebSocketCtor;
  relayUrl?: string;
  timeoutMs?: number;
};

export const buildRelayUrl = (token: string, relayUrl = DEFAULT_RELAY_URL): string => {
  const safe = encodeURIComponent(token);
  return `${relayUrl}?token=${safe}`;
};

export const generateBridgeToken = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const sendBridgeMessage = (
  token: string,
  message: BridgeMessage,
  options: SendOptions = {}
): Promise<void> => {
  if (!token) {
    return Promise.reject(new Error('Missing bridge token'));
  }

  const relayUrl = options.relayUrl || DEFAULT_RELAY_URL;
  const WebSocketImpl = options.WebSocketImpl || WebSocket;
  const socket = new WebSocketImpl(buildRelayUrl(token, relayUrl));
  const timeoutMs = options.timeoutMs ?? 5000;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('Bridge timeout'));
    }, timeoutMs);

    socket.onopen = () => {
      try {
        socket.send(JSON.stringify(message));
        clearTimeout(timer);
        socket.close();
        resolve();
      } catch (error) {
        clearTimeout(timer);
        socket.close();
        reject(error);
      }
    };

    socket.onerror = () => {
      clearTimeout(timer);
      socket.close();
      reject(new Error('Bridge socket error'));
    };

    socket.onclose = () => {
      clearTimeout(timer);
    };
  });
};
