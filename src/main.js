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

// ── Home Screen Sub-menus ───────────────────────────────────

function showHomeMenu(menuId) {
  $('menu-main').style.display = 'none';
  $('menu-create').style.display = 'none';
  $('menu-join').style.display = 'none';
  $(menuId).style.display = 'flex';
}

$('btn-menu-create').addEventListener('click', () => {
  showHomeMenu('menu-create');
  $('create-name').focus();
});

$('btn-menu-join').addEventListener('click', () => {
  showHomeMenu('menu-join');
  $('join-name').focus();
});

$('btn-back-create').addEventListener('click', () => showHomeMenu('menu-main'));
$('btn-back-join').addEventListener('click', () => showHomeMenu('menu-main'));

// ── Room Actions ────────────────────────────────────────────

$('btn-create').addEventListener('click', () => {
  const name = $('create-name').value.trim();
  if (!name) { showToast('Vui lòng nhập tên'); return; }
  const code = generateCode();
  connect(code, name);
  showScreen('lobby-screen');
});

$('btn-join').addEventListener('click', () => {
  const name = $('join-name').value.trim();
  const code = $('join-code').value.trim().toUpperCase();
  if (!name) { showToast('Vui lòng nhập tên'); return; }
  if (!code || code.length < 4) { showToast('Vui lòng nhập mã phòng'); return; }
  connect(code, name);
  showScreen('lobby-screen');
});

$('create-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btn-create').click();
});

$('join-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if ($('join-code').value.trim()) $('btn-join').click();
    else $('join-code').focus();
  }
});

$('join-code').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btn-join').click();
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

$('team-a-col').addEventListener('click', () => send({ type: 'switch-team', target: 'A' }));
$('team-b-col').addEventListener('click', () => send({ type: 'switch-team', target: 'B' }));

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
  showHomeMenu('menu-main');
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
    window.currentActionState = null;
    renderLobby();
    showScreen('lobby-screen');
  } else if (state.phase === 'GAME_OVER') {
    window.currentActionState = null;
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

  // Mode info & Team headers
  if (count < 3) {
    $('lobby-mode-info').textContent = `${count} người chơi — Cần ít nhất 3 người`;
    $('team-a-title').textContent = 'Đội A';
    $('team-b-title').textContent = 'Đội B';
  } else if (count === 3) {
    $('lobby-mode-info').textContent = `3 người chơi — Chế độ độc lập`;
    $('team-a-title').textContent = 'Đội Mã Hóa (Cần 2)';
    $('team-b-title').textContent = 'Kẻ Chặn Mã (Cần 1)';
  } else {
    $('lobby-mode-info').textContent = `${count} người chơi — Chế độ đội`;
    $('team-a-title').textContent = 'Đội A';
    $('team-b-title').textContent = 'Đội B';
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

  let viewState = `${s.phase}_${s.round}_${s.currentTeamTurn}_${s.myRole}_${s.myTeam}`;
  
  if (s.phase === 'ENCRYPT') {
    const hasSubmitted = s.mode === '3p' ? s.cluesSubmitted : (s.myTeam ? s['team' + s.myTeam].cluesSubmitted : false);
    viewState += `_clues_${hasSubmitted}`;
  } else if (s.phase.startsWith('GUESS')) {
    let mySub = false;
    if (s.myRole !== 'encryptor') {
      if (s.mode === '3p') {
        mySub = s.myRole === 'interceptor' ? s.interceptSubmitted : s.decryptSubmitted;
      } else {
        const isMyTeamTurn = s.myTeam === s.currentTeamTurn;
        mySub = isMyTeamTurn ? s.decryptSubmitted : s.interceptSubmitted;
      }
    }
    viewState += `_sub_${mySub}`;
  }

  if (window.currentActionState === viewState) {
    return;
  }
  window.currentActionState = viewState;

  if (s.phase === 'ENCRYPT') {
    renderEncryptPhase(area);
  } else if (s.phase.startsWith('GUESS')) {
    renderGuessPhase(area);
  } else if (s.phase.startsWith('REVEAL')) {
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
            <input type="text" class="clue-input" id="clue-${i}" placeholder="Gợi ý cho từ khóa số ${d}..." autocomplete="off" style="border: 2px solid ${KW_COLORS[d - 1]}; padding: 14px;" />
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

    // Enter key navigation
    [0, 1, 2].forEach(i => {
      const input = $(`clue-${i}`);
      if (!input) return;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (i < 2) {
            $(`clue-${i + 1}`)?.focus();
          } else {
            $('btn-submit-clues')?.click();
          }
        }
      });
    });
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

  if (s.mode === '3p') {
    html += renderGuess3P(clues);
  } else {
    html += renderGuessTeam(clues);
  }

  area.innerHTML = html;
  attachGuessHandlers();
}

