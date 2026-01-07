// Extension-wide type definitions

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  duration: string;
  thumbnail: string;
  url: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  isPublic: boolean;
  owner: string;
  imageUrl?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  uri: string;
  duration: number;
  previewUrl?: string;
  imageUrl?: string;
}

export interface DownloadJob {
  jobId: string;
  youtubeUrl: string;
  format: 'mp3' | 'flac';
  quality: '192' | '320';
  playlistId?: string;
  accessToken?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  filename?: string;
  metadata?: YouTubeMetadata;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  uploader: string;
  uploadDate: string;
  viewCount: number;
  description: string;
  thumbnail: string;
  youtubeId: string;
  youtubeUrl: string;
  tags: string[];
}

export interface ExtensionSettings {
  backendUrl: string;
  defaultFormat: 'mp3' | 'flac';
  defaultQuality: '192' | '320';
  downloadPath: string;
  autoSync: boolean;
  spotifyConnected: boolean;
  clientId?: string;
  clientSecret?: string;
}

export interface BackendHealthStatus {
  online: boolean;
  url: string;
  error?: string;
  responseTime?: number;
}

export interface ChromeMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

export interface MessageResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export interface SpotifyTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export interface ContextMenuItem {
  id: string;
  title: string;
  parentId?: string;
  contexts: string[];
  type?: 'normal' | 'separator';
}

// Event types
export enum MessageTypes {
  DOWNLOAD_VIDEO = 'DOWNLOAD_VIDEO',
  GET_CURRENT_VIDEO_DATA = 'GET_CURRENT_VIDEO_DATA',
  GET_SPOTIFY_PLAYLISTS = 'GET_SPOTIFY_PLAYLISTS',
  SET_SPOTIFY_TOKEN = 'SET_SPOTIFY_TOKEN',
  GET_BACKEND_STATUS = 'GET_BACKEND_STATUS',
  UPDATE_CONTEXT_MENU = 'UPDATE_CONTEXT_MENU',
  CURRENT_VIDEO_UPDATED = 'CURRENT_VIDEO_UPDATED',
  SPOTIFY_AUTH_COMPLETE = 'SPOTIFY_AUTH_COMPLETE',
  GET_POPUP_SETTINGS = 'GET_POPUP_SETTINGS',
  UPDATE_SETTING = 'UPDATE_SETTING',
  EXTRACT_PAGE_DATA = 'EXTRACT_PAGE_DATA',
  GET_PAGE_METADATA = 'GET_PAGE_METADATA',
  CONTEXT_MENU_CLICKED = 'CONTEXT_MENU_CLICKED'
}

// Constants
export const EXTENSION_CONFIG = {
  VERSION: '1.0.0',
  NAME: 'TuneFlow - YouTube to Spotify Bridge',
  DESCRIPTION: 'High-fidelity YouTube to Spotify playlist synchronization with smart source switching',
  BACKEND_DEFAULT_URL: 'http://localhost:3001',
  SUPPORTED_FORMATS: ['mp3', 'flac'] as const,
  SUPPORTED_QUALITIES: ['192', '320'] as const,
  CONTEXT_MENU_IDS: {
    MAIN: 'tuneflow-main',
    SAVE_LIBRARY: 'tuneflow-save-library',
    PLAYLISTS_SUBMENU: 'tuneflow-playlists-submenu',
    SETTINGS: 'tuneflow-settings'
  } as const,
  STORAGE_KEYS: {
    SETTINGS: 'tuneflow_settings',
    SPOTIFY_TOKEN: 'spotify_access_token',
    SPOTIFY_REFRESH_TOKEN: 'spotify_refresh_token',
    SPOTIFY_TOKEN_EXPIRY: 'spotify_token_expiry',
    BACKEND_URL: 'backend_url',
    CURRENT_VIDEO_DATA: 'current_video_data'
  } as const,
  NOTIFICATION_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  } as const
} as const;