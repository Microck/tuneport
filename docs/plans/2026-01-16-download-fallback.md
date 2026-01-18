# download fallback mode implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**goal:** implement "download only if not on spotify" behavior (fallback mode) and auto-switch to activity tab on download start.

**architecture:** add a setting `downloadMode` ('always' | 'missing_only'). update background logic to skip download if spotify match found and mode is 'missing_only'. update popup ui to switch tabs and show clean download button.

**tech stack:** react, typescript, chrome extension api

### Task 1: add download mode setting

**Files:**
- Modify: `tuneport-extension/src/popup/index.tsx`
- Modify: `tuneport-extension/src/background/index.ts`

**Step 1: write failing test**

no strict test for settings schema, but we'll add the property to `SettingsState` interface and `DEFAULT_SETTINGS`.

**Step 2: update settings interface**

add `downloadMode: 'always' | 'missing_only'` to `SettingsState`. default to `always` (preserving current behavior) or `missing_only` as requested. user asked for option 1 (fallback) to be toggleable.

**Step 3: add settings ui**

add a toggle or dropdown in `AdvancedSettings` (or main settings) for "Download Mode".
- "Always Download"
- "Download Missing Only"

**Step 4: commit**

```bash
git add tuneport-extension/src/popup/index.tsx
git commit -m "feat: add download mode setting"
```

### Task 2: implement fallback logic in background

**Files:**
- Modify: `tuneport-extension/src/background/index.ts`

**Step 1: update download logic**

in `processJob`, check `settings.downloadMode`.
- if `spotifyMatchFound` is true AND `downloadMode === 'missing_only'`, skip `DownloadService.downloadAudio`.
- log "Skipping download (exists on Spotify)" notification.

**Step 2: commit**

```bash
git add tuneport-extension/src/background/index.ts
git commit -m "feat: implement download fallback logic"
```

### Task 3: auto-switch to activity tab

**Files:**
- Modify: `tuneport-extension/src/popup/index.tsx`

**Step 1: update sync button handler**

in `handleSync`, after sending message:
- call `setActiveTab('activity')`.
- ensure animation is smooth (framer motion handles layout, but tab switch needs state update).

**Step 2: commit**

```bash
git add tuneport-extension/src/popup/index.tsx
git commit -m "feat: auto-switch to activity tab on sync"
```

### Task 4: verify and release

**Files:**
- Modify: `package.json`, `tuneport-extension/package.json`, `tuneport-extension/src/manifest.json`

**Step 1: bump version**

bump to `4.0.5`.

**Step 2: commit and release**

```bash
git add package.json tuneport-extension/package.json tuneport-extension/src/manifest.json
git commit -m "release: 4.0.5"
git push origin main
gh release create v4.0.5 --title "v4.0.5" --notes "added download fallback mode and auto-tab switch." --latest
```
