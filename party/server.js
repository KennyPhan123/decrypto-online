import { Server, routePartykitRequest } from "partyserver";
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

export class DecryptoServer extends Server {
  constructor(ctx, env) {
    super(ctx, env);
    this.players = [];
    this.connToPlayerId = new Map();
    this.playerToConnId = new Map();
    this.game = null;
  }

  onConnect(connection, ctx) {
    // Wait for 'join' message
  }

  onMessage(connection, message) {
    let data;
    try { data = JSON.parse(message); } catch { return; }
    
    let playerId = this.connToPlayerId.get(connection.id);

    if (data.type === 'join') {
      playerId = data.playerId;
      if (!playerId) return;
      this.connToPlayerId.set(connection.id, playerId);
      this.playerToConnId.set(playerId, connection.id);
      
      const existingPlayer = this.players.find(p => p.id === playerId);
      if (existingPlayer) {
        existingPlayer.isOnline = true;
        existingPlayer.name = (data.name || 'Người chơi').trim().slice(0, 20);
        this.broadcastState();
        return;
      }
    } else if (data.type === 'leave') {
      const idx = this.players.findIndex(p => p.id === playerId);
      if (idx !== -1) {
        const wasHost = this.players[idx].isHost;
        this.players.splice(idx, 1);
        if (this.players.length > 0 && wasHost) this.players[0].isHost = true;
      }
      this.connToPlayerId.delete(connection.id);
      this.playerToConnId.delete(playerId);
      if (this.players.length === 0) this.game = null;
      this.broadcastState();
      return;
    } else if (data.type === 'kick') {
      const p = this.players.find(pl => pl.id === playerId);
      if (!p || !p.isHost) return;
      
      const kickId = data.targetId;
      const kickIdx = this.players.findIndex(pl => pl.id === kickId);
      if (kickIdx !== -1) {
        this.players.splice(kickIdx, 1);
        const kickConnId = this.playerToConnId.get(kickId);
        if (kickConnId) {
          const c = this.getConnection(kickConnId);
          if (c) this.sendError(c, 'Bạn đã bị kick khỏi phòng!');
          this.connToPlayerId.delete(kickConnId);
        }
        this.playerToConnId.delete(kickId);
        if (this.players.length === 0) this.game = null;
        this.broadcastState();
      }
      return;
    }

    if (!playerId) return;

    // Mock sender so we don't have to rewrite everything
    const sender = { id: playerId };

    switch (data.type) {
      case 'join': this.handleJoin(sender, data); break;
      case 'switch-team': this.handleSwitchTeam(sender, data); break;
      case 'start': this.handleStart(sender); break;
      case 'submit-clues': this.handleSubmitClues(sender, data); break;
      case 'submit-guess': this.handleSubmitGuess(sender, data); break;
      case 'unsubmit-guess': this.handleUnsubmitGuess(sender, data); break;
      case 'chat-msg': this.handleChatMsg(sender, data); break;
      case 'wire-sync': this.handleWireSync(sender, data); break;
      case 'update-connections': this.handleUpdateConnections(sender, data); break;
      case 'toggle-ready': this.handleToggleReady(sender, data); break;
      case 'continue': this.handleContinue(sender); break;
      case 'play-again': this.handlePlayAgain(sender); break;
      default: break;
    }
  }

  onClose(connection) {
    const playerId = this.connToPlayerId.get(connection.id);
    if (!playerId) return;

    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.isOnline = false;
    }

    this.connToPlayerId.delete(connection.id);
    // Let PartyKit naturally hibernate/destroy the room after a timeout of zero connections

