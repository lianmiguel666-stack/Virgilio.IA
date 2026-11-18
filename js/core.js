/* =========================================================
   virgilio.ia — núcleo (utilidades compartilhadas)
   Todos os arquivos JS usam o objeto global "V".
   ========================================================= */
window.V = window.V || {};

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalize = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const fmt = (n, digits = 6) => Number.isFinite(n) ? n.toLocaleString('pt-BR', { maximumFractionDigits: digits }) : '—';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const timeNow = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const slug = (s) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'arquivo';
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // Pequenos construtores de HTML para as respostas do chat
  const p = (html) => `<p>${html}</p>`;
  const list = (items, ordered = false) => `<${ordered ? 'ol' : 'ul'}>${items.map((i) => `<li>${i}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;

  const STORAGE = {
    tasks: 'virgilio.tasks',
    chat: 'virgilio.chat',
    settings: 'virgilio.settings',
    memory: 'virgilio.memory',
    reminders: 'virgilio.reminders',
    notes: 'virgilio.notes'
  };

  const store = {
    get(key, fallback) {
      try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ }
    }
  };

  // Configurações do usuário (nome, tema, voz)
  const settings = Object.assign({ name: 'Lian', theme: 'auto', voice: false }, store.get(STORAGE.settings, {}));
  const saveSettings = () => store.set(STORAGE.settings, settings);

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function downloadFile(filename, content, mime = 'text/plain') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadDataUrl(filename, dataUrl) {
    const a = Object.assign(document.createElement('a'), { href: dataUrl, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copiado!'); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copiado!'); } catch { toast('Não consegui copiar'); }
      ta.remove();
    }
  }

  // fetch com tempo limite (para Wikipedia e clima)
  async function fetchJson(url, ms = 7000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(t); }
  }

  // Lê números escritos em português ("cinco", "dez") ou com vírgula
  const NUMBER_WORDS = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, quinze: 15, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, meia: 0.5 };
  function parseNum(s) {
    if (s == null) return NaN;
    const n = normalize(String(s));
    if (n in NUMBER_WORDS) return NUMBER_WORDS[n];
    return parseFloat(n.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  }

  Object.assign(V, {
    $, $$, escapeHtml, normalize, fmt, uid, timeNow, pick, slug, capitalize, p, list,
    STORAGE, store, settings, saveSettings, toast, downloadFile, downloadDataUrl, copyText, fetchJson, parseNum
  });
})();
