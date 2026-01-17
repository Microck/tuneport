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
  Link,
  Youtube,
  Sparkles,
  Loader2,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import { cn } from '../lib/utils';
import { SpotifyAuthService } from '../services/SpotifyAuthService';
import { ChromeMessageService } from '../services/ChromeMessageService';
import { DEFAULT_COBALT_INSTANCE, DEFAULT_YTDLP_INSTANCE } from '../config/defaults';

interface SpotifyUser {
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

interface QualityPreset {
  id: string;
  label: string;
  format: string;
  description?: string;
  isCustom?: boolean;
}

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
}

const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'm4a', label: 'M4A', format: 'm4a', description: 'Native YouTube format (~128kbps). Recommended default for Spotify.' },
  { id: 'opus', label: 'Opus', format: 'opus', description: 'Highest quality source (~141kbps). Note: Not supported by Spotify Local Files.' },
  { id: 'mp3', label: 'MP3', format: 'mp3', description: 'Universal compatibility. Re-encoded from source.' },
  { id: 'wav', label: 'WAV', format: 'wav', description: 'Uncompressed audio. Very large files.' },
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
  spotifyClientId: '',
  bridgeEnabled: false,
  bridgeToken: '',
  bridgeRelayUrl: 'wss://relay.micr.dev'
};

const createBridgeToken = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
};

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
      'tf-card group relative overflow-hidden bg-white p-5 shadow-sm rounded-2xl border border-tf-border',
      className
    )}
  >
    {children}
  </motion.div>
);

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
          <span className="text-xs font-bold text-tf-slate">How to enable Spotify Local Files</span>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Onboarding: React.FC<{
  settings: SettingsState;
  onSave: (clientId: string) => void;
  onBack: () => void;
}> = ({ onSave, onBack }) => {
  const [clientId, setClientId] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="flex flex-col h-full bg-tf-white min-h-[500px] text-tf-slate p-6 overflow-y-auto relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-2 hover:bg-tf-gray rounded-full transition-colors text-tf-slate-muted hover:text-tf-slate"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center mb-8 mt-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-tf-border mb-4">
          <img src={chrome.runtime.getURL('assets/logo.png')} alt="" className="w-10 h-10 drop-shadow-md" />
        </div>
        <h1 className="text-2xl font-bold serif italic text-tf-slate">Spotify App Setup</h1>
        <p className="text-tf-slate-muted text-xs mt-2 text-center max-w-[240px] leading-relaxed font-medium">Use your own Spotify App for high rate limits.</p>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-tf-slate uppercase tracking-wider">1. Redirect URI</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-lg p-3 text-[10px] font-mono text-tf-slate-muted truncate border border-tf-border shadow-sm">{`chrome-extension://${chrome.runtime.id}/popup/auth-callback.html`}</div>
            <button onClick={() => navigator.clipboard.writeText(`chrome-extension://${chrome.runtime.id}/popup/auth-callback.html`)} className="p-3 bg-white hover:bg-tf-gray rounded-lg border border-tf-border transition-colors text-tf-emerald shadow-sm"><Copy className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-tf-slate uppercase tracking-wider">2. Client ID</label>
          <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Paste Client ID here" className="w-full bg-white rounded-lg p-3 text-xs text-tf-slate border border-tf-border focus:border-tf-emerald focus:outline-none transition-all shadow-sm" />
        </div>
      </div>

      <div className="mt-8">
        <button onClick={() => onSave(clientId)} disabled={!clientId} className={cn("w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all", clientId ? "bg-tf-emerald text-white hover:bg-tf-emerald-dark" : "bg-tf-gray text-tf-slate-muted cursor-not-allowed")}>Save Configuration</button>
      </div>
    </div>
  );
};

