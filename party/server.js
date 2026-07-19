import { WORDS } from './words.js';

// ── Utilities ──────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getAllPermutations() {
  const perms = [];
  for (let a = 1; a <= 4; a++)
    for (let b = 1; b <= 4; b++)
      for (let c = 1; c <= 4; c++)
        if (a !== b && a !== c && b !== c) perms.push([a, b, c]);
  return perms;
}

const ALL_CODES = getAllPermutations(); // 24 permutations

function pickCode(usedCodes) {
  const available = ALL_CODES.filter(
    c => !usedCodes.some(u => u[0] === c[0] && u[1] === c[1] && u[2] === c[2])
  );
  return available[Math.floor(Math.random() * available.length)];
}

function pickKeywords(count, exclude = []) {
  const available = WORDS.filter(w => !exclude.includes(w));
  return shuffle(available).slice(0, count);
}

function arraysEqual(a, b) {
  return a && b && a.length === b.length && a.every((v, i) => v === b[i]);
}

// ── Server ─────────────────────────────────────────────────

export default class DecryptoServer {
  constructor(room) {
    this.room = room;
    this.players = [];
    this.game = null;
  }

  onConnect(connection, ctx) {
    // Wait for 'join' message
  }

  onMessage(message, sender) {
    let data;
    try { data = JSON.parse(message); } catch { return; }

    switch (data.type) {
      case 'join': this.handleJoin(sender, data); break;
      case 'switch-team': this.handleSwitchTeam(sender); break;
      case 'start': this.handleStart(sender); break;
      case 'submit-clues': this.handleSubmitClues(sender, data); break;
      case 'submit-guess': this.handleSubmitGuess(sender, data); break;
      case 'continue': this.handleContinue(sender); break;
      case 'play-again': this.handlePlayAgain(sender); break;
      default: break;
    }
  }

  onClose(connection) {
    const idx = this.players.findIndex(p => p.id === connection.id);
    if (idx === -1) return;

    const wasHost = this.players[idx].isHost;
    this.players.splice(idx, 1);

    if (this.players.length > 0 && wasHost) {
      this.players[0].isHost = true;
    }

    if (this.players.length === 0) {
      this.game = null;
      return;
    }

    this.broadcastState();
  }

  // ── Join / Start ─────────────────────────────────────────

  handleJoin(sender, data) {
    if (this.game && this.game.phase !== 'LOBBY') {
      this.sendError(sender, 'Game đang diễn ra, không thể tham gia.');
      return;
    }

    if (this.players.find(p => p.id === sender.id)) return;

    const name = (data.name || 'Người chơi').trim().slice(0, 20);
    const countA = this.players.filter(p => p.team === 'A').length;
    const countB = this.players.filter(p => p.team === 'B').length;
    
    this.players.push({
      id: sender.id,
      name,
      team: countA <= countB ? 'A' : 'B',
      isHost: this.players.length === 0,
    });

    this.broadcastState();
  }

  handleSwitchTeam(sender) {
    if (this.game) return;
    const player = this.players.find(p => p.id === sender.id);
    if (!player) return;

    const total = this.players.length;
    const maxPerTeam = Math.ceil(total / 2);
    
    const targetTeam = player.team === 'A' ? 'B' : 'A';
    const targetCount = this.players.filter(p => p.team === targetTeam).length;
    
    if (targetCount >= maxPerTeam && total >= 3) {
      this.sendError(sender, 'Đội này đã đầy! Phải duy trì sự cân bằng.');
      return;
    }
    
    player.team = targetTeam;
    this.broadcastState();
  }

  handleStart(sender) {
    const player = this.players.find(p => p.id === sender.id);
    if (!player || !player.isHost) return;

    const count = this.players.length;
    if (count < 3) {
      this.sendError(sender, 'Cần ít nhất 3 người chơi.');
      return;
    }

    const mode = count === 3 ? '3p' : 'team';

    if (mode === '3p') {
      this.initGame3P();
    } else {
      this.initGameTeam();
    }

    this.broadcastState();
  }

  // ── Initialize 3-player game ─────────────────────────────

  initGame3P() {
    const teamA = this.players.filter(p => p.team === 'A').map(p => p.id);
    const teamB = this.players.filter(p => p.team === 'B').map(p => p.id);
    
    const encryptors = teamA.length >= 2 ? teamA : teamB;
    const interceptor = teamA.length >= 2 ? teamB[0] : teamA[0];
    
    const keywords = pickKeywords(4);

    this.game = {
      phase: 'ENCRYPT',
      mode: '3p',
      round: 1,
      maxRounds: 5,

      encryptors: [encryptors[0], encryptors[1]],
      interceptorId: interceptor,
      keywords,
      encryptorIndex: 0,

      code: null,
      clues: [null, null, null],
      cluesSubmitted: false,

      decryptGuess: null,
      interceptGuess: null,

      interceptorTokens: 0,

      usedCodes: [],
      history: [],
    };

    this.startRound3P();
  }

