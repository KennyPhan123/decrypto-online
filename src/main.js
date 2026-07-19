import PartySocket from 'partysocket';

// ── State ───────────────────────────────────────────────────

let socket = null;
let state = null;
let timerInterval = null;

const KW_COLORS = ['var(--kw-1)', 'var(--kw-2)', 'var(--kw-3)', 'var(--kw-4)'];

// ── DOM Helpers ─────────────────────────────────────────────

const $ = id => document.getElementById(id);
const showScreen = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
};

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Connection ──────────────────────────────────────────────

function connect(roomCode, playerName) {
  const host = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.startsWith('192.168.') || location.hostname.startsWith('10.')
    ? location.host
    : `decrypto-online.kennyphan123.partykit.dev`;

  socket = new PartySocket({
    host: host,
    room: roomCode
  });

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join', name: playerName }));
  });

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'state') {
      state = data.state;
      render();
    } else if (data.type === 'error') {
      showToast(data.message);
    }
  });

  socket.addEventListener('close', () => {
    showToast('Mất kết nối. Tải lại trang để chơi lại.');
  });
}

function send(data) {
  if (socket) {
    socket.send(JSON.stringify(data));
  }
}

// ── Home Screen ─────────────────────────────────────────────

$('btn-create').addEventListener('click', () => {
  const name = $('player-name').value.trim();
  if (!name) { showToast('Vui lòng nhập tên'); return; }
  const code = generateCode();
  connect(code, name);
  showScreen('lobby-screen');
});

$('btn-join').addEventListener('click', () => {
  const name = $('player-name').value.trim();
  const code = $('room-code-input').value.trim().toUpperCase();
  if (!name) { showToast('Vui lòng nhập tên'); return; }
  if (!code || code.length < 4) { showToast('Vui lòng nhập mã phòng'); return; }
  connect(code, name);
  showScreen('lobby-screen');
});

$('player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if ($('room-code-input').value.trim()) $('btn-join').click();
    else $('room-code-input').focus();
  }
});

$('room-code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if ($('room-code-input').value.trim()) $('btn-join').click();
    else $('btn-create').click();
  }
});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Lobby ───────────────────────────────────────────────────

$('btn-copy-code').addEventListener('click', () => {
  const code = $('room-code-text').textContent;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code).then(() => showToast('Đã sao chép'));
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Đã sao chép');
    } catch (err) {
      showToast('Sao chép thất bại');
    }
    document.body.removeChild(textArea);
  }
});

$('btn-start').addEventListener('click', () => send({ type: 'start' }));

$('btn-switch-team').addEventListener('click', () => send({ type: 'switch-team' }));

// ── History Toggle ──────────────────────────────────────────

$('history-toggle').addEventListener('click', () => {
  $('history-panel').classList.toggle('open');
});

// ── Game Over ───────────────────────────────────────────────

$('btn-play-again').addEventListener('click', () => send({ type: 'play-again' }));

$('btn-back-home').addEventListener('click', () => {
  if (socket) socket.close();
  socket = null;
  state = null;
  showScreen('home-screen');
});

// ── Render ──────────────────────────────────────────────────

function render() {
  if (!state) return;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (state.phase === 'LOBBY') {
    renderLobby();
    showScreen('lobby-screen');
  } else if (state.phase === 'GAME_OVER') {
    renderGameOver();
    showScreen('gameover-screen');
  } else {
    renderGame();
    showScreen('game-screen');
    startTimer();
  }
}

function startTimer() {
  const s = state;
  const timerEl = $('topbar-timer');
  if (s.phase === 'ENCRYPT' && s.timerEnd) {
    timerEl.style.display = 'block';
    
    const updateTimer = () => {
      const remain = Math.max(0, Math.floor((s.timerEnd - Date.now()) / 1000));
      timerEl.textContent = remain + 's';
      if (remain <= 0) {
        clearInterval(timerInterval);
        const btn = $('btn-submit-clues');
        if (btn && !btn.disabled) btn.click();
      }
    };
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    timerEl.style.display = 'none';
  }
}

// ── Render Lobby ────────────────────────────────────────────

