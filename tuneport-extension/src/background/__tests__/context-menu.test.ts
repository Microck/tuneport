/**
 * @jest-environment jsdom
 */

export {};

const mockStorage: Record<string, any> = {};

const createMock = jest.fn();
const removeAllMock = jest.fn((callback?: () => void) => {
  if (callback) callback();
});

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        const result: Record<string, any> = {};
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach((key) => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      })
    }
  },
  contextMenus: {
    create: createMock,
    removeAll: removeAllMock,
    onClicked: {
      addListener: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    openOptionsPage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  },
  tabs: {
    onUpdated: {
      addListener: jest.fn()
    }
  }
} as any;

global.fetch = jest.fn();

describe('BackgroundService context menus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  test('updatePlaylistMenu creates add and download submenus', async () => {
    const playlists = [
      { id: 'pl-1', name: 'Playlist One' },
      { id: 'pl-2', name: 'Playlist Two' }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: playlists })
    });

    mockStorage.tuneport_settings = {
      enableDownload: true,
      defaultQuality: 'm4a',
      visiblePlaylists: []
    };
    mockStorage.spotify_access_token = 'token';

    const module = await import('../index');
    const service = new module.BackgroundService();

    await (service as any).updatePlaylistMenu();

    const calls = createMock.mock.calls.map((call) => call[0]);

    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'tuneport-add-submenu', parentId: 'tuneport-main' }),
        expect.objectContaining({ id: 'tuneport-download-submenu', parentId: 'tuneport-main' })
      ])
    );

    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'tuneport-playlist-add-pl-1', parentId: 'tuneport-add-submenu' }),
        expect.objectContaining({ id: 'tuneport-playlist-download-pl-1', parentId: 'tuneport-download-submenu' }),
        expect.objectContaining({ id: 'tuneport-playlist-add-pl-2', parentId: 'tuneport-add-submenu' }),
        expect.objectContaining({ id: 'tuneport-playlist-download-pl-2', parentId: 'tuneport-download-submenu' })
      ])
    );
  });

  test('updatePlaylistMenu respects visiblePlaylists filter', async () => {
    const playlists = [
      { id: 'pl-1', name: 'Playlist One' },
      { id: 'pl-2', name: 'Playlist Two' }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: playlists })
    });

    mockStorage.tuneport_settings = {
      enableDownload: true,
      defaultQuality: 'm4a',
      visiblePlaylists: ['pl-2']
    };
    mockStorage.spotify_access_token = 'token';

    const module = await import('../index');
    const service = new module.BackgroundService();

    await (service as any).updatePlaylistMenu();

    const calls = createMock.mock.calls.map((call) => call[0]);

    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'tuneport-playlist-add-pl-2' }),
        expect.objectContaining({ id: 'tuneport-playlist-download-pl-2' })
      ])
    );

    expect(calls).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'tuneport-playlist-add-pl-1' }),
        expect.objectContaining({ id: 'tuneport-playlist-download-pl-1' })
      ])
    );
  });

  test('add submenu respects enableDownload setting', async () => {
    mockStorage.tuneport_settings = {
      enableDownload: false,
      defaultQuality: 'm4a',
      downloadMode: 'missing_only'
    };

    const module = await import('../index');
    const service = new module.BackgroundService();
    const addSpy = jest.spyOn(service as any, 'addTrackToPlaylist').mockResolvedValue({});

    await (service as any).handleContextMenuClick({
      menuItemId: 'tuneport-playlist-add-pl-1',
      pageUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });

    expect(addSpy).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'pl-1',
      false,
      undefined,
      undefined
    );
  });
});
