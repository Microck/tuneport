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
  status?: string;
  progress?: number;
  currentStep?: string;
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

export function applyDownloadCompletion(
  job: DownloadJobLike
): { updatedJob: DownloadJobLike } {
  return {
    updatedJob: {
      ...job,
      status: 'completed',
      progress: 100,
      currentStep: undefined
    }
  };
}

export function applyDownloadInterruption(
  job: DownloadJobLike,
  error?: string
): { updatedJob: DownloadJobLike; notice: DownloadFailureNotice } {
  const message = error || 'Unknown error';

  return {
    updatedJob: {
      ...job,
      status: 'failed',
      progress: 100,
      currentStep: undefined,
      error: `Download failed: ${message}`
    },
    notice: {
      title: 'Download failed',
      message,
      type: 'error'
    }
  };
}
