import { applyDownloadFailure, applyDownloadCompletion, applyDownloadInterruption } from '../download-utils';

describe('applyDownloadFailure', () => {
  test('adds error and notice on failed download', () => {
    const job = {
      downloadInfo: { enabled: true, quality: 'Opus ~128k' }
    };

    const result = {
      success: false,
      quality: 'Opus ~128k',
      error: 'Rate limit exceeded'
    };

    const { updatedJob, notice } = applyDownloadFailure(job, result);

    expect(updatedJob.error).toBe('Download failed: Rate limit exceeded');
    expect(notice).toEqual({
      title: 'Download failed',
      message: 'Rate limit exceeded',
      type: 'error'
    });
  });

  test('uses fallback message when error missing', () => {
    const job = { downloadInfo: { enabled: true } };
    const result = { success: false, quality: 'Opus ~128k' };

    const { updatedJob, notice } = applyDownloadFailure(job, result);

    expect(updatedJob.error).toBe('Download failed: Unknown error');
    expect(notice?.message).toBe('Unknown error');
  });

  test('no notice on success', () => {
    const job = { downloadInfo: { enabled: true } };
    const result = { success: true, quality: 'Opus ~128k' };

    const { notice } = applyDownloadFailure(job, result);

    expect(notice).toBeUndefined();
  });
});

describe('applyDownloadCompletion', () => {
  test('marks job completed and clears step', () => {
    const job = {
      status: 'downloading',
      progress: 70,
      currentStep: 'Downloading audio...'
    };

    const { updatedJob } = applyDownloadCompletion(job);

    expect(updatedJob.status).toBe('completed');
    expect(updatedJob.progress).toBe(100);
    expect(updatedJob.currentStep).toBeUndefined();
  });
});

describe('applyDownloadInterruption', () => {
  test('marks job failed with error message', () => {
    const job = {
      status: 'downloading',
      progress: 70,
      currentStep: 'Downloading audio...'
    };

    const { updatedJob, notice } = applyDownloadInterruption(job, 'NETWORK_FAILED');

    expect(updatedJob.status).toBe('failed');
    expect(updatedJob.progress).toBe(100);
    expect(updatedJob.currentStep).toBeUndefined();
    expect(updatedJob.error).toBe('Download failed: NETWORK_FAILED');
    expect(notice).toEqual({
      title: 'Download failed',
      message: 'NETWORK_FAILED',
      type: 'error'
    });
  });

  test('uses fallback message when error missing', () => {
    const job = { status: 'downloading' };

    const { updatedJob, notice } = applyDownloadInterruption(job);

    expect(updatedJob.error).toBe('Download failed: Unknown error');
    expect(notice?.message).toBe('Unknown error');
  });
});
