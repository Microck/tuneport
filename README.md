<p align="center">
  <a href="https://github.com/Microck/tuneport">
    <img src="https://github.com/user-attachments/assets/9cbf4362-6d00-4347-8bfa-88d779a22faf" alt="logo" width="172">
  </a>
</p>

<p align="center">a browser extension that syncs youtube videos to spotify playlists with zero friction.</p>

<p align="center">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
  <a href="package.json"><img alt="node" src="https://img.shields.io/badge/node-18%2B-blue.svg" /></a>
  <a href="tuneport-extension/src/manifest.json"><img alt="platform" src="https://img.shields.io/badge/platform-chrome-grey.svg" /></a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/05c36f3e-4e48-4ed0-92d9-aab5059dbec6" width="300" alt="tuneport preview" />
</p>

---

## overview

tuneport bridges the gap between youtube's discovery algorithm and spotify's library management. it detects the video you're watching, finds the best match on spotify, and adds it to your chosen playlist with a single click.

unlike other sync tools, tuneport also offers **simultaneous downloads**. it checks lossless sources (qobuz, tidal, deezer) via lucida before falling back to youtube's audio stream, ensuring you always get the highest quality file for your local archive.

## features

-   **instant sync**: right-click any video -> "add to playlist".
-   **smart matching**: uses jaro-winkler fuzzy matching to handle "official video", "lyrics", and "ft." noise.
-   **dual pipeline**: adds to spotify + downloads to disk in parallel.
-   **lossless first**: prioritizes flac from lucida (qobuz/tidal/deezer); falls back to youtube's native opus stream (~128kbps, perceptually equivalent to mp3 320kbps).
-   **duplicate guard**: checks destination playlist before adding to prevent clutter.
-   **privacy**: runs entirely in the browser. no backend server. no data collection.

## quickstart

### manual installation

1.  download the latest `tuneport-github-v*.zip` from [releases](https://github.com/Microck/tuneport/releases).
2.  unzip the archive.
3.  navigate to `chrome://extensions`.
4.  enable **developer mode** (top right toggle).
5.  click **load unpacked** and select the unzipped folder.

### configuration

click the extension icon or access settings via the right-click menu.

-   **default playlist**: set a target to skip the selection menu.
-   **download format**: opus (best quality from youtube), mp3, ogg, or wav. note: youtube serves ~128kbps opus which is perceptually equivalent to mp3 320kbps.
-   **lossless sources**: enable "lucida" in advanced settings for true lossless (flac) from qobuz/tidal/deezer.

## development

### prerequisites

-   node.js 18+
-   npm 8+

### setup

```bash
# clone repository
git clone https://github.com/Microck/tuneport.git
cd tuneport

# install dependencies
npm install

# start dev server (watch mode)
npm run dev
```

load the `tuneport-extension/dist` folder in chrome as an unpacked extension.

### building

```bash
# build for chrome web store (restricted features)
npm run build:webstore

# build for github release (full features)
npm run build:github
```

## architecture

```mermaid
graph TD
    User((User)) -->|Context Menu / Popup| BG[Background Service]
    
    subgraph Core Logic
    BG -->|Fetch oEmbed| YT[YouTube]
    BG -->|Sanitize & Match| Match[Matching Service]
    Match -->|Search Query| SpotAPI[Spotify API]
    SpotAPI -->|Track Found| Add[Add to Playlist]
    end
    
    subgraph Download Pipeline
    BG -->|If Enabled| DL[Download Service]
    DL -->|1. Try Lossless| Lucida[Lucida API]
    Lucida -.->|Fallback| Cobalt[Cobalt API]
    Cobalt -->|Audio Stream| Disk[chrome.downloads]
    end
    
    Add -->|Success| Notify[Notification]
    Disk -->|Complete| Notify
```

## troubleshooting

**"not authenticated with spotify"**
click the tuneport icon in the toolbar and hit "connect spotify". the token refreshes automatically.

**"download failed"**
ensure the cobalt instance URL in settings is reachable. default: `https://cobalt-api.meowing.de`. alternative instances: `https://cobalt-backend.canine.tools`, `https://kityune.imput.net`.

**"track not found"**
the matching algorithm requires a clean title format (e.g., "Artist - Title"). heavy remix/mashup titles may fail confidence checks.

## technical documentation

for details on youtube's audio infrastructure, codec choices, and why opus ~128kbps rivals mp3 320kbps, see [`docs/report.tex`](docs/report.tex).

## license

mit.
