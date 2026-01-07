import { chrome } from 'webextension-polyfill';

interface ChromeMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

interface MessageResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export class ChromeMessageService {
  private static listeners: Map<string, (message: ChromeMessage) => void> = new Map();

  static async sendMessage(message: ChromeMessage): Promise<MessageResponse> {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      console.error('Chrome message send failed:', error);
      throw new Error('Failed to communicate with background script');
    }
  }

  static async sendMessageToTab(tabId: number, message: ChromeMessage): Promise<MessageResponse> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      console.error('Chrome tab message send failed:', error);
      throw new Error('Failed to communicate with content script');
    }
  }

  static addListener(callback: (message: ChromeMessage) => void): string {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(listenerId, callback);
    return listenerId;
  }

  static removeListener(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab || null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
      return null;
    }
  }

  static async getCurrentTabUrl(): Promise<string | null> {
    const tab = await this.getCurrentTab();
    return tab?.url || null;
  }

  static async injectScript(scriptPath: string): Promise<void> {
    try {
      const tab = await this.getCurrentTab();
      if (tab?.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [scriptPath]
        });
      }
    } catch (error) {
      console.error('Script injection failed:', error);
      throw new Error('Failed to inject script into page');
    }
  }

  static async setBadgeText(text: string): Promise<void> {
    try {
      await chrome.action.setBadgeText({ text });
    } catch (error) {
      console.error('Failed to set badge text:', error);
    }
  }

  static async showNotification(options: chrome.notifications.CreateNotificationOptions): Promise<void> {
    try {
      await chrome.notifications.create(options);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  static async openOptionsPage(): Promise<void> {
    try {
      await chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Failed to open options page:', error);
    }
  }

  // Storage utilities
  static async getStorage(keys: string | string[] | null): Promise<Record<string, any>> {
    try {
      return await chrome.storage.local.get(keys);
    } catch (error) {
      console.error('Storage get failed:', error);
      return {};
    }
  }

  static async setStorage(items: Record<string, any>): Promise<void> {
    try {
      await chrome.storage.local.set(items);
    } catch (error) {
      console.error('Storage set failed:', error);
      throw new Error('Failed to save to storage');
    }
  }

  static async removeStorage(keys: string | string[]): Promise<void> {
    try {
      await chrome.storage.local.remove(keys);
    } catch (error) {
      console.error('Storage remove failed:', error);
    }
  }

  static async clearStorage(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Storage clear failed:', error);
    }
  }
}

// Message type definitions
export enum MessageTypes {
  DOWNLOAD_VIDEO = 'DOWNLOAD_VIDEO',
  GET_CURRENT_VIDEO_DATA = 'GET_CURRENT_VIDEO_DATA',
  GET_SPOTIFY_PLAYLISTS = 'GET_SPOTIFY_PLAYLISTS',
  SET_SPOTIFY_TOKEN = 'SET_SPOTIFY_TOKEN',
  GET_BACKEND_STATUS = 'GET_BACKEND_STATUS',
  UPDATE_CONTEXT_MENU = 'UPDATE_CONTEXT_MENU',
  CURRENT_VIDEO_UPDATED = 'CURRENT_VIDEO_UPDATED',
  SPOTIFY_AUTH_COMPLETE = 'SPOTIFY_AUTH_COMPLETE',
  GET_POPUP_SETTINGS = 'GET_POPUP_SETTINGS',
  UPDATE_SETTING = 'UPDATE_SETTING',
  EXTRACT_PAGE_DATA = 'EXTRACT_PAGE_DATA',
  GET_PAGE_METADATA = 'GET_PAGE_METADATA'
}