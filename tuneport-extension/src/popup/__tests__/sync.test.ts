export {};

import { runSyncAndSwitch } from '../sync';

describe('runSyncAndSwitch', () => {
  const data = {
    youtubeUrl: 'https://youtube.com/watch?v=abc123',
    playlistId: 'playlist-1',
    download: true,
    downloadOptions: { format: 'm4a' }
  };

  test('switches to activity before awaiting sendMessage', async () => {
    const setActiveTab = jest.fn();
    const loadJobs = jest.fn();
    const sendMessage = jest.fn().mockResolvedValue({ success: true });

    await runSyncAndSwitch({ data, sendMessage, setActiveTab, loadJobs });

    expect(setActiveTab).toHaveBeenCalledWith('activity');
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(loadJobs).toHaveBeenCalledTimes(1);
  });

  test('switches to activity even when sendMessage fails', async () => {
    const setActiveTab = jest.fn();
    const loadJobs = jest.fn();
    const sendMessage = jest.fn().mockRejectedValue(new Error('send failed'));

    await expect(runSyncAndSwitch({ data, sendMessage, setActiveTab, loadJobs }))
      .rejects.toThrow('send failed');

    expect(setActiveTab).toHaveBeenCalledWith('activity');
    expect(loadJobs).not.toHaveBeenCalled();
  });
});
