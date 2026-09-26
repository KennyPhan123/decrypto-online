import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the server methods without requiring the Cloudflare runtime.
const source = readFileSync(new URL('../party/server.js', import.meta.url), 'utf8')
  .replace(/^import .*?\n/gm, '')
  .replace('export class DecryptoServer', 'class DecryptoServer')
  .split('export default')[0];
const ServerClass = vm.runInNewContext(`${source}\nDecryptoServer`, { Server: class {} });

const ids = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

function teamGame(countA, countB, phase = 'GUESS_A', turn = 'A') {
  const team = (teamIds) => ({
    playerIds: [...teamIds],
    encryptorIndex: 0,
    code: [1, 2, 3],
    clues: ['x', 'y', 'z'],
    cluesSubmitted: true,
    interceptions: 0,
    miscommunications: 0,
    decryptGuess: null,
    interceptGuess: null,
    decryptConnections: [1, 2, 3],
    decryptReady: [],
    interceptConnections: [3, 2, 1],
    interceptReady: [],
    chat: [],
  });

  return {
    mode: 'team',
    phase,
    round: 2,
    maxRounds: 8,
    currentTeamTurn: turn,
    teams: { A: team(ids('a', countA)), B: team(ids('b', countB)) },
    history: { A: [], B: [] },
    usedCodes: { A: [], B: [] },
  };
}

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
  server.getConnection = connId => ({ send: payload => sent.push({ connId, ...JSON.parse(payload) }) });
  server.broadcastState = () => {};
  return { server, sent };
}

// ── Ready tally must reconcile the moment a kick lands ────────────────

test('kick while a board is already fully voted: it submits without anyone re-clicking', () => {
  const game = teamGame(3, 3);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  // Team B needs 3 intercept votes; two are in, then b2 is kicked.
  server.handleToggleReady({ id: 'b0' }, { guessType: 'intercept', isReady: true });
  server.handleToggleReady({ id: 'b1' }, { guessType: 'intercept', isReady: true });
  server.handleKick('a0', { targetId: 'b2' });

  // Requirement drops to 2 and is already met — the submit must fire now,
  // because b0/b1 will never click their "Đã sẵn sàng" button again.
  assert.deepEqual(game.teams.B.interceptGuess, [3, 2, 1]);

  // The decrypt side finishes normally and the round reveals.
  server.handleToggleReady({ id: 'a1' }, { guessType: 'decrypt', isReady: true });
  server.handleToggleReady({ id: 'a2' }, { guessType: 'decrypt', isReady: true });
  assert.equal(game.phase, 'REVEAL_A');
});

test('kick while both boards wait on stale tallies: everything resolves on its own', () => {
  const game = teamGame(3, 3);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.handleToggleReady({ id: 'b0' }, { guessType: 'intercept', isReady: true });
  server.handleToggleReady({ id: 'b1' }, { guessType: 'intercept', isReady: true });
  server.handleToggleReady({ id: 'a1' }, { guessType: 'decrypt', isReady: true });
  server.handleToggleReady({ id: 'a2' }, { guessType: 'decrypt', isReady: true }); // decrypt submitted

  server.handleKick('a0', { targetId: 'b2' });

  // Intercept was left at 2/3 before the kick; it must submit right away and,
  // since decrypt is already in, reveal the round immediately — no
  // cancel-and-ready-again needed.
  assert.deepEqual(game.teams.B.interceptGuess, [3, 2, 1]);
  assert.equal(game.phase, 'REVEAL_A');
});

test('a player who becomes encryptor by the kick loses their old decrypt vote', () => {
  const game = teamGame(3, 3);
  // Host sits on team B so team A's encryptor a0 can be kicked.
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)], 'b0');

  game.teams.A.decryptReady = ['a1'];               // a1 was ready as a guesser
  game.teams.B.interceptReady = ['b0', 'b1', 'b2']; // already fully voted

  server.handleKick('b0', { targetId: 'a0' }); // a1 rotates into the encryptor role

  assert.deepEqual(game.teams.A.playerIds, ['a1', 'a2']);
  assert.deepEqual(
    game.teams.A.decryptReady,
    [],
    'a1 can no longer guess their own team\'s clues'
  );
  assert.equal(game.teams.A.decryptGuess, null, 'the board waits for a2');
  assert.deepEqual(game.teams.B.interceptGuess, [3, 2, 1], 'the other board already voted');

  server.handleToggleReady({ id: 'a2' }, { guessType: 'decrypt', isReady: true });
  assert.equal(game.phase, 'REVEAL_A');
});

