# tuneport bridge: detailed technical plan

## architecture overview
the bridge enables "zero-click" local file importing by connecting the chrome extension (sender) to the spotify desktop app (receiver) via an intermediary relay server.

## 1. the relay server
**purpose**: a message broker that holds signals until the desktop app is ready to process them.

- **stack**: Node.js + WebSocket (ws) or Socket.io.
- **hosting**: Vercel (serverless functions) or Render/Railway (persistent websockets).
- **message schema**:
  ```json
  {
    "token": "uuid-v4-secret",
    "action": "ADD_LOCAL_TRACK",
    "payload": {
      "filename": "Artist - Title.mp3",
      "playlistId": "spotify:playlist:..."
    }
  }
  ```
- **security**: users generate a unique `bridge_token` in the chrome extension. the relay only routes messages between clients sharing the same token.

## 2. the spicetify extension (`tuneport.js`)
**purpose**: an agent running inside spotify that bypasses web api restrictions.

- **connection**: connects to `wss://relay.micr.dev?token=USER_TOKEN` on startup.
- **state machine**:
  1. **idle**: wait for websocket message.
  2. **received**: receive filename + playlist id.
  3. **indexing**: trigger `Spicetify.Platform.LocalFilesAPI.scan()`.
  4. **matching**:
     - fetch all local tracks: `Spicetify.Platform.LocalFilesAPI.getTracks()`.
     - apply Jaro-Winkler fuzzy matching between `filename` and the metadata indexed by spotify.
  5. **execution**:
     - if match found (confidence > 0.9): `Spicetify.Platform.PlaylistAPI.add(playlistUri, [trackUri])`.
     - if no match: notify user via spotify's internal notification system.

## 3. chrome extension integration
- **ui**: new "bridge" tab in settings to toggle automation and copy the token.
- **logic**:
  - hook into `DownloadService`.
  - if a track is downloaded (meaning it wasn't found on spotify catalog):
    - wait for download completion.
    - POST message to relay: `{"action": "ADD_LOCAL_TRACK", ...}`.

## 4. setup flow (the user experience)
1. **spotify side**:
   - install [spicetify](https://spicetify.app).
   - drag `tuneport.js` into extensions folder.
   - run `spicetify apply`.
2. **chrome side**:
   - open tuneport settings -> bridge.
   - copy the generated **bridge token**.
3. **link**:
   - paste token into the popup inside spotify.
   - status turns green: "bridge active".

## challenges & mitigations
- **indexing lag**: spotify might not see the new file immediately after download.
  - *fix*: spicetify extension should retry matching every 5 seconds for 30 seconds if the first scan fails.
- **filename mismatch**: download provider might rename the file (e.g., removing special chars).
  - *fix*: chrome extension sends the *exact* final filename used in `chrome.downloads`.
- **connection drop**: websockets die on sleep.
  - *fix*: auto-reconnect logic in the spicetify script.

## implementation phases
1. **phase 1**: build relay server (minimal websocket echo).
2. **phase 2**: build spicetify script (test adding a known local track to a playlist).
3. **phase 3**: build chrome sender logic.
4. **phase 4**: polish ui and error handling.
