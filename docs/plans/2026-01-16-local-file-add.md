# local file auto-add and filename fix plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**goal:** fix duplicate artist in filenames, auto-add downloaded local files to spotify playlist, and auto-switch tab on sync.

**architecture:**
1.  update filename generation to strip artist from title if present.
2.  update background logic to construct `spotify:local` uri after download and attempt playlist add.
3.  update popup to switch tabs on sync (already done in previous session, but will verify/refine).

**tech stack:** typescript, chrome extension api, spotify web api

### Task 1: fix filename duplication

**Files:**
- Modify: `tuneport-extension/src/services/DownloadService.ts`
- Test: `tuneport-extension/src/services/__tests__/DownloadService.test.ts`

**Step 1: write failing test**

```typescript
test('strips artist from title in filename generation', () => {
  const title = 'Artist - Song Title';
  const artist = 'Artist';
  const filename = DownloadService['generateFilename'](title, artist, 'mp3');
  expect(filename).toBe('Artist - Song Title.mp3'); // currently might be Artist - Artist - Song Title
});
```

**Step 2: fix generation logic**

in `generateFilename`:
- check if `title` (sanitized) starts with `artist` (sanitized).
- if so, strip it.

**Step 3: commit**

```bash
git add tuneport-extension/src/services/DownloadService.ts
git commit -m "fix: prevent duplicate artist in filenames"
```

### Task 2: implement local file auto-add

**Files:**
- Modify: `tuneport-extension/src/background/index.ts`

**Step 1: implement uri construction**

- add helper `constructLocalUri(artist, title, duration)`.
- format: `spotify:local:{artist}:{album}:{title}:{duration}`.
- album is usually same as title for single downloads, or empty. let's try matching what spotify expects (often exact string match).

**Step 2: update download completion handler**

in `monitorDownloadJob` -> `finalizeSuccess`:
- if `spotifyMatchFound` was false (meaning we rely on local file):
  - construct local uri.
  - call `addToPlaylist(playlistId, localUri)`.
  - handle success/failure (it might fail if spotify hasn't scanned yet).
  - update notification message.

**Step 3: commit**

```bash
git add tuneport-extension/src/background/index.ts
git commit -m "feat: attempt auto-add of local files to playlist"
```

### Task 3: verify/fix tab switch

**Files:**
- Modify: `tuneport-extension/src/popup/index.tsx`

**Step 1: verify**

ensure `setActiveTab('activity')` is called in `handleSync`. (this was added in v4.0.5, just verifying it works as intended with the "Add & Download" button specifically).

**Step 2: commit (if changes needed)**

```bash
git add tuneport-extension/src/popup/index.tsx
git commit -m "fix: ensure activity tab switch on add+download"
```

### Task 4: release v4.0.6

**Files:**
- Modify: package.json, manifests

**Step 1: bump version**

bump to `4.0.6`.

**Step 2: release**

```bash
git push origin main
gh release create v4.0.6 --title "v4.0.6" --notes "filename fixes and local file auto-add attempt"
```