test('kick in round 1 (GUESS_BOTH): stale-ready board submits, the other side finishes', () => {
  const game = teamGame(3, 3, 'GUESS_BOTH', null);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  game.teams.B.decryptReady = ['b1']; // one vote short of the pre-kick requirement of 2

  server.handleKick('a0', { targetId: 'b2' }); // B now has 2 members → 1 vote is enough

  assert.deepEqual(game.teams.B.decryptGuess, [1, 2, 3], 'B submits immediately');

  server.handleToggleReady({ id: 'a1' }, { guessType: 'decrypt', isReady: true });
  server.handleToggleReady({ id: 'a2' }, { guessType: 'decrypt', isReady: true });
  assert.equal(game.phase, 'REVEAL_BOTH');
});

// ── The kicked encryptor's clues are kept ─────────────────────────────

test('kicking the encryptor mid-encrypt submits the clues they had written', () => {
  const game = teamGame(3, 3, 'ENCRYPT', null);
  game.teams.A.cluesSubmitted = false;
  game.teams.B.cluesSubmitted = false;
  game.teams.A.clues = [null, null, null];
  // Host on team B so encryptor a0 can be kicked.
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)], 'b0');

  server.handleClueDraft({ id: 'a0' }, { clues: [' một', 'hai ', ''] });
  assert.deepEqual(game.teams.A.clueDraft, ['một', 'hai', ''], 'draft is streamed and trimmed');

  server.handleKick('b0', { targetId: 'a0' });

  assert.equal(game.teams.A.cluesSubmitted, true, 'draft submitted at the kick');
  assert.deepEqual([...game.teams.A.clues], ['một', 'hai', '']);
  assert.equal(game.teams.A.clueDraft, null);
  assert.equal(game.phase, 'ENCRYPT', 'the other team is still writing');
  assert.ok(game.timerEnd, 'the 30s timer for the pending team starts');
  assert.ok(game.teams.A.playerIds.includes('a1'), 'the kick itself still happened');

  // Once the other team submits, the guess phase begins as usual.
  server.handleSubmitClues({ id: 'b0' }, { clues: ['g1', 'g2', 'g3'] });
  assert.equal(game.phase, 'GUESS_A');
  assert.equal(game.currentTeamTurn, 'A');
});

test('kicking the encryptor with a draft while the other team already submitted jumps straight to guessing', () => {
  const game = teamGame(3, 3, 'ENCRYPT', null);
  game.teams.A.cluesSubmitted = false;
  game.teams.B.cluesSubmitted = true;
  game.timerEnd = Date.now() + 30000;
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)], 'b0');

  server.handleClueDraft({ id: 'a0' }, { clues: ['c1', 'c2', 'c3'] });
  server.handleKick('b0', { targetId: 'a0' });

  assert.equal(game.teams.A.cluesSubmitted, true);
  assert.equal(game.phase, 'GUESS_A', 'both teams in → guessing right away');
  assert.equal(game.timerEnd, null, 'the sand timer is cleared');
});

test('kicking the encryptor who wrote nothing passes the job to the next player', () => {
  const game = teamGame(3, 3, 'ENCRYPT', null);
  game.teams.A.cluesSubmitted = false;
  game.teams.B.cluesSubmitted = false;
  game.teams.A.clues = [null, null, null];
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)], 'b0');

  server.handleKick('b0', { targetId: 'a0' });

  assert.equal(game.teams.A.cluesSubmitted, false, 'no empty board is forced on the team');
  assert.deepEqual(game.teams.A.clues, [null, null, null]);
  assert.equal(game.teams.A.playerIds[game.teams.A.encryptorIndex], 'a1', 'a1 takes over');
  assert.equal(game.phase, 'ENCRYPT');
});

