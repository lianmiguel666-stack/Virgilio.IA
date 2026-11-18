/* =========================================================
   virgilio.ia — gerador de imagens (canvas, 100% local)
   A mesma descrição sempre gera a mesma arte.
   ========================================================= */
(() => {
  'use strict';
  const { normalize } = V;

  function hashString(s) {
    let h = 2166136261;
    for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed || 1;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const PALETTES = [
    { k: ['mar', 'oceano', 'praia', 'agua', 'azul', 'ceu', 'chuva'], c: ['#0b3d5c', '#1b6f9c', '#4fb3d9', '#bfe7f2', '#f4f1de'] },
    { k: ['floresta', 'natureza', 'verde', 'planta', 'arvore', 'mata', 'jardim'], c: ['#173b2c', '#2f6b4f', '#4f9a72', '#9ad3b0', '#eef5e9'] },
    { k: ['por do sol', 'entardecer', 'sol', 'laranja', 'verao', 'calor', 'deserto'], c: ['#2d1e3e', '#a23e48', '#e8833a', '#f6c453', '#fff1d6'] },
    { k: ['noite', 'lua', 'estrela', 'espaco', 'galaxia', 'universo', 'escuro'], c: ['#0b0d1f', '#1d2148', '#4b3f8f', '#9a8fe0', '#e9e6ff'] },
    { k: ['fogo', 'vermelho', 'paixao', 'amor', 'energia', 'raiva'], c: ['#2b0a0a', '#7d1a1a', '#d2554a', '#f29e4c', '#ffe3c2'] },
    { k: ['rosa', 'flor', 'doce', 'primavera', 'fofo'], c: ['#4a1d3f', '#b0477a', '#f08bb0', '#fcd5e3', '#fff6f9'] },
    { k: ['neve', 'inverno', 'gelo', 'frio', 'branco'], c: ['#24324a', '#5f7a99', '#a9c3dc', '#e3eef8', '#ffffff'] },
    { k: ['tecnologia', 'codigo', 'robo', 'futuro', 'ia', 'digital', 'cyber', 'computador'], c: ['#060b14', '#0e2238', '#14d3c4', '#6c5ce7', '#e0fbff'] }
  ];
  function pickPalette(prompt, style, r) {
    const n = normalize(prompt);
    const found = PALETTES.find((p) => p.k.some((k) => n.includes(k)));
    if (found) return found.c;
    if (style === 'tecnologia') return PALETTES[7].c;
    return PALETTES[Math.floor(r() * PALETTES.length)].c;
  }

  function generateImage(prompt, style = 'abstrato') {
    const W = 1280, H = 800;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const r = rng(hashString(normalize(prompt) + '|' + style));
    const pal = pickPalette(prompt, style, r);
    const rand = (a, b) => a + r() * (b - a);
    const n = normalize(prompt);

    if (style === 'paisagem') {
      const night = /noite|lua|estrela|escuro/.test(n);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, night ? '#070a1c' : pal[2]);
      sky.addColorStop(1, night ? pal[2] : pal[4]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      if (night) for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,255,255,${rand(.3, 1)})`; ctx.fillRect(rand(0, W), rand(0, H * .6), rand(1, 3), rand(1, 3)); }
      const sx = rand(W * .2, W * .8), sy = rand(H * .15, H * .4), sr = rand(50, 90);
      const glow = ctx.createRadialGradient(sx, sy, sr * .5, sx, sy, sr * 3.5);
      glow.addColorStop(0, night ? 'rgba(255,255,240,.35)' : 'rgba(255,240,200,.6)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = night ? '#f4f1de' : '#fff4d6'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      const layers = 4;
      for (let l = 0; l < layers; l++) {
        const base = H * (.5 + l * .12);
        ctx.fillStyle = shade(pal[Math.max(0, 3 - l)], night ? -.55 + l * .05 : -.1 - l * .12);
        ctx.beginPath(); ctx.moveTo(0, H);
        let y = base;
        for (let x = 0; x <= W; x += 40) { y = Math.min(H, Math.max(H * .3, y + rand(-38, 38))); ctx.lineTo(x, y - rand(0, 30)); }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      }
      if (/mar|oceano|praia|lago|rio|agua/.test(n)) {
        const sea = ctx.createLinearGradient(0, H * .72, 0, H);
        sea.addColorStop(0, shade(pal[1], -.1)); sea.addColorStop(1, shade(pal[0], -.2));
        ctx.fillStyle = sea; ctx.fillRect(0, H * .72, W, H * .28);
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
        for (let i = 0; i < 40; i++) { const y = rand(H * .74, H); const x = rand(0, W); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rand(20, 80), y); ctx.stroke(); }
      }
    } else if (style === 'tecnologia') {
      ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * .7);
      g.addColorStop(0, shade(pal[1], .2)); g.addColorStop(1, pal[0]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.shadowBlur = 12; ctx.lineWidth = 2.5;
      for (let i = 0; i < 38; i++) {
        const col = r() > .5 ? pal[2] : pal[3];
        ctx.strokeStyle = col; ctx.shadowColor = col; ctx.fillStyle = col;
        let x = Math.round(rand(0, W) / 40) * 40, y = Math.round(rand(0, H) / 40) * 40;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) { if (r() > .5) x += Math.round(rand(-4, 4)) * 40; else y += Math.round(rand(-4, 4)) * 40; ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 40; ctx.shadowColor = pal[2]; ctx.strokeStyle = pal[4]; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(W / 2, H / 2, 90 + i * 55, rand(0, 6), rand(3, 9)); ctx.stroke(); }
      ctx.shadowBlur = 0;
    } else if (style === 'minimalista') {
      ctx.fillStyle = pal[4]; ctx.fillRect(0, 0, W, H);
      const cx = rand(W * .3, W * .7), cy = rand(H * .3, H * .6), rad = rand(140, 240);
      ctx.fillStyle = pal[2]; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal[0]; ctx.globalAlpha = .9;
      ctx.fillRect(rand(0, W * .5), cy + rad * .4, rand(W * .3, W * .6), rand(14, 30));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pal[1]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx + rand(-200, 200), cy + rand(-160, 160), rand(40, 90), 0, Math.PI * 2); ctx.stroke();
    } else {
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, pal[0]); bg.addColorStop(.6, pal[1]); bg.addColorStop(1, pal[2]);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.filter = 'blur(40px)';
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = pal[Math.floor(rand(1, 5))]; ctx.globalAlpha = rand(.35, .75);
        ctx.beginPath(); ctx.arc(rand(0, W), rand(0, H), rand(90, 260), 0, Math.PI * 2); ctx.fill();
      }
      ctx.filter = 'none'; ctx.globalAlpha = 1;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = pal[Math.floor(rand(2, 5))]; ctx.globalAlpha = rand(.5, .9);
        ctx.beginPath();
        const x = rand(0, W), y = rand(0, H), pts = 7, rad = rand(60, 160);
        for (let k = 0; k <= pts; k++) { const a = k / pts * Math.PI * 2; const rr = rad * rand(.7, 1.3); ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = .35; ctx.strokeStyle = pal[4]; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, rand(0, H)); ctx.bezierCurveTo(rand(0, W), rand(0, H), rand(0, W), rand(0, H), W, rand(0, H)); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }

    // legenda
    ctx.font = '600 22px "DM Sans", sans-serif';
    const label = prompt.length > 60 ? prompt.slice(0, 57) + '...' : prompt;
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    roundRect(ctx, 28, H - 70, tw + 36, 44, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(label, 46, H - 41);
    ctx.font = '700 16px "Space Grotesk", sans-serif'; ctx.globalAlpha = .7;
    ctx.fillText('virgilio.ia', W - 120, H - 40); ctx.globalAlpha = 1;

    return canvas.toDataURL('image/png');
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function shade(hex, amt) {
    const v = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return '#' + [v >> 16, (v >> 8) & 255, v & 255].map(f).map((c) => c.toString(16).padStart(2, '0')).join('');
  }

  V.generateImage = generateImage;
})();
