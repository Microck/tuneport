const STORAGE_KEY = 'tuneport_bridge_token';
const STATIC_TOKEN = '';
const RELAY_BASE = 'wss://relay.micr.dev';

let ws = null;
let reconnectTimer = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getToken = () => {
  if (STATIC_TOKEN) return STATIC_TOKEN;
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};


const notify = (message, type = 'info') => {
  if (window.Spicetify?.showNotification) {
    Spicetify.showNotification(message);
  } else {
    console.log('[tuneport]', type, message);
  }
};

const normalize = (value) => value
  .toLowerCase()
  .replace(/\.[^/.]+$/, '')
  .replace(/\s+/g, ' ')
  .replace(/[\[\]【】（）()「」『』\-_~～・]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const jaroDistance = (s1, s2) => {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches += 1;
      break;
    }
  }

  if (matches === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k += 1;
    if (s1[i] !== s2[k]) t += 1;
    k += 1;
  }

  const transpositions = t / 2;
  return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3;
};

const jaroWinkler = (s1, s2) => {
  const jaro = jaroDistance(s1, s2);
  const prefixLimit = 4;
  let prefix = 0;
  for (let i = 0; i < Math.min(prefixLimit, s1.length, s2.length); i++) {
    if (s1[i] !== s2[i]) break;
    prefix += 1;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
};

const scoreTrack = (filename, track) => {
  // Strip folder path and extension from filename
  let base = filename.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, '');
  base = normalize(base);
  const title = normalize(track?.name || track?.title || '');
  const artist = normalize((track?.artists || []).map(a => a?.name).filter(Boolean).join(' '));
  const combined = `${artist} ${title}`.trim();
  return Math.max(
    jaroWinkler(base, title),
    jaroWinkler(base, combined)
  );
};

const findBestMatch = (filename, tracks) => {
  let best = null;
  for (const track of tracks || []) {
    const score = scoreTrack(filename, track);
    if (!best || score > best.score) {
      best = { score, track };
    }
  }
  return best;
};

const addToPlaylist = async (playlistId, trackUri) => {
  const playlistUri = playlistId.startsWith('spotify:playlist:') ? playlistId : `spotify:playlist:${playlistId}`;
  await Spicetify.Platform.PlaylistAPI.add(playlistUri, [trackUri], {});
};

const refreshLocalFiles = async () => {
  try {
    const api = Spicetify.Platform.LocalFilesAPI;
    console.log('[tuneport] toggling local files to refresh...');
    await api.setIsEnabled(false);
    await sleep(500);
    await api.setIsEnabled(true);
    await sleep(1500);
    console.log('[tuneport] local files refreshed');
  } catch (e) {
    console.log('[tuneport] refresh failed:', e.message);
  }
};

const scanAndMatch = async (filename, playlistId) => {
  const tracks = await Spicetify.Platform.LocalFilesAPI.getTracks();
  const cleanName = filename.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, '');
  console.log('[tuneport] scanning', tracks.length, 'local tracks for:', cleanName);
  
  const normalizedSearch = normalize(cleanName);
  const exactMatch = tracks.find(t => {
    const trackName = normalize(t?.name || '');
    return trackName === normalizedSearch || 
           trackName.includes(normalizedSearch) || 
           normalizedSearch.includes(trackName);
  });
  
  if (exactMatch) {
    console.log('[tuneport] exact match found:', exactMatch.name);
    await addToPlaylist(playlistId, exactMatch.uri);
    notify('Tuneport: local track added');
    return true;
  }
  
  const match = findBestMatch(filename, tracks);
  console.log('[tuneport] best fuzzy match:', match?.track?.name, 'score:', match?.score);
  
  if (match && match.score >= 0.85) {
    await addToPlaylist(playlistId, match.track.uri);
    notify('Tuneport: local track added');
    return true;
  }
  return false;
};

const handleAddLocalTrack = async (payload) => {
  const filename = payload?.filename;
  const playlistId = payload?.playlistId;
  if (!filename || !playlistId) {
    notify('Tuneport: invalid payload', 'error');
    return;
  }

  await refreshLocalFiles();
  
  let attempts = 0;
  const maxAttempts = 6;
  while (attempts < maxAttempts) {
    const matched = await scanAndMatch(filename, playlistId);
    if (matched) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      console.log('[tuneport] no match, retrying in 5s... (attempt', attempts, '/', maxAttempts, ')');
      await sleep(5000);
      await refreshLocalFiles();
    }
  }

  notify('Tuneport: no local match after retries', 'error');
};

const onMessage = async (event) => {
  try {
    let data = event.data;
    if (data instanceof Blob) {
      data = await data.text();
    }
    const message = JSON.parse(data);
    if (message.action !== 'ADD_LOCAL_TRACK') return;
    await handleAddLocalTrack(message.payload || {});
  } catch (error) {
    console.error('[tuneport] failed to handle message', error);
  }
};

const connect = () => {
  const token = getToken();
  if (!token) {
    console.log('[tuneport] missing bridge token. set it via spicetify menu.');
    return;
  }


  const url = `${RELAY_BASE}?token=${encodeURIComponent(token)}`;
  ws = new WebSocket(url);
  ws.onmessage = onMessage;
  ws.onclose = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 3000);
  };
  ws.onerror = () => {
    if (ws) ws.close();
  };
};

const ensureReady = () => {
  const isReady = window.Spicetify && Spicetify.Platform && Spicetify.Platform.LocalFilesAPI && Spicetify.Menu;
  if (isReady) {
    new Spicetify.Menu.Item('TunePort Bridge Token', false, () => {
      const token = prompt('Enter TunePort Bridge Token:', getToken());
      if (token !== null) {
        localStorage.setItem(STORAGE_KEY, token.trim());
        location.reload();
      }
    }).register();

    connect();
    return;
  }
  setTimeout(ensureReady, 1000);
};


ensureReady();