  startRound3P() {
    const g = this.game;
    g.phase = 'ENCRYPT';
    g.code = pickCode(g.usedCodes);
    g.usedCodes.push(g.code);
    g.clues = [null, null, null];
    g.cluesSubmitted = false;
    g.decryptGuess = null;
    g.interceptGuess = null;
    g.timerEnd = null;
  }

  // ── Initialize team game ─────────────────────────────────

  initGameTeam() {
    const teamAIds = this.players.filter(p => p.team === 'A').map(p => p.id);
    const teamBIds = this.players.filter(p => p.team === 'B').map(p => p.id);

    const keywordsA = pickKeywords(4);
    const keywordsB = pickKeywords(4, keywordsA);

    this.game = {
      phase: 'ENCRYPT',
      mode: 'team',
      round: 1,
      maxRounds: 8,

      teams: {
        A: {
          playerIds: teamAIds,
          keywords: keywordsA,
          interceptions: 0,
          miscommunications: 0,
          encryptorIndex: 0,
          code: null,
          clues: [null, null, null],
          cluesSubmitted: false,
          decryptGuess: null,
          interceptGuess: null,
        },
        B: {
          playerIds: teamBIds,
          keywords: keywordsB,
          interceptions: 0,
          miscommunications: 0,
          encryptorIndex: 0,
          code: null,
          clues: [null, null, null],
          cluesSubmitted: false,
          decryptGuess: null,
          interceptGuess: null,
        },
      },

      currentTeamTurn: null,
      usedCodes: { A: [], B: [] },
      history: { A: [], B: [] },
    };

    this.startRoundTeam();
  }

  startRoundTeam() {
    const g = this.game;
    g.phase = 'ENCRYPT';
    g.currentTeamTurn = null;
    g.timerEnd = null;

    for (const key of ['A', 'B']) {
      const team = g.teams[key];
      team.code = pickCode(g.usedCodes[key]);
      g.usedCodes[key].push(team.code);
      team.clues = [null, null, null];
      team.cluesSubmitted = false;
      team.decryptGuess = null;
      team.interceptGuess = null;
    }
  }

  // ── Submit Clues ─────────────────────────────────────────

  handleSubmitClues(sender, data) {
    const g = this.game;
    if (!g || g.phase !== 'ENCRYPT') return;

    const clues = data.clues;
    if (!Array.isArray(clues) || clues.length !== 3) return;
    if (clues.some(c => typeof c !== 'string' || c.trim().length === 0)) return;

    const trimmed = clues.map(c => c.trim());

    if (g.mode === '3p') {
      const currentEncryptor = g.encryptors[g.encryptorIndex];
      if (sender.id !== currentEncryptor) return;

      g.clues = trimmed;
      g.cluesSubmitted = true;
      g.phase = 'GUESS';
    } else {
      const team = this.getPlayerTeam(sender.id);
      if (!team) return;

      const t = g.teams[team];
      const encryptorId = t.playerIds[t.encryptorIndex % t.playerIds.length];
      if (sender.id !== encryptorId) return;

      t.clues = trimmed;
      t.cluesSubmitted = true;

      if (g.teams.A.cluesSubmitted && g.teams.B.cluesSubmitted) {
        g.phase = 'GUESS_A';
        g.currentTeamTurn = 'A';
        g.timerEnd = null;
      } else {
        if (!g.timerEnd) {
          g.timerEnd = Date.now() + 30000;
        }
      }
    }

    this.broadcastState();
  }

  // ── Submit Guess ─────────────────────────────────────────

