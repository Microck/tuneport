import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  User,
  Music2,
  Download,
  Shield,
  ChevronLeft,
  LogOut,
  Save,
  AlertTriangle
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

  const logoUrl = useMemo(() => chrome.runtime.getURL('dist/assets/logo.png'), []);

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
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  const goBack = () => {
    window.close();
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-tf-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={goBack}
            className="p-2 hover:bg-tf-gray rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-tf-slate" />
          </button>
          <img src={logoUrl} alt="" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold serif italic text-tf-slate">TunePort Settings</h1>
            <p className="text-xs text-tf-slate-muted font-medium">Configure your preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <Section icon={User} title="Spotify Account">
            {isConnected ? (
              <div className="flex items-center justify-between p-4 bg-tf-gray/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  {user?.images?.[0]?.url && (
                    <img src={user.images[0].url} alt="" className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <p className="font-semibold text-tf-slate">{user?.display_name}</p>
                    <p className="text-xs text-tf-slate-muted">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 text-tf-rose hover:bg-tf-rose/10 rounded-xl transition-colors text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <p className="text-tf-slate-muted text-sm">Not connected to Spotify</p>
            )}
          </Section>

          <Section icon={Music2} title="Default Options">
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

          <Section icon={Download} title="Download Settings">
            <div className="space-y-4">
              <ToggleField
                label="Enable audio download by default"
                description="Download audio file when adding to playlist"
                value={settings.enableDownload}
                onChange={(v) => updateSetting('enableDownload', v)}
              />
              <ToggleField
                label="Show quality warnings"
                description="Warn when lossless source is not available"
                value={settings.showQualityWarnings}
                onChange={(v) => updateSetting('showQualityWarnings', v)}
              />
              <ToggleField
                label="Show 'not found' warnings"
                description="Warn when track is not found on Spotify"
                value={settings.showNotFoundWarnings}
                onChange={(v) => updateSetting('showNotFoundWarnings', v)}
              />
            </div>
          </Section>

          <Section icon={Shield} title="Advanced">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-tf-emerald font-semibold hover:underline"
            >
              {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 pt-4 border-t border-tf-border">
                <ToggleField
                  label="Enable lossless sources"
                  description="Search Qobuz, Tidal, and Deezer for higher quality audio"
                  value={settings.lucidaEnabled}
                  onChange={(v) => updateSetting('lucidaEnabled', v)}
                />

                {settings.lucidaEnabled && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold">Experimental Feature</p>
                        <p>Lossless sources require external services. Quality and availability may vary.</p>
                      </div>
                    </div>
                  </div>
                )}

                <TextField
                  label="Cobalt Instance URL"
                  value={settings.cobaltInstance}
                  onChange={(v) => updateSetting('cobaltInstance', v)}
                  placeholder="https://api.cobalt.tools"
                />
              </div>
            )}
          </Section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-tf-emerald text-white font-bold rounded-2xl hover:bg-tf-emerald-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-tf-border p-6 shadow-tf-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-tf-emerald/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-tf-emerald" />
      </div>
      <h2 className="text-lg font-bold text-tf-slate">{title}</h2>
    </div>
    {children}
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-tf-slate mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-tf-border rounded-xl text-sm focus:outline-none focus:border-tf-emerald transition-colors bg-white"
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const ToggleField: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, value, onChange }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-tf-slate">{label}</p>
      {description && <p className="text-xs text-tf-slate-muted mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-12 h-6 rounded-full transition-all relative flex-shrink-0",
        value ? "bg-tf-emerald" : "bg-tf-border"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
        value ? "left-7" : "left-1"
      )} />
    </button>
  </div>
);

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-tf-slate mb-2">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-tf-border rounded-xl text-sm focus:outline-none focus:border-tf-emerald transition-colors"
    />
  </div>
);

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SettingsPage />);
}
