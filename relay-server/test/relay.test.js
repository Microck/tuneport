import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, '../src/index.js');

const waitForLine = (proc, matcher) => new Promise((resolvePromise, reject) => {
  const onData = (data) => {
    const text = data.toString();
    if (matcher.test(text)) {
      proc.stdout.off('data', onData);
      resolvePromise();
    }
  };
  proc.stdout.on('data', onData);
  proc.on('error', reject);
});

const connect = (url) => new Promise((resolve, reject) => {
  const ws = new WebSocket(url);
  ws.once('open', () => resolve(ws));
  ws.once('error', reject);
});

test('broadcasts only to same token', async () => {
  const port = 8091;
  const server = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForLine(server, /ws listening/);

  const a1 = await connect(`ws://localhost:${port}/?token=a`);
  const a2 = await connect(`ws://localhost:${port}/?token=a`);
  const b1 = await connect(`ws://localhost:${port}/?token=b`);

  const received = [];
  a2.on('message', (data) => received.push({ client: 'a2', data: data.toString() }));
  b1.on('message', (data) => received.push({ client: 'b1', data: data.toString() }));

  a1.send('ping');

  await new Promise((r) => setTimeout(r, 150));

  assert.deepEqual(received, [{ client: 'a2', data: 'ping' }]);

  a1.close();
  a2.close();
  b1.close();
  server.kill();
});
