import React, { useState, useEffect } from 'react';
import { ChromeMessageService } from '../services/ChromeMessageService';
import { SpotifyAuthService } from '../services/SpotifyAuthService';

interface SpotifyUser {
  display_name: string;
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
  error?: string;
}

export const TuneFlowPopup: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');

  useEffect(() => {
    checkConnection();
    loadPlaylists();
    loadJobs();
    getCurrentUrl();
  }, []);

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
      const response = await ChromeMessageService.sendMessage({
        type: 'GET_SPOTIFY_PLAYLISTS'
      });
      
      if (response.success) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'GET_ACTIVE_JOBS'
      });
      
      if (response.jobs) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const getCurrentUrl = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        setCurrentUrl(tab.url);
      }
    } catch (error) {
      console.error('Failed to get current URL:', error);
    }
  };

  const handleConnect = async () => {
    setIsAuthenticating(true);
    try {
      const authUrl = await SpotifyAuthService.getAuthUrl();
      chrome.tabs.create({ url: authUrl });
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await SpotifyAuthService.disconnect();
      setIsConnected(false);
      setUser(null);
      setPlaylists([]);
      setSelectedPlaylist('');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentUrl) {
      alert('Please navigate to a YouTube video first');
      return;
    }

    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'ADD_TRACK_TO_PLAYLIST',
        data: {
          youtubeUrl: currentUrl,
          playlistId
        }
      });

      if (response.success) {
        loadJobs();
        // Close popup to show progress in notifications
        window.close();
      } else {
        alert('Failed to add track: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to add track:', error);
      alert('Failed to add track to playlist');
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'searching':
      case 'adding': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-w-[320px] p-6 bg-gradient-to-br from-green-600 to-green-800 text-white">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">🎵 TuneFlow</h1>
          <p className="text-sm text-green-100">
            Add YouTube videos to Spotify playlists
          </p>
        </div>

        <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <h2 className="font-semibold mb-3">✨ Features</h2>
          <ul className="text-sm space-y-2 text-green-50">
            <li>• Right-click on YouTube videos</li>
            <li>• Find matching tracks on Spotify</li>
            <li>• Add to your playlists instantly</li>
            <li>• No setup required!</li>
          </ul>
        </div>

        <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <h2 className="font-semibold mb-2">📝 How to use</h2>
          <ol className="text-sm space-y-1 text-green-50 list-decimal list-inside">
            <li>Click Connect to Spotify</li>
            <li>Open any YouTube video</li>
            <li>Right-click and select a playlist</li>
            <li>Done!</li>
          </ol>
        </div>

        <button
          onClick={handleConnect}
          disabled={isAuthenticating}
          className="w-full bg-white text-green-700 font-bold py-3 px-4 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAuthenticating ? 'Connecting...' : '🔗 Connect to Spotify'}
        </button>

        <p className="text-xs text-center mt-4 text-green-200">
          Your data stays private • No account needed
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-[400px] max-h-[600px] bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🎵 TuneFlow</h1>
            <p className="text-sm text-green-100">
              {user?.display_name}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Current Video Info */}
      {currentUrl && isYouTubeUrl(currentUrl) ? (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Current Video</p>
              <p className="text-sm font-medium truncate">
                Ready to add to playlist
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b bg-yellow-50">
          <p className="text-sm text-yellow-800">
            ℹ️ Navigate to a YouTube video to add it to a playlist
          </p>
        </div>
      )}

      {/* Playlists */}
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Your Playlists
        </h2>
        
        {playlists.length === 0 ? (
          <p className="text-sm text-gray-500">No playlists found</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={!currentUrl || !isYouTubeUrl(currentUrl)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                {playlist.images?.[0]?.url ? (
                  <img
                    src={playlist.images[0].url}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                    {playlist.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{playlist.name}</p>
                  <p className="text-xs text-gray-500">
                    {playlist.tracks?.total || 0} tracks
                  </p>
                </div>
                <div className="text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <div className="p-4 border-t">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Recent Activity
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.jobId}
                className="p-3 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium truncate flex-1">
                    {job.trackInfo?.title || 'Unknown track'}
                  </p>
                  <span className={`text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                
                {job.progress < 100 && job.status !== 'failed' && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
                
                {job.error && (
                  <p className="text-xs text-red-500 mt-1">{job.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-center text-gray-500">
          💡 Tip: You can also right-click on YouTube videos to add them directly
        </p>
      </div>
    </div>
  );
};
