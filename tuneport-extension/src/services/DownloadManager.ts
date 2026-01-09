import { ChromeMessageService } from './ChromeMessageService';
import type { DownloadJob, YouTubeMetadata } from '../types';

export class DownloadManager {
  private static activeJobs: Map<string, DownloadJob> = new Map();
  private static progressCallbacks: Map<string, (progress: number) => void> = new Map();

  /**
   * Start a new download job
   */
  static async startDownload(
    youtubeUrl: string,
    options: {
      format?: 'mp3' | 'flac';
      quality?: '192' | '320';
      playlistId?: string;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<DownloadJob> {
    try {
      const {
        format = 'mp3',
        quality = '320',
        playlistId,
        onProgress
      } = options;

      // Send download request to background script
      const response = await ChromeMessageService.sendMessage({
        type: 'DOWNLOAD_VIDEO',
        data: {
          youtubeUrl,
          format,
          quality,
          playlistId
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start download');
      }

      const job: DownloadJob = {
        jobId: response.jobId,
        youtubeUrl,
        format,
        quality,
        playlistId,
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store job
      this.activeJobs.set(job.jobId, job);

      // Setup progress callback
      if (onProgress) {
        this.progressCallbacks.set(job.jobId, onProgress);
        this.startProgressPolling(job.jobId);
      }

      console.log('Download job started:', job);
      return job;

    } catch (error) {
      console.error('Failed to start download:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId: string): Promise<DownloadJob | null> {
    try {
      // Check local cache first
      const localJob = this.activeJobs.get(jobId);
      
      if (localJob && (localJob.status === 'completed' || localJob.status === 'failed')) {
        return localJob;
      }

      // Query backend for status
      const response = await ChromeMessageService.sendMessage({
        type: 'GET_JOB_STATUS',
        jobId
      });

      if (response.success) {
        const job = response.job;
        this.activeJobs.set(jobId, job);
        return job;
      }

      return localJob || null;
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  }

  /**
   * Get all active jobs
   */
  static getActiveJobs(): DownloadJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await ChromeMessageService.sendMessage({
        type: 'CANCEL_JOB',
        jobId
      });

      if (response.success) {
        this.activeJobs.delete(jobId);
        this.progressCallbacks.delete(jobId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  /**
   * Clear completed/failed jobs
   */
  static clearCompletedJobs(): void {
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.activeJobs.delete(jobId);
        this.progressCallbacks.delete(jobId);
      }
    }
  }

  /**
   * Start progress polling for a job
   */
  private static startProgressPolling(jobId: string): void {
    const poll = async () => {
      try {
        const job = await this.getJobStatus(jobId);
        
        if (!job) {
          return;
        }

        // Update progress if callback is set
        const progressCallback = this.progressCallbacks.get(jobId);
        if (progressCallback && job.progress !== undefined) {
          progressCallback(job.progress);
        }

        // Continue polling if job is still active
        if (job.status === 'queued' || job.status === 'processing') {
          setTimeout(poll, 1000);
        } else {
          // Job completed, remove callback
          this.progressCallbacks.delete(jobId);
        }

      } catch (error) {
        console.error('Progress polling error:', error);
        
        // Stop polling on error
        this.progressCallbacks.delete(jobId);
      }
    };

    // Start polling
    setTimeout(poll, 1000);
  }

  /**
   * Download file from backend
   */
  static async downloadFile(jobId: string, filename: string): Promise<void> {
    try {
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/download/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Trigger download using Chrome downloads API
      await ChromeMessageService.sendMessage({
        type: 'TRIGGER_DOWNLOAD',
        url: url,
        filename: filename
      });

      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);

    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
  }

  /**
   * Get backend URL from settings
   */
  private static async getBackendUrl(): Promise<string> {
    const stored = await ChromeMessageService.getStorage(['backendUrl']);
    return stored.backendUrl || 'http://localhost:3001';
  }

  /**
   * Extract YouTube metadata from URL
   */
  static extractYouTubeMetadata(youtubeUrl: string): Partial<YouTubeMetadata> {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = youtubeUrl.match(pattern);
      if (match) {
        return {
          youtubeId: match[1],
          youtubeUrl: youtubeUrl
        };

      }
    }

    throw new Error('Invalid YouTube URL');
  }

  /**
   * Validate YouTube URL
   */
  static isValidYouTubeUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/youtube\.com\/v\/[a-zA-Z0-9_-]{11}/
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  /**
   * Get video thumbnail URL
   */
  static getVideoThumbnail(videoId: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'maxresdefault'): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }

  /**
   * Format duration from seconds to MM:SS
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Estimate file size based on format and duration
   */
  static estimateFileSize(durationSeconds: number, format: 'mp3' | 'flac', quality: '192' | '320'): number {
    const minutes = durationSeconds / 60;
    
    if (format === 'mp3') {
      const bitrate = quality === '320' ? 320 : 192; // kbps
      return Math.round((bitrate * 1000 * minutes) / 8); // bytes
    } else if (format === 'flac') {
      // FLAC typically needs about 500-600 kbps for good quality
      return Math.round(600 * 1000 * minutes / 8); // bytes
    }
    
    return 0;
  }

  /**
   * Clean filename for safe saving
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Generate unique filename to avoid conflicts
   */
  static generateUniqueFilename(title: string, format: string): string {
    const sanitized = this.sanitizeFilename(title);
    const timestamp = Date.now();
    return `${sanitized}_${timestamp}.${format}`;
  }
}