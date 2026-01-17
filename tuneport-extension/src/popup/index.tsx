import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Settings, Activity, Music2, Check, ChevronDown, ChevronUp, 
  ExternalLink, Copy, Zap, User, Shield, HelpCircle, Search, Download, 
  MousePointer2, Terminal, LogOut, Link, Youtube, Sparkles, Loader2, 
  ChevronRight, ArrowLeft, AlertCircle, CheckCircle2, XCircle
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
}

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
  customPresets: any[];
  spotifyFallbackMode: 'auto' | 'ask' | 'never';
  enableDebugConsole: boolean;
  matchThreshold: number;
  downloadMode: 'always' | 'missing_only';
  spotifyClientId: string;
  bridgeEnabled: boolean;
  bridgeToken: string;
  bridgeRelayUrl: string;
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

const Onboarding: React.FC<{ settings: SettingsState; onSave: (id: string) => void; onBack: () => void; }> = ({ onSave, onBack }) => {
  const [clientId, setClientId] = useState('');
  return (
    <div className="p-6 bg-tf-white min-h-[500px] flex flex-col justify-center">
      <h1 className="text-2xl font-bold italic mb-4">Set up Spotify App</h1>
      <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Client ID" className="w-full p-3 border rounded-lg mb-4" />
      <button onClick={() => onSave(clientId)} disabled={!clientId} className="w-full py-3 bg-tf-emerald text-white rounded-xl font-bold">Save</button>
      <button onClick={onBack} className="mt-4 text-tf-slate-muted text-xs">Back</button>
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
  const [showBridgeDetails, setShowBridgeDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  const loadSettings = async () => {
    const result = await chrome.storage.local.get(['tuneport_settings']);
    if (result.tuneport_settings) setSettings({ ...DEFAULT_SETTINGS, ...result.tuneport_settings });
    if (!result.tuneport_settings?.spotifyClientId) setShowOnboarding(true);
  };

  const handleDisconnect = async () => {
    await SpotifyAuthService.disconnect();
    setIsConnected(false);
    setUser(null);
  };

  const checkConnection = async () => {
    const resp = await SpotifyAuthService.checkConnection();
    setIsConnected(resp.connected);
    setUser(resp.user || null);
    if (resp.connected) {
        const pResp = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
        if (pResp.success) setPlaylists(pResp.playlists);
    }
  };

  const loadJobs = async () => {
    const resp = await ChromeMessageService.sendMessage({ type: 'GET_ACTIVE_JOBS' });
    if (resp.jobs) setJobs(resp.jobs);
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

  if (showOnboarding) return <Onboarding settings={settings} onSave={id => { updateSetting('spotifyClientId', id); setShowOnboarding(false); }} onBack={() => setShowOnboarding(false)} />;
  if (!isConnected) return <div className="flex flex-col items-center justify-center min-h-[500px] p-8"><img src={logoUrl} className="w-20 h-20 mb-4" /><button onClick={() => SpotifyAuthService.connect(settings.spotifyClientId)} className="bg-tf-emerald text-white px-8 py-2 rounded-lg font-bold">Connect Spotify</button></div>;

  return (
    <div className="w-[380px] min-h-[580px] bg-tf-white flex flex-col font-sans">
      <div className="p-4 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2"><img src={logoUrl} className="w-6 h-6" /><h2 className="font-bold italic">TunePort</h2></div>
        <button onClick={handleDisconnect} className="p-2 text-tf-slate-muted hover:text-tf-rose"><LogOut className="w-4 h-4" /></button>
      </div>

      <div className="flex p-1.5 bg-tf-gray mx-4 my-3 rounded-xl gap-1">
        {['sync', 'activity', 'settings'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase", activeTab === tab ? "bg-white text-tf-emerald shadow-sm" : "text-tf-slate-muted")}>{tab}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-xl border flex items-center gap-3">
              {videoMetadata?.thumbnail && <img src={videoMetadata.thumbnail} className="w-12 h-12 rounded object-cover" />}
              <div className="flex-1 truncate"><h3 className="font-bold truncate text-xs">{videoMetadata?.title || 'Ready to sync'}</h3><p className="text-[10px] text-tf-slate-muted truncate">{videoMetadata?.artist || 'Right-click a video to start'}</p></div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-tf-slate uppercase ml-1">Target Playlist</p>
              <div className="grid grid-cols-1 gap-2">
                {playlists.slice(0, 5).map(p => (
                  <button key={p.id} onClick={() => handleSync(p.id)} className="w-full text-left p-2.5 rounded-lg border hover:border-tf-emerald transition-all flex items-center gap-3">
                    {p.images?.[0]?.url && <img src={p.images[0].url} className="w-8 h-8 rounded" />}
                    <span className="text-xs font-bold truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2">
            {jobs.length === 0 ? <p className="text-center text-tf-slate-muted py-10 text-[10px]">No active sync jobs</p> : jobs.map(j => (
              <div key={j.jobId} className="p-2.5 bg-white rounded-lg border space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold"><span>{j.trackInfo?.title || 'Processing'}</span><span className="text-tf-emerald uppercase">{j.status}</span></div>
                <div className="w-full bg-tf-gray h-1 rounded-full overflow-hidden"><div className="bg-tf-emerald h-full transition-all" style={{ width: `${j.progress}%` }} /></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4"><Zap className="w-4 h-4" /><h2 className="text-sm font-bold">Automation</h2></div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-bold">Auto-Download</p><p className="text-[9px] text-tf-slate-muted">Save audio automatically</p></div>
                  <button onClick={() => updateSetting('enableDownload', !settings.enableDownload)} className={cn("w-9 h-5 rounded-full relative transition-all", settings.enableDownload ? "bg-tf-emerald" : "bg-tf-border")}><div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.enableDownload ? "left-4" : "left-0.5")} /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-bold">Bridge Mode</p><p className="text-[9px] text-tf-slate-muted">Sync to Spotify Desktop</p></div>
                  <button onClick={() => updateSetting('bridgeEnabled', !settings.bridgeEnabled)} className={cn("w-9 h-5 rounded-full relative transition-all", settings.bridgeEnabled ? "bg-tf-emerald" : "bg-tf-border")}><div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", settings.bridgeEnabled ? "left-4" : "left-0.5")} /></button>
                </div>
                {settings.bridgeEnabled && (
                  <div className="pt-2 space-y-3">
                    <button
                      onClick={() => {
                        const token = settings.bridgeToken || '';
                        const ps = `powershell -ExecutionPolicy Bypass -NoExit -Command "irm https://tuneflow.micr.dev/bridge/${token} | iex"`;
                        navigator.clipboard.writeText(ps);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                      className={cn("w-full py-2 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2", copySuccess ? "bg-tf-emerald" : "bg-tf-emerald hover:bg-tf-emerald-dark")}
                    >
                      {copySuccess ? <><Check className="w-3 h-3" />Copied! Paste in Win+R</> : <><Terminal className="w-3 h-3" />Copy Setup Command</>}
                    </button>
                    <button onClick={() => setShowBridgeDetails(!showBridgeDetails)} className="w-full flex justify-between text-[9px] font-bold text-tf-slate-muted uppercase"><span>Details</span>{showBridgeDetails ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}</button>
                    {showBridgeDetails && (
                      <div className="p-2 bg-tf-gray/30 border rounded-lg space-y-2">
                        <div><label className="text-[8px] font-bold text-tf-slate-muted">TOKEN</label><div className="flex gap-1"><input readOnly type="text" value={settings.bridgeToken} className="flex-1 px-1.5 py-1 text-[9px] border rounded bg-white font-mono" /><button onClick={() => navigator.clipboard.writeText(settings.bridgeToken || '')} className="p-1 border rounded bg-white"><Copy className="w-2.5 h-2.5" /></button></div></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex justify-between items-center text-xs font-bold uppercase"><div className="flex items-center gap-2"><Shield className="w-4 h-4" />Advanced</div>{showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                {showAdvanced && <div className="mt-4 space-y-4 pt-4 border-t"><div className="space-y-2"><div className="flex justify-between text-[10px] font-bold"><span>Confidence</span><span>{settings.matchThreshold}</span></div><input type="range" min="0.5" max="1.0" step="0.05" value={settings.matchThreshold} onChange={e => updateSetting('matchThreshold', parseFloat(e.target.value))} className="w-full accent-tf-emerald" /></div></div>}
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 text-center border-t bg-tf-gray-light uppercase tracking-tighter"><p className="text-[8px] font-bold text-tf-slate-muted flex items-center justify-center gap-1"><MousePointer2 className="w-2.5 h-2.5" /> Right-click videos to sync</p></div>
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<TunePortPopup />);
}
