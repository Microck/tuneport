export interface DownloadResultLike {
  success: boolean;
  error?: string;
  quality: string;
}

export interface DownloadJobLike {
  downloadInfo?: {
    enabled: boolean;
    quality?: string;
  };
  error?: string;
}

export interface DownloadFailureNotice {
  title: string;
  message: string;
  type: 'error';
}

export function applyDownloadFailure(
  job: DownloadJobLike,
  result: DownloadResultLike
): { updatedJob: DownloadJobLike; notice?: DownloadFailureNotice } {
  if (result.success) {
    return { updatedJob: job };
  }

  const message = result.error || 'Unknown error';
  const updatedJob = {
    ...job,
    error: `Download failed: ${message}`
  };

  return {
    updatedJob,
    notice: {
      title: 'Download failed',
      message,
      type: 'error'
    }
  };
}