  handleSubmitGuess(sender, data) {
    const g = this.game;
    if (!g) return;

    const guess = data.guess;
    if (!Array.isArray(guess) || guess.length !== 3) return;
    if (guess.some(n => typeof n !== 'number' || n < 1 || n > 4)) return;

    const guessType = data.guessType;

    if (g.mode === '3p') {
      if (g.phase !== 'GUESS') return;

      if (guessType === 'decrypt') {
        const otherEncryptor = g.encryptors.find(id => id !== g.encryptors[g.encryptorIndex]);
        if (sender.id !== otherEncryptor) return;
        g.decryptGuess = guess;
      } else if (guessType === 'intercept') {
        if (g.round < 2) return;
        if (sender.id !== g.interceptorId) return;
        g.interceptGuess = guess;
      }

      const needIntercept = g.round >= 2;
      const decryptDone = g.decryptGuess !== null;
      const interceptDone = !needIntercept || g.interceptGuess !== null;

      if (decryptDone && interceptDone) {
        g.phase = 'REVEAL';
        this.resolveRound3P();
      }
    } else {
      const turnTeam = g.currentTeamTurn;
      if (!turnTeam) return;
      if (g.phase !== `GUESS_${turnTeam}`) return;

      const opponentTeam = turnTeam === 'A' ? 'B' : 'A';
      const ownTeam = g.teams[turnTeam];
      const oppTeam = g.teams[opponentTeam];
      const playerTeam = this.getPlayerTeam(sender.id);

      if (guessType === 'decrypt') {
        if (playerTeam !== turnTeam) return;
        const encId = ownTeam.playerIds[ownTeam.encryptorIndex % ownTeam.playerIds.length];
        if (sender.id === encId) return;
        if (ownTeam.decryptGuess) return;
        ownTeam.decryptGuess = guess;
      } else if (guessType === 'intercept') {
        if (g.round < 2) return;
        if (playerTeam !== opponentTeam) return;
        if (oppTeam.interceptGuess) return;
        oppTeam.interceptGuess = guess;
      }

      const decryptDone = ownTeam.decryptGuess !== null;
      const needIntercept = g.round >= 2;
      const interceptDone = !needIntercept || oppTeam.interceptGuess !== null;

      if (decryptDone && interceptDone) {
        g.phase = `REVEAL_${turnTeam}`;
        this.resolveTeamTurn(turnTeam);
      }
    }

    this.broadcastState();
  }

  // ── Resolve rounds ───────────────────────────────────────

  resolveRound3P() {
    const g = this.game;
    const interceptCorrect = g.interceptGuess && arraysEqual(g.interceptGuess, g.code);
    const decryptCorrect = arraysEqual(g.decryptGuess, g.code);

    if (interceptCorrect) {
      g.interceptorTokens++;
    }
    if (!decryptCorrect) {
      g.interceptorTokens++;
    }

    g.history.push({
      round: g.round,
      clues: [...g.clues],
      code: [...g.code],
      decryptGuess: g.decryptGuess ? [...g.decryptGuess] : null,
      interceptGuess: g.interceptGuess ? [...g.interceptGuess] : null,
      decryptCorrect,
      interceptCorrect: interceptCorrect || false,
    });
  }

  resolveTeamTurn(turnTeam) {
    const g = this.game;
    const opponentTeam = turnTeam === 'A' ? 'B' : 'A';
    const ownTeam = g.teams[turnTeam];
    const oppTeam = g.teams[opponentTeam];

    const interceptCorrect = oppTeam.interceptGuess && arraysEqual(oppTeam.interceptGuess, ownTeam.code);
    const decryptCorrect = arraysEqual(ownTeam.decryptGuess, ownTeam.code);

    if (interceptCorrect) {
      oppTeam.interceptions++;
    }
    if (!decryptCorrect) {
      ownTeam.miscommunications++;
    }

    g.history[turnTeam].push({
      round: g.round,
      clues: [...ownTeam.clues],
      code: [...ownTeam.code],
      decryptGuess: ownTeam.decryptGuess ? [...ownTeam.decryptGuess] : null,
      interceptGuess: oppTeam.interceptGuess ? [...oppTeam.interceptGuess] : null,
      decryptCorrect,
      interceptCorrect: interceptCorrect || false,
    });
  }

  // ── Continue (next phase) ────────────────────────────────

  handleContinue(sender) {
    const g = this.game;
    if (!g) return;

    const player = this.players.find(p => p.id === sender.id);
    if (!player || !player.isHost) return;

    if (g.mode === '3p') {
      if (g.phase === 'REVEAL') {
        if (g.interceptorTokens >= 2 || g.round >= g.maxRounds) {
          g.phase = 'GAME_OVER';
        } else {
          g.round++;
          g.encryptorIndex = (g.encryptorIndex + 1) % 2;
          this.startRound3P();
        }
      }
    } else {
      if (g.phase === 'REVEAL_A') {
        g.phase = 'GUESS_B';
        g.currentTeamTurn = 'B';

        g.teams.B.decryptGuess = null;
        g.teams.A.interceptGuess = null;
      } else if (g.phase === 'REVEAL_B') {
        const endResult = this.checkTeamEndConditions();
        if (endResult) {
          g.phase = 'GAME_OVER';
          g.winner = endResult;
        } else if (g.round >= g.maxRounds) {
          g.phase = 'GAME_OVER';
          g.winner = this.calculateTiebreaker();
        } else {
          g.round++;
          g.teams.A.encryptorIndex = (g.teams.A.encryptorIndex + 1) % g.teams.A.playerIds.length;
          g.teams.B.encryptorIndex = (g.teams.B.encryptorIndex + 1) % g.teams.B.playerIds.length;
          this.startRoundTeam();
        }
      }
    }

    this.broadcastState();
  }

