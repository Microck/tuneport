import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User,
  Music2,
  Download,
  Shield,
  LogOut,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Save,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Settings as SettingsIcon,
  Plus,
  Trash2,
  HelpCircle,
  Search,
  Link
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
  customPresets: QualityPreset[];
  spotifyFallbackMode: 'auto' | 'ask' | 'never';
  enableDebugConsole: boolean;
  matchThreshold: number;
  spotifyClientId: string;
  bridgeEnabled: boolean;
  bridgeToken: string;
  bridgeRelayUrl: string;
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
  customPresets: [],
  spotifyFallbackMode: 'auto',
  enableDebugConsole: false,
  matchThreshold: 0.7,
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

export const SettingsPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const logoUrl = useMemo(() => chrome.runtime.getURL('assets/logo.png'), []);

  useEffect(() => {
    loadSettings();
    checkConnection();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get([
        'tuneport_settings',
        'lucida_enabled'
      ]);
      
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
    setIsSaving(true);
    try {
      await chrome.storage.local.set({
        tuneport_settings: settings,
        lucida_enabled: settings.lucidaEnabled
      });

      await ChromeMessageService.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings
      });
      
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when settings change (debounced)
  useEffect(() => {
    if (JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS)) {
      const timer = setTimeout(saveSettings, 1000);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const checkConnection = async () => {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setIsConnected(response.connected);
      setUser(response.user || null);
      if (response.connected) {
        loadPlaylists();
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
      if (response.success) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const handleDisconnect = async () => {
    await SpotifyAuthService.disconnect();
    setIsConnected(false);
    setUser(null);
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => {
      if (key === 'bridgeEnabled' && value === true && !prev.bridgeToken) {
        return { ...prev, [key]: value, bridgeToken: createBridgeToken() };
      }
      return { ...prev, [key]: value };
    });
  };


  return (
    <div className="min-h-[600px] w-full bg-tf-white font-sans text-tf-slate">
      
      <div className="p-5 flex items-center justify-between bg-white border-b border-tf-border sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="TunePort" className="w-8 h-8 drop-shadow-md" />
          <div>
            <h1 className="text-lg font-bold serif italic text-tf-slate">Settings</h1>
          </div>
        </div>
        {savedSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-bold text-tf-emerald flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Saved
          </motion.div>
        )}
      </div>

      <div className="p-5 space-y-6 pb-20">
        {/* Spotify Account Section */}
        <Section icon={User} title="Spotify Account">
          {isConnected ? (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-tf-gray/50 to-white rounded-xl border border-tf-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user?.images?.[0]?.url ? (
                    <img src={user.images[0].url} alt="" className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-tf-emerald/10 flex items-center justify-center ring-2 ring-white">
                      <User className="w-5 h-5 text-tf-emerald" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tf-emerald border-2 border-white rounded-full" />
                </div>
                <div>
                  <p className="font-bold text-tf-slate text-sm">{user?.display_name}</p>
                  <p className="text-[10px] text-tf-slate-muted font-medium">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="p-2 text-tf-rose hover:bg-tf-rose/5 rounded-lg transition-all"
                title="Disconnect"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6 bg-tf-gray/30 rounded-xl border border-dashed border-tf-slate-muted/30">
              <p className="text-tf-slate-muted font-medium mb-3 text-xs">Not connected</p>
              <button 
                onClick={() => {
                  saveSettings().then(() => {
                    SpotifyAuthService.connect(settings.spotifyClientId || undefined);
                  });
                }}
                className="px-4 py-2 bg-tf-emerald text-white font-bold rounded-lg hover:bg-tf-emerald-dark transition-colors shadow-lg shadow-tf-emerald/20 text-xs"
              >
                Connect Now
              </button>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-tf-border/50">
             <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-tf-slate select-none list-none">
                   <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                   Advanced: Bring Your Own App (Recommended)
                </summary>
                <div className="mt-3 space-y-4 pl-6">
                   <p className="text-[10px] text-tf-slate-muted">
                      Use your own Spotify Developer App to avoid rate limits and quotas.
                   </p>
                   
                   <div>
                      <label className="block text-[10px] font-bold text-tf-slate mb-1">Redirect URI (Copy this to Spotify)</label>
                      <div className="flex gap-2">
                         <input 
                            readOnly 
                            value={chrome.runtime.getURL('popup/auth-callback.html')}
                            className="flex-1 px-3 py-2 text-xs border border-tf-border rounded-lg bg-tf-gray/30 text-tf-slate-muted font-mono"
                         />
                         <button
                            onClick={() => {
                               navigator.clipboard.writeText(chrome.runtime.getURL('popup/auth-callback.html'));
                            }}
                            className="p-2 text-tf-slate hover:bg-tf-gray/50 rounded-lg border border-tf-border"
                            title="Copy to clipboard"
                         >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                         </button>
                      </div>
                   </div>

                   <TextField
                      label="Client ID"
                      value={settings.spotifyClientId}
                      onChange={(v) => updateSetting('spotifyClientId', v)}
                      placeholder="Paste your Client ID here"
                      description="Leave empty to use the default shared ID (may be rate limited)."
                   />
                </div>
             </details>
          </div>
        </Section>

        {/* Default Options Section */}
        <Section icon={Music2} title="Preferences">
          <div className="space-y-4">
            <SelectField
              label="Default Playlist"
              value={settings.defaultPlaylist}
              onChange={(v) => updateSetting('defaultPlaylist', v)}
              options={[
                { id: '', label: 'Ask every time' },
                ...playlists.map(p => ({ id: p.id, label: p.name }))
              ]}
            />
            <SelectField
              label="Default Quality"
              value={settings.defaultQuality}
              onChange={(v) => updateSetting('defaultQuality', v)}
              options={QUALITY_OPTIONS}
              showDescription={true}
            />
            <SelectField
              label="File Naming Format"
              value={settings.fileNamingFormat}
              onChange={(v) => updateSetting('fileNamingFormat', v)}
              options={FILE_NAMING_OPTIONS}
            />
          </div>
        </Section>

        {/* Download Settings Section */}
        <Section icon={Download} title="Download & Sync">
          <div className="space-y-4 divide-y divide-tf-border/50">
            <ToggleField
              label="Auto-Download"
              description="Download audio when adding to playlist"
              value={settings.enableDownload}
              onChange={(v) => updateSetting('enableDownload', v)}
            />
            <ToggleField
              label="Quality Warnings"
              description="Warn if requested quality unavailable"
              value={settings.showQualityWarnings}
              onChange={(v) => updateSetting('showQualityWarnings', v)}
              className="pt-4"
            />
            <ToggleField
              label="'Not Found' Alerts"
              description="Warn if track not found on Spotify"
              value={settings.showNotFoundWarnings}
              onChange={(v) => updateSetting('showNotFoundWarnings', v)}
              className="pt-4"
            />
            <div className="pt-4 space-y-3">
              <SelectField
                label="Download Provider"
                value={settings.downloadProvider}
                onChange={(v) => updateSetting('downloadProvider', v as 'cobalt' | 'yt-dlp')}
                options={[
                  { id: 'yt-dlp', label: 'yt-dlp (Default)' },
                  { id: 'cobalt', label: 'Cobalt' }
                ]}
              />
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
                      className="w-full px-3 py-2 text-xs border border-tf-border rounded-lg bg-white"
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
                        className="w-full px-3 py-2 text-xs border border-tf-border rounded-lg bg-white"
                        placeholder="Bearer token"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-tf-slate mb-1">Cobalt instance URL</label>
                  <input
                    type="text"
                    value={settings.cobaltInstance}
                    onChange={(e) => updateSetting('cobaltInstance', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-tf-border rounded-lg bg-white"
                    placeholder="https://cobalt.micr.dev"
                  />
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section icon={Link} title="Bridge">
          <div className="space-y-4">
            <ToggleField
              label="Enable Bridge"
              description="Allow external apps to control TunePort"
              value={settings.bridgeEnabled}
              onChange={(v) => updateSetting('bridgeEnabled', v)}
            />
            
            {settings.bridgeEnabled && (
              <div className="bg-tf-gray/30 border border-tf-border rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-tf-slate">Bridge Token</label>
                  <span className="text-[9px] font-bold text-tf-emerald bg-tf-emerald/10 px-2 py-0.5 rounded-full border border-tf-emerald/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tf-emerald animate-pulse" />
                    ACTIVE
                  </span>
                </div>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    type="text"
                    value={settings.bridgeToken || ''}
                    className="flex-1 px-3 py-2 text-xs border border-tf-border rounded-lg bg-white text-tf-slate-muted font-mono"
                    placeholder="No token available"
                  />
                  <button
                    onClick={() => {
                      const token = settings.bridgeToken;
                      const script = `localStorage.setItem('tuneport_bridge_token','${token}');location.reload();`;
                      navigator.clipboard.writeText(script);
                      alert('Setup script copied! Paste it into Spotify DevTools Console (Ctrl+Shift+I).');
                    }}
                    className="p-2 text-tf-slate hover:bg-tf-gray/50 rounded-lg border border-tf-border bg-white transition-colors"
                    title="Copy Setup Script"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"></path></svg>
                  </button>
                </div>

                <p className="text-[9px] text-tf-slate-muted mt-2 leading-relaxed">
                  Use this token to authenticate external tools. Keep it secret.
                </p>
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-tf-slate mb-1">Relay URL</label>
                  <input
                    type="text"
                    value={settings.bridgeRelayUrl}
                    onChange={(e) => updateSetting('bridgeRelayUrl', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-tf-border rounded-lg bg-white"
                    placeholder="wss://relay.micr.dev"
                  />
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section icon={HelpCircle} title="Sync with Spotify">
          <SpotifyLocalFilesTutorial />
        </Section>

        {/* Custom Presets Section */}
        <Section icon={Music2} title="Custom Presets">
          <CustomPresetsManager
            presets={settings.customPresets || []}
            onChange={(presets) => updateSetting('customPresets', presets)}
          />
        </Section>

        {/* Spotify Fallback Mode */}
        <Section icon={Search} title="Track Matching">
          <div className="space-y-4">
            <SelectField
              label="Fallback Mode"
              value={settings.spotifyFallbackMode}
              onChange={(v) => updateSetting('spotifyFallbackMode', v as 'auto' | 'ask' | 'never')}
              options={[
                { id: 'auto', label: 'Auto', description: 'Automatically search YouTube Music metadata if Spotify match fails' },
                { id: 'ask', label: 'Ask', description: 'Prompt before using YouTube Music metadata' },
                { id: 'never', label: 'Never', description: 'Never use fallback, fail if no Spotify match' }
              ]}
              showDescription={true}
            />
          </div>
        </Section>

        {/* Advanced Section */}
        <Section icon={Shield} title="Advanced">
          <div className="space-y-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 bg-tf-gray/30 hover:bg-tf-gray/50 rounded-lg transition-colors group"
            >
              <span className="text-xs font-bold text-tf-slate group-hover:text-tf-emerald transition-colors">
                {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-3 h-3 text-tf-slate-muted" />
              ) : (
                <ChevronDown className="w-3 h-3 text-tf-slate-muted" />
              )}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2 pb-2">
                    <div className="bg-tf-gray/30 border border-tf-border rounded-xl p-3 space-y-2">
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
                        Threshold for auto-adding tracks. Higher values prevent false positives. Recommended: 0.7-0.85.
                      </p>
                    </div>
                    <div className="bg-tf-gray/30 border border-tf-border rounded-xl p-3">
                      <ToggleField
                        label="Enable Debug Console"
                        description="Show technical logs in the Activity tab"
                        value={settings.enableDebugConsole}
                        onChange={(v) => updateSetting('enableDebugConsole', v)}
                      />
                    </div>
                    <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3">
                      <ToggleField
                        label="Enable Lossless Sources"
                        description="Search Qobuz/Tidal/Deezer (Experimental)"
                        value={settings.lucidaEnabled}
                        onChange={(v) => updateSetting('lucidaEnabled', v)}
                      />
                    </div>

                    <TextField
                      label="Cobalt Instance URL"
                      value={settings.cobaltInstance}
                      onChange={(v) => updateSetting('cobaltInstance', v)}
                      placeholder="https://api.cobalt.tools"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, children, className }) => (
  <div className={cn(
    "bg-white rounded-2xl border border-tf-border p-5 shadow-sm",
    className
  )}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-tf-gray flex items-center justify-center text-tf-slate">
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-base font-bold text-tf-slate">{title}</h2>
    </div>
    {children}
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string; description?: string }>;
  className?: string;
  showDescription?: boolean;
}> = ({ label, value, onChange, options, className, showDescription = false }) => {
  const selectedOption = options.find(opt => opt.id === value);
  
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-tf-slate mb-2 ml-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald focus:ring-2 focus:ring-tf-emerald/5 transition-all appearance-none cursor-pointer hover:bg-tf-gray/50"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-tf-slate-muted pointer-events-none" />
      </div>
      {showDescription && selectedOption?.description && (
        <p className="text-[10px] text-tf-slate-muted mt-1.5 ml-1">{selectedOption.description}</p>
      )}
    </div>
  );
};

const ToggleField: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}> = ({ label, description, value, onChange, className }) => (
  <div className={cn("flex items-center justify-between gap-4", className)}>
    <div className="flex-1">
      <p className="text-xs font-bold text-tf-slate">{label}</p>
      {description && <p className="text-[10px] text-tf-slate-muted mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-9 h-5 rounded-full transition-all relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-tf-emerald/10",
        value ? "bg-tf-emerald" : "bg-tf-border"
      )}
    >
      <div className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
        value ? "left-4.5" : "left-0.5"
      )} />
    </button>
  </div>
);

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}> = ({ label, value, onChange, placeholder, description }) => (
  <div>
    <label className="block text-xs font-bold text-tf-slate mb-2 ml-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-tf-gray/30 border border-tf-border rounded-lg text-xs font-medium focus:outline-none focus:border-tf-emerald focus:ring-2 focus:ring-tf-emerald/5 transition-all placeholder:text-tf-slate-muted/50"
    />
    {description && <p className="text-[10px] text-tf-slate-muted mt-1 ml-1">{description}</p>}
  </div>
);

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

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsPage />);
}
