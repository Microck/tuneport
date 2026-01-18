<p align="center">
  <img src="https://raw.githubusercontent.com/Microck/tuneport/main/tuneport-extension/assets/logo.png" width="100" />
</p>

<p align="center">
  the missing link between youtube and spotify.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tuneport"><img src="https://img.shields.io/badge/chrome-web%20store-4285F4?style=flat-square&logo=google-chrome&logoColor=white" /></a>
  <a href="https://addons.mozilla.org/firefox/addon/tuneport-youtube-to-spotify-full/"><img src="https://img.shields.io/badge/firefox-add--ons-FF7139?style=flat-square&logo=firefox&logoColor=white" /></a>
  <img src="https://img.shields.io/badge/spotify-api-1DB954?style=flat-square&logo=spotify&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Microck/tuneport/main/website/public/hero-light.png" width="800" />
</p>

---

## quickstart

**install from store:**
- [chrome web store](https://chromewebstore.google.com/detail/tuneport)
- [firefox add-ons](https://addons.mozilla.org/firefox/addon/tuneport-youtube-to-spotify-full/)

**manual install:**
1. download the latest [release](https://github.com/Microck/tuneport/releases).
2. go to `chrome://extensions`.
3. enable **developer mode**.
4. drag and drop the zip file.

---

## features

- **finds matches**: scans spotify for the youtube song you're watching.
- **adds to playlist**: one click adds the official track to your library.
- **downloads missing tracks**: if it's not on spotify (remixes, bootlegs), it downloads high-quality audio locally.
- **smart parsing**: cleans up titles (removes "official video", "lyrics", "ft.") for better matching.
- **bring your own key**: use your own spotify app credentials to avoid rate limits.

---

## the "local files" problem

you want to click one button and have a youtube-only remix appear in your spotify playlist. i know. i want that too.

it is currently impossible to do this automatically with just a chrome extension.

### why it fails
spotify's web api explicitly blocks adding `local` files to playlists. you can only add tracks that exist in their cloud catalog. we tried everything:
- **api injection**: rejected by server (400 bad request).
- **file system manipulation**: chrome extensions are sandboxed and can't write to spotify's database.
- **spotilocal**: the old internal desktop bridge is dead/locked down.

### the workaround
tuneport does the next best thing:
1. it matches what it can (90% of songs).
2. for the rest, it downloads the file to `Downloads/TunePort` with a clean name (`Artist - Title.mp3`).
3. you enable "local files" in spotify desktop once.
4. you drag the file in.

bridge is now live in settings. enable it, copy the token, and run the spicetify script to auto-add local files. see [spicetify-extension](../spicetify-extension/) for setup.

---

## development

```bash
# install dependencies
npm install

# run dev server
npm run dev

# build for production
npm run build
```

---

## license

mit. do whatever you want with it.
