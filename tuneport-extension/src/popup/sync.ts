type SyncData = {
  youtubeUrl: string;
  playlistId: string;
  download: boolean;
  downloadOptions?: {
    format: string;
    segments?: unknown[];
    segmentMode?: string;
  };
};

type RunSyncDeps = {
  data: SyncData;
  sendMessage: (message: { type: string; data: SyncData }) => Promise<{ success?: boolean }>;
  setActiveTab: (tab: 'sync' | 'activity' | 'settings') => void;
  loadJobs: () => void | Promise<void>;
};

export async function runSyncAndSwitch({ data, sendMessage, setActiveTab, loadJobs }: RunSyncDeps) {
  setActiveTab('activity');
  const response = await sendMessage({
    type: 'ADD_TRACK_TO_PLAYLIST',
    data
  });

  if (response.success) {
    await loadJobs();
  }
}
