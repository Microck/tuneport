<p align="center">
  <a href="https://github.com/Microck/tuneport">
    <img src="https://github.com/user-attachments/assets/9cbf4362-6d00-4347-8bfa-88d779a22faf" alt="logo" width="100">
  </a>
</p>

<p align="center">a browser extension that syncs YouTube videos to Spotify playlists with zero friction.</p>

<p align="center">
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green.svg" /></a>
  <a href="package.json"><img alt="node" src="https://img.shields.io/badge/node-18%2B-blue.svg" /></a>
  <a href="tuneport-extension/src/manifest.json"><img alt="platform" src="https://img.shields.io/badge/platform-browser-orange.svg" /></a>
</p>

<p align="center">
  <img src="./assets/tuneport.gif" width="800" alt="tuneport preview" />
</p>

---

## overview

tuneport bridges the gap between YouTube's discovery algorithm and Spotify's library management. it detects the video you're watching, finds the best match on Spotify, and adds it to your chosen playlist with a single click.

unlike other sync tools, tuneport also offers **simultaneous downloads**. it checks lossless sources (Qobuz, Tidal, Deezer) via Lucida before falling back to YouTube's audio stream, ensuring you always get the highest quality file for your local archive.

---

## installation & setup

1.  **install extension**: download the latest `tuneport-github-v*.zip` from [releases](https://github.com/Microck/tuneport/releases). unzip, go to `chrome://extensions`, enable **developer mode**, and **load unpacked**.
2.  **create Spotify app**: go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new application.
3.  **add redirect uri**: find your redirect uri in the extension setup screen (e.g. `https://<id>.chromiumapp.org/`). add this to your Spotify app settings and save.
4.  **client id**: copy the `client id` from the dashboard and paste it into the extension.

---

## features

-   **instant sync**: right-click any video -> "add to playlist".
-   **smart matching**: uses Jaro-Winkler fuzzy matching to handle "official video", "lyrics", and "ft." noise.
-   **YouTube Music fallback**: when Spotify match fails, tries YouTube Music metadata for better results (auto/ask/never modes).
-   **dual pipeline**: adds to Spotify + downloads to disk in parallel.
-   **segment downloads**: auto or manual ranges via yt-dlp. manual supports single-song cuts (merged) or multiple tracks. adds to Spotify when titles exist.
-   **lossless first**: prioritizes flac from Lucida (Qobuz/Tidal/Deezer); falls back to YouTube's native opus stream (~128kbps, perceptually equivalent to mp3 320kbps).
-   **custom quality presets**: create up to 5 custom download presets with format descriptions.
-   **duplicate guard**: checks destination playlist before adding to prevent clutter.
-   **privacy**: runs entirely in the browser. no backend server. no data collection.

---

## configuration

click the extension icon or access settings via the right-click menu.

-   **default playlist**: set a target to skip the selection menu.
-   **download format**: opus (best quality from YouTube), mp3, ogg, or wav. YouTube serves ~128kbps opus which is perceptually equivalent to mp3 320kbps.
-   **lossless sources**: enable "lucida" in advanced settings for true lossless (flac) from Qobuz/Tidal/Deezer.

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
# build for chrome (restricted features)

npm run build:chrome

# build for firefox (full features)
npm run build:firefox

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
    Lucida -.->|Fallback| YtDlp[yt-dlp API]
    YtDlp -->|Audio Stream| Disk[chrome.downloads]
    end
    
    Add -->|Success| Notify[Notification]
    Disk -->|Complete| Notify
```

## troubleshooting

**"not authenticated with Spotify"**
click the tuneport icon in the toolbar and hit "connect Spotify". the token refreshes automatically.

**"download failed"**
the default download provider is yt-dlp (self-hosted at `https://yt.micr.dev`). if downloads fail, check your internet connection. you can also switch to Cobalt in settings if needed.

**"track not found"**
the matching algorithm requires a clean title format (e.g., "Artist - Title"). heavy remix/mashup titles may fail confidence checks.

## technical documentation

for details on youtube's audio infrastructure, codec choices, and why opus ~128kbps rivals mp3 320kbps, see [`docs/archival_and_transcoding.pdf`](docs/archival_and_transcoding.pdf).

## license

mit.