    this.broadcastState();
  }

  // ── Join / Start ─────────────────────────────────────────

  handleJoin(sender, data) {
    if (this.game && this.game.phase !== 'LOBBY') {
      const cId = this.playerToConnId.get(sender.id);
      if (cId) this.sendError(this.getConnection(cId), 'Game đang diễn ra, không thể tham gia.');
      return;
    }

    if (data.isCreating === false && this.players.length === 0) {
      const cId = this.playerToConnId.get(sender.id);
      if (cId) this.sendError(this.getConnection(cId), 'Phòng này không tồn tại!');
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
      isOnline: true,
    });

    this.broadcastState();
  }

  handleSwitchTeam(sender, data) {
    if (this.game) return;
    const player = this.players.find(p => p.id === sender.id);
    if (!player) return;

    const targetTeam = data.target || (player.team === 'A' ? 'B' : 'A');
    if (targetTeam !== 'A' && targetTeam !== 'B') return;
    
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

    const countA = this.players.filter(p => p.team === 'A').length;
    const countB = this.players.filter(p => p.team === 'B').length;

    if (count === 3) {
      if (countA !== 2 || countB !== 1) {
        this.broadcastError('Để bắt đầu chế độ 3 người, Đội Mã Hóa phải có đúng 2 người và Kẻ Chặn Mã phải có 1 người.');
        return;
      }
    } else {
      if (Math.abs(countA - countB) > 1) {
        this.broadcastError('Đội hình chưa cân bằng! Vui lòng chia lại sao cho số lượng 2 đội chênh lệch không quá 1 người.');
        return;
      }
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
      chat: [],
      decryptConnections: [null, null, null],
      decryptReady: [],
      interceptConnections: [null, null, null],
      interceptReady: [],
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
    g.chat = [];
    g.decryptConnections = [null, null, null];
    g.decryptReady = [];
    g.interceptConnections = [null, null, null];
    g.interceptReady = [];
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
          chat: [],
          decryptConnections: [null, null, null],
          decryptReady: [],
          interceptConnections: [null, null, null],
          interceptReady: [],
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
          chat: [],
          decryptConnections: [null, null, null],
          decryptReady: [],
          interceptConnections: [null, null, null],
          interceptReady: [],
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
      team.chat = [];
      team.decryptConnections = [null, null, null];
      team.decryptReady = [];
      team.interceptConnections = [null, null, null];
      team.interceptReady = [];
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

  handleUnsubmitGuess(sender, data) {
    const g = this.game;
    if (!g) return;
    
    const guessType = data.guessType;
    
    if (g.mode === '3p') {
      if (g.phase !== 'GUESS') return;
      if (guessType === 'decrypt') {
        const otherEncryptor = g.encryptors.find(id => id !== g.encryptors[g.encryptorIndex]);
        if (sender.id !== otherEncryptor) return;
        g.decryptGuess = null;
        g.decryptReady = [];
      } else if (guessType === 'intercept') {
        if (sender.id !== g.interceptorId) return;
        g.interceptGuess = null;
        g.interceptReady = [];
      }
    } else {
      const turnTeam = g.currentTeamTurn;
      if (!turnTeam) return;
      if (g.phase !== `GUESS_${turnTeam}`) return;
      
      const opponentTeam = turnTeam === 'A' ? 'B' : 'A';
      const playerTeam = this.getPlayerTeam(sender.id);
      
      if (guessType === 'decrypt' && playerTeam === turnTeam) {
        g.teams[turnTeam].decryptGuess = null;
        g.teams[turnTeam].decryptReady = [];
      } else if (guessType === 'intercept' && playerTeam === opponentTeam) {
        g.teams[opponentTeam].interceptGuess = null;
        g.teams[opponentTeam].interceptReady = [];
      }
    }
    this.broadcastState();
  }

  // ── Chat & Wire Sync ─────────────────────────────────────

  handleChatMsg(sender, data) {
    const g = this.game;
    if (!g) return;

    const team = this.getPlayerTeam(sender.id);
    if (!team && g.mode !== '3p') return;

    const msg = {
      senderName: this.players.find(p => p.id === sender.id)?.name || 'Unknown',
      text: data.text,
    };

    if (g.mode === '3p') {
      g.chat.push(msg);
    } else {
      g.teams[team].chat.push(msg);
    }

    this.broadcastState();
  }

  handleWireSync(sender, data) {
    const g = this.game;
    if (!g) return;

    const team = this.getPlayerTeam(sender.id);
    
    for (const p of this.players) {
      if (p.id === sender.id) continue; // Don't send back to sender
      
      const pTeam = this.getPlayerTeam(p.id);
      
      let shouldSend = false;
      if (g.mode === '3p') {
        const isSenderEncryptor = g.encryptors[g.encryptorIndex] === sender.id;
        const isPEncryptor = g.encryptors[g.encryptorIndex] === p.id;
        if (!isSenderEncryptor && !isPEncryptor) {
          shouldSend = true;
        }
      } else {
        if (team && team === pTeam) {
          if (team === g.currentTeamTurn) {
            const encId = g.teams[team].playerIds[g.teams[team].encryptorIndex % g.teams[team].playerIds.length];
            if (p.id !== encId) {
              shouldSend = true;
            }
          } else {
            shouldSend = true;
          }
        }
      }

      if (shouldSend) {
        const conn = this.getConnection(p.id);
        if (conn) {
          conn.send(JSON.stringify({
            type: 'wire-sync-forward',
            senderId: sender.id,
            senderName: this.players.find(pl => pl.id === sender.id)?.name || 'Unknown',
            syncData: data.syncData
          }));
        }
      }
    }
  }

  handleUpdateConnections(sender, data) {
    const g = this.game;
    if (!g) return;
    
    const guessType = data.guessType; // 'decrypt' or 'intercept'
    
    if (g.mode === '3p') {
      if (guessType === 'decrypt') {
        g.decryptConnections = data.connections;
        g.decryptReady = [];
      } else if (guessType === 'intercept') {
        g.interceptConnections = data.connections;
        g.interceptReady = [];
      }
    } else {
      const turnTeam = g.currentTeamTurn;
      if (!turnTeam) return;
      const opponentTeam = turnTeam === 'A' ? 'B' : 'A';
      const playerTeam = this.getPlayerTeam(sender.id);
      
      if (guessType === 'decrypt' && playerTeam === turnTeam) {
        g.teams[turnTeam].decryptConnections = data.connections;
        g.teams[turnTeam].decryptReady = [];
      } else if (guessType === 'intercept' && playerTeam === opponentTeam) {
        g.teams[opponentTeam].interceptConnections = data.connections;
        g.teams[opponentTeam].interceptReady = [];
      }
    }
    
    this.broadcastState();
  }

  handleToggleReady(sender, data) {
    const g = this.game;
    if (!g) return;
    
    const guessType = data.guessType; // 'decrypt' or 'intercept'
    const isReady = data.isReady;
    
    let targetReadyArray = null;
    let targetConnections = null;
    let targetTeamObj = null;
    let requiredCount = 1;
    
    if (g.mode === '3p') {
      if (guessType === 'decrypt') {
        targetReadyArray = g.decryptReady;
        targetConnections = g.decryptConnections;
        requiredCount = 1;
      } else if (guessType === 'intercept') {
        targetReadyArray = g.interceptReady;
        targetConnections = g.interceptConnections;
        requiredCount = 1;
      }
    } else {
      const turnTeam = g.currentTeamTurn;
      if (!turnTeam) return;
      const opponentTeam = turnTeam === 'A' ? 'B' : 'A';
      const playerTeam = this.getPlayerTeam(sender.id);
      
      if (guessType === 'decrypt' && playerTeam === turnTeam) {
        targetReadyArray = g.teams[turnTeam].decryptReady;
        targetConnections = g.teams[turnTeam].decryptConnections;
        targetTeamObj = g.teams[turnTeam];
      } else if (guessType === 'intercept' && playerTeam === opponentTeam) {
        targetReadyArray = g.teams[opponentTeam].interceptReady;
        targetConnections = g.teams[opponentTeam].interceptConnections;
        targetTeamObj = g.teams[opponentTeam];
      }
      
      if (targetTeamObj) {
        const teamName = targetTeamObj === g.teams.A ? 'A' : 'B';
        const activeMembers = this.players.filter(p => p.team === teamName).length;
        if (teamName === turnTeam) {
          requiredCount = Math.max(1, activeMembers - 1);
        } else {
          requiredCount = Math.max(1, activeMembers);
        }
      }
    }
    
    if (!targetReadyArray) return;
    
    if (isReady && !targetReadyArray.includes(sender.id)) {
      targetReadyArray.push(sender.id);
    } else if (!isReady) {
      const idx = targetReadyArray.indexOf(sender.id);
      if (idx !== -1) targetReadyArray.splice(idx, 1);
    }
    
    if (targetReadyArray.length >= requiredCount) {
      this.handleSubmitGuess(sender, { guess: targetConnections, guessType });
      return;
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

  broadcastError(message) {
    for (const conn of this.getConnections()) {
      conn.send(JSON.stringify({ type: 'error', message }));
    }
  }

  broadcastState() {
    this.players.forEach(p => {
      const connId = this.playerToConnId.get(p.id);
      const conn = connId ? this.getConnection(connId) : null;
      if (conn && p.isOnline) {
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
        roomCode: this.name,
        myId: viewerId,
        players: this.players,
      };
    }
    const base = {
      roomCode: this.name,
      players: this.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, team: p.team, isOnline: p.isOnline })),
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

    if (!isCurrentEncryptor) {
      state.chat = g.chat;
      state.decryptConnections = g.decryptConnections;
      state.decryptReady = g.decryptReady;
      state.interceptConnections = g.interceptConnections;
      state.interceptReady = g.interceptReady;
    }

    // Calculate active guessers count for 3P
    if (!isCurrentEncryptor) {
      if (state.myRole === 'guesser') {
        const otherEncryptorId = g.encryptors.find(id => id !== currentEncryptorId);
        state.activeGuessersCount = (this.players.some(p => p.id === otherEncryptorId)) ? 1 : 1;
      } else if (state.myRole === 'interceptor') {
        state.activeGuessersCount = 1;
      }
    }

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
    if (myTeam === 'A' && viewerId === encryptorA) {
      if (g.phase === 'ENCRYPT' || g.currentTeamTurn === 'A' || !g.currentTeamTurn) myRole = 'encryptor';
    }
    if (myTeam === 'B' && viewerId === encryptorB) {
      if (g.phase === 'ENCRYPT' || g.currentTeamTurn === 'B' || !g.currentTeamTurn) myRole = 'encryptor';
    }

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

    if (myTeam && myTeam !== 'none' && myRole !== 'encryptor') {
      state.chat = g.teams[myTeam].chat;
      state.decryptConnections = g.teams[myTeam].decryptConnections;
      state.decryptReady = g.teams[myTeam].decryptReady;
      state.interceptConnections = g.teams[myTeam].interceptConnections;
      state.interceptReady = g.teams[myTeam].interceptReady;
      
      // Calculate active guessers count for this team
      const onlineTeamMembers = this.players.filter(p => p.team === myTeam && p.isOnline).length;
      if (g.currentTeamTurn === myTeam || (!g.currentTeamTurn && myRole === 'encryptor')) {
        state.activeGuessersCount = Math.max(1, onlineTeamMembers - 1);
      } else {
        state.activeGuessersCount = Math.max(1, onlineTeamMembers);
      }
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

export default {
  async fetch(request, env, ctx) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  }
}
