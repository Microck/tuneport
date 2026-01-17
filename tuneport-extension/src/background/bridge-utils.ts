import type { BridgeMessage } from '../services/BridgeService';

export const canBridge = (
  enabled: boolean,
  spotifyMatchFound: boolean,
  downloadResult?: { filename?: string }
): boolean => {
  if (!enabled) return false;
  if (spotifyMatchFound) return false;
  return Boolean(downloadResult?.filename);
};

export const buildBridgeMessage = (filename: string, playlistId: string): BridgeMessage => ({
  action: 'ADD_LOCAL_TRACK',
  payload: { filename, playlistId }
});
