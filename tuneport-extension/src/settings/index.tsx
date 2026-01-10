import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ChevronUp
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
  enableDownload: false,
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

  const loadSettings = useCallback(async () => {
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
  }, []);

  const loadPlaylists = useCallback(async () => {
    try {
      const response = await ChromeMessageService.sendMessage({ type: 'GET_SPOTIFY_PLAYLISTS' });
      if (response.success) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
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
  }, [loadPlaylists]);

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

  useEffect(() => {
    loadSettings();
    checkConnection();
  }, [loadSettings, checkConnection]);

  const handleDisconnect = async () => {
    await SpotifyAuthService.disconnect();
    setIsConnected(false);
    setUser(null);
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-tf-white font-sans text-tf-slate selection:bg-tf-emerald/20 selection:text-tf-emerald-dark">
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-white to-transparent pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-3xl mx-auto p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-12"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-tf-emerald/20 blur-xl rounded-full group-hover:bg-tf-emerald/30 transition-colors" />
            <img src={logoUrl} alt="TunePort" className="w-16 h-16 relative z-10 drop-shadow-lg transform transition-transform group-hover:scale-105 duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold serif italic text-tf-slate tracking-tight">Settings</h1>
            <p className="text-tf-slate-muted font-medium mt-1">Customize your TunePort experience</p>
          </div>
        </motion.div>

        <div className="space-y-8">
          <Section 
            icon={User} 
            title="Spotify Account" 
            delay={0.1}
            className="border-tf-emerald/10 shadow-tf-sm hover:shadow-tf-md transition-shadow duration-300"
          >
            {isConnected ? (
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-tf-gray/50 to-white rounded-2xl border border-tf-border/50">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {user?.images?.[0]?.url ? (
                      <img src={user.images[0].url} alt="" className="w-12 h-12 rounded-full ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-tf-emerald/10 flex items-center justify-center ring-2 ring-white">
                        <User className="w-6 h-6 text-tf-emerald" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-tf-emerald border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="font-bold text-tf-slate text-lg">{user?.display_name}</p>
                    <p className="text-xs text-tf-slate-muted font-medium">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 text-tf-rose bg-tf-rose/5 hover:bg-tf-rose/10 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-tf-rose/20"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-center py-8 bg-tf-gray/30 rounded-2xl border border-dashed border-tf-slate-muted/30">
                <p className="text-tf-slate-muted font-medium mb-4">Not connected to Spotify</p>
                <button 
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') })}
                  className="px-6 py-2.5 bg-tf-emerald text-white font-bold rounded-xl hover:bg-tf-emerald-dark transition-colors shadow-lg shadow-tf-emerald/20"
                >
                  Connect Now
                </button>
              </div>
            )}
          </Section>

          <Section icon={Music2} title="Preferences" delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="md:col-span-2"
              />
            </div>
          </Section>

          <Section icon={Download} title="Download & Sync" delay={0.3}>
            <div className="space-y-4 divide-y divide-tf-border/50">
              <ToggleField
                label="Auto-Download"
                description="Automatically download audio file when adding a track to playlist"
                value={settings.enableDownload}
                onChange={(v) => updateSetting('enableDownload', v)}
              />
              <ToggleField
                label="Quality Warnings"
                description="Warn when the requested audio quality is not available"
                value={settings.showQualityWarnings}
                onChange={(v) => updateSetting('showQualityWarnings', v)}
                className="pt-4"
              />
              <ToggleField
                label="'Not Found' Alerts"
                description="Show a warning when a track cannot be found on Spotify"
                value={settings.showNotFoundWarnings}
                onChange={(v) => updateSetting('showNotFoundWarnings', v)}
                className="pt-4"
              />
            </div>
          </Section>

          <Section icon={Shield} title="Advanced" delay={0.4}>
            <div className="space-y-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-4 bg-tf-gray/30 hover:bg-tf-gray/50 rounded-xl transition-colors group"
              >
                <span className="text-sm font-bold text-tf-slate group-hover:text-tf-emerald transition-colors">
                  {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-tf-slate-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-tf-slate-muted" />
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
                    <div className="space-y-6 pt-2 pb-4">
                      <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4">
                        <ToggleField
                          label="Enable Lossless Sources"
                          description="Search Qobuz, Tidal, and Deezer for high-fidelity audio (Experimental)"
                          value={settings.lucidaEnabled}
                          onChange={(v) => updateSetting('lucidaEnabled', v)}
                        />
                        
                        {settings.lucidaEnabled && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-start gap-3 text-xs text-amber-800 bg-amber-100/50 p-3 rounded-xl"
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>This feature requires external services and may have varying availability. Use with caution.</p>
                          </motion.div>
                        )}
                      </div>

                      <TextField
                        label="Cobalt Instance URL"
                        value={settings.cobaltInstance}
                        onChange={(v) => updateSetting('cobaltInstance', v)}
                        placeholder="https://api.cobalt.tools"
                        description="Custom Cobalt API instance for downloads"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>
        </div>

        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-tf-border z-50"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <p className="text-xs text-tf-slate-muted font-medium hidden md:block">
              Changes are saved locally to your browser.
            </p>
            <div className="flex gap-4 ml-auto">
              <button 
                onClick={() => window.close()}
                className="px-6 py-3 text-tf-slate-muted hover:text-tf-slate font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-lg transition-all transform active:scale-95",
                  savedSuccess 
                    ? "bg-tf-emerald text-white shadow-tf-emerald/30" 
                    : "bg-tf-slate text-white hover:bg-tf-slate/90 shadow-tf-slate/20",
                  isSaving && "opacity-70 cursor-wait"
                )}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
        
        <div className="h-24" />
      </div>
    </div>
  );
};

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ icon: Icon, title, children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className={cn(
      "bg-white rounded-3xl border border-tf-border p-6 md:p-8",
      className
    )}
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-tf-gray flex items-center justify-center text-tf-slate group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-tf-slate">{title}</h2>
    </div>
    {children}
  </motion.div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
  className?: string;
}> = ({ label, value, onChange, options, className }) => {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-bold text-tf-slate mb-2.5 ml-1">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3.5 bg-tf-gray/30 border border-tf-border rounded-xl text-sm font-medium focus:outline-none focus:border-tf-emerald focus:ring-4 focus:ring-tf-emerald/5 transition-all appearance-none cursor-pointer hover:bg-tf-gray/50"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tf-slate-muted pointer-events-none" />
      </div>
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
      <p className="text-sm font-bold text-tf-slate">{label}</p>
      {description && <p className="text-xs text-tf-slate-muted mt-1 leading-relaxed">{description}</p>}
    </div>
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={cn(
        "w-12 h-7 rounded-full transition-all relative flex-shrink-0 focus:outline-none focus:ring-4 focus:ring-tf-emerald/10",
        value ? "bg-tf-emerald" : "bg-tf-border"
      )}
    >
      <div className={cn(
        "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300",
        value ? "left-6" : "left-1"
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
}> = ({ label, value, onChange, placeholder, description }) => {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-tf-slate mb-2.5 ml-1">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-tf-gray/30 border border-tf-border rounded-xl text-sm font-medium focus:outline-none focus:border-tf-emerald focus:ring-4 focus:ring-tf-emerald/5 transition-all placeholder:text-tf-slate-muted/50"
      />
      {description && <p className="text-xs text-tf-slate-muted mt-2 ml-1">{description}</p>}
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsPage />);
}
