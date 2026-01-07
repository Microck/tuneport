import React, { useState, useEffect } from 'react';
import { ChromeMessageService } from '../services/ChromeMessageService';
import { SpotifyAuthService } from '../services/SpotifyAuthService';
import { DownloadManager } from '../services/DownloadManager';

interface Settings {
  backendUrl: string;
  defaultFormat: 'mp3' | 'flac';
  defaultQuality: '192' | '320';
  downloadPath: string;
  autoSync: boolean;
  spotifyConnected: boolean;
  playlists: any[];
}

interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  filename?: string;
  error?: string;
}

export const TuneFlowPopup: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    backendUrl: 'http://localhost:3001',
    defaultFormat: 'mp3',
    defaultQuality: '320',
    downloadPath: '',
    autoSync: false,
    spotifyConnected: false,
    playlists: []
  });

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; url: string }>({ online: false, url: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    checkBackendStatus();
    checkSpotifyConnection();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'GET_POPUP_SETTINGS'
      });
      
      if (response.success) {
        setSettings(prev => ({ ...prev, ...response.settings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const checkBackendStatus = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'GET_BACKEND_STATUS'
      });
      
      setBackendStatus({
        online: response.backendOnline,
        url: response.backendUrl
      });
    } catch (error) {
      console.error('Failed to check backend status:', error);
      setBackendStatus({ online: false, url: settings.backendUrl });
    }
  };

  const checkSpotifyConnection = async () => {
    try {
      const response = await SpotifyAuthService.checkConnection();
      setSettings(prev => ({ ...prev, spotifyConnected: response.connected }));
      
      if (response.connected) {
        loadPlaylists();
      }
    } catch (error) {
      console.error('Failed to check Spotify connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'GET_SPOTIFY_PLAYLISTS'
      });
      
      if (response.success) {
        setSettings(prev => ({ ...prev, playlists: response.playlists }));
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const handleConnectSpotify = async () => {
    try {
      const authUrl = await SpotifyAuthService.getAuthUrl();
      window.open(authUrl, '_blank', 'width=500,height=600');
      
      // Listen for auth completion
      const listener = (message: any) => {
        if (message.type === 'SPOTIFY_AUTH_COMPLETE') {
          ChromeMessageService.removeListener(listener);
          checkSpotifyConnection();
        }
      };
      
      ChromeMessageService.addListener(listener);
    } catch (error) {
      console.error('Failed to initiate Spotify auth:', error);
    }
  };

  const handleDisconnectSpotify = async () => {
    try {
      await SpotifyAuthService.disconnect();
      setSettings(prev => ({ 
        ...prev, 
        spotifyConnected: false, 
        playlists: [] 
      }));
    } catch (error) {
      console.error('Failed to disconnect Spotify:', error);
    }
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Save to chrome storage
    ChromeMessageService.sendMessage({
      type: 'UPDATE_SETTING',
      key: key,
      value: value
    });
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    await checkBackendStatus();
    setIsLoading(false);
  };

  const handleDownloadTest = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'DOWNLOAD_VIDEO',
        data: {
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Test video
          format: settings.defaultFormat,
          quality: settings.defaultQuality
        }
      });
      
      if (response.success) {
        setJobStatus({
          jobId: response.jobId,
          status: 'queued'
        });
      }
    } catch (error) {
      console.error('Test download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading TuneFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <img src="/assets/icon-48.png" alt="TuneFlow" className="logo" />
        <h1>TuneFlow</h1>
        <div className={`status-indicator ${backendStatus.online ? 'online' : 'offline'}`}>
          <div className="status-dot"></div>
          <span>{backendStatus.online ? 'Backend Online' : 'Backend Offline'}</span>
        </div>
      </header>

      <main className="popup-content">
        {/* Backend Status Section */}
        <section className="settings-section">
          <h2>Backend Connection</h2>
          <div className="setting-item">
            <label>Backend URL:</label>
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => handleSettingChange('backendUrl', e.target.value)}
              placeholder="http://localhost:3001"
            />
            <button 
              onClick={handleTestConnection}
              disabled={isLoading}
              className="test-btn"
            >
              Test
            </button>
          </div>
        </section>

        {/* Spotify Integration Section */}
        <section className="settings-section">
          <h2>Spotify Integration</h2>
          <div className="spotify-status">
            <div className={`connection-status ${settings.spotifyConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-icon">
                {settings.spotifyConnected ? '✓' : '✗'}
              </span>
              <span>
                {settings.spotifyConnected 
                  ? `Connected (${settings.playlists.length} playlists)` 
                  : 'Not Connected'
                }
              </span>
            </div>
            
            {settings.spotifyConnected ? (
              <button 
                onClick={handleDisconnectSpotify}
                className="disconnect-btn"
              >
                Disconnect
              </button>
            ) : (
              <button 
                onClick={handleConnectSpotify}
                className="connect-btn"
              >
                Connect to Spotify
              </button>
            )}
          </div>
        </section>

        {/* Download Settings Section */}
        <section className="settings-section">
          <h2>Default Download Settings</h2>
          
          <div className="setting-item">
            <label>Audio Format:</label>
            <select
              value={settings.defaultFormat}
              onChange={(e) => handleSettingChange('defaultFormat', e.target.value)}
            >
              <option value="mp3">MP3 (320kbps)</option>
              <option value="flac">FLAC (Lossless)</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Quality:</label>
            <select
              value={settings.defaultQuality}
              onChange={(e) => handleSettingChange('defaultQuality', e.target.value)}
            >
              <option value="192">192 kbps</option>
              <option value="320">320 kbps</option>
            </select>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
              />
              Auto-sync to Spotify after download
            </label>
          </div>
        </section>

        {/* Test Section */}
        <section className="settings-section">
          <h2>Test</h2>
          <button 
            onClick={handleDownloadTest}
            disabled={!backendStatus.online}
            className="test-download-btn"
          >
            Download Test Video
          </button>
          
          {jobStatus && (
            <div className="job-status">
              <div className={`status-badge ${jobStatus.status}`}>
                {jobStatus.status.toUpperCase()}
              </div>
              {jobStatus.filename && (
                <p className="filename">{jobStatus.filename}</p>
              )}
              {jobStatus.error && (
                <p className="error">{jobStatus.error}</p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="popup-footer">
        <p>TuneFlow v1.0.0 - High-Fidelity YouTube to Spotify Bridge</p>
      </footer>
    </div>
  );
};

export default TuneFlowPopup;