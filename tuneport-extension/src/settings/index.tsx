import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User,
  Music2,
  Download,
  Shield,
  LogOut,
  Save,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SpotifyAuthService } from '../services/SpotifyAuthService';
import { ChromeMessageService } from '../services/ChromeMessageService';

interface SpotifyUser {
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
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
  { id: 'best', label: 'Best Quality (Auto)' },
  { id: 'mp3-320', label: 'MP3 320kbps' },
  { id: 'mp3-256', label: 'MP3 256kbps' },
  { id: 'mp3-128', label: 'MP3 128kbps' }
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
    setSettings(prev => ({ ...prev, [key]: value }));
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
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') })}
                className="px-4 py-2 bg-tf-emerald text-white font-bold rounded-lg hover:bg-tf-emerald-dark transition-colors shadow-lg shadow-tf-emerald/20 text-xs"
              >
                Connect Now
              </button>
            </div>
          )}
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
  options: Array<{ id: string; label: string }>;
  className?: string;
}> = ({ label, value, onChange, options, className }) => (
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
  </div>
);

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

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsPage />);
}
