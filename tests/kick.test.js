import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the server methods without requiring the Cloudflare runtime.
const source = readFileSync(new URL('../party/server.js', import.meta.url), 'utf8')
  .replace(/^import .*\n/gm, '')
  .replace('export class DecryptoServer', 'class DecryptoServer')
  .split('export default')[0];
const ServerClass = vm.runInNewContext(`${source}\nDecryptoServer`, { Server: class {} });

const ids = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

function teamGame(countA, countB, phase = 'GUESS_A') {
  const team = (teamIds) => ({
    playerIds: [...teamIds],
    encryptorIndex: 0,
    code: [1, 2, 3],
    clues: ['x', 'y', 'z'],
    cluesSubmitted: false,
    decryptGuess: null,
    interceptGuess: null,
    decryptConnections: [null, null, null],
    decryptReady: [],
    interceptConnections: [null, null, null],
    interceptReady: [],
    chat: [],
  });

  const A = ids('a', countA);
  const B = ids('b', countB);
  return {
    mode: 'team',
    phase,
    round: 2,
    maxRounds: 8,
    currentTeamTurn: 'A',
    teams: { A: team(A), B: team(B) },
    history: { A: [], B: [] },
    usedCodes: { A: [], B: [] },
  };
}

function threePlayerGame() {
  return {
    mode: '3p',
    phase: 'GUESS',
    round: 2,
    maxRounds: 5,
    encryptors: ['a0', 'a1'],
    interceptorId: 'b0',
    encryptorIndex: 0,
    keywords: ['one', 'two', 'three', 'four'],
    code: [1, 2, 3],
    clues: [],
    decryptConnections: [null, null, null],
    decryptReady: [],
    interceptConnections: [null, null, null],
    interceptReady: [],
    chat: [],
    history: [],
    interceptorTokens: 0,
  };
}

// Build a server around a game; broadcastState is stubbed so the fixture game
// does not need to be serializable.
function fixture(game, playerIds, hostId = 'a0') {
  const server = new ServerClass();
  server.game = game;
  server.players = playerIds.map(id => ({
    id,
    name: id.toUpperCase(),
    team: id[0].toUpperCase(),
    isHost: id === hostId,
    isOnline: true,
  }));
  server.playerToConnId = new Map(playerIds.map(id => [id, `socket-${id}`]));
  server.connToPlayerId = new Map(playerIds.map(id => [`socket-${id}`, id]));

  const sent = [];
  const counters = { broadcasts: 0 };
  server.getConnection = connId => ({ send: payload => sent.push({ connId, ...JSON.parse(payload) }) });
  server.broadcastState = () => { counters.broadcasts++; };
  return { server, sent, counters };
}

test('5 players: a kick that keeps both teams at 2+ continues the game', () => {
  const game = teamGame(3, 2);
  const { server, sent, counters } = fixture(game, [...ids('a', 3), ...ids('b', 2)]);

  server.handleKick('a0', { targetId: 'a2' });

  assert.equal(server.game, game);
  assert.deepEqual(server.players.map(p => p.id), ['a0', 'a1', 'b0', 'b1']);
  assert.deepEqual(game.teams.A.playerIds, ['a0', 'a1']);
  assert.equal(counters.broadcasts, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].connId, 'socket-a2');
  assert.equal(sent[0].type, 'kicked');
});

test('5 players: a kick that would leave a team with 1 player needs a reset', () => {
  const game = teamGame(3, 2);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 2)]);

  server.handleKick('a0', { targetId: 'b1' });

  assert.equal(server.players.length, 5, 'unconfirmed kick must be ignored');
  assert.deepEqual(game.teams.B.playerIds, ['b0', 'b1']);
});

test('4 players: the kick only happens once the host confirms the reset', () => {
  const game = teamGame(2, 2);
  const { server, sent } = fixture(game, [...ids('a', 2), ...ids('b', 2)]);

  server.handleKick('a0', { targetId: 'b1' });
  assert.equal(server.game, game);
  assert.equal(server.players.length, 4);

  server.handleKick('a0', { targetId: 'b1', reset: true });
  assert.equal(server.game, null, 'game goes back to the lobby');
  assert.deepEqual(server.players.map(p => p.id), ['a0', 'a1', 'b0']);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, 'kicked');
});

test('3 players: every kick resets the game, even down to 3 players left', () => {
  const game = threePlayerGame();
  const { server } = fixture(game, ['a0', 'a1', 'b0']);

  server.handleKick('a0', { targetId: 'b0' });
  assert.equal(server.game, game, 'unconfirmed kick must be ignored');

  server.handleKick('a0', { targetId: 'b0', reset: true });
  assert.equal(server.game, null);
  assert.deepEqual(server.players.map(p => p.id), ['a0', 'a1']);
});

test('kicking the current encryptor hands the role to a player who is still there', () => {
  const game = teamGame(3, 3);
  game.teams.A.encryptorIndex = 2; // a2 is the encryptor
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.handleKick('a0', { targetId: 'a2' });

  const team = server.game.teams.A;
  const encryptorId = team.playerIds[team.encryptorIndex % team.playerIds.length];
  assert.deepEqual(team.playerIds, ['a0', 'a1']);
  assert.equal(encryptorId, 'a0', 'rotation continues with the next player');
});

test('kicking another player keeps the same encryptor', () => {
  const game = teamGame(3, 3);
  game.teams.A.encryptorIndex = 1; // a1 is the encryptor
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.handleKick('a0', { targetId: 'a2' });

  const team = server.game.teams.A;
  assert.deepEqual(team.playerIds, ['a0', 'a1']);
  assert.equal(team.playerIds[team.encryptorIndex % team.playerIds.length], 'a1');
});

test('a kicked player is dropped from the team board state', () => {
  const game = teamGame(3, 3);
  game.teams.A.decryptReady = ['a1', 'a2'];
  game.teams.A.interceptReady = ['a2'];
  game.teams.A.chat = [
    { senderId: 'a1', senderName: 'A1', text: 'hello' },
    { senderId: 'a2', senderName: 'A2', text: 'bye' },
  ];
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.handleKick('a0', { targetId: 'a2' });

  assert.deepEqual(game.teams.A.decryptReady, ['a1']);
  assert.deepEqual(game.teams.A.interceptReady, []);
  assert.deepEqual(game.teams.A.chat.map(m => m.senderId), ['a1']);
});

test('only the host can kick, and never themselves', () => {
  const game = teamGame(3, 3);
  const { server, sent } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.handleKick('a1', { targetId: 'b1' });
  assert.equal(server.players.length, 6, 'non-host kick is ignored');

  server.handleKick('a0', { targetId: 'a0' });
  assert.equal(server.players.length, 6, 'host cannot kick themselves');

  server.handleKick('a0', { targetId: 'nobody' });
  assert.equal(server.players.length, 6, 'unknown player is ignored');
  assert.deepEqual(sent, []);
});

test('the host role moves on if the host ever leaves the table', () => {
  const game = teamGame(3, 3);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  // Simulates any removal path: the remaining players keep exactly one host.
  server.detachPlayer(server.players.find(p => p.id === 'a0'));
  assert.equal(server.players.find(p => p.isHost).id, 'a1');
});

test('a kick in the lobby needs no confirmation', () => {
  const { server, sent } = fixture(null, ['a0', 'a1', 'b0']);

  server.handleKick('a0', { targetId: 'b0' });

  assert.deepEqual(server.players.map(p => p.id), ['a0', 'a1']);
  assert.equal(sent[0].type, 'kicked');
});
