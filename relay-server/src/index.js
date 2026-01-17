import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 8080;

const wss = new WebSocketServer({ port });
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
