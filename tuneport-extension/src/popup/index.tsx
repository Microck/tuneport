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
  Settings
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
}

interface QualityPreset {
  id: string;
  label: string;
  format: string;
  bitrate: string;
}

const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'best', label: 'Best Quality (Auto)', format: 'best', bitrate: '320' },
  { id: 'mp3-320', label: 'MP3 320kbps', format: 'mp3', bitrate: '320' },
  { id: 'mp3-256', label: 'MP3 256kbps', format: 'mp3', bitrate: '256' },
  { id: 'mp3-128', label: 'MP3 128kbps', format: 'mp3', bitrate: '128' },
];

export const TunePortPopup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sync' | 'activity'>('sync');
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
  const [enableDownload, setEnableDownload] = useState(false);
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  useEffect(() => {
    checkConnection();
    loadJobs();
    getCurrentUrl();
    
    const interval = setInterval(loadJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setIsConnected(response.connected);
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
      if (tab?.url) setCurrentUrl(tab.url);
    } catch (error) {
      console.error('Failed to get current URL:', error);
    }
  };

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
            format: quality.format,
            bitrate: quality.bitrate
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
          <button 
            onClick={() => chrome.runtime.openOptionsPage()} 
            className="p-2 hover:bg-tf-gray text-tf-slate-muted hover:text-tf-slate transition-colors rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={handleDisconnect} className="p-2 hover:bg-tf-rose/10 text-tf-slate-muted hover:text-tf-rose transition-colors rounded-xl">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex p-2 bg-tf-gray mx-5 my-4 rounded-2xl gap-1">
        {(['sync', 'activity'] as const).map((tab) => (
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
              className="space-y-6"
            >
              {isYouTube ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-tf-emerald/10 blur-xl group-hover:bg-tf-emerald/20 transition-colors rounded-3xl" />
                  <div className="relative bg-white border border-tf-emerald/30 p-6 rounded-3xl shadow-tf-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-tf-emerald/10 flex items-center justify-center text-tf-emerald">
                        <Youtube className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-tf-slate-muted uppercase tracking-widest mb-1 mono">Signal Detected</p>
                        <h3 className="text-sm font-bold text-tf-slate truncate">Current YouTube Video</h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] text-tf-slate-muted font-medium mb-2">Select a playlist to instantly sync this track:</p>
                      
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-tf-gray/50 mb-3">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-tf-slate-muted" />
                          <span className="text-[11px] font-semibold text-tf-slate">Also download audio</span>
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
                        <div className="relative mb-3">
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
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tf-border rounded-xl shadow-lg z-10 overflow-hidden">
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

                      <div className="grid grid-cols-1 gap-2">
                        {playlists.slice(0, 5).map((pl) => (
                          <button
                            key={pl.id}
                            onClick={() => handleSync(pl.id)}
                            className="flex items-center justify-between p-3 rounded-2xl border border-tf-border hover:border-tf-emerald hover:bg-tf-emerald/5 transition-all text-left group/pl"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              {pl.images?.[0]?.url ? (
                                <img src={pl.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-tf-emerald/10 flex items-center justify-center flex-shrink-0">
                                  <Music2 className="w-4 h-4 text-tf-emerald" />
                                </div>
                              )}
                              <span className="text-xs font-bold text-tf-slate truncate">{pl.name}</span>
                            </div>
                            <Plus className="w-4 h-4 text-tf-slate-muted group-hover/pl:text-tf-emerald transition-colors flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
          ) : (
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
                        <CheckCircle2 className="w-5 h-5 text-tf-emerald" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-tf-rose" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-tf-emerald animate-spin" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
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
                    </div>
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
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 text-center border-t border-tf-border bg-tf-gray-light">
        <p className="text-[9px] font-bold text-tf-slate-muted mono uppercase tracking-[0.15em] flex items-center justify-center gap-2">
          <MousePointer2 className="w-3 h-3" /> Right-click videos to sync instantly
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
