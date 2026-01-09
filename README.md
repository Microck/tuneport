<div align="center">
  <img src="tuneflow-extension/assets/icon-128.png" width="100" alt="tuneport logo" />

  a chrome extension that syncs youtube videos to spotify playlists and downloads audio.

  [![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
  [![node](https://img.shields.io/badge/node-18%2B-blue)](package.json)

  <br/>

  <img src="https://placehold.co/800x400/1a1a1a/ffffff?text=tuneport+preview" width="800" alt="tuneport preview" />
</div>

---

## quickstart

1. download the latest release from github.
2. unzip the archive.
3. open `chrome://extensions` and enable **developer mode**.
4. click **load unpacked** and select the unzipped folder.

## features

- **one-click sync**: adds youtube videos to spotify playlists via right-click context menu.
- **dual action**: downloads audio locally while syncing to spotify.
- **smart matching**: uses jaro-winkler similarity to match fuzzy titles.
- **source fallback**: tries lossless sources (lucida) first, falls back to youtube (cobalt).
- **client-side**: no backend server. authentication happens directly with spotify.

## how it works

```mermaid
graph LR
  A[user right-clicks] --> B{extract metadata}
  B --> C[search spotify]
  C -->|match found| D[add to playlist]
  C -->|no match| E[notify user]
  B --> F{download enabled?}
  F -->|yes| G[fetch audio]
  G --> H[save to disk]
```

1. content script extracts video title and channel from the active tab.
2. background service sanitizes the title (removes "official video", "lyrics", etc).
3. searches spotify api with multi-query fallback.
4. adds track to selected playlist if confidence score > 0.5.
5. downloads audio via cobalt or lucida api if enabled in settings.

## usage

### configuration

access settings via the popup gear icon.

```json
{
  "default_playlist": "ask every time",
  "quality": "mp3-320",
  "naming": "artist - title",
  "sources": ["cobalt", "lucida"]
}
```

### commands

- **right-click video**: opens context menu with playlist options.
- **popup click**: allows manual sync of current tab.

## project structure

```
tuneflow-extension/
├── src/
│   ├── background/    # service worker & api logic
│   ├── content/       # youtube dom scraper
│   ├── popup/         # react ui for extension
│   ├── settings/      # options page
│   └── services/      # spotify, cobalt, lucida integrations
├── scripts/           # build & package tools
└── assets/            # icons & static files
```

## license

mit.