function renderCluesOnly(clues) {
  return `
    <div class="clues-display fade-in" style="margin-bottom:14px">
      <div class="clues-display-header">Gợi ý</div>
      ${clues.map((c, i) => `
        <div class="clue-display-item">
          <div class="clue-number" style="background:var(--text-muted)">${['A', 'B', 'C'][i]}</div>
          <span>${esc(c)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderGuess3P(clues) {
  const s = state;
  let html = '';

  if (s.myRole === 'encryptor' && s.currentEncryptorId === s.myId) {
    html += renderCluesOnly(clues);
    html += `<div class="waiting-indicator">Bạn là người mã hóa — Hãy chờ đồng đội đoán</div>`;
  } else if (s.myRole === 'interceptor') {
    if (s.round < 2) {
      html += renderCluesOnly(clues);
      html += `<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>`;
      if (!s.decryptSubmitted) {
        html += `<div class="waiting-indicator">Đang chờ đội mã hóa đoán<span class="waiting-dots"></span></div>`;
      }
    } else if (s.interceptSubmitted) {
      html += renderCluesOnly(clues);
      html += `<div class="guess-submitted">Bạn đã gửi dự đoán<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('intercept', 'Chặn mã', clues, null);
    }
  } else {
    if (s.decryptSubmitted) {
      html += renderCluesOnly(clues);
      html += `<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('decrypt', 'Giải mã', clues, s.keywords);
    }
  }

  return html;
}

function renderGuessTeam(clues) {
  const s = state;
  const turnTeam = s.currentTeamTurn;
  const isMyTeamTurn = s.myTeam === turnTeam;
  const oppTeam = turnTeam === 'A' ? 'B' : 'A';
  let html = '';

  if (isMyTeamTurn) {
    const teamData = turnTeam === 'A' ? s.teamA : s.teamB;
    const isEncryptor = teamData.encryptorId === s.myId;

    if (isEncryptor) {
      html += renderCluesOnly(clues);
      html += `<div class="waiting-indicator">Bạn là người mã hóa — Không được gợi ý</div>`;
    } else if (s.decryptSubmitted) {
      html += renderCluesOnly(clues);
      html += `<div class="guess-submitted">Đội bạn đã gửi dự đoán. Đang chờ đội ${oppTeam}<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('decrypt', 'Giải mã', clues, teamData.keywords);
    }
  } else {
    if (s.round < 2) {
      html += renderCluesOnly(clues);
      html += `<div class="waiting-indicator">Vòng 1 — Chưa thể chặn mã</div>`;
    } else if (s.interceptSubmitted) {
      html += renderCluesOnly(clues);
      html += `<div class="guess-submitted">Đội bạn đã gửi dự đoán<span class="waiting-dots"></span></div>`;
    } else {
      html += renderGuessForm('intercept', 'Chặn mã', clues, null);
    }
  }

  return html;
}

function renderGuessForm(guessType, title, clues, keywords) {
  return `
    <div class="guess-section fade-in">
      <div class="guess-section-title">${title}</div>
      <div class="wire-task-container" id="wire-task">
        <svg class="wire-svg" id="wire-svg"></svg>
        <div class="wire-col left-col">
          ${[0, 1, 2].map(i => `
            <div class="wire-item">
              <div class="wire-box left-node" data-clue="${i}">
                <span>${esc(clues[i])}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="wire-col right-col">
          ${[1, 2, 3, 4].map(num => `
            <div class="wire-item">
              <div class="wire-box right-node" data-val="${num}" style="border-color:${KW_COLORS[num-1]}; color:${KW_COLORS[num-1]}">
                <span class="kw-number" style="background:${KW_COLORS[num-1]}">${num}</span>
                ${keywords ? `<span style="color:var(--text)">${esc(keywords[num-1])}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-primary" id="btn-submit-guess" data-type="${guessType}" disabled style="width:100%">Gửi</button>
    </div>
  `;
}

function attachGuessHandlers() {
  const btn = $('btn-submit-guess');
  if (!btn) return;

  const container = $('wire-task');
  const svg = $('wire-svg');
  if (!container || !svg) return;

  const leftNodes = document.querySelectorAll('.left-node');
  const rightNodes = document.querySelectorAll('.right-node');
  
  const connections = { 0: null, 1: null, 2: null };
  let activeStartNode = null;
  let activeLine = null;

  function updateLines() {
    svg.innerHTML = '';
    const cRect = container.getBoundingClientRect();
    
    // Draw active line
    if (activeLine) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', activeLine.x1);
      line.setAttribute('y1', activeLine.y1);
      line.setAttribute('x2', activeLine.x2);
      line.setAttribute('y2', activeLine.y2);
      line.setAttribute('stroke', 'var(--text-muted)');
      line.setAttribute('stroke-width', '4');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }

    const KW_BG = ['var(--kw-1-bg)', 'var(--kw-2-bg)', 'var(--kw-3-bg)', 'var(--kw-4-bg)'];

    // Draw connected lines
    rightNodes.forEach(rn => {
      rn.classList.remove('connected');
      rn.style.backgroundColor = '';
    });

    for (let i = 0; i < 3; i++) {
      const num = connections[i];
      const lNode = leftNodes[i];
      if (num) {
        const rNode = Array.from(rightNodes).find(n => parseInt(n.dataset.val) === num);
        if (lNode && rNode) {
          const lRect = lNode.getBoundingClientRect();
          const rRect = rNode.getBoundingClientRect();
          
          let lX, lY, rX, rY;
          // Connect from right edge of left box to left edge of right box
          lX = lRect.right - cRect.left;
          lY = lRect.top + lRect.height/2 - cRect.top;
          
          rX = rRect.left - cRect.left;
          rY = rRect.top + rRect.height/2 - cRect.top;
          
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', lX);
          line.setAttribute('y1', lY);
          line.setAttribute('x2', rX);
          line.setAttribute('y2', rY);
          line.setAttribute('stroke', rNode.style.color);
          line.setAttribute('stroke-width', '6');
          line.setAttribute('stroke-linecap', 'round');
          svg.appendChild(line);
          
          lNode.classList.add('connected');
          lNode.style.borderColor = rNode.style.color;
          lNode.style.backgroundColor = KW_BG[num-1];

          rNode.classList.add('connected');
          rNode.style.backgroundColor = KW_BG[num-1];
        }
      } else {
        lNode.classList.remove('connected');
        lNode.style.borderColor = '';
        lNode.style.backgroundColor = '';
      }
    }
    
    btn.disabled = !(connections[0] && connections[1] && connections[2]);
  }

  container.addEventListener('pointerdown', e => {
    const node = e.target.closest('.left-node');
    if (!node) return;
    
    const clueIdx = parseInt(node.dataset.clue);
    connections[clueIdx] = null; // disconnect
    
    activeStartNode = node;
    const cRect = container.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    
    activeLine = {
      x1: nRect.right - cRect.left,
      y1: nRect.top + nRect.height/2 - cRect.top,
      x2: e.clientX - cRect.left,
      y2: e.clientY - cRect.top
    };
    
    updateLines();
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', e => {
    if (!activeStartNode) return;
    const cRect = container.getBoundingClientRect();
    activeLine.x2 = e.clientX - cRect.left;
    activeLine.y2 = e.clientY - cRect.top;
    updateLines();
  });

  container.addEventListener('pointerup', e => {
    if (!activeStartNode) return;
    container.releasePointerCapture(e.pointerId);
    
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    const rightNode = dropTarget?.closest('.right-node') || dropTarget?.closest('.wire-item')?.querySelector('.right-node');
    
    if (rightNode) {
      const clueIdx = parseInt(activeStartNode.dataset.clue);
      const val = parseInt(rightNode.dataset.val);
      
      // Disconnect other wires connected to this target
      for (let k in connections) {
        if (connections[k] === val) connections[k] = null;
      }
      
      connections[clueIdx] = val;
    }
    
    activeStartNode = null;
    activeLine = null;
    updateLines();
  });

  rightNodes.forEach(rn => {
    rn.addEventListener('click', () => {
      const num = parseInt(rn.dataset.val);
      const s = state;
      let hist = [];
      
      if (s.mode === '3p') {
        hist = s.history || [];
      } else {
        const isMyTeamTurn = s.myTeam === s.currentTeamTurn;
        hist = isMyTeamTurn ? s.myHistory || [] : s.opponentHistory || [];
      }
      
      const clueHistory = [];
      hist.forEach(entry => {
        const idx = entry.code.indexOf(num);
        if (idx !== -1) {
          clueHistory.push({ round: entry.round, text: entry.clues[idx] });
        }
      });

      if (clueHistory.length === 0) {
        showToast(`Từ khóa #${num} chưa có lịch sử`);
        return;
      }

      const html = clueHistory.map(c => `<div style="padding:8px 0; border-bottom:1px solid var(--border-light)">Vòng ${c.round}: <b style="font-size:1.1rem">${esc(c.text)}</b></div>`).join('');
      
      const dialog = document.createElement('dialog');
      dialog.style.padding = '20px';
      dialog.style.borderRadius = '12px';
      dialog.style.border = 'none';
      dialog.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
      dialog.style.width = '85%';
      dialog.style.maxWidth = '350px';
      dialog.style.background = 'var(--surface)';
      dialog.style.color = 'var(--text)';
      dialog.style.position = 'fixed';
      dialog.style.top = '50%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
      dialog.style.margin = '0';
      
      dialog.innerHTML = `
        <h3 style="margin-top:0; margin-bottom:16px; color:${KW_COLORS[num-1]}">Lịch sử Từ khóa #${num}</h3>
        <div style="margin-bottom:20px">${html}</div>
        <button class="btn btn-primary" style="width:100%" onclick="this.closest('dialog').close()">Đóng</button>
      `;
      
      document.body.appendChild(dialog);
      dialog.showModal();
      dialog.addEventListener('close', () => dialog.remove());
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    });
  });

  window.addEventListener('resize', updateLines);
  setTimeout(updateLines, 50);

  btn.addEventListener('click', () => {
    if (!connections[0] || !connections[1] || !connections[2]) return;
    const guess = [connections[0], connections[1], connections[2]];
    const guessType = btn.dataset.type;

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
      <div class="reveal-title">Từ khóa đúng</div>
      <div class="reveal-code-row">
        ${s.revealCode.map((d, i) => `
          <div class="reveal-code-item">
            <div style="font-weight: 600; font-size: 1.1rem; color: var(--text)">${esc(currentClues[i])}</div>
            <div class="reveal-guess-arrow">→</div>
            <div class="code-digit" style="background:${KW_COLORS[d - 1]}">${d}</div>
          </div>
        `).join('')}
      </div>
  `;

  const renderGuessComparison = (guessArr) => {
    return guessArr.map((g, i) => {
      const isMatch = g === s.revealCode[i];
      const icon = isMatch 
        ? '<svg class="reveal-icon-correct" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg class="reveal-icon-wrong" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      return `
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="code-digit" style="background:${KW_COLORS[g - 1]}; transform: scale(0.8)">${g}</div>
          ${icon}
        </div>
      `;
    }).join('');
  };

  // Decrypt result
  if (s.decryptGuess) {
    const cls = s.decryptCorrect ? 'result-correct' : 'result-incorrect';
    const label = s.decryptCorrect ? 'Giải mã thành công' : 'Giải mã thất bại';
    html += `
      <div class="reveal-result ${cls}">
        <span class="result-label">${label}</span>
        <div style="display:flex; gap:12px;">${renderGuessComparison(s.decryptGuess)}</div>
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
        <div style="display:flex; gap:12px;">${renderGuessComparison(s.interceptGuess)}</div>
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
