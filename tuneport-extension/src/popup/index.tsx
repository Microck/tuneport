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
  Settings,
  User,
  Shield,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ChromeMessageService } from '../services/ChromeMessageService';
import { SpotifyAuthService } from '../services/SpotifyAuthService';

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
  status: string;
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
}

interface QualityPreset {
  id: string;
  label: string;
  format: string;
}

const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'best', label: 'Opus (Best Quality)', format: 'best' },
  { id: 'opus', label: 'Opus (Native)', format: 'opus' },
  { id: 'mp3', label: 'MP3 (Re-encoded)', format: 'mp3' },
  { id: 'ogg', label: 'OGG (Re-encoded)', format: 'ogg' },
  { id: 'wav', label: 'WAV (Uncompressed)', format: 'wav' },
];

const FILE_NAMING_OPTIONS = [
  { id: 'artist-title', label: 'Artist - Title' },
  { id: 'title-artist', label: 'Title - Artist' },
  { id: 'title', label: 'Title only' }
];

interface SettingsState {
  defaultPlaylist: string;
  defaultQuality: string;
  fileNamingFormat: string;
  enableDownload: boolean;
  enableLosslessSources: boolean;
  showQualityWarnings: boolean;
  showNotFoundWarnings: boolean;
  cobaltInstance: string;
  lucidaEnabled: boolean;
  visiblePlaylists: string[];
}

const DEFAULT_SETTINGS: SettingsState = {
  defaultPlaylist: '',
  defaultQuality: 'best',
  fileNamingFormat: 'artist-title',
  enableDownload: true,
  enableLosslessSources: false,
  showQualityWarnings: true,
  showNotFoundWarnings: true,
  cobaltInstance: 'https://cobalt-api.meowing.de',
  lucidaEnabled: false,
  visiblePlaylists: []
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
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{ title: string; artist: string; thumbnail: string } | null>(null);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistSearch, setPlaylistSearch] = useState('');

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  useEffect(() => {
    checkConnection();
    loadJobs();
    getCurrentUrl();
    loadSettings();
    
    const interval = setInterval(loadJobs, 2000);
    return () => clearInterval(interval);
  }, []);

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
      const quality = QUALITY_PRESETS.find(q => q.id === selectedQuality) || QUALITY_PRESETS[0];
      const response = await ChromeMessageService.sendMessage({
        type: 'ADD_TRACK_TO_PLAYLIST',
        data: { 
          youtubeUrl: currentUrl, 
          playlistId,
          download: enableDownload,
          downloadOptions: enableDownload ? {
            format: quality.format
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
                      <img 
                        src={videoMetadata.thumbnail} 
                        alt="" 
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-md"
                      />
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
                          {QUALITY_PRESETS.find(q => q.id === selectedQuality)?.label || 'Best Quality'}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-tf-slate-muted transition-transform", showQualityDropdown && "rotate-180")} />
                      </button>
                      {showQualityDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tf-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                          {QUALITY_PRESETS.map((preset) => (
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

                  <div className="relative">
                    <button
                      onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl border border-tf-border bg-white hover:border-tf-emerald transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {selectedPlaylist?.images?.[0]?.url ? (
                          <img src={selectedPlaylist.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
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
                                <img src={pl.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
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
                        <img src={job.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover ml-2 border border-tf-border" />
                      )}
                      {job.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-tf-emerald ml-2" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-tf-rose ml-2" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-tf-emerald animate-spin ml-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                        job.status === 'completed' ? "bg-tf-emerald/10 text-tf-emerald" :
                        job.status === 'failed' ? "bg-tf-rose/10 text-tf-rose" :
                        "bg-tf-gray text-tf-slate-muted"
                      )}>
                        {job.status}
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
                    {job.currentStep && job.status !== 'completed' && job.status !== 'failed' && (
                      <p className="text-[10px] text-tf-slate-muted font-medium mb-2 mono">{job.currentStep}</p>
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
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {savedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs font-bold text-tf-emerald bg-tf-emerald/10 p-2 rounded-lg"
                >
                  <Check className="w-3 h-3" /> Saved
                </motion.div>
              )}

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
                      {QUALITY_PRESETS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
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
                          <img src={p.images[0].url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
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
                    <div>
                      <label className="block text-[10px] font-bold text-tf-slate mb-1">Cobalt Instance</label>
                      <input
                        type="text"
                        value={settings.cobaltInstance}
                        onChange={(e) => updateSetting('cobaltInstance', e.target.value)}
                        placeholder="https://cobalt-api.meowing.de"
                        className="w-full px-3 py-2 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald"
                      />
                    </div>
                  </div>
                )}
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
