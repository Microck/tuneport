import { applyDownloadFailure } from '../download-utils';

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
