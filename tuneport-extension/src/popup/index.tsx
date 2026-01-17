import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Activity, 
  Music2, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Copy,
  Zap,
  User,
  Shield,
  HelpCircle,
  Search,
  Download,
  MousePointer2,
  Terminal,
  LogOut,
  Link
} from 'lucide-react';

import { cn } from '../lib/utils';
import { SpotifyAuthService } from '../services/SpotifyAuthService';
import { ChromeMessageService } from '../services/ChromeMessageService';
import { DEFAULT_COBALT_INSTANCE, DEFAULT_YTDLP_INSTANCE } from '../config/defaults';

interface Segment {
  start: number;
  end: number;
  title: string;
}

type SegmentMode = 'single' | 'multiple';

interface Job {
  id: string;
  status: 'pending' | 'downloading' | 'converting' | 'uploading' | 'completed' | 'failed' | 'awaiting_fallback';
  progress: number;
  title: string;
  artist: string;
  thumbnail: string;
  error?: string;
  downloadInfo?: {
    enabled: boolean;
    quality: string;
    source: string;
    filename: string;
    fileCount?: number;
  };
  fallbackMetadata?: {
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
  };
}

interface QualityPreset {
  id: string;
  label: string;
  format: string;
  description?: string;
  isCustom?: boolean;
}

const QUALITY_OPTIONS = [
  { id: 'best', label: 'Opus', description: 'Native YouTube quality. ~128kbps Opus, equivalent to MP3 320kbps.' },
  { id: 'mp3', label: 'MP3', description: 'Universal compatibility. Re-encoded from source.' },
  { id: 'ogg', label: 'OGG Vorbis', description: 'Open format. Good for Linux/FOSS applications.' },
  { id: 'wav', label: 'WAV', description: 'Uncompressed audio. Large files.' }
];

const FILE_NAMING_OPTIONS = [
  { id: 'artist-title', label: 'Artist - Title' },
  { id: 'title-artist', label: 'Title - Artist' },
  { id: 'title', label: 'Title only' }
];