function renderLobby() {
  const s = state;
  $('room-code-text').textContent = s.roomCode;

  const isHost = s.players.find(p => p.id === s.myId)?.isHost;
  const count = s.players.length;

  // Mode info
  if (count < 3) {
    $('lobby-mode-info').textContent = `${count} người chơi — Cần ít nhất 3 người`;
  } else if (count === 3) {
    $('lobby-mode-info').textContent = `3 người chơi — Chế độ độc lập (Interceptor)`;
  } else {
    $('lobby-mode-info').textContent = `${count} người chơi — Chế độ đội`;
  }

  // Lobby Teams (pre-game)
  const teamA = s.players.filter(p => p.team === 'A');
  const teamB = s.players.filter(p => p.team === 'B');
  renderTeamList('team-a-list', teamA, s.myId);
  renderTeamList('team-b-list', teamB, s.myId);

  // Start button
  $('btn-start').style.display = isHost && count >= 3 ? 'block' : 'none';
  $('lobby-waiting').style.display = isHost ? 'none' : 'block';
}

function renderTeamList(ulId, players, myId) {
  $(ulId).innerHTML = players.map(p => `
    <li>${esc(p.name)}${p.id === myId ? ' (bạn)' : ''}${p.isHost ? ' <span class="lobby-player-host" style="font-size:10px; margin-left:4px;">Chủ phòng</span>' : ''}</li>
  `).join('');
}

// ── Render Game ─────────────────────────────────────────────

function renderGame() {
  const s = state;

  // Identity
  renderIdentity();

  // Round display
  $('round-display').textContent = `${s.round}/${s.maxRounds}`;

  // Tokens
  renderTokens();

  // Keywords
  renderKeywords();

  // Phase status
  renderPhaseStatus();

  // Action area
  renderActionArea();

  // History
  renderHistory();
}

function renderIdentity() {
  const s = state;
  const me = s.players.find(p => p.id === s.myId);
  if (!me) return;
  let identity = `<strong>${esc(me.name)}</strong>`;
  if (s.mode === '3p') {
     identity += s.myRole === 'interceptor' ? ' (Người chặn)' : ' (Đội mã hóa)';
  } else {
     identity += s.myTeam ? ` (Đội ${s.myTeam})` : ' (Khán giả)';
  }
  const el = $('player-identity');
  if (el) el.innerHTML = identity;
}

function renderTokens() {
  const s = state;
  const container = $('topbar-tokens');

  if (s.mode === '3p') {
    container.innerHTML = `
      <div class="token-3p">
        <span>Chặn: <strong>${s.interceptorTokens}</strong>/2</span>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="token-group token-group-a">
        <span class="token-team-label" style="color:var(--team-a)">A</span>
        <span class="token-item"><span class="token-count token-label-i">${s.teamA.interceptions}</span>C</span>
        <span class="token-item"><span class="token-count token-label-m">${s.teamA.miscommunications}</span>L</span>
      </div>
      <div class="token-group token-group-b">
        <span class="token-team-label" style="color:var(--team-b)">B</span>
        <span class="token-item"><span class="token-count token-label-i">${s.teamB.interceptions}</span>C</span>
        <span class="token-item"><span class="token-count token-label-m">${s.teamB.miscommunications}</span>L</span>
      </div>
    `;
  }
}

function renderKeywords() {
  const s = state;
  const panel = $('keywords-panel');

  if (s.keywords) {
    panel.style.display = 'block';
    $('keywords-list').innerHTML = s.keywords.map((kw, i) => `
      <div class="keyword-chip kw-${i + 1}">
        <span class="kw-number">${i + 1}</span>
        <span>${esc(kw)}</span>
      </div>
    `).join('');
  } else {
    panel.style.display = 'none';
  }
}

function renderPhaseStatus() {
  const s = state;
  let text = '';

  if (s.mode === '3p') {
    const encName = s.encryptors.find(e => e.id === s.currentEncryptorId)?.name || '';
    switch (s.phase) {
      case 'ENCRYPT':
        text = s.myRole === 'encryptor'
          ? 'Bạn là người mã hóa — Nhập gợi ý'
          : `Đang chờ ${encName} mã hóa...`;
        break;
      case 'GUESS':
        text = 'Đoán mã số';
        break;
      case 'REVEAL':
        text = 'Kết quả';
        break;
    }
  } else {
    const turn = s.currentTeamTurn;
    switch (s.phase) {
      case 'ENCRYPT':
        text = s.myRole === 'encryptor'
          ? 'Bạn là người mã hóa — Nhập gợi ý'
          : 'Đang chờ mã hóa...';
        break;
      case 'GUESS_A': case 'GUESS_B':
        text = `Đội ${turn} — Đoán mã số`;
        break;
      case 'REVEAL_A': case 'REVEAL_B':
        text = `Đội ${turn} — Kết quả`;
        break;
    }
  }

  $('phase-status').textContent = text;
}

