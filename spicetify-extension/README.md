# TunePort Bridge

![TunePort Logo](preview.png)

This extension acts as a bridge for the [TunePort Chrome Extension](https://github.com/Microck/tuneport) to sync local files from YouTube directly into your Spotify playlists.

## Features

- **Local File Sync**: Automatically adds downloaded tracks from TunePort to your "Local Files" in Spotify.
- **WebSocket Relay**: Listens for add requests from the TunePort extension.
- **Auto-Refresh**: Automatically toggles "Local Files" setting to refresh the library when a new track is added.

## Setup

1. Install this extension via the Spicetify Marketplace.
2. Click on the **Profile Menu** in Spotify > **TunePort Bridge Token**.
3. Enter the API Token found in your TunePort Chrome Extension settings.
4. Reload Spotify.

## Manual Installation

Copy `tuneport.js` into your Spicetify `Extensions` folder, then run:

```bash
spicetify config extensions tuneport.js
spicetify apply
```
