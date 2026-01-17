import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const port = Number(process.env.PORT) || 8080;

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const match = req.url?.match(/^\/status\/([a-f0-9]+)$/);
  if (match) {
    const token = match[1];
    const clients = channels.get(token);
    const count = clients ? clients.size : 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected: count > 0, clients: count }));
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

const wss = new WebSocketServer({ server });
const channels = new Map();

const getToken = (req) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    return url.searchParams.get('token');
  } catch {
    return null;
  }
};

wss.on('connection', (ws, req) => {
  const token = getToken(req);
  if (!token) {
    ws.close(1008, 'missing token');
    return;
  }

  if (!channels.has(token)) {
    channels.set(token, new Set());
  }

  const clients = channels.get(token);
  clients.add(ws);

  ws.on('message', (data) => {
    for (const client of clients) {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (clients.size === 0) {
      channels.delete(token);
    }
  });
});

wss.on('listening', () => {
  console.log(`[relay] ws listening on ${port}`);
});

server.listen(port, () => {
  console.log(`[relay] http+ws server on ${port}`);
});