function renderActionArea() {
  const s = state;
  const area = $('action-area');

  if (s.phase === 'ENCRYPT') {
    renderEncryptPhase(area);
  } else if (s.phase === 'GUESS' || s.phase === 'GUESS_A' || s.phase === 'GUESS_B') {
    renderGuessPhase(area);
  } else if (s.phase === 'REVEAL' || s.phase === 'REVEAL_A' || s.phase === 'REVEAL_B') {
    renderRevealPhase(area);
  }
}

// ── Encrypt Phase ───────────────────────────────────────────

function renderEncryptPhase(area) {
  const s = state;
  const hasSubmitted = s.mode === '3p' ? s.cluesSubmitted : (s.myTeam ? s['team' + s.myTeam].cluesSubmitted : false);

  if (s.myRole === 'encryptor' && s.code && !hasSubmitted) {
    area.innerHTML = `
      <div class="encrypt-code-display fade-in">
        <div class="encrypt-code-label">Mã số cần truyền đạt</div>
        <div class="encrypt-code-numbers">
          ${s.code.map(d => `<div class="code-digit" style="background:${KW_COLORS[d - 1]}">${d}</div>`).join('')}
        </div>
      </div>
      <div class="clue-inputs fade-in">
        ${s.code.map((d, i) => `
          <div class="clue-input-row">
            <div class="clue-number" style="background:${KW_COLORS[d - 1]}">${['A', 'B', 'C'][i]}</div>
            <input type="text" class="clue-input" id="clue-${i}" placeholder="Gợi ý cho từ khóa số ${d}..." autocomplete="off" />
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" id="btn-submit-clues">Gửi gợi ý</button>
    `;
    $('btn-submit-clues').addEventListener('click', (e) => {
      const isAuto = !e.isTrusted;
      let clues = [0, 1, 2].map(i => $(`clue-${i}`).value.trim());

      if (!isAuto && clues.some(c => !c)) {
        showToast('Vui lòng nhập đủ 3 gợi ý');
        return;
      }

      if (isAuto) {
        clues = clues.map(c => c || '(Hết giờ)');
      }

      send({ type: 'submit-clues', clues });

      area.innerHTML = `
        <div class="waiting-indicator fade-in">
          <p>Đang gửi gợi ý...<span class="waiting-dots"></span></p>
        </div>
      `;
    });

    // Auto-focus first input
    setTimeout(() => $('clue-0')?.focus(), 100);
  } else {
    // Waiting for encryptor(s)
    let waitText = '';
    if (s.mode === '3p') {
      const enc = s.encryptors.find(e => e.id === s.currentEncryptorId);
      waitText = `Đang chờ ${enc?.name || ''} nhập gợi ý`;
    } else {
      const submitted = [];
      if (s.teamA.cluesSubmitted) submitted.push('A');
      if (s.teamB.cluesSubmitted) submitted.push('B');
      if (submitted.length === 0) {
        waitText = 'Đang chờ cả 2 người mã hóa...';
      } else {
        const waiting = submitted.includes('A') ? 'B' : 'A';
        waitText = `Đội ${submitted[0]} đã xong. Đang chờ đội ${waiting}...`;
      }
    }

    area.innerHTML = `
      <div class="waiting-indicator fade-in">
        <p>${waitText}<span class="waiting-dots"></span></p>
      </div>
    `;
  }
}

// ── Guess Phase ─────────────────────────────────────────────

function renderGuessPhase(area) {
  const s = state;
  const clues = s.currentClues || s.clues;
  if (!clues) return;

  let html = '';

  // Show clues
  html += `
    <div class="clues-display fade-in">
      <div class="clues-display-header">Gợi ý</div>
      ${clues.map((c, i) => `
        <div class="clue-display-item">
          <div class="clue-number" style="background:var(--text-muted)">${['A', 'B', 'C'][i]}</div>
          <span>${esc(c)}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Determine what this player can do
  if (s.mode === '3p') {
    html += renderGuess3P();
  } else {
    html += renderGuessTeam();
  }

  area.innerHTML = html;
  attachGuessHandlers();
}

function renderGuess3P() {
  const s = state;
  let html = '';

  if (s.myRole === 'encryptor' && s.currentEncryptorId === s.myId) {
    // Current encryptor: just watch
    html += `<div class="waiting-indicator">Bạn là người mã hóa — Hãy chờ đồng đội đoán</div>`;
  } else if (s.myRole === 'interceptor') {
    if (s.round < 2) {
      html += `<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>`;
      // Still need to wait for decrypt
      if (!s.decryptSubmitted) {
        html += `<div class="waiting-indicator">Đang chờ đội mã hóa đoán<span class="waiting-dots"></span></div>`;
      }
    } else if (s.interceptSubmitted) {
      html += `<div class="guess-submitted">Bạn đã gửi dự đoán<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('intercept', 'Chặn mã');
    }
  } else {
    // Guesser (other encryptor)
    if (s.decryptSubmitted) {
      html += `<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('decrypt', 'Giải mã');
    }
  }

  return html;
}

function renderGuessTeam() {
  const s = state;
  const turnTeam = s.currentTeamTurn;
  const isMyTeamTurn = s.myTeam === turnTeam;
  const oppTeam = turnTeam === 'A' ? 'B' : 'A';
  let html = '';

  if (isMyTeamTurn) {
    // My team is decrypting
    const teamData = turnTeam === 'A' ? s.teamA : s.teamB;
    const isEncryptor = teamData.encryptorId === s.myId;

    if (isEncryptor) {
      html += `<div class="waiting-indicator">Bạn là người mã hóa — Không được gợi ý</div>`;
    } else if (s.decryptSubmitted) {
      html += `<div class="guess-submitted">Đội bạn đã gửi dự đoán. Đang chờ đội ${oppTeam}<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('decrypt', 'Giải mã');
    }
  } else {
    // My team is intercepting
    if (s.round < 2) {
      html += `<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>`;
    } else if (s.interceptSubmitted) {
      html += `<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('intercept', 'Chặn mã');
    }
  }

  return html;
}

function renderGuessForm(guessType, title) {
  return `
    <div class="guess-section fade-in">
      <div class="guess-section-title">${title}</div>
      <div class="guess-inputs">
        ${[0, 1, 2].map(i => `
          <div class="guess-select-group">
            <span class="guess-label">Gợi ý ${['A', 'B', 'C'][i]}</span>
            <select class="guess-select" id="guess-${i}" onchange="this.style.color = this.options[this.selectedIndex].style.color">
              <option value="">?</option>
              <option value="1" style="color:${KW_COLORS[0]}; font-weight:bold;">1</option>
              <option value="2" style="color:${KW_COLORS[1]}; font-weight:bold;">2</option>
              <option value="3" style="color:${KW_COLORS[2]}; font-weight:bold;">3</option>
              <option value="4" style="color:${KW_COLORS[3]}; font-weight:bold;">4</option>
            </select>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" id="btn-submit-guess" data-type="${guessType}">Gửi</button>
    </div>
  `;
}

function attachGuessHandlers() {
  const btn = $('btn-submit-guess');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const guessType = btn.dataset.type;
    const guess = [0, 1, 2].map(i => {
      const val = $(`guess-${i}`)?.value;
      return val ? parseInt(val) : 0;
    });

    if (guess.some(n => n < 1 || n > 4)) {
      showToast('Vui lòng chọn đủ 3 số');
      return;
    }

    send({ type: 'submit-guess', guess, guessType });
    btn.disabled = true;
    btn.textContent = 'Đã gửi';
  });
}

// ── Reveal Phase ────────────────────────────────────────────

function renderRevealPhase(area) {
  const s = state;
  const isHost = s.players.find(p => p.id === s.myId)?.isHost;

  let html = '';

  const currentClues = s.mode === '3p' ? s.clues : s.currentClues;

  // Correct code
  html += `
    <div class="reveal-section fade-in">
      <div class="reveal-title">Mã số đúng</div>
      <div class="reveal-code-row" style="flex-direction: column; gap: 8px;">
        ${s.revealCode.map((d, i) => `
          <div style="display: flex; align-items: center; gap: 12px; background: var(--surface-alt); padding: 8px 16px; border-radius: 8px; width: 100%; max-width: 300px; margin: 0 auto;">
            <div class="code-digit" style="background:${KW_COLORS[d - 1]}">${d}</div>
            <div style="color:${KW_COLORS[d - 1]}; font-weight: 600; font-size: 1.1rem">${esc(currentClues[i])}</div>
          </div>
        `).join('')}
      </div>
  `;

  const renderGuessDigits = (guessArr) => {
    return guessArr.map((g, i) => {
      const isMatch = g === s.revealCode[i];
      const color = isMatch ? 'var(--success)' : 'var(--error)';
      return `<div class="code-digit" style="background:${color}; transform: scale(0.8)">${g}</div>`;
    }).join('');
  };

  // Decrypt result
  if (s.decryptGuess) {
    const cls = s.decryptCorrect ? 'result-correct' : 'result-incorrect';
    const label = s.decryptCorrect ? 'Giải mã thành công' : 'Giải mã thất bại';
    html += `
      <div class="reveal-result ${cls}">
        <span class="result-label">${label}</span>
        <div style="display:flex; gap:4px; justify-content:center; margin-top:8px;">${renderGuessDigits(s.decryptGuess)}</div>
      </div>
    `;
  }

  // Intercept result
  if (s.interceptGuess) {
    const cls = s.interceptCorrect ? 'result-correct' : 'result-incorrect';
    const label = s.interceptCorrect ? 'Chặn mã thành công!' : 'Chặn mã thất bại';
    html += `
      <div class="reveal-result ${cls}">
        <span class="result-label">${label}</span>
        <div style="display:flex; gap:4px; justify-content:center; margin-top:8px;">${renderGuessDigits(s.interceptGuess)}</div>
      </div>
    `;
  } else if (s.round < 2 || (s.needIntercept === false)) {
    // No interception in round 1
  }

  html += `</div>`;

  // Continue button (host only)
  if (isHost) {
    html += `<button class="btn btn-primary" id="btn-continue">Tiếp tục</button>`;
  } else {
    html += `<div class="waiting-indicator">Đang chờ chủ phòng tiếp tục<span class="waiting-dots"></span></div>`;
  }

  area.innerHTML = html;

  $('btn-continue')?.addEventListener('click', () => {
    send({ type: 'continue' });
  });
}

// ── History ─────────────────────────────────────────────────

function renderHistory() {
  const s = state;
  const container = $('history-tables');

  if (s.mode === '3p') {
    renderHistory3P(container);
  } else {
    renderHistoryTeam(container);
  }
}

function renderHistory3P(container) {
  const s = state;
  const history = s.history || [];

  if (history.length === 0) {
    container.innerHTML = '<div class="history-empty">Chưa có lịch sử</div>';
    return;
  }

  // Build keyword-organized view
  const kwClues = { 1: [], 2: [], 3: [], 4: [] };
  const rounds = [];

  for (const entry of history) {
    rounds.push(entry.round);
    for (let i = 0; i < 3; i++) {
      const kwNum = entry.code[i];
      kwClues[kwNum].push({ round: entry.round, clue: entry.clues[i] });
    }
  }

  container.innerHTML = `
    <div class="history-section-label">Theo từ khóa</div>
    ${buildKeywordTable(kwClues, rounds)}
  `;
}

function renderHistoryTeam(container) {
  const s = state;
  const myHist = s.myHistory || [];
  const oppHist = s.opponentHistory || [];

  if (myHist.length === 0 && oppHist.length === 0) {
    container.innerHTML = '<div class="history-empty">Chưa có lịch sử</div>';
    return;
  }

  let html = '';

  // Opponent history (most important for interception)
  if (oppHist.length > 0) {
    const oppTeam = s.myTeam === 'A' ? 'B' : 'A';
    const kwClues = { 1: [], 2: [], 3: [], 4: [] };
    const rounds = [];

    for (const entry of oppHist) {
      rounds.push(entry.round);
      for (let i = 0; i < 3; i++) {
        const kwNum = entry.code[i];
        kwClues[kwNum].push({ round: entry.round, clue: entry.clues[i] });
      }
    }

    html += `<div class="history-section-label">Đội ${oppTeam} (đối phương)</div>`;
    html += buildKeywordTable(kwClues, rounds);
  }

  // Own history
  if (myHist.length > 0) {
    const kwClues = { 1: [], 2: [], 3: [], 4: [] };
    const rounds = [];

    for (const entry of myHist) {
      rounds.push(entry.round);
      for (let i = 0; i < 3; i++) {
        const kwNum = entry.code[i];
        kwClues[kwNum].push({ round: entry.round, clue: entry.clues[i] });
      }
    }

    html += `<div class="history-section-label">Đội ${s.myTeam} (đội bạn)</div>`;
    html += buildKeywordTable(kwClues, rounds);
  }

  container.innerHTML = html;
}

function buildKeywordTable(kwClues, rounds) {
  const uniqueRounds = [...new Set(rounds)].sort((a, b) => a - b);

  let html = `<table class="history-table"><thead><tr><th>Từ khóa</th>`;
  for (const r of uniqueRounds) {
    html += `<th class="kw-col-header">V${r}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (let kw = 1; kw <= 4; kw++) {
    html += `<tr style="color:${KW_COLORS[kw - 1]}"><td style="font-weight:600">#${kw}</td>`;
    for (const r of uniqueRounds) {
      const entry = kwClues[kw].find(e => e.round === r);
      html += `<td class="kw-cell">${entry ? esc(entry.clue) : '—'}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table>`;
  return html;
}

// ── Game Over ───────────────────────────────────────────────

function renderGameOver() {
  const s = state;
  const isHost = s.players.find(p => p.id === s.myId)?.isHost;

  if (s.mode === '3p') {
    if (s.winner === 'interceptor') {
      $('gameover-title').textContent = s.myRole === 'interceptor'
        ? 'Bạn đã thắng!' : 'Người chặn mã đã thắng!';
    } else {
      $('gameover-title').textContent = s.myRole === 'interceptor'
        ? 'Bạn đã thua!' : 'Đội mã hóa đã thắng!';
    }

    $('gameover-summary').innerHTML = `
      <p>Token chặn: ${s.interceptorTokens}/2</p>
      <p>Số vòng: ${s.round}/${s.maxRounds}</p>
    `;

    if (s.allKeywords) {
      $('gameover-keywords').innerHTML = `
        <div class="gameover-team-keywords">
          <div class="gameover-team-header" style="background:var(--surface-alt)">Từ khóa</div>
          <div class="gameover-kw-list">
            ${s.allKeywords.map((kw, i) => `
              <div class="keyword-chip kw-${i + 1}">
                <span class="kw-number">${i + 1}</span>
                <span>${esc(kw)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  } else {
    // Team mode
    if (s.winner === 'TIE') {
      $('gameover-title').textContent = 'Hòa!';
    } else {
      const winTeam = s.winner;
      const isMyTeamWin = s.myTeam === winTeam;
      $('gameover-title').textContent = isMyTeamWin
        ? `Đội bạn thắng! (Đội ${winTeam})`
        : `Đội ${winTeam} thắng!`;
    }

    $('gameover-summary').innerHTML = `
      <p>Đội A — Chặn: ${s.teamA.interceptions} | Lỗi: ${s.teamA.miscommunications}</p>
      <p>Đội B — Chặn: ${s.teamB.interceptions} | Lỗi: ${s.teamB.miscommunications}</p>
      <p>Số vòng: ${s.round}/${s.maxRounds}</p>
    `;

    if (s.allKeywords) {
      $('gameover-keywords').innerHTML = `
        <div class="gameover-team-keywords">
          <div class="gameover-team-header team-a-header">Từ khóa Đội A</div>
          <div class="gameover-kw-list">
            ${s.allKeywords.A.map((kw, i) => `
              <div class="keyword-chip kw-${i + 1}">
                <span class="kw-number">${i + 1}</span>
                <span>${esc(kw)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="gameover-team-keywords">
          <div class="gameover-team-header team-b-header">Từ khóa Đội B</div>
          <div class="gameover-kw-list">
            ${s.allKeywords.B.map((kw, i) => `
              <div class="keyword-chip kw-${i + 1}">
                <span class="kw-number">${i + 1}</span>
                <span>${esc(kw)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  $('btn-play-again').style.display = isHost ? 'block' : 'none';
}

// ── Escape HTML ─────────────────────────────────────────────

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