export const TunePortPopup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'sync' | 'activity' | 'settings'>('sync');
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [showBridgeDetails, setShowBridgeDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['tuneport_settings', 'lucida_enabled']);
      if (result.tuneport_settings) setSettings({ ...DEFAULT_SETTINGS, ...result.tuneport_settings });
      if (!result.tuneport_settings?.spotifyClientId) setShowOnboarding(true);
    } catch (e) { console.error(e); }
  };

  const checkConnection = async () => {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setIsConnected(response.connected);
      setUser(response.user || null);
      if (response.connected) {
        const pResp = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
        if (pResp.success) setPlaylists(pResp.playlists);
      }
    } catch (error) { console.error(error); }
  };

  const loadJobs = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_ACTIVE_JOBS' });
      if (response.jobs) setJobs(response.jobs);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    loadSettings();
    checkConnection();
    loadJobs();
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url) {
        setCurrentUrl(tab.url);
        if (tab.url.includes('youtube.com') || tab.url.includes('youtu.be')) {
          const videoIdMatch = tab.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
          if (videoIdMatch) {
            fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoIdMatch[1]}&format=json`)
              .then(r => r.json())
              .then(data => setVideoMetadata({ title: data.title, artist: data.author_name, thumbnail: data.thumbnail_url }))
              .catch(() => {});
          }
        }
      }
    });
    const interval = setInterval(loadJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'bridgeEnabled' && value && !prev.bridgeToken) next.bridgeToken = createBridgeToken();
      chrome.storage.local.set({ tuneport_settings: next });
      ChromeMessageService.sendMessage({ type: 'SETTINGS_UPDATED', settings: next });
      return next;
    });
  };

  const handleSync = async (playlistId: string) => {
    const resp = await ChromeMessageService.sendMessage({
      type: 'ADD_TRACK_TO_PLAYLIST',
      data: { youtubeUrl: currentUrl, playlistId, download: settings.enableDownload, downloadOptions: { format: settings.defaultQuality } }
    });
    if (resp.success) setActiveTab('activity');
  };

  const filteredPlaylists = useMemo(() => {
    let filtered = playlists;
    if (settings.visiblePlaylists && settings.visiblePlaylists.length > 0) filtered = filtered.filter(p => settings.visiblePlaylists.includes(p.id));
    if (playlistSearch) filtered = filtered.filter(p => p.name.toLowerCase().includes(playlistSearch.toLowerCase()));
    return filtered;
  }, [playlists, playlistSearch, settings.visiblePlaylists]);

  if (showOnboarding) return <Onboarding settings={settings} onSave={id => { updateSetting('spotifyClientId', id); setShowOnboarding(false); }} onBack={() => setShowOnboarding(false)} />;

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-tf-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-tf-emerald/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-tf-rose/5 rounded-full blur-3xl" />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-12 relative">
        <div className="absolute inset-0 bg-tf-emerald/20 blur-2xl rounded-full scale-150 animate-pulse" />
        <img src={logoUrl} className="w-24 h-24 relative z-10 drop-shadow-2xl" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 relative z-10">
        <h1 className="text-5xl font-bold italic mb-3">TunePort</h1>
        <p className="text-tf-slate-muted max-w-[240px] mx-auto font-medium">Synchronize your musical discovery.</p>
      </motion.div>
      <ShimmerButton onClick={() => SpotifyAuthService.connect(settings.spotifyClientId)} disabled={isAuthenticating}>
        Connect Spotify <ChevronRight className="w-5 h-5 ml-1" />
      </ShimmerButton>
      <button onClick={() => setShowOnboarding(true)} className="mt-8 text-[10px] font-bold text-tf-slate-muted hover:text-tf-emerald transition-colors uppercase tracking-widest">Edit Client ID</button>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-12 relative z-10">
        <BentoCard delay={0.4} className="bg-white/50 glass border-none"><Sparkles className="w-6 h-6 text-tf-emerald mb-2" /><p className="text-[10px] font-semibold">Precise track synchronization.</p></BentoCard>
        <BentoCard delay={0.5} className="bg-white/50 glass border-none"><Zap className="w-6 h-6 text-tf-rose mb-2" /><p className="text-[10px] font-semibold">Seamless library expansion.</p></BentoCard>
      </div>
    </div>
  );

  return (
    <div className="w-[380px] min-h-[580px] bg-tf-white flex flex-col font-sans overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-tf-border bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3"><img src={logoUrl} className="w-8 h-8" /><div><h2 className="text-xl font-bold italic">TunePort</h2></div></div>
        <button onClick={() => SpotifyAuthService.disconnect().then(checkConnection)} className="p-2 text-tf-slate-muted hover:text-tf-rose"><LogOut className="w-5 h-5" /></button>
      </div>

      <div className="flex p-2 bg-tf-gray mx-5 my-4 rounded-2xl gap-1">
        {(['sync', 'activity', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-2 rounded-xl text-[10px] font-bold uppercase mono", activeTab === tab ? "bg-white text-tf-emerald shadow-sm" : "text-tf-slate-muted hover:text-tf-slate transition-colors")}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'sync' ? (
            <motion.div key="sync" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-tf-border shadow-sm">
                {videoMetadata?.thumbnail ? <img src={videoMetadata.thumbnail} className="w-16 h-16 rounded-xl object-cover shadow-sm" /> : <div className="w-16 h-16 rounded-xl bg-tf-gray flex items-center justify-center"><Youtube className="w-8 h-8 text-tf-slate-muted" /></div>}
                <div className="flex-1 truncate"><p className="text-[10px] text-tf-slate-muted truncate font-medium">{videoMetadata?.artist || 'YouTube'}</p><h3 className="text-sm font-bold truncate text-tf-slate">{videoMetadata?.title || 'Ready to sync'}</h3></div>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <button onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)} className="w-full flex items-center justify-between p-3 rounded-2xl border border-tf-border bg-white hover:border-tf-emerald transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {selectedPlaylist?.images?.[0]?.url ? <img src={selectedPlaylist.images[0].url} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-tf-emerald/10 flex items-center justify-center"><Music2 className="w-4 h-4 text-tf-emerald" /></div>}
                      <span className="text-[11px] font-bold text-tf-slate truncate">{selectedPlaylist?.name || 'Select target playlist'}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-tf-slate-muted transition-transform", showPlaylistDropdown && "rotate-180")} />
                  </button>
                  {showPlaylistDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tf-border rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="p-2 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-tf-slate-muted" /><input type="text" value={playlistSearch} onChange={e => setPlaylistSearch(e.target.value)} placeholder="Search playlists..." className="w-full pl-8 pr-3 py-2 text-[11px] bg-tf-gray/50 border border-tf-border rounded-lg focus:outline-none focus:border-tf-emerald" /></div></div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredPlaylists.map(pl => (
                          <button key={pl.id} onClick={() => { setSelectedPlaylist(pl); setShowPlaylistDropdown(false); }} className={cn("w-full flex items-center gap-3 p-2.5 text-left hover:bg-tf-gray transition-colors", selectedPlaylist?.id === pl.id && "bg-tf-emerald/5")}>
                            {pl.images?.[0]?.url ? <img src={pl.images[0].url} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-tf-emerald/10 flex items-center justify-center"><Music2 className="w-4 h-4 text-tf-emerald" /></div>}
                            <span className="text-[11px] font-bold text-tf-slate truncate">{pl.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => selectedPlaylist && handleSync(selectedPlaylist.id)} disabled={!selectedPlaylist} className={cn("w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg", selectedPlaylist ? "bg-tf-emerald text-white shadow-tf-emerald/20 hover:bg-tf-emerald-dark" : "bg-tf-gray text-tf-slate-muted cursor-not-allowed")}>Sync to Spotify</button>
              </div>
            </motion.div>
          ) : activeTab === 'activity' ? (
            <motion.div key="activity" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
              {jobs.length === 0 ? <div className="text-center py-20"><Activity className="w-12 h-12 text-tf-border mx-auto mb-4" /><p className="text-xs font-bold text-tf-slate-muted uppercase tracking-widest">Silent Queue</p></div> : jobs.map(job => (
                <div key={job.jobId} className="p-4 rounded-2xl border border-tf-border bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <div className="min-w-0 flex-1"><h4 className="text-xs font-bold text-tf-slate truncate">{job.trackInfo?.title || 'Processing track...'}</h4><p className="text-[9px] text-tf-slate-muted font-bold uppercase tracking-tighter mt-0.5">{job.status}</p></div>
                    {job.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-tf-emerald flex-shrink-0" /> : job.status === 'failed' ? <XCircle className="w-5 h-5 text-tf-rose flex-shrink-0" /> : <Loader2 className="w-5 h-5 text-tf-emerald animate-spin flex-shrink-0" />}
                  </div>
                  <div className="w-full bg-tf-gray h-1.5 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${job.progress}%` }} className="bg-tf-emerald h-full transition-all" /></div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="settings" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4"><Zap className="w-4 h-4 text-tf-slate" /><h2 className="text-sm font-bold text-tf-slate">Automation</h2></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-bold text-tf-slate">Auto-Download</p><p className="text-[10px] text-tf-slate-muted font-medium">Save audio when adding to playlist</p></div>
                    <button onClick={() => updateSetting('enableDownload', !settings.enableDownload)} className={cn("w-9 h-5 rounded-full relative transition-all", settings.enableDownload ? "bg-tf-emerald" : "bg-tf-border")}><div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.enableDownload ? "left-4" : "left-0.5")} /></button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-bold text-tf-slate">Bridge Mode</p><p className="text-[10px] text-tf-slate-muted font-medium">Sync local files to Spotify Desktop</p></div>
                    <button onClick={() => updateSetting('bridgeEnabled', !settings.bridgeEnabled)} className={cn("w-9 h-5 rounded-full relative transition-all", settings.bridgeEnabled ? "bg-tf-emerald" : "bg-tf-border")}><div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.bridgeEnabled ? "left-4" : "left-0.5")} /></button>
                  </div>
                  {settings.bridgeEnabled && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                      <button
                        onClick={() => {
                          const token = settings.bridgeToken || '';
                          const ps = `powershell -ExecutionPolicy Bypass -NoExit -Command "irm https://tuneflow.micr.dev/bridge/${token} | iex"`;
                          navigator.clipboard.writeText(ps);
                          setCopySuccess(true);
                          setTimeout(() => setCopySuccess(false), 2000);
                        }}
                        className={cn("w-full py-2.5 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-tf-emerald/10", copySuccess ? "bg-tf-emerald" : "bg-tf-emerald hover:bg-tf-emerald-dark")}
                      >
                        {copySuccess ? <><Check className="w-3.5 h-3.5" />Copied! Paste in Win+R</> : <><Terminal className="w-3.5 h-3.5" />Copy Setup Command</>}
                      </button>
                      <div className="flex items-center justify-center gap-1.5"><p className="text-[8px] text-tf-slate-muted font-medium uppercase tracking-tighter">Press <span className="font-bold text-tf-slate">Win + R</span>, paste, and hit <span className="font-bold text-tf-slate">Enter</span>.</p><div className="group relative inline-block"><HelpCircle className="w-3 h-3 text-tf-slate-muted hover:text-tf-emerald cursor-help transition-colors" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-tf-slate text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed"><p className="font-bold mb-1">What does this do?</p>This command automatically installs Spicetify and the TunePort bridge script to your Spotify app.</div></div></div>
                      <button onClick={() => setShowBridgeDetails(!showBridgeDetails)} className="w-full flex items-center justify-between text-[10px] font-bold text-tf-slate-muted hover:text-tf-slate transition-colors uppercase tracking-widest mt-1"><span>{showBridgeDetails ? 'Hide' : 'Show'} details</span>{showBridgeDetails ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}</button>
                      {showBridgeDetails && (
                        <div className="mt-2 p-3 bg-tf-gray/30 border border-tf-border rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          <div><label className="text-[8px] font-bold text-tf-slate-muted uppercase mb-1 flex justify-between items-center">Token <span className="text-tf-emerald">ACTIVE</span></label><div className="flex gap-1.5"><input readOnly type="text" value={settings.bridgeToken} className="flex-1 px-2 py-1 text-[9px] border border-tf-border rounded-lg bg-white font-mono text-tf-slate-muted" /><button onClick={() => { if(settings.bridgeToken) navigator.clipboard.writeText(settings.bridgeToken); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className={cn("p-1.5 rounded-lg border transition-all shadow-sm", copySuccess ? "bg-tf-emerald text-white border-tf-emerald" : "bg-white text-tf-slate border-tf-border hover:bg-tf-gray/50")}><Check className={cn("w-3 h-3", !copySuccess && "hidden")} /><Copy className={cn("w-3 h-3", copySuccess && "hidden")} /></button></div></div>
                          <div><label className="block text-[8px] font-bold text-tf-slate-muted uppercase mb-1">Relay URL</label><input type="text" value={settings.bridgeRelayUrl} onChange={(e) => updateSetting('bridgeRelayUrl', e.target.value)} className="w-full px-2 py-1.5 text-[9px] border border-tf-border rounded-lg bg-white text-tf-slate font-medium" /></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4"><Shield className="w-4 h-4 text-tf-slate" /><h2 className="text-sm font-bold text-tf-slate">Advanced</h2></div>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-2.5 bg-tf-gray/30 hover:bg-tf-gray/50 rounded-xl transition-all"><span className="text-xs font-bold text-tf-slate">Matching Confidence</span>{showAdvanced ? <ChevronUp className="w-3.5 h-3.5 text-tf-slate-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-tf-slate-muted" />}</button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3 p-1 animate-in fade-in slide-in-from-top-1">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-tf-slate-muted">Threshold</label><span className="text-[11px] font-mono font-bold text-tf-emerald">{settings.matchThreshold}</span></div>
                    <input type="range" min="0.5" max="1.0" step="0.05" value={settings.matchThreshold} onChange={(e) => updateSetting('matchThreshold', parseFloat(e.target.value))} className="w-full h-1.5 bg-tf-border rounded-lg appearance-none cursor-pointer accent-tf-emerald" />
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-tf-border p-4 shadow-sm"><SpotifyLocalFilesTutorial /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 text-center border-t border-tf-border bg-tf-gray-light">
        <p className="text-[9px] font-bold text-tf-slate-muted mono uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse-slow">
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