  // ── Win/Loss checks ──────────────────────────────────────

  checkTeamEndConditions() {
    const g = this.game;
    const a = g.teams.A;
    const b = g.teams.B;

    const aWin = a.interceptions >= 2;
    const aLose = a.miscommunications >= 2;
    const bWin = b.interceptions >= 2;
    const bLose = b.miscommunications >= 2;

    if ((aWin && bWin) || (aLose && bLose) || (aWin && aLose) || (bWin && bLose)) {
      return this.calculateTiebreaker();
    }

    if (aWin) return 'A';
    if (bWin) return 'B';
    if (aLose) return 'B';
    if (bLose) return 'A';

    return null;
  }

  calculateTiebreaker() {
    const g = this.game;
    const scoreA = g.teams.A.interceptions - g.teams.A.miscommunications;
    const scoreB = g.teams.B.interceptions - g.teams.B.miscommunications;
    if (scoreA > scoreB) return 'A';
    if (scoreB > scoreA) return 'B';
    return 'TIE';
  }

  // ── Play Again ───────────────────────────────────────────

  handlePlayAgain(sender) {
    const player = this.players.find(p => p.id === sender.id);
    if (!player || !player.isHost) return;
    this.game = null;
    this.broadcastState();
  }

  // ── Helpers ──────────────────────────────────────────────

  getPlayerTeam(playerId) {
    const g = this.game;
    if (!g || g.mode !== 'team') return null;
    if (g.teams.A.playerIds.includes(playerId)) return 'A';
    if (g.teams.B.playerIds.includes(playerId)) return 'B';
    return null;
  }

  getPlayerName(playerId) {
    const p = this.players.find(p => p.id === playerId);
    return p ? p.name : '???';
  }

  sendError(connection, message) {
    connection.send(JSON.stringify({ type: 'error', message }));
  }

  broadcastState() {
    this.players.forEach(p => {
      const conn = this.room.getConnection(p.id);
      if (conn) {
        conn.send(JSON.stringify({
          type: 'state',
          state: this.getSanitizedState(p.id)
        }));
      }
    });
  }

