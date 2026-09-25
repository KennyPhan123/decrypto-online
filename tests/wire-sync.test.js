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

function threePlayerGame(phase, round, encryptorIndex) {
  return {
    mode: '3p', phase, round, maxRounds: 5,
    encryptors: ['a0', 'a1'], encryptorIndex, interceptorId: 'b0',
    keywords: ['one', 'two', 'three', 'four'], code: [1, 2, 3],
    clues: ['first', 'second', 'third'], cluesSubmitted: true,
    interceptorTokens: 0, history: [], chat: [],
    decryptConnections: [1, 2, 3], decryptReady: ['a1'],
    interceptConnections: [3, 2, 1], interceptReady: ['b0'],
    decryptGuess: [1, 2, 3], interceptGuess: [3, 2, 1],
  };
}

for (const round of [1, 2, 3]) {
  for (const phase of ['ENCRYPT', 'GUESS', 'REVEAL', 'GAME_OVER']) {
    test(`3p round ${round} ${phase}: state only includes the viewer's draft board`, () => {
      const index = (round - 1) % 2;
      const game = threePlayerGame(phase, round, index);
      const { server } = fixture(game);
      // Test serialized state, as received on reconnect or a normal broadcast.
      const view = id => JSON.parse(JSON.stringify(server.getSanitizedState(id)));
      const decryptor = view(game.encryptors[1 - index]);
      const interceptor = view('b0');
      assert.deepEqual(decryptor.decryptConnections, game.decryptConnections);
      assert.deepEqual(decryptor.decryptReady, game.decryptReady);
      assert.ok(!('interceptConnections' in decryptor));
      assert.ok(!('interceptReady' in decryptor));
      assert.deepEqual(interceptor.interceptConnections, game.interceptConnections);
      assert.deepEqual(interceptor.interceptReady, game.interceptReady);
      assert.ok(!('decryptConnections' in interceptor));
      assert.ok(!('decryptReady' in interceptor));
      for (const id of [game.encryptors[index], 'spectator']) {
        const state = view(id);
        for (const key of ['decryptConnections', 'decryptReady', 'interceptConnections', 'interceptReady']) {
          assert.ok(!(key in state), `${id} must not receive ${key}`);
        }
      }
      for (const id of [...game.encryptors, 'b0']) {
        const state = view(id);
        if (phase === 'REVEAL' || phase === 'GAME_OVER') {
          assert.deepEqual(state.decryptGuess, game.decryptGuess);
          assert.deepEqual(state.interceptGuess, game.interceptGuess);
          assert.deepEqual(state.revealCode, game.code);
        } else {
          assert.ok(!('decryptGuess' in state));
          assert.ok(!('interceptGuess' in state));
          assert.ok(!('revealCode' in state));
        }
      }
    });
  }
}
