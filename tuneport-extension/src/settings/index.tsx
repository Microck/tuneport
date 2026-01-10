import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User,
  Music,
  Settings as SettingsIcon,
  Info,
  LogOut,
  Save,
  Check,
  AlertTriangle,
  FolderOpen,
  Wifi,
  Zap,
  Volume2,
  FileAudio,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SpotifyAuthService } from '../services/SpotifyAuthService';
import { ChromeMessageService } from '../services/ChromeMessageService';

interface SpotifyUser {
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
  product?: string;
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
  lucidaEnabled: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  defaultPlaylist: '',
  defaultQuality: 'best',
  fileNamingFormat: 'artist-title',
  enableDownload: true,
  enableLosslessSources: false,
  showQualityWarnings: true,
  showNotFoundWarnings: true,
  cobaltInstance: 'https://api.cobalt.tools',
  lucidaEnabled: false
};

const QUALITY_OPTIONS = [
  { id: 'best', label: 'Best Available (Auto)', desc: 'Highest quality found (up to FLAC)' },
  { id: 'mp3-320', label: 'MP3 320kbps', desc: 'High quality, compatible' },
  { id: 'mp3-256', label: 'MP3 256kbps', desc: 'Balanced' },
  { id: 'mp3-128', label: 'MP3 128kbps', desc: 'Low size' }
];

const FILE_NAMING_OPTIONS = [
  { id: 'artist-title', label: 'Artist - Title', example: 'The Weeknd - Blinding Lights.mp3' },
  { id: 'title-artist', label: 'Title - Artist', example: 'Blinding Lights - The Weeknd.mp3' },
  { id: 'title', label: 'Title only', example: 'Blinding Lights.mp3' }
];

const SidebarItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
      isActive 
        ? "bg-slate-800 text-white shadow-sm border border-slate-700/50" 
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
    )}
  >
    <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500")} />
    {label}
    {isActive && (
      <motion.div 
        layoutId="active-pill"
        className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" 
      />
    )}
  </button>
);

const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
    <p className="text-slate-400 text-sm mt-1">{description}</p>
  </div>
);

const SettingCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("bg-slate-900 border border-slate-800 rounded-xl p-5", className)}>
    {children}
  </div>
);

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'conversion' | 'spotify' | 'about'>('general');
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  const loadSettings = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(['tuneport_settings', 'lucida_enabled']);
      if (result.tuneport_settings) setSettings({ ...DEFAULT_SETTINGS, ...result.tuneport_settings });
      if (result.lucida_enabled !== undefined) setSettings(prev => ({ ...prev, lucidaEnabled: result.lucida_enabled }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setIsConnected(response.connected);
      setUser(response.user || null);
      if (response.connected) {
        const plResponse = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
        if (plResponse.success) setPlaylists(plResponse.playlists);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    checkConnection();
  }, [loadSettings, checkConnection]);

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      await chrome.storage.local.set({
        tuneport_settings: settings,
        lucida_enabled: settings.lucidaEnabled
      });
      await ChromeMessageService.sendMessage({ type: 'SETTINGS_UPDATED', settings });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('idle');
    }
  };

  useEffect(() => {
    if (JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS)) {
      const timer = setTimeout(saveSettings, 1000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 flex">
      
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="p-6 flex items-center gap-3">
          <img src={logoUrl} alt="TunePort" className="w-8 h-8 rounded-lg shadow-lg shadow-emerald-900/20" />
          <div>
            <h1 className="font-bold text-white tracking-tight">TunePort</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Converter Pro</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarItem icon={SettingsIcon} label="General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <SidebarItem icon={Music} label="Conversion" isActive={activeTab === 'conversion'} onClick={() => setActiveTab('conversion')} />
          <SidebarItem icon={User} label="Spotify Account" isActive={activeTab === 'spotify'} onClick={() => setActiveTab('spotify')} />
          <SidebarItem icon={Info} label="About" isActive={activeTab === 'about'} onClick={() => setActiveTab('about')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3 border border-slate-800">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-rose-500")} />
            <p className="text-xs font-medium text-slate-400">
              {isConnected ? "System Online" : "System Offline"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 ml-64 p-10 max-w-4xl">
        <AnimatePresence mode="wait">
          
          {activeTab === 'general' && (
            <motion.div 
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SectionHeader title="General Settings" description="Configure global application behavior." />
              
              <div className="space-y-6">
                <SettingCard>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-400" />
                        Default Playlist
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">Target destination for converted tracks.</p>
                    </div>
                    <select 
                      value={settings.defaultPlaylist}
                      onChange={(e) => updateSetting('defaultPlaylist', e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 w-48 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    >
                      <option value="">Always Ask</option>
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </SettingCard>

                <SettingCard>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Notifications
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">Manage system alerts and warnings.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
                      <span className="text-sm text-slate-300">Warn on Low Quality</span>
                      <input 
                        type="checkbox" 
                        checked={settings.showQualityWarnings}
                        onChange={(e) => updateSetting('showQualityWarnings', e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 rounded border-slate-600 bg-slate-700"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
                      <span className="text-sm text-slate-300">Warn if Not Found</span>
                      <input 
                        type="checkbox" 
                        checked={settings.showNotFoundWarnings}
                        onChange={(e) => updateSetting('showNotFoundWarnings', e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 rounded border-slate-600 bg-slate-700"
                      />
                    </label>
                  </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'conversion' && (
            <motion.div
              key="conversion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SectionHeader title="Conversion Engine" description="Manage audio processing, bitrate, and formats." />

              <div className="space-y-6">
                <SettingCard>
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-emerald-400" />
                    Audio Output
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Target Quality</label>
                      <div className="space-y-2">
                        {QUALITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => updateSetting('defaultQuality', opt.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden",
                              settings.defaultQuality === opt.id 
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-100" 
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            <div className="font-medium text-sm">{opt.label}</div>
                            <div className="text-xs opacity-70">{opt.desc}</div>
                            {settings.defaultQuality === opt.id && (
                              <Check className="absolute top-3 right-3 w-4 h-4 text-emerald-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Naming Pattern</label>
                      <div className="space-y-2">
                        {FILE_NAMING_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => updateSetting('fileNamingFormat', opt.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all",
                              settings.fileNamingFormat === opt.id 
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-100" 
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            <div className="font-medium text-sm">{opt.label}</div>
                            <div className="text-xs opacity-70 font-mono mt-1">{opt.example}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SettingCard>

                <SettingCard className="border-amber-900/30 bg-gradient-to-br from-slate-900 to-amber-950/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Lossless Engine (Beta)
                    </h3>
                    <div className="px-2 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase rounded border border-amber-500/30">
                      Experimental
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.lucidaEnabled}
                        onChange={(e) => updateSetting('lucidaEnabled', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                    <div className="text-sm text-slate-400">
                      Enable high-fidelity sources (Tidal/Qobuz/Deezer). <br/>
                      <span className="text-xs text-amber-500/80">May increase conversion time significantly.</span>
                    </div>
                  </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'spotify' && (
            <motion.div
              key="spotify"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SectionHeader title="Spotify Integration" description="Manage your connected account and local files." />

              <div className="space-y-6">
                <SettingCard>
                  <h3 className="font-semibold text-white mb-4">Account Status</h3>
                  {isConnected ? (
                    <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg">
                      <div className="flex items-center gap-4">
                        {user?.images?.[0]?.url ? (
                          <img src={user.images[0].url} alt="" className="w-12 h-12 rounded-full border-2 border-emerald-500/30" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-emerald-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-white font-bold text-lg">{user?.display_name}</div>
                          <div className="text-emerald-400/80 text-sm font-medium flex items-center gap-1">
                            <Wifi className="w-3 h-3" /> Connected • {user?.product === 'premium' ? 'Premium' : 'Free'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          await SpotifyAuthService.disconnect();
                          setIsConnected(false);
                          setUser(null);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-900/20 hover:text-rose-400 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-rose-800"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/50">
                      <p className="text-slate-400 mb-4">No account connected.</p>
                      <button 
                        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') })}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                      >
                        Connect Spotify
                      </button>
                    </div>
                  )}
                </SettingCard>

                <SettingCard className="bg-slate-900/80">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-emerald-400" />
                    Local Files Setup
                  </h3>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-400 space-y-3">
                    <p>To play converted tracks in Spotify, you must enable Local Files:</p>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                      <li>Open Spotify Settings.</li>
                      <li>Toggle <strong>"Show Local Files"</strong> to ON.</li>
                      <li>Add your browser's <strong>Downloads</strong> folder to the source list.</li>
                    </ol>
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
                      <Info className="w-3 h-3" />
                      Tracks converted by TunePort will appear in "Local Files" automatically.
                    </div>
                  </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SectionHeader title="About TunePort" description="Version information and credits." />
              <div className="space-y-6">
                <SettingCard>
                  <div className="flex flex-col items-center py-8">
                    <img src={logoUrl} alt="TunePort" className="w-20 h-20 mb-4 drop-shadow-2xl" />
                    <h2 className="text-2xl font-bold text-white">TunePort</h2>
                    <p className="text-slate-500 mt-1 mb-6">v2.0.1 • Professional Edition</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <a href="https://github.com/Microck/tuneport" target="_blank" rel="noopener noreferrer" 
                         className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <ExternalLink className="w-4 h-4" /> GitHub
                      </a>
                      <a href="https://cobalt.tools" target="_blank" rel="noopener noreferrer" 
                         className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                        <Zap className="w-4 h-4" /> Cobalt
                      </a>
                    </div>
                  </div>
                </SettingCard>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ y: 50 }}
        animate={{ y: saveStatus === 'idle' ? 50 : 0 }}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium z-50"
      >
        {saveStatus === 'saving' ? (
          <>Saving changes...</>
        ) : (
          <><Check className="w-4 h-4" /> Settings Saved</>
        )}
      </motion.div>

    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsPage />);
}
