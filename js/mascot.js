/* =========================================================
   virgilio.ia — o bardo Virgílio (mascote em pixel art)
   Desenhado pixel a pixel num <canvas>. Estados:
   idle (parado), talk (falando), play (tocando alaúde),
   think (pensando) e cheer (comemorando).
   ========================================================= */
(() => {
  'use strict';

  const W = 24, H = 33; // 32 linhas + 1 de folga para o "respirar"

  const PALETTE = {
    K: '#141a3a', // contorno
    H: '#2f6fdb', h: '#1d4aa3', // chapéu azul
    F: '#ffe08a', f: '#f2b632', // pena dourada
    S: '#f5cfa3', s: '#d9a072', // pele
    A: '#e0a447', a: '#a8722a', // cabelo
    E: '#141a3a', // olhos
    M: '#9c3b4a', m: '#5e1f2a', // boca
    C: '#6d3fc0', c: '#4a2a8a', // capa roxa
    T: '#2fa3c7', t: '#1f7c9c', // túnica azul-turquesa
    G: '#ffd35c', // botões dourados
    B: '#7a4a24', // cinto
    P: '#2a3270', // calça
    O: '#6b4325', // botas
    L: '#c98745', l: '#8f5626', W: '#3a2412', N: '#9a6634', Z: '#fff4d6' // alaúde
  };

  // Corpo base (sem alaúde, braços e boca, que são desenhados por cima)
  const BASE = [
    '........................',
    '..ff....................',
    '..fFf...................',
    '...fFf..KKKKK...........',
    '....fFfKHHHHHK..........',
    '.....fKHHHHHHHK.........',
    '......KHHHHHHHHK........',
    '....KKKhhhhhhhhKKK......',
    '...KHHHHHHHHHHHHHHK.....',
    '....KKKAAAAAAAAAKKK.....',
    '......KAASSSSSSAAK......',
    '......KASSSSSSSSAK......',
    '......KASESSSSESAK......',
    '......KASSSSSSSSAK......',
    '......KAsSSSSSSsAK......',
    '.......KsSSSSSSsK.......',
    '........KKssssKK........',
    '.....CCCKTTTTTTKCCC.....',
    '....CCCKTTTTTTTTKCCC....',
    '....CcCKTTTGTTTTKcCC....',
    '....CcKTTTTTTTTTTKcC....',
    '....CcKTTTTGTTTTTKcC....',
    '....CcKBBBBBBBBBBKcC....',
    '....CcKTTTTTTTTTTKcC....',
    '....CcCKTTTTTTTTKCcC....',
    '....CccKPPPPPPPPKccC....',
    '.....CcKPPPKKPPPKcC.....',
    '.....CCKPPPKKPPPKCC.....',
    '.......KPPPK.KPPPK......',
    '.......KOOOK.KOOOK......',
    '......KOOOOK.KOOOOK.....',
    '......KKKKKK.KKKKKK.....'
  ];

  function drawGrid(ctx, grid, oy) {
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch !== '.' && PALETTE[ch]) { ctx.fillStyle = PALETTE[ch]; ctx.fillRect(x, y + oy, 1, 1); }
      }
    });
  }
  const px = (ctx, x, y, c) => { ctx.fillStyle = PALETTE[c] || c; ctx.fillRect(x, y, 1, 1); };

  function drawLute(ctx, oy) {
    // braço (diagonal até a mão esquerda do bardo)
    const neck = [[12, 21], [13, 21], [14, 20], [15, 20], [16, 19], [17, 19], [18, 18], [19, 18], [20, 17], [21, 17]];
    neck.forEach(([x, y]) => { px(ctx, x, y + oy, 'N'); px(ctx, x, y + 1 + oy, 'l'); });
    px(ctx, 22, 16 + oy, 'l'); px(ctx, 22, 17 + oy, 'K'); px(ctx, 21, 16 + oy, 'K'); px(ctx, 23, 16 + oy, 'K'); // cravelhas
    // corpo (elipse)
    const cx = 9, cy = 23;
    for (let y = -3; y <= 3; y++) for (let x = -4; x <= 4; x++) {
      const d = (x * x) / 20 + (y * y) / 10;
      if (d <= 1) px(ctx, cx + x, cy + y + oy, d > 0.7 ? 'K' : (x + y < -1 ? 'L' : 'l'));
    }
    px(ctx, cx, cy + oy, 'W'); px(ctx, cx + 1, cy + oy, 'W'); px(ctx, cx, cy - 1 + oy, 'W'); px(ctx, cx + 1, cy - 1 + oy, 'W');
    px(ctx, cx - 2, cy - 2 + oy, 'Z'); // brilho
  }

  function drawArms(ctx, oy, strum) {
    // braço que segura o braço do alaúde (lado direito da tela)
    [[17, 18], [18, 19]].forEach(([x, y]) => px(ctx, x, y + oy, 'T'));
    px(ctx, 19, 17 + oy, 'S'); px(ctx, 20, 18 + oy, 'S');
    // braço que dedilha (alterna entre duas posições)
    const pts = strum ? [[7, 19], [7, 20], [8, 21]] : [[7, 19], [7, 20], [7, 21]];
    pts.forEach(([x, y]) => px(ctx, x, y + oy, 'T'));
    const hand = strum ? [10, 22] : [8, 22];
    px(ctx, hand[0], hand[1] + oy, 'S'); px(ctx, hand[0] + 1, hand[1] + oy, 'S'); px(ctx, hand[0], hand[1] + 1 + oy, 's');
  }

  function drawFace(ctx, oy, { mouth, blink, happy }) {
    if (blink) { px(ctx, 9, 12 + oy, 'a'); px(ctx, 14, 12 + oy, 'a'); }
    if (happy) { px(ctx, 9, 11 + oy, 'K'); px(ctx, 14, 11 + oy, 'K'); px(ctx, 9, 12 + oy, 'S'); px(ctx, 14, 12 + oy, 'S'); }
    // bochechas
    px(ctx, 8, 13 + oy, '#f2a7a0'); px(ctx, 15, 13 + oy, '#f2a7a0');
    if (mouth === 2) { px(ctx, 11, 14 + oy, 'm'); px(ctx, 12, 14 + oy, 'm'); px(ctx, 11, 15 + oy, 'M'); px(ctx, 12, 15 + oy, 'M'); }
    else if (mouth === 1) { px(ctx, 11, 14 + oy, 'm'); px(ctx, 12, 14 + oy, 'M'); }
    else { px(ctx, 11, 14 + oy, 'M'); px(ctx, 12, 14 + oy, 'M'); if (happy) { px(ctx, 10, 13 + oy, 'M'); px(ctx, 13, 13 + oy, 'M'); } }
  }

  function render(ctx, frame) {
    ctx.clearRect(0, 0, W, H);
    const oy = frame.bob ? 1 : 0;
    drawGrid(ctx, BASE, oy);
    drawLute(ctx, oy);
    drawArms(ctx, oy, frame.strum);
    drawFace(ctx, oy, frame);
  }

  /* ---------- Controlador de animação ---------- */
  const instances = [];
  let state = 'idle';
  let stateUntil = 0;
  let t0 = performance.now();

  function frameFor(now) {
    const t = now - t0;
    const f = { bob: false, strum: false, mouth: 0, blink: false, happy: false };
    const blinkCycle = t % 3400;
    f.blink = blinkCycle > 3250;
    if (state === 'idle') f.bob = Math.floor(t / 700) % 2 === 1;
    if (state === 'talk') { f.mouth = [0, 1, 2, 1][Math.floor(t / 110) % 4]; f.bob = Math.floor(t / 350) % 2 === 1; }
    if (state === 'play' || state === 'think') { f.strum = Math.floor(t / 160) % 2 === 1; f.bob = Math.floor(t / 320) % 2 === 1; f.happy = state === 'play'; }
    if (state === 'cheer') { f.happy = true; f.bob = Math.floor(t / 150) % 2 === 1; f.strum = Math.floor(t / 120) % 2 === 1; f.mouth = 2; }
    return f;
  }

  let lastNote = 0;
  function loop(now) {
    if (stateUntil && now > stateUntil) { state = 'idle'; stateUntil = 0; instances.forEach((i) => i.wrap?.setAttribute('data-state', 'idle')); }
    const f = frameFor(now);
    instances.forEach((i) => render(i.ctx, f));
    if ((state === 'play' || state === 'cheer') && now - lastNote > 420) { lastNote = now; instances.forEach(spawnNote); }
    requestAnimationFrame(loop);
  }

  function spawnNote(inst) {
    if (!inst.wrap || inst.noNotes) return;
    const n = document.createElement('span');
    n.className = 'bard-note';
    n.textContent = ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)];
    n.style.left = (55 + Math.random() * 35) + '%';
    n.style.setProperty('--drift', (Math.random() * 30 - 10) + 'px');
    inst.wrap.appendChild(n);
    setTimeout(() => n.remove(), 1600);
  }

  // Cria um bardo dentro de um elemento (wrap). size = largura em px.
  function mount(wrap, { size = 72, noNotes = false } = {}) {
    if (!wrap) return null;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.className = 'bard-canvas';
    canvas.style.width = size + 'px';
    canvas.style.height = Math.round(size * H / W) + 'px';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Virgílio, o bardo');
    wrap.appendChild(canvas);
    const inst = { ctx: canvas.getContext('2d'), wrap, noNotes };
    instances.push(inst);
    if (instances.length === 1) requestAnimationFrame(loop);
    return inst;
  }

  // Muda o estado. ms = por quanto tempo (0 = até mandar outro)
  function set(newState, ms = 0) {
    state = newState;
    t0 = performance.now();
    stateUntil = ms ? performance.now() + ms : 0;
    instances.forEach((i) => i.wrap?.setAttribute('data-state', newState));
  }

  // Rosto do bardo como imagem (para o avatar das mensagens)
  function avatarDataUrl() {
    const c = document.createElement('canvas');
    c.width = 18; c.height = 18;
    const ctx = c.getContext('2d');
    ctx.translate(-3, 0);
    drawGrid(ctx, BASE.slice(0, 18), 0);
    drawFace(ctx, 0, { mouth: 0, happy: true });
    return c.toDataURL();
  }

  /* ---------- Melodias de alaúde (Web Audio) ---------- */
  const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99 };
  const SONGS = {
    'Balada do Viajante': ['E4', 'G4', 'A4', '-', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'E4', '-', 'D4', 'E4', 'G4', 'E4'],
    'Canção da Taverna': ['C5', 'G4', 'E4', 'G4', 'C5', 'G4', 'E4', 'G4', 'D5', 'B4', 'G4', 'B4', 'C5', '-', 'C5', '-'],
    'Lamento da Lua': ['A4', 'C5', 'E5', 'D5', 'C5', 'A4', '-', 'G4', 'A4', 'C5', 'B4', 'A4', '-', 'E4', 'A4', '-'],
    'Marcha dos Heróis': ['G4', 'G4', 'C5', '-', 'C5', 'D5', 'E5', '-', 'D5', 'C5', 'D5', 'G4', 'C5', '-', '-', '-']
  };
  let audioCtx = null;
  function pluck(freq, time, dur = 0.5) {
    const o = audioCtx.createOscillator(), o2 = audioCtx.createOscillator(), g = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sawtooth';
    o.frequency.value = freq; o2.frequency.value = freq * 2.003;
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(3000, time); filter.frequency.exponentialRampToValueAtTime(400, time + dur);
    const g2 = audioCtx.createGain(); g2.gain.value = 0.15;
    o.connect(filter); o2.connect(g2); g2.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(0.22, time + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.start(time); o2.start(time); o.stop(time + dur); o2.stop(time + dur);
  }
  function playSong(name) {
    const title = SONGS[name] ? name : Object.keys(SONGS)[Math.floor(Math.random() * Object.keys(SONGS).length)];
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const beat = 0.22;
      const start = audioCtx.currentTime + 0.05;
      SONGS[title].forEach((n, i) => { if (n !== '-') pluck(NOTE[n], start + i * beat, 0.6); });
      set('play', SONGS[title].length * beat * 1000 + 400);
    } catch { set('play', 3000); }
    return title;
  }

  V.bard = { mount, set, avatarDataUrl, playSong, songs: () => Object.keys(SONGS), render, W, H };
})();
