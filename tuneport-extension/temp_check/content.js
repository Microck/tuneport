(() => {
  // src/content/index.ts
  var YouTubeContentScript = class {
    constructor() {
      this.currentVideoData = null;
      this.observer = null;
      this.initializeContentScript();
    }
    async initializeContentScript() {
      try {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => this.setupYouTubeObserver());
        } else {
          this.setupYouTubeObserver();
        }
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
        });
        console.log("TunePort Content Script initialized");
      } catch (error) {
        console.error("Failed to initialize content script:", error);
      }
    }
    setupYouTubeObserver() {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            this.handlePageChange();
          }
        });
      });
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      this.handlePageChange();
    }
    handlePageChange() {
      const videoData = this.extractVideoData();
      if (videoData && this.isNewVideo(videoData)) {
        this.currentVideoData = videoData;
        this.updateContextMenuData();
        console.log("New video detected:", videoData.title);
      }
    }
    getVideoElement() {
      return document.querySelector("video");
    }
    extractVideoData() {
      try {
        const url = window.location.href;
        const videoId = this.extractVideoId(url);
        if (!videoId)
          return null;
        let title = "";
        const titleElement = document.querySelector("h1.title yt-formatted-string, h1.title") || document.querySelector("h1.ytd-video-primary-info-renderer") || document.querySelector("h1");
        if (titleElement) {
          title = titleElement.textContent?.trim() || "";
        }
        let channelName = "";
        const channelElement = document.querySelector("#channel-name a, .ytd-channel-name a, a.yt-simple-endpoint");
        if (channelElement) {
          channelName = channelElement.textContent?.trim() || "";
        }
        const thumbnailElement = document.querySelector("#movie_player img, .ytp-videowall-still img");
        const thumbnail = thumbnailElement?.src || "";
        let duration = "";
        const durationElement = document.querySelector(".ytp-time-duration");
        if (durationElement) {
          duration = durationElement.textContent || "";
        }
        return {
          videoId,
          title,
          channelName,
          duration,
          thumbnail,
          url: window.location.href
        };
      } catch (error) {
        console.error("Failed to extract video data:", error);
        return null;
      }
    }
    extractVideoId(url) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match)
          return match[1];
      }
      return null;
    }
    isNewVideo(videoData) {
      return !this.currentVideoData || this.currentVideoData.videoId !== videoData.videoId;
    }
    async updateContextMenuData() {
      try {
        await chrome.storage.local.set({
          currentVideoData: this.currentVideoData
        });
        chrome.runtime.sendMessage({
          type: "CURRENT_VIDEO_UPDATED",
          data: this.currentVideoData
        });
      } catch (error) {
        console.error("Failed to update context menu data:", error);
      }
    }
    handleMessage(message, _sender, sendResponse) {
      switch (message.type) {
        case "GET_CURRENT_VIDEO_DATA":
          sendResponse({
            success: true,
            data: this.currentVideoData
          });
          break;
        case "EXTRACT_PAGE_DATA":
          sendResponse({
            success: true,
            data: {
              url: window.location.href,
              title: document.title,
              videoData: this.currentVideoData
            }
          });
          break;
        case "GET_PAGE_METADATA": {
          const metadata = this.extractPageMetadata();
          sendResponse({
            success: true,
            metadata
          });
          break;
        }
        default:
          console.log("Unknown message type:", message.type);
      }
    }
    extractPageMetadata() {
      try {
        const metadata = {
          url: window.location.href,
          title: document.title,
          description: "",
          keywords: "",
          ogImage: "",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) {
          metadata.description = descriptionMeta.getAttribute("content") || "";
        }
        const ogImageMeta = document.querySelector('meta[property="og:image"]');
        if (ogImageMeta) {
          metadata.ogImage = ogImageMeta.getAttribute("content") || "";
        }
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta) {
          metadata.keywords = keywordsMeta.getAttribute("content") || "";
        }
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        if (jsonLdScripts.length > 0) {
          try {
            const jsonLdData = JSON.parse(jsonLdScripts[0].textContent || "{}");
            metadata.structuredData = jsonLdData;
          } catch (e) {
            console.log("Failed to parse JSON-LD data");
          }
        }
        return metadata;
      } catch (error) {
        console.error("Failed to extract page metadata:", error);
        return {};
      }
    }
    getCurrentVideoData() {
      return this.currentVideoData;
    }
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  };
  var tuneportContentScript = new YouTubeContentScript();
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "CONTEXT_MENU_CLICKED") {
      const { menuItemId, youtubeUrl } = message.data;
      const videoData = tuneportContentScript.getCurrentVideoData();
      if (videoData && videoData.url) {
        chrome.runtime.sendMessage({
          type: "DOWNLOAD_VIDEO",
          data: {
            youtubeUrl: videoData.url,
            menuItemId,
            videoData
          }
        });
      }
    }
  });
  window.addEventListener("beforeunload", () => {
    tuneportContentScript.destroy();
  });
})();
