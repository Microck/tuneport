/**
 * @jest-environment jsdom
 */

// Mock chrome API
const mockStorage: Record<string, any> = {};
const mockTabs: any[] = [];
// eslint-disable-next-line @typescript-eslint/ban-types
const mockListeners: Map<string, Function> = new Map();

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
      }),
      remove: jest.fn((keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      })
    }
  },
  tabs: {
    query: jest.fn((options) => {
      return Promise.resolve(mockTabs.filter(tab => {
        if (options.active && !tab.active) return false;
        if (options.currentWindow && !tab.windowId) return false;
        return true;
      }));
    }),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve({ success: true })),
    openOptionsPage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    onMessage: {
      addListener: jest.fn((callback) => {
        const id = `listener_${Date.now()}`;
        mockListeners.set(id, callback);
        return id;
      })
    }
  },
  notifications: {
    create: jest.fn()
  },
  action: {
    setBadgeText: jest.fn()
  }
};

import { ChromeMessageService } from '../ChromeMessageService';

describe('ChromeMessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    mockTabs.length = 0;
    mockListeners.clear();
  });

  describe('sendMessage', () => {
    test('should send message and return response', async () => {
      const response = await ChromeMessageService.sendMessage({
        type: 'TEST_MESSAGE',
        data: { test: true }
      });
      expect(response).toEqual({ success: true });
    });

    test('should throw error when send fails', async () => {
      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValueOnce(new Error('Send failed'));
      await expect(ChromeMessageService.sendMessage({ type: 'TEST' }))
        .rejects.toThrow('Failed to communicate with background script');
    });
  });

  describe('getCurrentTab', () => {
    test('should return null when no tabs found', async () => {
      mockTabs.length = 0;
      const tab = await ChromeMessageService.getCurrentTab();
      expect(tab).toBeNull();
    });

    test('should return current tab', async () => {
      mockTabs.push({ id: 1, active: true, windowId: 1, url: 'https://youtube.com' });
      const tab = await ChromeMessageService.getCurrentTab();
      expect(tab).not.toBeNull();
      expect(tab?.id).toBe(1);
    });
  });

  describe('getCurrentTabUrl', () => {
    test('should return null when no tab URL', async () => {
      mockTabs.push({ id: 1, active: true });
      const url = await ChromeMessageService.getCurrentTabUrl();
      expect(url).toBeNull();
    });

    test('should return current tab URL', async () => {
      mockTabs.push({ id: 1, active: true, windowId: 1, url: 'https://youtube.com/watch?v=test' });
      const url = await ChromeMessageService.getCurrentTabUrl();
      expect(url).toBe('https://youtube.com/watch?v=test');
    });
  });

  describe('storage utilities', () => {
    test('should get storage values', async () => {
      mockStorage['testKey'] = 'testValue';
      const result = await ChromeMessageService.getStorage('testKey');
      expect(result.testKey).toBe('testValue');
    });

    test('should set storage values', async () => {
      await ChromeMessageService.setStorage({ newKey: 'newValue' });
      expect(mockStorage.newKey).toBe('newValue');
    });

    test('should remove storage values', async () => {
      mockStorage.removeKey = 'value';
      await ChromeMessageService.removeStorage('removeKey');
      expect(mockStorage.removeKey).toBeUndefined();
    });

    test('should clear storage', async () => {
      mockStorage.key1 = 'value1';
      mockStorage.key2 = 'value2';
      await ChromeMessageService.clearStorage();
      expect(Object.keys(mockStorage).length).toBe(0);
    });
  });

  describe('notification utilities', () => {
    test('should create notification', async () => {
      await ChromeMessageService.showNotification({
        type: 'basic',
        title: 'Test',
        message: 'Test message'
      });
      expect(chrome.notifications.create).toHaveBeenCalled();
    });
  });

  describe('badge utilities', () => {
    test('should set badge text', async () => {
      await ChromeMessageService.setBadgeText('5');
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
    });
  });
});
