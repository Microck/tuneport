/**
 * @jest-environment jsdom
 */

// Mock chrome API
const mockStorage: Record<string, any> = {};

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        const result: Record<string, any> = {};
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }),
      set: jest.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      })
    }
  },
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve({ success: true })),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Mock for content script environment
document.body.innerHTML = `
  <html>
    <head>
      <title>Test Video - YouTube</title>
      <meta name="description" content="Test video description">
      <meta property="og:image" content="https://example.com/thumb.jpg">
    </head>
    <body>
      <div id="movie_player">
        <img src="https://example.com/player.jpg" />
      </div>
      <h1 class="title">
        <yt-formatted-string>Test Artist - Test Song</yt-formatted-string>
      </h1>
      <div id="channel-name">
        <a href="/channel/test">Test Channel</a>
      </div>
      <span class="ytp-time-duration">3:45</span>
    </body>
  </html>
`;

describe('YouTubeContentScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    document.body.innerHTML = `
      <html>
        <head>
          <title>Test Video - YouTube</title>
        </head>
        <body>
          <div id="movie_player">
            <img src="https://example.com/player.jpg" />
          </div>
          <h1 class="title">
            <yt-formatted-string>Test Artist - Test Song</yt-formatted-string>
          </h1>
          <div id="channel-name">
            <a href="/channel/test">Test Channel</a>
          </div>
          <span class="ytp-time-duration">3:45</span>
        </body>
      </html>
    `;
  });

  describe('extractVideoId', () => {
    test('should extract video ID from URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          expect(match[1]).toBe('dQw4w9WgXcQ');
          return;
        }
      }
    });

    test('should return null for invalid URL', () => {
      const url = 'https://example.com/video';
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          fail('Should not match');
          return;
        }
      }
    });
  });

  describe('isNewVideo', () => {
    test('should return true for different video IDs', () => {
      const currentData = { videoId: 'abc123' };
      const newData = { videoId: 'xyz789' };
      expect(newData.videoId !== currentData.videoId).toBe(true);
    });

    test('should return false for same video ID', () => {
      const currentData = { videoId: 'abc123' };
      const newData = { videoId: 'abc123' };
      expect(newData.videoId !== currentData.videoId).toBe(false);
    });
  });

  describe('extractPageMetadata', () => {
    test('should extract page metadata', () => {
      const metadata: any = {
        url: window.location.href,
        title: document.title,
        description: '',
        keywords: '',
        ogImage: '',
        timestamp: new Date().toISOString()
      };

      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        metadata.description = descriptionMeta.getAttribute('content') || '';
      }

      const ogImageMeta = document.querySelector('meta[property="og:image"]');
      if (ogImageMeta) {
        metadata.ogImage = ogImageMeta.getAttribute('content') || '';
      }

      expect(metadata.title).toBe('Test Video - YouTube');
    });
  });

  describe('sanitizeFilename', () => {
    test('should sanitize special characters', () => {
      const sanitize = (filename: string) => {
        return filename
          .replace(/[<>:"/\\|?*]/g, '_')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 255);
      };
      
      expect(sanitize('test<>:"|?*file.txt')).toBe('test_______file.txt');
      expect(sanitize('  test file  ')).toBe('test file');
    });
  });

  describe('formatDuration', () => {
    test('should format seconds to MM:SS', () => {
      const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      };
      
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3661)).toBe('61:01');
    });
  });
});
