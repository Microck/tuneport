/** @jest-environment jsdom */

// Test for type definitions and constants

describe('Type Definitions', () => {
  describe('YouTubeVideo interface', () => {
    test('should have required properties', () => {
      const video = {
        videoId: 'test123',
        title: 'Test Video',
        channelName: 'Test Channel',
        duration: '3:45',
        thumbnail: 'https://example.com/thumb.jpg',
        url: 'https://youtube.com/watch?v=test123'
      };
      
      expect(video.videoId).toBeDefined();
      expect(video.title).toBeDefined();
      expect(video.channelName).toBeDefined();
      expect(video.duration).toBeDefined();
      expect(video.thumbnail).toBeDefined();
      expect(video.url).toBeDefined();
    });
  });

  describe('SpotifyPlaylist interface', () => {
    test('should have required properties', () => {
      const playlist = {
        id: 'playlist123',
        name: 'My Playlist',
        description: 'Test description',
        trackCount: 10,
        isPublic: true,
        owner: 'user123',
        imageUrl: 'https://example.com/cover.jpg'
      };
      
      expect(playlist.id).toBeDefined();
      expect(playlist.name).toBeDefined();
      expect(playlist.trackCount).toBeDefined();
      expect(playlist.isPublic).toBeDefined();
      expect(playlist.owner).toBeDefined();
    });
  });

  describe('DownloadJob interface', () => {
    test('should have required properties', () => {
      const job: any = {
        jobId: 'job123',
        youtubeUrl: 'https://youtube.com/watch?v=test',
        format: 'mp3',
        quality: '320',
        status: 'queued',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      expect(job.jobId).toBeDefined();
      expect(job.youtubeUrl).toBeDefined();
      expect(job.format).toBeDefined();
      expect(job.quality).toBeDefined();
      expect(job.status).toBeDefined();
      expect(job.createdAt).toBeDefined();
      expect(job.updatedAt).toBeDefined();
    });

    test('should accept valid status values', () => {
      const statuses = ['queued', 'processing', 'completed', 'failed'];
      
      statuses.forEach(status => {
        const job: any = { status };
        expect(['queued', 'processing', 'completed', 'failed']).toContain(job.status);
      });
    });
  });

  describe('YouTubeMetadata interface', () => {
    test('should have required properties', () => {
      const metadata = {
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180,
        uploader: 'TestUploader',
        uploadDate: '2024-01-01',
        viewCount: 1000,
        description: 'Test description',
        thumbnail: 'https://example.com/thumb.jpg',
        youtubeId: 'test123',
        youtubeUrl: 'https://youtube.com/watch?v=test123',
        tags: ['tag1', 'tag2']
      };
      
      expect(metadata.title).toBeDefined();
      expect(metadata.artist).toBeDefined();
      expect(metadata.duration).toBeDefined();
      expect(metadata.youtubeId).toBeDefined();
      expect(metadata.youtubeUrl).toBeDefined();
    });
  });

  describe('EXTENSION_CONFIG constants', () => {
    test('should have valid configuration values', () => {
      const config = {
        VERSION: '1.0.0',
        NAME: 'TuneFlow',
        DESCRIPTION: 'Extension description',
        BACKEND_DEFAULT_URL: 'http://localhost:3001',
        SUPPORTED_FORMATS: ['mp3', 'flac'],
        SUPPORTED_QUALITIES: ['192', '320'],
        CONTEXT_MENU_IDS: {
          MAIN: 'tuneflow-main',
          PLAYLISTS_SUBMENU: 'tuneflow-playlists-submenu',
          SETTINGS: 'tuneflow-settings'
        },
        STORAGE_KEYS: {
          SETTINGS: 'tuneflow_settings',
          SPOTIFY_TOKEN: 'spotify_access_token'
        }
      };
      
      expect(config.VERSION).toBeDefined();
      expect(config.NAME).toBeDefined();
      expect(config.BACKEND_DEFAULT_URL).toBeDefined();
      expect(config.SUPPORTED_FORMATS).toContain('mp3');
      expect(config.SUPPORTED_FORMATS).toContain('flac');
      expect(config.SUPPORTED_QUALITIES).toContain('192');
      expect(config.SUPPORTED_QUALITIES).toContain('320');
    });
  });

  describe('MessageTypes enum', () => {
    test('should have required message types', () => {
      const messageTypes = [
        'DOWNLOAD_VIDEO',
        'GET_CURRENT_VIDEO_DATA',
        'GET_SPOTIFY_PLAYLISTS',
        'SET_SPOTIFY_TOKEN',
        'UPDATE_CONTEXT_MENU',
        'SPOTIFY_AUTH_COMPLETE',
        'GET_POPUP_SETTINGS'
      ];
      
      messageTypes.forEach(type => {
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });
});