test('clue drafts are only accepted from the current encryptor while they are writing', () => {
  const game = teamGame(3, 3, 'ENCRYPT', null);
  game.teams.A.cluesSubmitted = false;
  game.teams.B.cluesSubmitted = false;
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.handleClueDraft({ id: 'a1' }, { clues: ['x', 'y', 'z'] });
  assert.equal(game.teams.A.clueDraft, undefined, 'a non-encryptor cannot write the draft');

  server.handleClueDraft({ id: 'a0' }, { clues: [' x ', 'y', 'z'] });
  assert.deepEqual(game.teams.A.clueDraft, ['x', 'y', 'z']);

  server.handleClueDraft({ id: 'a0' }, { clues: ['only-one'] });
  assert.deepEqual(game.teams.A.clueDraft, ['x', 'y', 'z'], 'malformed drafts are ignored');

  server.handleClueDraft({ id: 'b0' }, { clues: ['b1', 'b2', 'b3'] });
  assert.deepEqual(game.teams.B.clueDraft, ['b1', 'b2', 'b3'], 'each team has its own draft');

  game.teams.A.cluesSubmitted = true;
  server.handleClueDraft({ id: 'a0' }, { clues: ['late', 'edit', '!'] });
  assert.deepEqual(game.teams.A.clueDraft, ['x', 'y', 'z'], 'nothing is accepted after submit');
});

test('the encrypt timeout submits the streamed draft instead of empty clues', () => {
  const game = teamGame(3, 3, 'ENCRYPT', null);
  game.teams.A.cluesSubmitted = true;
  game.teams.B.cluesSubmitted = false;
  game.timerEnd = Date.now() + 30000;
  game.teams.B.clueDraft = ['b1', '', 'b3'];
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.enforceEncryptTimeout();

  assert.deepEqual([...game.teams.B.clues], ['b1', '', 'b3']);
  assert.equal(game.teams.B.cluesSubmitted, true);
  assert.equal(game.phase, 'GUESS_A');
  assert.equal(game.timerEnd, null);
});

test('the encrypt timeout still falls back to empty clues when nothing was typed', () => {
  const game = teamGame(3, 3, 'ENCRYPT', null);
  game.teams.A.cluesSubmitted = true;
  game.teams.B.cluesSubmitted = false;
  game.timerEnd = Date.now() + 30000;
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.enforceEncryptTimeout();

  assert.deepEqual([...game.teams.B.clues], ['', '', '']);
  assert.equal(game.phase, 'GUESS_A');
});

// ── Offline players still count as playing (until a kick) ─────────────

test('an offline teammate still counts toward the ready tally', () => {
  const game = teamGame(3, 3);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.players.find(p => p.id === 'a2').isOnline = false; // F5 / dropped tab

  assert.equal(server.requiredReadyCount('A', 'decrypt'), 2, 'offline player still on the team');

  server.handleToggleReady({ id: 'a1' }, { guessType: 'decrypt', isReady: true });
  assert.equal(game.teams.A.decryptGuess, null, 'one vote out of two — not enough');

  // The player reconnects (same id) and readies up.
  server.players.find(p => p.id === 'a2').isOnline = true;
  server.handleToggleReady({ id: 'a2' }, { guessType: 'decrypt', isReady: true });
  assert.deepEqual(game.teams.A.decryptGuess, [1, 2, 3]);
});

test('the client-facing guesser count includes offline teammates too', () => {
  const game = teamGame(3, 3);
  const { server } = fixture(game, [...ids('a', 3), ...ids('b', 3)]);

  server.players.find(p => p.id === 'a2').isOnline = false;

  const view = JSON.parse(JSON.stringify(server.getSanitizedState('a1')));
  assert.equal(view.activeGuessersCount, 2, 'matches the server tally (3 members − encryptor)');
});
