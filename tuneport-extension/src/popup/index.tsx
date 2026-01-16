import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music2, 
  Activity, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Youtube,
  Sparkles,
  Zap,
  MousePointer2,
  ChevronRight,
  LogOut,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Settings,
  User,
  Shield,
  Check,
  AlertCircle,
  HelpCircle,
  Trash2,
  Terminal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ChromeMessageService } from '../services/ChromeMessageService';
import { SpotifyAuthService } from '../services/SpotifyAuthService';
import { DEFAULT_COBALT_INSTANCE, DEFAULT_YTDLP_INSTANCE } from '../config/defaults';
import { parseDescriptionSegments, parseManualMultiSegments, parseManualSingleSegments } from '../services/SegmentParser';
import type { Segment, SegmentMode } from '../services/SegmentParser';


const ShimmerButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, disabled, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'shimmer-button group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden',
        'rounded-2xl px-8 py-4 whitespace-nowrap',
        'text-white font-bold text-lg mono tracking-wide',
        'bg-gradient-to-r from-tf-emerald to-tf-emerald-dark',
        'transform-gpu transition-all duration-300 ease-in-out',
        'hover:scale-[1.02] hover:shadow-2xl hover:shadow-tf-emerald/30',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

const OrbitingCircles: React.FC<{
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  radius?: number;
  path?: boolean;
  iconSize?: number;
  speed?: number;
}> = ({
  className,
  children,
  reverse,
  duration = 20,
  radius = 80,
  path = true,
  iconSize = 30,
  speed = 1,
}) => {
  const calculatedDuration = duration / speed;
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <circle
            className="stroke-tf-emerald/10 stroke-[1px]"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      {React.Children.map(children, (child, index) => {
        const angle = (360 / React.Children.count(children)) * index;
        return (
          <div
            style={
              {
                "--duration": `${calculatedDuration}s`,
                "--radius": `${radius}px`,
                "--angle": angle,
                "--icon-size": `${iconSize}px`,
              } as React.CSSProperties
            }
            className={cn(
              "animate-orbit absolute flex size-[var(--icon-size)] transform-gpu items-center justify-center rounded-full",
              { "[animation-direction:reverse]": reverse }
            )}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      'tf-card group relative overflow-hidden bg-white p-5',
      className
    )}
  >
    {children}
  </motion.div>
);

interface Job {
  jobId: string;
  status: 'queued' | 'searching' | 'adding' | 'downloading' | 'completed' | 'failed' | 'awaiting_fallback';
  progress: number;
  trackInfo?: {
    title: string;
    artist: string;
  };
  thumbnail?: string;
  error?: string;
  downloadInfo?: {
    enabled: boolean;
    quality?: string;
    source?: string;
    filename?: string;
  };
  currentStep?: string;
  startedAt?: number;
  stepStartedAt?: number;
  fallbackMetadata?: {
    title: string;
    artist: string;
    source: string;
    confidence: string;
  };
}

interface QualityPreset {
  id: string;
  label: string;
  format: string;
  description?: string;
  isCustom?: boolean;
}

const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'opus', label: 'Opus', format: 'opus', description: 'Highest quality source (~141kbps). Recommended default.' },
  { id: 'm4a', label: 'M4A', format: 'm4a', description: 'Native YouTube format (~128kbps). High quality and compatibility.' },
  { id: 'mp3', label: 'MP3', format: 'mp3', description: 'Universal compatibility. Re-encoded from source.' },
  { id: 'wav', label: 'WAV', format: 'wav', description: 'Uncompressed audio. Large files.' },
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
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-tf-emerald" />
          <span className="text-xs font-bold text-tf-slate">How to add a custom folder to Spotify</span>
        </div>
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
                Local Files is <span className="font-bold text-tf-rose">disabled by default</span> in Spotify. To see your downloads:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-tf-slate-muted">
                <li>Open the <span className="font-bold text-tf-slate">Spotify desktop app</span></li>
                <li>Click your profile picture → <span className="font-bold text-tf-slate">Settings</span></li>
                <li>Scroll to <span className="font-bold text-tf-slate">Library</span> section</li>
                <li>Toggle <span className="font-bold text-tf-emerald">Show Local Files</span> ON</li>
                <li>Click <span className="font-bold text-tf-slate">Add a source</span></li>
                <li>Navigate to <span className="font-mono text-tf-slate">Downloads → TunePort</span> and select it</li>
              </ol>
              <div className="text-[10px] text-tf-slate-muted pt-2 border-t border-blue-100 space-y-1">
                <p>Your downloads appear in <span className="font-bold">Your Library → Local Files</span></p>
                <p>Files are saved to: <span className="font-mono font-bold">Downloads/TunePort/</span></p>
              </div>
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
            <option value="best">Opus</option>
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
}

