# Tuneport Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build relay server, Spicetify extension, and extension sender so local file downloads are auto-added to Spotify playlists.

**Architecture:** A websocket relay routes messages by token between the browser extension and a Spicetify script. The sender posts download completion events with filename + playlist. The Spicetify script scans local files, matches track, and adds it to a playlist.

**Tech Stack:** Node.js (ws or socket.io), Spicetify JS, Chrome Extension (existing tuneport extension)

### Task 1: Inventory existing code + decide file locations

**Files:**
- Modify: `README.md`
- Modify: `tuneport-extension/README.md`
- Modify: `tuneport-extension/package.json`
- Modify: `package.json`
- Modify: `vercel.json`

**Step 1: Locate codebase conventions**

Run: `ls`
Expected: repo root listing

**Step 2: Find existing extension modules**

Run: `ls tuneport-extension`
Expected: extension folders (src, dist, etc)

**Step 3: Decide relay server location**

Decision: create `relay-server/` at repo root unless an existing backend exists.

**Step 4: Update docs with plan entry (temporary)**

Add a short note in `README.md` that bridge is in progress; no user-facing instructions yet.

**Step 5: Commit**

```bash
git add README.md tuneport-extension/README.md
git commit -m "docs: note bridge work in progress"
```

### Task 2: Relay server skeleton

**Files:**
- Create: `relay-server/package.json`
- Create: `relay-server/src/index.js`
- Create: `relay-server/README.md`
- Create: `relay-server/.env.example`
- Modify: `vercel.json` (if deploying to Vercel)

**Step 1: Write failing test**

If no test infra, skip tests and just run server locally.

**Step 2: Create relay server entry**

```js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 8080 });

const channels = new Map();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");
  if (!token) {
    ws.close(1008, "missing token");
    return;
  }
  if (!channels.has(token)) channels.set(token, new Set());
  channels.get(token).add(ws);
  ws.on("message", (data) => {
    for (const client of channels.get(token)) {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  });
  ws.on("close", () => channels.get(token).delete(ws));
});
```

**Step 3: Run server**

Run: `node relay-server/src/index.js`
Expected: server running on 8080

**Step 4: Commit**

```bash
git add relay-server vercel.json
git commit -m "feat: add relay server skeleton"
```

### Task 3: Spicetify extension script

**Files:**
- Create: `spicetify-extension/tuneport.js`
- Create: `spicetify-extension/README.md`

**Step 1: Create websocket client and reconnect loop**

```js
let ws;
const token = localStorage.getItem("tuneport_bridge_token");
const relayUrl = `wss://relay.micr.dev?token=${token}`;

function connect() {
  if (!token) return;
  ws = new WebSocket(relayUrl);
  ws.onmessage = onMessage;
  ws.onclose = () => setTimeout(connect, 3000);
}
```

**Step 2: Handle ADD_LOCAL_TRACK**

```js
async function onMessage(ev) {
  const msg = JSON.parse(ev.data);
  if (msg.action !== "ADD_LOCAL_TRACK") return;
  await Spicetify.Platform.LocalFilesAPI.scan();
  const tracks = await Spicetify.Platform.LocalFilesAPI.getTracks();
  const match = findBestMatch(msg.payload.filename, tracks);
  if (match && match.score > 0.9) {
    await Spicetify.Platform.PlaylistAPI.add(msg.payload.playlistId, [match.uri]);
  } else {
    Spicetify.showNotification("Tuneport: no local match");
  }
}
```

**Step 3: Add fuzzy matching**

Implement Jaro-Winkler or a simple similarity function inside the script.

**Step 4: Commit**

```bash
git add spicetify-extension
 git commit -m "feat: add spicetify bridge script"
```

### Task 4: Chrome extension sender

**Files:**
- Modify: `tuneport-extension/src/*` (DownloadService or equivalent)
- Modify: `tuneport-extension/src/settings/*` (bridge UI)

**Step 1: Add bridge token generation**

Generate and store UUID v4 token in settings.

**Step 2: Add bridge settings UI**

Add a "Bridge" tab to enable automation + show token.

**Step 3: Send relay message on download complete**

Hook into download completion; send message to relay:

```js
fetch("https://relay.micr.dev", {
  method: "POST",
  body: JSON.stringify({ token, action: "ADD_LOCAL_TRACK", payload: { filename, playlistId } }),
  headers: { "Content-Type": "application/json" }
});
```

**Step 4: Commit**

```bash
git add tuneport-extension/src
 git commit -m "feat: add bridge sender"
```

### Task 5: E2E manual test

**Files:**
- Modify: `README.md`

**Step 1: Run relay server**

Run: `node relay-server/src/index.js`
Expected: running

**Step 2: Load extension in Chrome**

Manual: enable bridge and copy token

**Step 3: Install Spicetify script**

Manual: place `tuneport.js` and run `spicetify apply`

**Step 4: Confirm add**

Download a track; confirm it is added to playlist.

**Step 5: Commit**

```bash
git add README.md
 git commit -m "docs: add bridge manual test"
```