const SpotifyLocalFilesTutorial: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-tf-gray/30 hover:bg-tf-gray/50 rounded-lg transition-colors"
      >
        <span className="text-xs font-bold text-tf-slate">How to enable Spotify Local Files</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-3">
              <p className="text-tf-slate font-medium">
                Spotify doesn&apos;t scan local files by default. Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-tf-slate-muted">
                <li>Open the <span className="font-bold text-tf-slate">Spotify desktop app</span></li>
                <li>Click your profile picture → <span className="font-bold text-tf-slate">Settings</span></li>
                <li>Scroll to <span className="font-bold text-tf-slate">Library</span></li>
                <li>Toggle <span className="font-bold text-tf-emerald">Show Local Files</span> ON</li>
                <li>Under &quot;Show songs from&quot;, enable your <span className="font-bold text-tf-slate">Downloads</span> folder</li>
                <li>Or click <span className="font-bold text-tf-slate">Add a source</span> and navigate to your Downloads/TunePort folder</li>
              </ol>
              <p className="text-[10px] text-tf-slate-muted pt-2 border-t border-blue-100">
                Downloaded files are saved to: <span className="font-mono">Downloads/TunePort/</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CustomPresetsManager: React.FC<{
  presets: QualityPreset[];
  onChange: (presets: QualityPreset[]) => void;
}> = ({ presets, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFormat, setNewFormat] = useState('mp3');
  
  const MAX_PRESETS = 5;
  const canAdd = presets.length < MAX_PRESETS;
  
  const handleAdd = () => {
    if (!newName.trim() || !canAdd) return;
    
    const newPreset: QualityPreset = {
      id: `custom-${Date.now()}`,
      label: newName.trim(),
      format: newFormat,
      isCustom: true
    };
    
    onChange([...presets, newPreset]);
    setNewName('');
    setNewFormat('mp3');
    setIsAdding(false);
  };
  
  const handleDelete = (id: string) => {
    onChange(presets.filter(p => p.id !== id));
  };
  
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-tf-slate-muted">
        Create up to {MAX_PRESETS} custom presets for quick access.
      </p>
      
      {presets.length > 0 && (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-3 bg-tf-gray/30 rounded-lg"
            >
              <div>
                <p className="text-xs font-bold text-tf-slate">{preset.label}</p>
                <p className="text-[10px] text-tf-slate-muted">{preset.format.toUpperCase()}</p>
              </div>
              <button
                onClick={() => handleDelete(preset.id)}
                className="p-1.5 text-tf-rose hover:bg-tf-rose/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {isAdding ? (
        <div className="p-3 bg-tf-gray/30 rounded-lg space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Preset name"
            className="w-full px-3 py-2 bg-white border border-tf-border rounded-lg text-xs focus:outline-none focus:border-tf-emerald"
            maxLength={20}
          />
          <select
            value={newFormat}
            onChange={(e) => setNewFormat(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-tf-border rounded-lg text-xs focus:outline-none focus:border-tf-emerald"
          >
            <option value="best">Opus (Best)</option>
            <option value="opus">Opus</option>
            <option value="mp3">MP3</option>
            <option value="ogg">OGG</option>
            <option value="wav">WAV</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex-1 py-2 bg-tf-emerald text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewName(''); }}
              className="flex-1 py-2 bg-tf-gray text-tf-slate text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          disabled={!canAdd}
          className={cn(
            "w-full flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold transition-colors",
            canAdd
              ? "bg-tf-emerald/10 text-tf-emerald hover:bg-tf-emerald/20"
              : "bg-tf-gray text-tf-slate-muted cursor-not-allowed"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {canAdd ? 'Add Custom Preset' : `Maximum ${MAX_PRESETS} presets reached`}
        </button>
      )}
    </div>
  );
};

interface SettingsState {
  defaultPlaylist: string;
  defaultQuality: string;
  fileNamingFormat: string;
  enableDownload: boolean;
  enableLosslessSources: boolean;
  showQualityWarnings: boolean;
  showNotFoundWarnings: boolean;
  cobaltInstance: string;
  downloadProvider: 'cobalt' | 'yt-dlp';
  ytDlpInstance: string;
  ytDlpToken: string;
  lucidaEnabled: boolean;
  visiblePlaylists: string[];
  customPresets: QualityPreset[];
  spotifyFallbackMode: 'auto' | 'ask' | 'never';
  enableDebugConsole: boolean;
  matchThreshold: number;
  downloadMode: 'always' | 'missing_only';
  spotifyClientId?: string;
  spotifyClientSecret?: string;
  bridgeEnabled?: boolean;
  bridgeToken?: string;
  bridgeRelayUrl?: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  defaultPlaylist: '',
  defaultQuality: 'm4a',
  fileNamingFormat: 'artist-title',
  enableDownload: true,
  enableLosslessSources: false,
  showQualityWarnings: true,
  showNotFoundWarnings: true,
  cobaltInstance: DEFAULT_COBALT_INSTANCE,
  downloadProvider: 'yt-dlp',
  ytDlpInstance: DEFAULT_YTDLP_INSTANCE,
  ytDlpToken: '',
  lucidaEnabled: false,
  visiblePlaylists: [],
  customPresets: [],
  spotifyFallbackMode: 'auto',
  enableDebugConsole: false,
  matchThreshold: 0.85,
  downloadMode: 'missing_only',
  bridgeEnabled: false,
  bridgeToken: '',
  bridgeRelayUrl: 'wss://relay.micr.dev'
};

const createBridgeToken = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
};


