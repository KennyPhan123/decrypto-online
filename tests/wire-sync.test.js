import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the server methods without requiring the Cloudflare runtime.
const source = readFileSync(new URL('../party/server.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace('export class DecryptoServer', 'class DecryptoServer')
  .split('export default')[0];
const ServerClass = vm.runInNewContext(`${source}\nDecryptoServer`, { Server: class {} });

function fixture(game) {
  const server = new ServerClass();
  server.game = game;
  const ids = ['a0', 'a1', 'a2', 'b0', 'b1', 'b2', 'spectator'];
  server.players = ids.map(id => ({ id, name: id, isOnline: true }));
  server.playerToConnId = new Map(ids.map(id => [id, `socket-${id}`]));
  const sent = [];
  server.getConnection = connId => ({ send: payload => sent.push({ connId, ...JSON.parse(payload) }) });
  return { server, sent };
}

function teamGame(phase, turn = 'A') {
  return {
    mode: 'team', phase, currentTeamTurn: turn,
    teams: {
      A: { playerIds: ['a0', 'a1', 'a2'], encryptorIndex: 0 },
      B: { playerIds: ['b0', 'b1', 'b2'], encryptorIndex: 0 },
    },
  };
}
const syncData = { activeLine: { clueIdx: 0, x2: 0.5, y2: 0.5 } };

for (const round of [1, 2, 3]) {
  test(`3p round ${round}: no wires are forwarded between any roles`, () => {
    const { server, sent } = fixture({ mode: '3p', phase: 'GUESS', round,
      encryptors: ['a0', 'a1'], encryptorIndex: 0, interceptorId: 'b0' });
    for (const id of ['a0', 'a1', 'b0']) server.handleWireSync({ id }, { syncData });
    assert.deepEqual(sent, []);
  });
}

for (const [phase, turn, sender, recipients] of [
  ['GUESS_BOTH', null, 'a1', ['a2']],
  ['GUESS_A', 'A', 'a1', ['a2']],
  ['GUESS_A', 'A', 'b1', ['b0', 'b2']],
  ['GUESS_B', 'B', 'b1', ['b2']],
  ['GUESS_B', 'B', 'a1', ['a0', 'a2']],
  ['GUESS_A', 'A', 'a0', []],
  ['GUESS_BOTH', null, 'b0', []],
  ['GUESS_A', 'A', 'spectator', []],
  ['ENCRYPT', 'A', 'a1', []],
  ['REVEAL_A', 'A', 'b1', []],
]) {
  test(`${phase}: ${sender} only shares with eligible teammates`, () => {
    const { server, sent } = fixture(teamGame(phase, turn));
    server.handleWireSync({ id: sender }, { syncData });
    assert.deepEqual(sent.map(s => s.connId), recipients.map(id => `socket-${id}`));
    for (const message of sent) {
      assert.equal(message.senderId, sender);
      assert.deepEqual(message.syncData, syncData);
    }
  });
}

test('offline teammates receive no wires', () => {
  const { server, sent } = fixture(teamGame('GUESS_A'));
  server.players.find(p => p.id === 'a2').isOnline = false;
  server.handleWireSync({ id: 'a1' }, { syncData });
  assert.deepEqual(sent, []);
});
