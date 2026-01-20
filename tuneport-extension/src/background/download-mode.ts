export type DownloadMode = 'always' | 'missing_only';

export function resolveDownloadMode(
  setting: DownloadMode,
  override?: DownloadMode
): DownloadMode {
  return override ?? setting;
}
