// E2E smoke test against the running wrangler dev server.
const BASE = 'http://127.0.0.1:8787';
const ROOM = 'E2E' + Math.floor(Math.random() * 9000 + 1000);

function wsUrl() {
  return `ws://127.0.0.1:8787/parties/decrypto-server/${ROOM}`;
}

function client(playerId, name) {
  const ws = new WebSocket(wsUrl());
  const inbox = [];
  const waiters = [];
  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    inbox.push(data);
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].pred(data)) {
        const w = waiters.splice(i, 1)[0];
        clearTimeout(w.timer);
        w.resolve(data);
      }
    }
  });
  const opened = new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  return {
    ws, inbox, playerId, name,
    opened,
    send: (obj) => ws.send(JSON.stringify(obj)),
    join: async () => {
      await opened;
      ws.send(JSON.stringify({ type: 'join', name, playerId, isCreating: true }));
    },
    wait: (pred, label, ms = 5000) => new Promise((resolve, reject) => {
      const hit = inbox.find(pred);
      if (hit) return resolve(hit);
      const timer = setTimeout(() => reject(new Error(`timeout waiting: ${label}`)), ms);
      waiters.push({ pred, resolve, timer });
    }),
    close: () => { try { ws.close(); } catch { /* already closed */ } },
  };
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push([name, ok]);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${extra ? ' | ' + extra : ''}`);
};

// ── 1. Static page serves the built app ──
const page = await fetch(BASE + '/');
const html = await page.text();
check('GET / serves the app', page.ok && html.includes('DECRYPTO'));

// ── 2. Lobby: 4 players join, host kicks one from team B ──
const clients = {
  'e2e-host': client('e2e-host', 'Host'),
  'e2e-p2': client('e2e-p2', 'P2'),
  'e2e-p3': client('e2e-p3', 'P3'),
  'e2e-p4': client('e2e-p4', 'P4'),
};
const [host, ...others] = Object.values(clients);
await Promise.all(Object.values(clients).map(c => c.join()));

const joined = await host.wait(
  d => d.type === 'state' && d.state.phase === 'LOBBY' && d.state.players?.length === 4,
  'host sees 4 players'
);
check('lobby has 4 players', joined.state.players.length === 4);

// Whichever client joined first is the host — it is not necessarily ours.
const hostId = joined.state.players.find(p => p.isHost)?.id;
const hostClient = clients[hostId];
check('exactly one host', joined.state.players.filter(p => p.isHost).length === 1, `host=${hostId}`);

// Kick whoever ended up on team B so the remaining table stays 2/1 and can start.
const target = joined.state.players.find(p => p.team === 'B' && p.id !== hostId);
hostClient.send({ type: 'kick', targetId: target.id });

const kickedNotice = await clients[target.id].wait(d => d.type === 'kicked', 'target receives kicked');
check('kicked player is notified', !!kickedNotice, kickedNotice?.message);
// The real client closes its own socket when it sees "kicked" (see main.js).
clients[target.id].close();

const afterKick = await host.wait(
  d => d.type === 'state'
    && d.state.players?.length === 3
    && !d.state.players.some(p => p.id === target.id),
  'host sees 3 players after kick'
);
check('player removed immediately in lobby', afterKick.state.players.length === 3,
  afterKick.state.players.map(p => p.id).join(','));
check('teams still startable (2/1)',
  ['A', 'B'].map(t => afterKick.state.players.filter(p => p.team === t).length).sort().join('/') === '1/2');

// Whatever the kicked socket still sends must be ignored by the server.
const inboxBefore = host.inbox.length;
clients[target.id].send({ type: 'switch-team', target: 'A' });
await new Promise(r => setTimeout(r, 400));
check('messages from a kicked socket are ignored', host.inbox.length === inboxBefore,
  `host inbox ${inboxBefore} -> ${host.inbox.length}`);

// ── 3. Start the game, then drop the interceptor: they stay in the game ──
hostClient.send({ type: 'start' });
const inGame = await host.wait(
  d => d.type === 'state' && d.state.phase && d.state.phase !== 'LOBBY',
  'game starts'
);
check('game started', inGame.state.phase === 'ENCRYPT', `phase=${inGame.state.phase}`);
check('3-player mode chosen', inGame.state.mode === '3p');

const interceptorId = inGame.state.interceptor?.id;
check('interceptor is a remaining player', !!interceptorId && interceptorId !== target.id,
  `interceptor=${interceptorId}`);

// Some remaining player (the "observer") witnesses the drop — it may even be
// the host, so never wait on the client that is about to disconnect.
const observer = Object.values(clients).find(
  c => c.playerId !== interceptorId && c.playerId !== target.id
    && c.ws.readyState === WebSocket.OPEN
);
check('observer available to witness the drop', !!observer);

// The interceptor drops the connection — simulates F5 / closed tab.
clients[interceptorId].close();
await new Promise(r => setTimeout(r, 600));

const afterDrop = await observer.wait(
  d => d.type === 'state'
    && d.state.players?.some(p => p.id === interceptorId && p.isOnline === false),
  'observer sees interceptor offline'
);
const dropped = afterDrop.state.players.find(p => p.id === interceptorId);
check('offline player still counted as playing', !!dropped && dropped.isOnline === false);
check('offline player still the interceptor',
  afterDrop.state.interceptor?.id === interceptorId);

for (const c of Object.values(clients)) c.close();

console.log('\n' + (results.every(([, ok]) => ok) ? 'ALL PASS' : 'SOME FAILED'));
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