export const TunePortPopup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<{ display_name: string; email: string; images: Array<{ url: string }> } | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sync' | 'activity' | 'settings'>('sync');
  const [selectedQuality, setSelectedQuality] = useState<string>('m4a');
  const [enableDownload, setEnableDownload] = useState(true);
  const [segmentsEnabled, setSegmentsEnabled] = useState(false);
  const [segmentMode, setSegmentMode] = useState<'auto' | 'manual'>('auto');
  const [manualSegmentMode, setManualSegmentMode] = useState<SegmentMode>('multiple');
  const [segmentInput, setSegmentInput] = useState('');
  const [detectedSegments, setDetectedSegments] = useState<Segment[]>([]);
  const [manualSegments, setManualSegments] = useState<Segment[]>([]);
  const [selectedSegmentIndexes, setSelectedSegmentIndexes] = useState<number[]>([]);
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{ title: string; artist: string; thumbnail: string } | null>(null);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [debugLogs, setDebugLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'error' | 'warn' }>>([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBridgeDetails, setShowBridgeDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['tuneport_settings', 'lucida_enabled']);
      if (result.tuneport_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.tuneport_settings });
      }
      if (result.lucida_enabled !== undefined) {
        setSettings(prev => ({ ...prev, lucidaEnabled: result.lucida_enabled }));
      }
      
      if (!result.tuneport_settings?.spotifyClientId) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleOnboardingComplete = async (clientId: string) => {
    const newSettings = { ...settings, spotifyClientId: clientId };
    setSettings(newSettings);
    setShowOnboarding(false);
    
    try {
      await chrome.storage.local.set({
        tuneport_settings: newSettings,
        lucida_enabled: newSettings.lucidaEnabled
      });
      await ChromeMessageService.sendMessage({ type: 'SETTINGS_UPDATED', settings: newSettings });
      loadSettings();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs();
      if (activeTab === 'activity' && showDebugConsole) {
        loadDebugLogs();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTab, showDebugConsole]);

  useEffect(() => {
    checkConnection();
    loadJobs();
    getCurrentUrl();
    loadSettings();
  }, []);

  async function loadDebugLogs() {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_DEBUG_LOGS' });
      if (response.logs) setDebugLogs(response.logs);
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  }

  const clearDebugLogs = async () => {
    try {
      await ChromeMessageService.sendMessage({ type: 'CLEAR_DEBUG_LOGS' });
      setDebugLogs([]);
    } catch (error) {
      console.error('Failed to clear debug logs:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await chrome.storage.local.set({
        tuneport_settings: settings,
        lucida_enabled: settings.lucidaEnabled
      });
      await ChromeMessageService.sendMessage({ type: 'SETTINGS_UPDATED', settings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      const timer = setTimeout(saveSettings, 1000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => {
      if (key === 'bridgeEnabled' && value === true && !prev.bridgeToken) {
        return { ...prev, [key]: value, bridgeToken: createBridgeToken() };
      }
      return { ...prev, [key]: value };
    });
  };

  async function checkConnection() {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setIsConnected(response.connected);
      setUser(response.user || null);
      if (response.connected) loadPlaylists();
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  }

  async function loadPlaylists() {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
      if (response.success) setPlaylists(response.playlists);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  async function loadJobs() {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_ACTIVE_JOBS' });
      if (response.jobs) setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }

  const confirmFallback = async (jobId: string) => {
    try {
      await ChromeMessageService.sendMessage({ type: 'CONFIRM_FALLBACK', jobId });
      loadJobs();
    } catch (error) {
      console.error('Failed to confirm fallback:', error);
    }
  };

  const rejectFallback = async (jobId: string) => {
    try {
      await ChromeMessageService.sendMessage({ type: 'REJECT_FALLBACK', jobId });
      loadJobs();
    } catch (error) {
      console.error('Failed to reject fallback:', error);
    }
  };

  async function getCurrentUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        setCurrentUrl(tab.url);
        if (tab.url.includes('youtube.com') || tab.url.includes('youtu.be')) {
          fetchVideoMetadata(tab.url);
        }
      }
    } catch (error) {
      console.error('Failed to get current URL:', error);
    }
  }

  const fetchVideoMetadata = async (url: string) => {
    try {
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (!videoMetadata && videoIdMatch) {
        const videoId = videoIdMatch[1];
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        const data = await response.json();
        setVideoMetadata({
          title: data.title,
          artist: data.author_name,
          thumbnail: data.thumbnail_url
        });
      }
    } catch (error) {
      console.error('Failed to fetch video metadata:', error);
    }
  };

  const handleSync = async () => {
    if (!selectedPlaylist) return;
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'SYNC_VIDEO',
        url: currentUrl,
        playlistId: selectedPlaylist.id,
        quality: selectedQuality,
        segments: segmentsEnabled ? (segmentMode === 'auto' ? detectedSegments : manualSegments) : undefined
      });
      if (response.success) {
        setActiveTab('activity');
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to sync video:', error);
    }
  };

  const handleDisconnect = async () => {
    await SpotifyAuthService.disconnect();
    setIsConnected(false);
    setUser(null);
  };

  const handleEditClientId = () => {
    setShowOnboarding(true);
  };

  return (
    <div className="w-[380px] min-h-[580px] bg-tf-white flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'sync' ? (
            <motion.div key="sync" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            </motion.div>
          ) : activeTab === 'activity' ? (
            <motion.div key="activity" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                      <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-tf-slate">Account</h2>
                  </div>
                  <button
                    onClick={handleEditClientId}
                    className="px-3 py-1 bg-white hover:bg-tf-gray border border-tf-border rounded-full text-[10px] font-bold text-tf-slate-muted hover:text-tf-emerald transition-all"
                  >
                    Edit Client ID
                  </button>
                </div>
                {user ? (
                  <div className="flex items-center justify-between p-3 bg-tf-gray/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {user.images?.[0]?.url ? (
                        <img src={user.images[0].url} alt="" className="w-8 h-8 rounded-full ring-2 ring-white" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-tf-emerald/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-tf-emerald" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-tf-slate text-xs">{user.display_name}</p>
                        <p className="text-[10px] text-tf-slate-muted">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={handleDisconnect} className="p-2 text-tf-rose hover:bg-tf-rose/5 rounded-lg transition-all"><LogOut className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-tf-gray/30 rounded-xl border border-dashed border-tf-slate-muted/30">
                    <p className="text-xs text-tf-slate-muted mb-2">Not connected</p>
                    <button onClick={() => SpotifyAuthService.connect(settings.spotifyClientId)} className="px-4 py-1.5 bg-tf-emerald text-white text-[10px] font-bold rounded-lg">Connect Now</button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Preferences</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-tf-slate mb-1">Default Playlist</label>
                    <select
                      value={settings.defaultPlaylist}
                      onChange={(e) => updateSetting('defaultPlaylist', e.target.value)}
                      className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                    >
                      <option value="">Ask every time</option>
                      {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-tf-slate mb-1">Default Quality</label>
                    <select
                      value={settings.defaultQuality}
                      onChange={(e) => updateSetting('defaultQuality', e.target.value)}
                      className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                    >
                      {QUALITY_OPTIONS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-tf-slate mb-1">File Naming</label>
                    <select
                      value={settings.fileNamingFormat}
                      onChange={(e) => updateSetting('fileNamingFormat', e.target.value)}
                      className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                    >
                      {FILE_NAMING_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Automation</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-tf-slate">Auto-Download</p>
                      <p className="text-[10px] text-tf-slate-muted">Save audio when adding to playlist</p>
                    </div>
                    <button
                      onClick={() => updateSetting('enableDownload', !settings.enableDownload)}
                      className={cn("w-9 h-5 rounded-full transition-all relative", settings.enableDownload ? "bg-tf-emerald" : "bg-tf-border")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.enableDownload ? "left-4" : "left-0.5")} />
                    </button>
                  </div>

                  {settings.enableDownload && (
                    <div className="flex items-center justify-between p-2 bg-tf-gray/30 border border-tf-border rounded-lg animate-in fade-in slide-in-from-top-1">
                      <div>
                        <p className="text-[11px] font-bold text-tf-slate">Download Mode</p>
                      </div>
                      <div className="flex bg-white/50 rounded-lg p-0.5 border border-tf-border">
                        <button
                          onClick={() => updateSetting('downloadMode', 'always')}
                          className={cn(
                            "px-2 py-1 text-[9px] font-bold rounded-md transition-all",
                            settings.downloadMode === 'always' ? "bg-white shadow text-tf-slate" : "text-tf-slate-muted hover:text-tf-slate"
                          )}
                        >
                          Always
                        </button>
                        <button
                          onClick={() => updateSetting('downloadMode', 'missing_only')}
                          className={cn(
                            "px-2 py-1 text-[9px] font-bold rounded-md transition-all",
                            settings.downloadMode === 'missing_only' ? "bg-white shadow text-tf-slate" : "text-tf-slate-muted hover:text-tf-slate"
                          )}
                        >
                          Missing
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-tf-slate">Bridge Mode</p>
                      <p className="text-[10px] text-tf-slate-muted">Auto-sync local files to Spotify</p>
                    </div>
                    <button
                      onClick={() => updateSetting('bridgeEnabled', !settings.bridgeEnabled)}
                      className={cn("w-9 h-5 rounded-full transition-all relative", settings.bridgeEnabled ? "bg-tf-emerald" : "bg-tf-border")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.bridgeEnabled ? "left-4" : "left-0.5")} />
                    </button>
                  </div>

                  {settings.bridgeEnabled && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <button
                        onClick={() => {
                          const token = settings.bridgeToken || '';
                          const ps = `powershell -ExecutionPolicy Bypass -NoExit -Command "irm https://tuneflow.micr.dev/bridge/${token} | iex"`;
                          navigator.clipboard.writeText(ps);
                          setCopySuccess(true);
                          setTimeout(() => setCopySuccess(false), 2000);
                        }}
                        className={cn(
                          "w-full py-2 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm",
                          copySuccess ? "bg-tf-emerald" : "bg-tf-emerald hover:bg-tf-emerald-dark"
                        )}
                      >
                        {copySuccess ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied! Paste in Win+R
                          </>
                        ) : (
                          <>
                            <Terminal className="w-3 h-3" />
                            Copy Setup Command
                          </>
                        )}
                      </button>

                      <div className="pt-1 text-center space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-[8px] text-tf-slate-muted font-medium">
                            Press <span className="font-bold text-tf-slate">Win + R</span>, paste the command, and hit <span className="font-bold text-tf-slate">Enter</span>.
                          </p>
                          <div className="group relative inline-block">
                            <HelpCircle className="w-2.5 h-2.5 text-tf-slate-muted hover:text-tf-emerald cursor-help transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-tf-slate text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
                              <p className="font-bold mb-1 text-left">What does this do?</p>
                              <p className="text-left">This command automatically installs Spicetify and the TunePort bridge script to your Spotify desktop app. It allows the extension to instantly add downloaded files to your playlists. No data is collected.</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowBridgeDetails(!showBridgeDetails)}
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-tf-slate-muted hover:text-tf-slate transition-colors"
                        >
                          <span>{showBridgeDetails ? 'Hide' : 'Show'} details</span>
                          {showBridgeDetails ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                        </button>
                        
                        {showBridgeDetails && (
                          <div className="mt-2 p-2 bg-tf-gray/30 border border-tf-border rounded-lg space-y-2 animate-in fade-in zoom-in-95 duration-150 text-left">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[8px] font-bold text-tf-slate-muted uppercase">Token</label>
                                <span className="text-[8px] font-bold text-tf-emerald">ACTIVE</span>
                              </div>
                              <div className="flex gap-1">
                                <input readOnly type="text" value={settings.bridgeToken || ''} className="flex-1 px-1.5 py-1 text-[9px] border border-tf-border rounded bg-white font-mono text-tf-slate-muted" />
                                <button
                                  onClick={() => {
                                    if (settings.bridgeToken) {
                                      navigator.clipboard.writeText(settings.bridgeToken);
                                      setCopySuccess(true);
                                      setTimeout(() => setCopySuccess(false), 2000);
                                    }
                                  }}
                                  className={cn(
                                    "p-1 rounded transition-colors border border-tf-border",
                                    copySuccess ? "bg-tf-emerald text-white" : "text-tf-slate hover:bg-white"
                                  )}
                                >
                                  {copySuccess ? <Check className="w-2.5 h-2.5" /> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"></path></svg>}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-tf-slate-muted uppercase mb-1">Relay</label>
                              <input
                                type="text"
                                value={settings.bridgeRelayUrl || ''}
                                onChange={(e) => updateSetting('bridgeRelayUrl', e.target.value)}
                                className="w-full px-1.5 py-1 text-[9px] border border-tf-border rounded bg-white text-tf-slate"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Visible Playlists</h2>
                </div>
                <p className="text-[10px] text-tf-slate-muted mb-3">Select which playlists appear in sync. Leave empty to show all.</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {playlists.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-tf-gray/30 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.visiblePlaylists.length === 0 || settings.visiblePlaylists.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const current = settings.visiblePlaylists || [];
                            updateSetting('visiblePlaylists', [...current, p.id]);
                          } else {
                            const newList = (settings.visiblePlaylists || []).filter((id: string) => id !== p.id);
                            updateSetting('visiblePlaylists', newList);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-tf-border text-tf-emerald focus:ring-tf-emerald/20"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {p.images?.[0]?.url ? (
                          <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover object-center" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-tf-emerald/10 flex items-center justify-center flex-shrink-0">
                            <Music2 className="w-3 h-3 text-tf-emerald" />
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-tf-slate truncate">{p.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Advanced</h2>
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-2 bg-tf-gray/30 hover:bg-tf-gray/50 rounded-lg transition-colors"
                >
                  <span className="text-xs font-bold text-tf-slate">{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                  {showAdvanced ? <ChevronUp className="w-3 h-3 text-tf-slate-muted" /> : <ChevronDown className="w-3 h-3 text-tf-slate-muted" />}
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3">
                    <div className="p-3 bg-tf-gray/30 border border-tf-border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-tf-slate">Matching Confidence</label>
                        <span className="text-[10px] font-mono text-tf-emerald font-bold">{settings.matchThreshold ?? 0.7}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.0"
                        step="0.05"
                        value={settings.matchThreshold ?? 0.7}
                        onChange={(e) => updateSetting('matchThreshold', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-tf-border rounded-lg appearance-none cursor-pointer accent-tf-emerald"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-tf-gray/30 border border-tf-border rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-tf-slate">Debug Console</p>
                        <p className="text-[10px] text-tf-slate-muted">Show logs in Activity tab</p>
                      </div>
                      <button
                        onClick={() => updateSetting('enableDebugConsole', !settings.enableDebugConsole)}
                        className={cn("w-9 h-5 rounded-full transition-all relative", settings.enableDebugConsole ? "bg-tf-emerald" : "bg-tf-border")}
                      >
                        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.enableDebugConsole ? "left-4" : "left-0.5")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-amber-50/50 border border-amber-200/50 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-tf-slate">Lossless Sources</p>
                        <p className="text-[10px] text-tf-slate-muted">Experimental (Qobuz/Tidal)</p>
                      </div>
                      <button
                        onClick={() => updateSetting('lucidaEnabled', !settings.lucidaEnabled)}
                        className={cn("w-9 h-5 rounded-full transition-all relative", settings.lucidaEnabled ? "bg-tf-emerald" : "bg-tf-border")}
                      >
                        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.lucidaEnabled ? "left-4" : "left-0.5")} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-tf-border/50 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-tf-slate mb-1">Download Provider</label>
                        <select
                          value={settings.downloadProvider}
                          onChange={(e) => updateSetting('downloadProvider', e.target.value as 'cobalt' | 'yt-dlp')}
                          className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                        >
                          <option value="yt-dlp">yt-dlp (Default)</option>
                          <option value="cobalt">Cobalt</option>
                        </select>
                      </div>

                      {settings.downloadProvider === 'yt-dlp' ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={settings.ytDlpInstance}
                            onChange={(e) => updateSetting('ytDlpInstance', e.target.value)}
                            className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                            placeholder="https://yt.micr.dev"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={settings.cobaltInstance}
                          onChange={(e) => updateSetting('cobaltInstance', e.target.value)}
                          placeholder="https://cobalt.micr.dev"
                          className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Sync with Spotify</h2>
                </div>
                <SpotifyLocalFilesTutorial />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 text-center border-t border-tf-border bg-tf-gray-light">
        <p className="text-[9px] font-bold text-tf-slate-muted mono uppercase tracking-[0.1em] flex items-center justify-center gap-1.5">
          <MousePointer2 className="w-3 h-3" /> Right-click videos to sync
        </p>
      </div>
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<TunePortPopup />);
}