  getSanitizedState(viewerId) {
    if (!this.game) {
      return {
        phase: 'LOBBY',
        roomCode: this.room.id,
        myId: viewerId,
        players: this.players,
      };
    }
    const base = {
      roomCode: this.room.id,
      players: this.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, team: p.team })),
      myId: viewerId,
    };
    return this.game.mode === '3p' 
      ? this.sanitize3P(viewerId, base)
      : this.sanitizeTeam(viewerId, base);
  }

  sanitize3P(viewerId, base) {
    const g = this.game;
    const isEncryptor = g.encryptors.includes(viewerId);
    const isInterceptor = viewerId === g.interceptorId;
    const currentEncryptorId = g.encryptors[g.encryptorIndex];
    const isCurrentEncryptor = viewerId === currentEncryptorId;
    const otherEncryptorId = g.encryptors.find(id => id !== currentEncryptorId);

    const state = {
      ...base,
      phase: g.phase,
      mode: '3p',
      round: g.round,
      maxRounds: g.maxRounds,

      encryptors: g.encryptors.map(id => ({ id, name: this.getPlayerName(id) })),
      interceptor: { id: g.interceptorId, name: this.getPlayerName(g.interceptorId) },
      currentEncryptorId,

      myRole: isInterceptor ? 'interceptor' : (isCurrentEncryptor ? 'encryptor' : 'guesser'),
      keywords: isEncryptor ? g.keywords : null,
      interceptorTokens: g.interceptorTokens,
      cluesSubmitted: g.cluesSubmitted,
      timerEnd: g.timerEnd,

      history: g.history,
    };

    // Code: only current encryptor sees during ENCRYPT
    if (g.phase === 'ENCRYPT' && isCurrentEncryptor) {
      state.code = g.code;
    }

    // Clues: visible during GUESS and REVEAL
    if (g.phase === 'GUESS' || g.phase === 'REVEAL') {
      state.clues = g.clues;
    }

    // Guessing status
    if (g.phase === 'GUESS') {
      state.decryptSubmitted = g.decryptGuess !== null;
      state.interceptSubmitted = g.interceptGuess !== null;
      state.needIntercept = g.round >= 2;
    }

    // Reveal info
    if (g.phase === 'REVEAL' || g.phase === 'GAME_OVER') {
      state.revealCode = g.code;
      state.decryptGuess = g.decryptGuess;
      state.interceptGuess = g.interceptGuess;

      const lastHistory = g.history[g.history.length - 1];
      if (lastHistory) {
        state.decryptCorrect = lastHistory.decryptCorrect;
        state.interceptCorrect = lastHistory.interceptCorrect;
      }
    }

    // Game over
    if (g.phase === 'GAME_OVER') {
      state.winner = g.interceptorTokens >= 2 ? 'interceptor' : 'encryptors';
      state.allKeywords = g.keywords;
    }

    return state;
  }

  sanitizeTeam(viewerId, base) {
    const g = this.game;
    const myTeam = this.getPlayerTeam(viewerId);
    const oppTeamKey = myTeam === 'A' ? 'B' : 'A';

    const encryptorA = g.teams.A.playerIds[g.teams.A.encryptorIndex % g.teams.A.playerIds.length];
    const encryptorB = g.teams.B.playerIds[g.teams.B.encryptorIndex % g.teams.B.playerIds.length];

    let myRole = 'guesser';
    if (myTeam === 'A' && viewerId === encryptorA) myRole = 'encryptor';
    if (myTeam === 'B' && viewerId === encryptorB) myRole = 'encryptor';

    const state = {
      ...base,
      phase: g.phase,
      mode: 'team',
      round: g.round,
      maxRounds: g.maxRounds,
      currentTeamTurn: g.currentTeamTurn,
      myTeam,
      myRole,
      timerEnd: g.timerEnd,

      teamA: {
        playerIds: g.teams.A.playerIds,
        players: g.teams.A.playerIds.map(id => ({ id, name: this.getPlayerName(id) })),
        interceptions: g.teams.A.interceptions,
        miscommunications: g.teams.A.miscommunications,
        encryptorId: encryptorA,
        cluesSubmitted: g.teams.A.cluesSubmitted,
      },
      teamB: {
        playerIds: g.teams.B.playerIds,
        players: g.teams.B.playerIds.map(id => ({ id, name: this.getPlayerName(id) })),
        interceptions: g.teams.B.interceptions,
        miscommunications: g.teams.B.miscommunications,
        encryptorId: encryptorB,
        cluesSubmitted: g.teams.B.cluesSubmitted,
      },

      keywords: myTeam ? g.teams[myTeam].keywords : null,
      myHistory: myTeam ? g.history[myTeam] : [],
      opponentHistory: myTeam ? g.history[oppTeamKey] : [],
    };

    // Code: only own team's encryptor sees during ENCRYPT
    if (g.phase === 'ENCRYPT' && myRole === 'encryptor') {
      state.code = g.teams[myTeam].code;
    }

    // Clues & guessing status during GUESS phases
    const turnTeam = g.currentTeamTurn;
    if (turnTeam && (g.phase === `GUESS_${turnTeam}` || g.phase === `REVEAL_${turnTeam}`)) {
      state.currentClues = g.teams[turnTeam].clues;

      const ownTeam = g.teams[turnTeam];
      const oppTeam = g.teams[turnTeam === 'A' ? 'B' : 'A'];

      state.decryptSubmitted = ownTeam.decryptGuess !== null;
      state.interceptSubmitted = oppTeam.interceptGuess !== null;
      state.needIntercept = g.round >= 2;
    }

    // Reveal info
    if (turnTeam && g.phase === `REVEAL_${turnTeam}`) {
      const ownTeam = g.teams[turnTeam];
      const oppTeam = g.teams[turnTeam === 'A' ? 'B' : 'A'];
      const histArr = g.history[turnTeam];
      const last = histArr[histArr.length - 1];

      state.revealCode = ownTeam.code;
      state.decryptGuess = ownTeam.decryptGuess;
      state.interceptGuess = oppTeam.interceptGuess;

      if (last) {
        state.decryptCorrect = last.decryptCorrect;
        state.interceptCorrect = last.interceptCorrect;
      }
    }

    // Game over
    if (g.phase === 'GAME_OVER') {
      state.winner = g.winner;
      state.allKeywords = {
        A: g.teams.A.keywords,
        B: g.teams.B.keywords,
      };
    }

    return state;
  }
}