const DEFAULT_SETTINGS: SettingsState = {
  defaultPlaylist: '',
  defaultQuality: 'best',
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
  matchThreshold: 0.7
};

export const TunePortPopup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<{ display_name: string; email: string; images: Array<{ url: string }> } | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sync' | 'activity' | 'settings'>('sync');
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
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


  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  useEffect(() => {
    checkConnection();
    loadJobs();
    getCurrentUrl();
    loadSettings();
    
    const interval = setInterval(() => {
      loadJobs();
      if (activeTab === 'activity' && showDebugConsole) {
        loadDebugLogs();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTab, showDebugConsole]);

  const loadDebugLogs = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_DEBUG_LOGS' });
      if (response.logs) setDebugLogs(response.logs);
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  };

  const clearDebugLogs = async () => {
    try {
      await ChromeMessageService.sendMessage({ type: 'CLEAR_DEBUG_LOGS' });
      setDebugLogs([]);
    } catch (error) {
      console.error('Failed to clear debug logs:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['tuneport_settings', 'lucida_enabled']);
      if (result.tuneport_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.tuneport_settings });
      }
      if (result.lucida_enabled !== undefined) {
        setSettings(prev => ({ ...prev, lucidaEnabled: result.lucida_enabled }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
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
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const checkConnection = async () => {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setIsConnected(response.connected);
      setUser(response.user || null);
      if (response.connected) loadPlaylists();
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
      if (response.success) setPlaylists(response.playlists);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_ACTIVE_JOBS' });
      if (response.jobs) setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

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

  const getCurrentUrl = async () => {
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
  };

  const fetchVideoMetadata = async (url: string) => {
    try {
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (!videoIdMatch) return;
      
      const videoId = videoIdMatch[1];
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (response.ok) {
        const data = await response.json();
        const title = data.title || '';
        let artist = '';
        let trackTitle = title;
        
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          artist = parts[0].trim();
          trackTitle = parts.slice(1).join(' - ').trim();
        } else {
          artist = data.author_name || '';
        }
        
        trackTitle = trackTitle
          .replace(/\s*\(Official\s*(Music\s*)?Video\)/gi, '')
          .replace(/\s*\[Official\s*(Music\s*)?Video\]/gi, '')
          .replace(/\s*\(Lyrics?\)/gi, '')
          .replace(/\s*\[Lyrics?\]/gi, '')
          .replace(/\s*\(Audio\)/gi, '')
          .replace(/\s*\[Audio\]/gi, '')
          .replace(/\s*\(Visualizer\)/gi, '')
          .replace(/\s*ft\.?\s+.+$/gi, '')
          .replace(/\s*feat\.?\s+.+$/gi, '')
          .trim();
        
        setVideoMetadata({
          title: trackTitle,
          artist,
          thumbnail: data.thumbnail_url
        });
      }
    } catch (error) {
      console.error('Failed to fetch video metadata:', error);
    }
  };

  const segmentsAllowed = settings.downloadProvider === 'yt-dlp';
  const activeSegments = segmentMode === 'auto' ? detectedSegments : manualSegments;

  const updateSelectedSegments = (segments: Segment[]) => {
    setSelectedSegmentIndexes(segments.map((_, index) => index));
  };

  const toggleSegmentIndex = (index: number) => {
    setSelectedSegmentIndexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }
      return [...prev, index];
    });
  };

  const handleDetectSegments = async () => {
    try {
      const tab = await ChromeMessageService.getCurrentTab();
      if (!tab?.id) return;

      const response = await ChromeMessageService.sendMessageToTab(tab.id, { type: 'GET_PAGE_METADATA' });
      const description = response?.metadata?.description || '';
      const segments = parseDescriptionSegments(description);
      setDetectedSegments(segments);
      updateSelectedSegments(segments);
    } catch (error) {
      console.error('Failed to detect segments:', error);
    }
  };

  const parseManualInput = (value: string, mode: SegmentMode) => {
    const segments = mode === 'single'
      ? parseManualSingleSegments(value)
      : parseManualMultiSegments(value);
    setManualSegments(segments);
    updateSelectedSegments(segments);
  };

  const handleManualSegmentsChange = (value: string) => {
    setSegmentInput(value);
    parseManualInput(value, manualSegmentMode);
  };

  const formatTimestamp = (value: number) => {
    const totalSeconds = Math.max(0, Math.floor(value));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSegmentLabel = (segment: Segment) => {
    const start = formatTimestamp(segment.start);
    const end = segment.end !== undefined ? formatTimestamp(segment.end) : 'end';
    const range = segment.end !== undefined ? `${start}-${end}` : `${start}+`;
    return segment.title ? `${range} · ${segment.title}` : range;
  };


  const filteredPlaylists = useMemo(() => {
    let filtered = playlists;
    
    if (settings.visiblePlaylists && settings.visiblePlaylists.length > 0) {
      filtered = filtered.filter(p => settings.visiblePlaylists.includes(p.id));
    }
    
    if (playlistSearch) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(playlistSearch.toLowerCase())
      );
    }
    return filtered;
  }, [playlists, playlistSearch, settings.visiblePlaylists]);

  const allQualityPresets = useMemo(() => {
    const customPresets = (settings.customPresets || []).map(p => ({
      ...p,
      isCustom: true,
      label: `${p.label} (Custom)`
    }));
    return [...QUALITY_PRESETS, ...customPresets];
  }, [settings.customPresets]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    try {
      const authUrl = await SpotifyAuthService.getAuthUrl();
      await chrome.tabs.create({ url: authUrl });
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    await SpotifyAuthService.disconnect();
    setIsConnected(false);
    setUser(null);
  };

  const handleSync = async (playlistId: string) => {
    try {
      const quality = allQualityPresets.find(q => q.id === selectedQuality) || QUALITY_PRESETS[0];
      const selectedSegments = segmentsEnabled && segmentsAllowed
        ? activeSegments.filter((_, index) => selectedSegmentIndexes.includes(index))
        : [];
      const segmentsPayload = selectedSegments.length > 0 ? selectedSegments : undefined;
      const segmentModePayload = segmentsEnabled && segmentsAllowed
        ? (segmentMode === 'auto' ? 'multiple' : manualSegmentMode)
        : undefined;

      const response = await ChromeMessageService.sendMessage({
        type: 'ADD_TRACK_TO_PLAYLIST',
        data: { 
          youtubeUrl: currentUrl,
          playlistId,
          download: enableDownload,
          downloadOptions: enableDownload ? {
            format: quality.format,
            segments: segmentsPayload,
            segmentMode: segmentsPayload ? segmentModePayload : undefined
          } : undefined
        }
      });
      if (response.success) {
        setActiveTab('activity');
        loadJobs();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };


  const isYouTube = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-tf-white relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-tf-emerald/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-tf-rose/5 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="mb-12 relative"
        >
          <div className="absolute inset-0 bg-tf-emerald/20 blur-2xl rounded-full scale-150 animate-pulse-slow" />
          <div className="relative z-10">
            <img src={logoUrl} alt="TunePort" className="w-24 h-24 relative z-10 drop-shadow-2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10 relative z-10"
        >
          <h1 className="text-5xl font-bold serif mb-3 text-tf-slate tracking-tight italic">
            TunePort
          </h1>
          <p className="text-tf-slate-muted max-w-[240px] mx-auto leading-relaxed font-medium">
            Synchronize your musical discovery with a single click.
          </p>
        </motion.div>

        <ShimmerButton onClick={handleConnect} disabled={isAuthenticating} className="mb-12">
          {isAuthenticating ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Connect Spotify <ChevronRight className="w-5 h-5" />
            </>
          )}
        </ShimmerButton>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm relative z-10">
          <BentoCard delay={0.4} className="bg-white/50 glass border-none">
            <Sparkles className="w-6 h-6 text-tf-emerald mb-2" />
            <div className="text-xs font-bold mono uppercase tracking-tighter text-tf-slate-muted mb-1">Curation</div>
            <p className="text-[10px] font-semibold text-tf-slate leading-tight">Precise track synchronization.</p>
          </BentoCard>
          <BentoCard delay={0.5} className="bg-white/50 glass border-none">
            <Zap className="w-6 h-6 text-tf-rose mb-2" />
            <div className="text-xs font-bold mono uppercase tracking-tighter text-tf-slate-muted mb-1">Velocity</div>
            <p className="text-[10px] font-semibold text-tf-slate leading-tight">Seamless library expansion.</p>
          </BentoCard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-tf-white min-h-[500px]">
      <div className="p-5 flex items-center justify-between border-b border-tf-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="" className="w-8 h-8 drop-shadow-sm" />
          <div>
            <h2 className="text-xl font-bold serif italic text-tf-slate leading-none">TunePort</h2>
            <p className="text-[9px] font-bold text-tf-emerald uppercase tracking-[0.2em] mt-1.5 mono">Identity Verified</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {savedSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-[10px] font-bold text-tf-emerald"
              >
                <Check className="w-3 h-3" /> Saved
              </motion.div>
            )}
          </AnimatePresence>
          <a 
            href="https://github.com/Microck/tuneport" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-tf-gray text-tf-slate-muted hover:text-tf-slate transition-colors rounded-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <button onClick={handleDisconnect} className="p-2 hover:bg-tf-rose/10 text-tf-slate-muted hover:text-tf-rose transition-colors rounded-xl">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex p-2 bg-tf-gray mx-5 my-4 rounded-2xl gap-1">
        {(['sync', 'activity', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 px-4 rounded-xl text-[10px] font-bold transition-all uppercase mono tracking-widest",
              activeTab === tab ? "bg-white text-tf-emerald shadow-tf-sm" : "text-tf-slate-muted hover:text-tf-slate"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'sync' ? (
            <motion.div
              key="sync"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {isYouTube ? (
                <>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-tf-border shadow-sm">
                    {videoMetadata?.thumbnail ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                        <img 
                          src={videoMetadata.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-tf-gray flex items-center justify-center flex-shrink-0">
                        <Youtube className="w-8 h-8 text-tf-slate-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[10px] text-tf-slate-muted font-medium truncate">
                        {videoMetadata?.artist || 'Unknown Artist'}
                      </p>
                      <h3 className="text-sm font-bold text-tf-slate truncate mt-0.5">
                        {videoMetadata?.title || 'Loading...'}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-tf-gray/50">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-tf-emerald" />
                      <span className="text-[11px] font-bold text-tf-slate">Download Audio</span>
                    </div>
                    <button
                      onClick={() => setEnableDownload(!enableDownload)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative",
                        enableDownload ? "bg-tf-emerald" : "bg-tf-border"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                        enableDownload ? "left-5" : "left-0.5"
                      )} />
                    </button>
                  </div>

                  {enableDownload && (
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-tf-border bg-white hover:border-tf-emerald transition-all"
                      >
                        <span className="text-[11px] font-semibold text-tf-slate">
                          {allQualityPresets.find(q => q.id === selectedQuality)?.label || 'Best Quality'}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-tf-slate-muted transition-transform", showQualityDropdown && "rotate-180")} />
                      </button>
                      {showQualityDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tf-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                          {allQualityPresets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setSelectedQuality(preset.id);
                                setShowQualityDropdown(false);
                              }}
                              className={cn(
                                "w-full px-3 py-2 text-left text-[11px] font-medium hover:bg-tf-gray transition-colors",
                                selectedQuality === preset.id ? "text-tf-emerald bg-tf-emerald/5" : "text-tf-slate"
                              )}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {enableDownload && (
                    <div className="rounded-2xl border border-tf-border bg-white p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-tf-slate">Segment Download</p>
                          <p className="text-[9px] text-tf-slate-muted">Cut by timestamps or manual ranges</p>
                        </div>
                        <button
                          onClick={() => segmentsAllowed && setSegmentsEnabled(!segmentsEnabled)}
                          disabled={!segmentsAllowed}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            segmentsEnabled && segmentsAllowed ? "bg-tf-emerald" : "bg-tf-border",
                            !segmentsAllowed && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                            segmentsEnabled && segmentsAllowed ? "left-5" : "left-0.5"
                          )} />
                        </button>
                      </div>

                      {!segmentsAllowed && (
                        <p className="text-[9px] text-amber-600 font-medium">segments only on yt-dlp</p>
                      )}

                      {segmentsEnabled && segmentsAllowed && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSegmentMode('auto');
                                updateSelectedSegments(detectedSegments);
                              }}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-[10px] font-bold",
                                segmentMode === 'auto' ? "bg-tf-emerald/10 text-tf-emerald" : "bg-tf-gray text-tf-slate-muted"
                              )}
                            >
                              Auto
                            </button>
                            <button
                              onClick={() => {
                                setSegmentMode('manual');
                                updateSelectedSegments(manualSegments);
                              }}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-[10px] font-bold",
                                segmentMode === 'manual' ? "bg-tf-emerald/10 text-tf-emerald" : "bg-tf-gray text-tf-slate-muted"
                              )}
                            >
                              Manual
                            </button>
                          </div>

                          {segmentMode === 'auto' ? (
                            <div className="space-y-2">
                              <button
                                onClick={handleDetectSegments}
                                className="w-full py-2 rounded-lg text-[10px] font-bold bg-tf-gray/60 text-tf-slate hover:bg-tf-gray"
                              >
                                Detect from description
                              </button>

                              {detectedSegments.length > 0 ? (
                                <div className="max-h-28 overflow-y-auto space-y-1">
                                  {detectedSegments.map((segment, index) => (
                                    <label key={`auto-${index}`} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-tf-gray/40 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedSegmentIndexes.includes(index)}
                                        onChange={() => toggleSegmentIndex(index)}
                                        className="w-3 h-3 rounded border-tf-border text-tf-emerald focus:ring-tf-emerald/20"
                                      />
                                      <span className="text-[10px] font-medium text-tf-slate truncate">{formatSegmentLabel(segment)}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[9px] text-tf-slate-muted">No timestamps detected yet.</p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setManualSegmentMode('single');
                                    parseManualInput(segmentInput, 'single');
                                  }}
                                  className={cn(
                                    "flex-1 py-2 rounded-lg text-[10px] font-bold",
                                    manualSegmentMode === 'single' ? "bg-tf-emerald/10 text-tf-emerald" : "bg-tf-gray text-tf-slate-muted"
                                  )}
                                >
                                  Single
                                </button>
                                <button
                                  onClick={() => {
                                    setManualSegmentMode('multiple');
                                    parseManualInput(segmentInput, 'multiple');
                                  }}
                                  className={cn(
                                    "flex-1 py-2 rounded-lg text-[10px] font-bold",
                                    manualSegmentMode === 'multiple' ? "bg-tf-emerald/10 text-tf-emerald" : "bg-tf-gray text-tf-slate-muted"
                                  )}
                                >
                                  Multiple
                                </button>
                              </div>

                              <textarea
                                value={segmentInput}
                                onChange={(e) => handleManualSegmentsChange(e.target.value)}
                                placeholder={manualSegmentMode === 'single'
                                  ? "0:00-1:23\n1:33-2:20"
                                  : "3:24-5:47 theme\n6:14-8:28 closing"}
                                className="w-full min-h-[72px] p-2 text-[10px] rounded-lg border border-tf-border bg-tf-gray/30 focus:outline-none focus:border-tf-emerald"
                              />

                              {manualSegments.length > 0 ? (
                                <div className="max-h-28 overflow-y-auto space-y-1">
                                  {manualSegments.map((segment, index) => (
                                    <label key={`manual-${index}`} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-tf-gray/40 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedSegmentIndexes.includes(index)}
                                        onChange={() => toggleSegmentIndex(index)}
                                        className="w-3 h-3 rounded border-tf-border text-tf-emerald focus:ring-tf-emerald/20"
                                      />
                                      <span className="text-[10px] font-medium text-tf-slate truncate">{formatSegmentLabel(segment)}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[9px] text-tf-slate-muted">
                                  {manualSegmentMode === 'single'
                                    ? 'Add ranges to keep. Gaps are removed.'
                                    : 'Paste ranges like 0:00-2:22 Title.'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative">

                    <button
                      onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl border border-tf-border bg-white hover:border-tf-emerald transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {selectedPlaylist?.images?.[0]?.url ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={selectedPlaylist.images[0].url} alt="" className="w-full h-full object-cover object-center" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-tf-emerald/10 flex items-center justify-center flex-shrink-0">
                            <Music2 className="w-4 h-4 text-tf-emerald" />
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-tf-slate truncate">
                          {selectedPlaylist?.name || 'Select Playlist'}
                        </span>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-tf-slate-muted transition-transform flex-shrink-0", showPlaylistDropdown && "rotate-180")} />
                    </button>
                    
                    {showPlaylistDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tf-border rounded-xl shadow-lg z-20 overflow-hidden">
                        <div className="p-2 border-b border-tf-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-tf-slate-muted" />
                            <input
                              type="text"
                              value={playlistSearch}
                              onChange={(e) => setPlaylistSearch(e.target.value)}
                              placeholder="Search playlists..."
                              className="w-full pl-8 pr-3 py-2 text-[11px] bg-tf-gray/50 border border-tf-border rounded-lg focus:outline-none focus:border-tf-emerald"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredPlaylists.map((pl) => (
                            <button
                              key={pl.id}
                              onClick={() => {
                                setSelectedPlaylist(pl);
                                setShowPlaylistDropdown(false);
                                setPlaylistSearch('');
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-2 text-left hover:bg-tf-gray transition-colors",
                                selectedPlaylist?.id === pl.id && "bg-tf-emerald/5"
                              )}
                            >
                              {pl.images?.[0]?.url ? (
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={pl.images[0].url} alt="" className="w-full h-full object-cover object-center" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-tf-emerald/10 flex items-center justify-center flex-shrink-0">
                                  <Music2 className="w-4 h-4 text-tf-emerald" />
                                </div>
                              )}
                              <span className="text-[11px] font-medium text-tf-slate truncate">{pl.name}</span>
                            </button>
                          ))}
                          {filteredPlaylists.length === 0 && (
                            <p className="text-[10px] text-tf-slate-muted text-center py-4">No playlists found</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => selectedPlaylist && handleSync(selectedPlaylist.id)}
                    disabled={!selectedPlaylist}
                    className={cn(
                      "w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                      selectedPlaylist 
                        ? "bg-tf-emerald text-white hover:bg-tf-emerald-dark shadow-lg shadow-tf-emerald/20" 
                        : "bg-tf-gray text-tf-slate-muted cursor-not-allowed"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    {enableDownload ? 'Add & Download' : 'Add to Playlist'}
                  </button>
                </>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="relative inline-block mb-6">
                    <OrbitingCircles radius={50} speed={0.5}>
                      <Music2 className="w-4 h-4 text-tf-emerald/40" />
                      <Youtube className="w-4 h-4 text-tf-rose/40" />
                      <Search className="w-4 h-4 text-tf-slate/20" />
                    </OrbitingCircles>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="w-8 h-8 text-tf-slate-muted animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold serif italic text-tf-slate mb-2">Awaiting Signal</h3>
                  <p className="text-xs text-tf-slate-muted font-medium px-4">Navigate to a YouTube video to start syncing it to your playlists.</p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'activity' ? (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {jobs.length === 0 ? (
                <div className="text-center py-20">
                  <Activity className="w-12 h-12 text-tf-border mx-auto mb-4" />
                  <p className="text-xs font-bold text-tf-slate-muted mono tracking-wide uppercase">Silent Queue</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.jobId} className="p-4 rounded-2xl border border-tf-border bg-white shadow-tf-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-tf-slate truncate">{job.trackInfo?.title || 'Processing...'}</h4>
                        <p className="text-[10px] text-tf-slate-muted font-semibold">{job.trackInfo?.artist || ''}</p>
                      </div>
                      {job.thumbnail && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden ml-2 border border-tf-border flex-shrink-0">
                          <img src={job.thumbnail} alt="" className="w-full h-full object-cover object-center" />
                        </div>
                      )}
                      {job.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-tf-emerald ml-2" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-tf-rose ml-2" />
                      ) : job.status === 'awaiting_fallback' ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 ml-2" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-tf-emerald animate-spin ml-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                        job.status === 'completed' ? "bg-tf-emerald/10 text-tf-emerald" :
                        job.status === 'failed' ? "bg-tf-rose/10 text-tf-rose" :
                        job.status === 'awaiting_fallback' ? "bg-amber-50 text-amber-600" :
                        "bg-tf-gray text-tf-slate-muted"
                      )}>
                        {job.status === 'awaiting_fallback' ? 'confirm match' : job.status}
                      </span>
                      {job.downloadInfo?.enabled && job.downloadInfo?.quality && (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {job.downloadInfo.quality}
                        </span>
                      )}
                      {job.startedAt && job.status !== 'completed' && job.status !== 'failed' && (
                        <span className="text-[9px] font-medium text-tf-slate-muted mono">
                          {Math.floor((Date.now() - job.startedAt) / 1000)}s
                        </span>
                      )}
                    </div>
                    {job.currentStep && job.status !== 'completed' && job.status !== 'failed' && job.status !== 'awaiting_fallback' && (
                      <p className="text-[10px] text-tf-slate-muted font-medium mb-2 mono">{job.currentStep}</p>
                    )}
                    {job.status === 'awaiting_fallback' && job.fallbackMetadata && (
                      <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 mb-2">
                        <p className="text-[10px] text-amber-700 font-medium mb-2">
                          Found via YouTube Music: <span className="font-bold">{job.fallbackMetadata.title}</span> by <span className="font-bold">{job.fallbackMetadata.artist}</span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmFallback(job.jobId)}
                            className="flex-1 text-[10px] font-bold py-1.5 px-3 rounded-lg bg-tf-emerald text-white hover:bg-tf-emerald/90 transition-colors"
                          >
                            Try This
                          </button>
                          <button
                            onClick={() => rejectFallback(job.jobId)}
                            className="flex-1 text-[10px] font-bold py-1.5 px-3 rounded-lg bg-tf-gray text-tf-slate hover:bg-tf-border transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    )}
                    {job.error && (
                      <p className="text-[10px] text-tf-rose font-medium mb-2">{job.error}</p>
                    )}
                    <div className="w-full h-1.5 bg-tf-gray rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        className={cn("h-full", job.status === 'failed' ? "bg-tf-rose" : "bg-tf-emerald")}
                      />
                    </div>
                  </div>
                ))
              )}

              {settings.enableDebugConsole && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setShowDebugConsole(!showDebugConsole);
                      if (!showDebugConsole) loadDebugLogs();
                    }}
                    className="w-full flex items-center justify-between p-3 bg-tf-gray/30 hover:bg-tf-gray/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-tf-slate-muted" />
                      <span className="text-xs font-bold text-tf-slate">Debug Console</span>
                    </div>
                    {showDebugConsole ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  
                  <AnimatePresence>
                    {showDebugConsole && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-gray-400 font-mono">{debugLogs.length} entries</span>
                            <button
                              onClick={clearDebugLogs}
                              className="text-[10px] text-gray-400 hover:text-white transition-colors font-mono"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[9px]">
                            {debugLogs.length === 0 ? (
                              <p className="text-gray-500">No logs yet. Try downloading something.</p>
                            ) : (
                              debugLogs.slice().reverse().map((log, i) => (
                                <div key={i} className={cn(
                                  "py-0.5",
                                  log.type === 'error' ? 'text-red-400' :
                                  log.type === 'warn' ? 'text-yellow-400' :
                                  'text-gray-300'
                                )}>
                                  <span className="text-gray-500">{new Date(log.time).toLocaleTimeString()}</span>{' '}
                                  {log.message}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Account</h2>
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
                  </div>
                ) : (
                  <p className="text-xs text-tf-slate-muted">Not connected</p>
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
                      {allQualityPresets.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                    </select>
                    {allQualityPresets.find(q => q.id === settings.defaultQuality)?.description && (
                      <p className="text-[10px] text-tf-slate-muted mt-1">
                        {allQualityPresets.find(q => q.id === settings.defaultQuality)?.description}
                      </p>
                    )}
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
                    <Music2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Custom Presets</h2>
                </div>
                <CustomPresetsManager
                  presets={settings.customPresets || []}
                  onChange={(presets) => updateSetting('customPresets', presets)}
                />
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
                            if (settings.visiblePlaylists.length === 0) {
                              updateSetting('visiblePlaylists', [p.id]);
                            } else {
                              updateSetting('visiblePlaylists', [...settings.visiblePlaylists, p.id]);
                            }
                          } else {
                            const newList = settings.visiblePlaylists.filter((id: string) => id !== p.id);
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
                {settings.visiblePlaylists.length > 0 && (
                  <button
                    onClick={() => updateSetting('visiblePlaylists', [])}
                    className="mt-2 text-[10px] text-tf-emerald font-bold hover:underline"
                  >
                    Clear selection (show all)
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
                    <Download className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-tf-slate">Downloads</h2>
                </div>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl mb-3">
                  <p className="text-[10px] text-blue-700 font-medium">
                    Files save to: <span className="font-bold">Downloads/TunePort/</span>
                  </p>
                  <p className="text-[9px] text-blue-600 mt-1">
                    YouTube: Opus ~128k (equals MP3 320k quality). Lucida: lossless FLAC.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-tf-slate">Auto-Download</p>
                      <p className="text-[10px] text-tf-slate-muted">Download when adding to playlist</p>
                    </div>
                    <button
                      onClick={() => updateSetting('enableDownload', !settings.enableDownload)}
                      className={cn("w-9 h-5 rounded-full transition-all relative", settings.enableDownload ? "bg-tf-emerald" : "bg-tf-border")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.enableDownload ? "left-4" : "left-0.5")} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-tf-slate">Quality Warnings</p>
                      <p className="text-[10px] text-tf-slate-muted">Warn if quality unavailable</p>
                    </div>
                    <button
                      onClick={() => updateSetting('showQualityWarnings', !settings.showQualityWarnings)}
                      className={cn("w-9 h-5 rounded-full transition-all relative", settings.showQualityWarnings ? "bg-tf-emerald" : "bg-tf-border")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.showQualityWarnings ? "left-4" : "left-0.5")} />
                    </button>
                  </div>
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
                      <p className="text-[9px] text-tf-slate-muted leading-relaxed">
                        Threshold for auto-adding tracks. Higher values prevent false positives (wrong artist/remix). Recommended: 0.7-0.85.
                      </p>
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
                        <p className="text-[10px] text-tf-slate-muted">Qobuz/Tidal/Deezer (Experimental)</p>
                      </div>
                      <button
                        onClick={() => updateSetting('lucidaEnabled', !settings.lucidaEnabled)}
                        className={cn("w-9 h-5 rounded-full transition-all relative", settings.lucidaEnabled ? "bg-tf-emerald" : "bg-tf-border")}
                      >
                        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.lucidaEnabled ? "left-4" : "left-0.5")} />
                      </button>
                    </div>
                    <div className="pt-2 border-t border-tf-border/50">
                      <label className="block text-[10px] font-bold text-tf-slate mb-1">Download Provider</label>
                      <select
                        value={settings.downloadProvider}
                        onChange={(e) => updateSetting('downloadProvider', e.target.value as 'cobalt' | 'yt-dlp')}
                        className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald mb-3"
                      >
                        <option value="yt-dlp">yt-dlp (Default)</option>
                        <option value="cobalt">Cobalt</option>
                      </select>

                      {settings.downloadProvider === 'yt-dlp' ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-bold text-tf-slate">yt-dlp instance URL</label>
                              <a 
                                href="https://tuneport.micr.dev/self-host" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[9px] text-tf-emerald hover:underline cursor-pointer"
                                title="Learn how to self-host your own instance"
                              >
                                <HelpCircle className="w-3 h-3" />
                                How to self-host
                              </a>
                            </div>
                            <input
                              type="text"
                              value={settings.ytDlpInstance}
                              onChange={(e) => updateSetting('ytDlpInstance', e.target.value)}
                              className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                              placeholder="https://yt.micr.dev"
                            />
                          </div>
                          
                          {/* Only show token input if NOT using the default instance */}
                          {!(!settings.ytDlpInstance || settings.ytDlpInstance.includes('yt.micr.dev')) && (
                            <div>
                              <label className="block text-[10px] font-bold text-tf-slate mb-1">
                                yt-dlp API token
                              </label>
                              <input
                                type="password"
                                value={settings.ytDlpToken}
                                onChange={(e) => updateSetting('ytDlpToken', e.target.value)}
                                className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                                placeholder="Bearer token"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-tf-slate mb-1">Cobalt Instance</label>
                          <input
                            type="text"
                            value={settings.cobaltInstance}
                            onChange={(e) => updateSetting('cobaltInstance', e.target.value)}
                            placeholder="https://cobalt.micr.dev"
                            className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                          />
                        </div>
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
