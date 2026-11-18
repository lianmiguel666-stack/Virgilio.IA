/* =========================================================
   virgilio.ia — interface (liga os botões, tarefas e chat)
   ========================================================= */
(() => {
  'use strict';
  const { $, $$, escapeHtml, normalize, fmt, uid, timeNow, p, list, STORAGE, store, settings, saveSettings, toast, downloadFile, downloadDataUrl, copyText } = V;

  /* =========================================================
     Tela de carregamento
     ========================================================= */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const bar = $('#loaderBar');
    const text = $('#loaderText');
    const img = $('#loaderImage');
    const mark = $('#loaderMark');

    // Mostra a imagem personalizada só se ela existir.
    const showImage = () => { img.hidden = false; mark.hidden = true; };
    // o bardo toca enquanto carrega
    if (V.bard) { mark.hidden = true; V.bard.mount($('#loaderBard'), { size: 120 }); V.bard.set('play'); }
    if (img.complete && img.naturalWidth > 0) showImage();
    else img.addEventListener('load', showImage, { once: true });

    const steps = ['Afinando o alaúde...', 'Carregando suas tarefas...', 'Acordando o bardo Virgílio...', 'Tudo pronto!'];
    let i = 0;
    bar.style.width = (100 / steps.length) + '%';
    const tick = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      text.textContent = steps[i];
      bar.style.width = ((i + 1) / steps.length * 100) + '%';
    }, 380);

    const minTime = new Promise((r) => setTimeout(r, 1500));
    const pageLoaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
    const failSafe = new Promise((r) => setTimeout(r, 5000));

    Promise.race([Promise.all([minTime, pageLoaded]), failSafe]).then(() => {
      clearInterval(tick);
      bar.style.width = '100%';
      text.textContent = steps[steps.length - 1];
      setTimeout(() => {
        loader.classList.add('done');
        V.bard?.set('idle');
        document.body.classList.remove('is-loading');
        setTimeout(() => loader.remove(), 600);
      }, 250);
    });
  }

  /* =========================================================
     Cabeçalho, tema e novidades
     ========================================================= */
  function refreshHeader() {
    const now = new Date();
    const h = now.getHours();
    $('#greeting').textContent = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    $('#userName').textContent = settings.name;
    $('#dateLabel').textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#todayLabel').textContent = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    $('#avatarButton').textContent = settings.name.slice(0, 2).toUpperCase();
  }

  function setTheme(theme) {
    settings.theme = theme; saveSettings();
    const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('#themeButton').textContent = dark ? '☀️' : '🌙';
    $('#themeButton').title = dark ? 'Modo claro' : 'Modo escuro';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0b1220' : '#f2f6fc';
  }

  function initHeader() {
    refreshHeader();
    setTheme(settings.theme);
    $('#themeButton').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

    const share = new URL('https://t.me/share/url');
    share.searchParams.set('url', location.href.startsWith('http') ? location.href : 'https://github.com/lianmiguel666-stack/Virgilio.IA');
    share.searchParams.set('text', 'Estou me organizando com o virgilio.ia ✦');
    $('#telegramLink').href = share.toString();

    $('#updateButton').addEventListener('click', () => {
      addMessage('ai', p('<b>Novidades da versão 2.0</b>') + list([
        'Lembretes e timers com notificação ("me lembre em 10 minutos de...")',
        'Pesquisa na Wikipedia ("o que é...", "quem foi...") e previsão do tempo',
        'Equações de 1º e 2º grau, tabuada, datas e muitas conversões novas',
        'Novos scripts: jogo da velha, cronômetro, quiz, landing page, modo escuro e API',
        'Memória: ele lembra do seu nome e do que você contar',
        'Fale com ele pelo 🎤 e ouça as respostas em voz alta',
        'Modo escuro, piadas, curiosidades, sorteios, senhas e ferramentas de texto'
      ]) + p('Escreva <b>ajuda</b> para ver exemplos de tudo.'));
      $('#chatWindow').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('#avatarButton').addEventListener('click', () => sendToChat('o que você sabe sobre mim'));
  }

  /* =========================================================
     Tarefas
     ========================================================= */
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const PRIORITY_LABEL = { high: 'Alta', medium: 'Média', low: 'Baixa' };
  let tasks = store.get(STORAGE.tasks, []);
  let currentFilter = 'all';
  const saveTasks = () => store.set(STORAGE.tasks, tasks);

  function sortedTasks(arr) {
    const mode = $('#sortTasks').value;
    return [...arr].sort((a, b) => {
      if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
      if (mode === 'recent') return b.createdAt - a.createdAt;
      if (mode === 'duration') return a.duration - b.duration;
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.createdAt - b.createdAt;
    });
  }

  // API usada pelo chat (brain.js)
  V.tasksApi = {
    add({ title, category = 'Trabalho', priority = 'medium', duration = 25, today = true }) {
      const task = { id: uid(), title: title.trim().slice(0, 90), category, priority, duration: Number(duration), today, status: 'open', createdAt: Date.now() };
      tasks.push(task); saveTasks(); renderTasks();
      return task;
    },
    open: () => sortedTasks(tasks.filter((t) => t.status !== 'done')),
    all: () => [...tasks],
    find(query, includeDone = false) {
      const q = normalize(query);
      if (!q) return null;
      const pool = tasks.filter((t) => includeDone || t.status !== 'done');
      return pool.find((t) => normalize(t.title) === q) || pool.find((t) => normalize(t.title).includes(q) || q.includes(normalize(t.title)))
        || pool.find((t) => q.split(/\s+/).filter((w) => w.length > 3).some((w) => normalize(t.title).includes(w)));
    },
    setStatus(id, status) { const t = tasks.find((x) => x.id === id); if (t) { t.status = status; saveTasks(); renderTasks(); } },
    remove(id) { tasks = tasks.filter((t) => t.id !== id); saveTasks(); renderTasks(); },
    best() {
      return tasks.filter((t) => t.status !== 'done').sort((a, b) => (b.status === 'doing') - (a.status === 'doing')
        || (b.today - a.today) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.duration - b.duration)[0];
    }
  };

  function renderTasks() {
    const q = normalize($('#taskSearch').value);
    const visible = sortedTasks(tasks.filter((t) => {
      if (currentFilter === 'today' && !t.today) return false;
      if (currentFilter === 'open' && t.status === 'done') return false;
      return !q || normalize(t.title + ' ' + t.category).includes(q);
    }));

    $('#taskList').innerHTML = visible.map((t) => `
      <div class="task-item ${t.status}" data-id="${t.id}">
        <button class="task-check" data-action="toggle" type="button" aria-label="${t.status === 'done' ? 'Reabrir' : 'Concluir'} tarefa">${t.status === 'done' ? '✓' : ''}</button>
        <div class="task-main">
          <div class="task-title">${escapeHtml(t.title)}</div>
          <div class="task-meta">
            <span class="tag ${t.priority}">${PRIORITY_LABEL[t.priority]}</span>
            <span class="tag">${escapeHtml(t.category)}</span>
            <span class="tag">${t.duration} min</span>
            ${t.today ? '<span class="tag today">Hoje</span>' : ''}
            ${t.status === 'doing' ? '<span class="tag medium">Em andamento</span>' : ''}
          </div>
        </div>
        <div class="task-actions">
          ${t.status !== 'done' ? `<button data-action="doing" type="button">${t.status === 'doing' ? 'Pausar' : 'Iniciar'}</button>` : ''}
          <button data-action="delete" type="button" aria-label="Excluir">Excluir</button>
        </div>
      </div>`).join('');

    const empty = $('#emptyState');
    empty.hidden = visible.length > 0;
    const filtered = !visible.length && tasks.length;
    $('h3', empty).textContent = filtered ? 'Nada com esse filtro' : 'Nenhuma tarefa por aqui';
    $('p', empty).textContent = filtered ? 'Tente outro filtro ou outra busca.' : 'Adicione algo pequeno. Clareza costuma aparecer depois do primeiro passo.';
    renderStats();
  }

  function renderStats() {
    const todays = tasks.filter((t) => t.today);
    const doneToday = todays.filter((t) => t.status === 'done').length;
    $('#focusCount').innerHTML = `${doneToday}<span>/${todays.length}</span>`;
    $('#focusProgress').style.width = todays.length ? (doneToday / todays.length * 100) + '%' : '0';
    $('#focusCaption').textContent = !todays.length ? 'Comece adicionando uma tarefa'
      : doneToday === todays.length ? 'Dia concluído. Mandou bem!'
      : `Faltam ${todays.length - doneToday} para fechar o dia`;
    $('#doingCount').textContent = tasks.filter((t) => t.status === 'doing').length;
    $('#doneCount').textContent = tasks.filter((t) => t.status === 'done').length;
  }

  function initTasks() {
    const dialog = $('#taskDialog');
    const form = $('#taskForm');
    const open = () => { form.reset(); dialog.showModal(); setTimeout(() => $('#taskTitle').focus(), 50); };

    $('#openTaskButton').addEventListener('click', open);
    $('#emptyAddButton').addEventListener('click', open);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close('cancel'); });

    form.addEventListener('submit', (e) => {
      if (e.submitter && e.submitter.value === 'cancel') return;
      const title = $('#taskTitle').value.trim();
      if (!title) { e.preventDefault(); return; }
      V.tasksApi.add({ title, category: $('#taskCategory').value, priority: $('#taskPriority').value, duration: $('#taskDuration').value, today: $('#taskToday').checked });
      toast('Tarefa adicionada');
    });

    $('#taskList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.closest('.task-item').dataset.id;
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      if (btn.dataset.action === 'toggle') task.status = task.status === 'done' ? 'open' : 'done';
      if (btn.dataset.action === 'doing') task.status = task.status === 'doing' ? 'open' : 'doing';
      if (btn.dataset.action === 'delete') { tasks = tasks.filter((t) => t.id !== id); toast('Tarefa excluída'); }
      saveTasks(); renderTasks();
    });

    $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
      $$('.filter').forEach((b) => b.classList.toggle('active', b === btn));
      currentFilter = btn.dataset.filter;
      renderTasks();
    }));
    $('#taskSearch').addEventListener('input', renderTasks);
    $('#sortTasks').addEventListener('change', renderTasks);

    $('#exportButton').addEventListener('click', () => {
      if (!tasks.length) { toast('Nenhuma tarefa para exportar'); return; }
      const status = { open: 'Aberta', doing: 'Em andamento', done: 'Concluída' };
      const lines = ['Tarefas — virgilio.ia', 'Exportado em ' + new Date().toLocaleString('pt-BR'), ''];
      sortedTasks(tasks).forEach((t) => lines.push(`[${t.status === 'done' ? 'x' : ' '}] ${t.title} — ${PRIORITY_LABEL[t.priority]}, ${t.category}, ${t.duration} min, ${status[t.status]}${t.today ? ', hoje' : ''}`));
      downloadFile('tarefas-virgilio.txt', lines.join('\n'));
    });

    $('#clearDoneButton').addEventListener('click', () => {
      const n = tasks.filter((t) => t.status === 'done').length;
      if (!n) { toast('Nenhuma tarefa concluída para limpar'); return; }
      tasks = tasks.filter((t) => t.status !== 'done');
      saveTasks(); renderTasks();
      toast(n === 1 ? '1 tarefa concluída removida' : n + ' tarefas concluídas removidas');
    });

    renderTasks();
  }

  /* =========================================================
     Modo foco
     ========================================================= */
  const focus = { total: 25 * 60, left: 25 * 60, timer: null };
  function renderFocus() {
    const m = String(Math.floor(focus.left / 60)).padStart(2, '0');
    const s = String(focus.left % 60).padStart(2, '0');
    $('#focusTimer').textContent = m + ':' + s;
    $('#focusLabel').textContent = focus.timer ? 'Pausar' : focus.left < focus.total ? 'Continuar' : 'Iniciar';
    $('#focusButton').classList.toggle('running', !!focus.timer);
    document.title = focus.timer ? `${m}:${s} · foco | virgilio.ia` : 'virgilio.ia | Assistente de tarefas';
  }
  function startFocus() {
    if (focus.timer) return;
    focus.timer = setInterval(() => {
      focus.left--;
      if (focus.left <= 0) {
        clearInterval(focus.timer); focus.timer = null; focus.left = focus.total;
        notify('Bloco de foco concluído!', 'Faça uma pausa de 5 minutos.');
        addMessage('ai', p('⏰ Bloco de foco concluído. Respira, alonga e volta quando quiser.'));
      }
      renderFocus();
    }, 1000);
    renderFocus();
  }
  function stopFocus() { if (focus.timer) { clearInterval(focus.timer); focus.timer = null; renderFocus(); } }

  /* =========================================================
     Lembretes (com notificação do navegador)
     ========================================================= */
  let reminders = store.get(STORAGE.reminders, []);
  const reminderTimers = {};
  const saveReminders = () => store.set(STORAGE.reminders, reminders);

  function beep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach((t) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.15, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.2);
      });
    } catch { /* sem áudio */ }
  }

  function notify(title, body) {
    toast(title + (body ? ' ' + body : ''));
    beep();
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: 'assets/icon.svg' }); } catch { /* ignore */ }
  }

  function armReminder(r) {
    const ms = r.at - Date.now();
    reminderTimers[r.id] = setTimeout(() => fireReminder(r.id), Math.max(0, Math.min(ms, 2147483000)));
  }

  function fireReminder(id) {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    reminders = reminders.filter((x) => x.id !== id); saveReminders(); renderReminders();
    notify(r.timer ? r.text : '⏰ Lembrete', r.timer ? '' : r.text);
    addMessage('ai', p(r.timer ? `<b>${escapeHtml(r.text)}</b>` : `⏰ Lembrete: <b>${escapeHtml(r.text)}</b>`));
    speak(r.timer ? r.text : 'Lembrete: ' + r.text);
  }

  function addReminder(text, ms, timer = false) {
    if ('Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch { /* ignore */ } }
    const r = { id: uid(), text, at: Date.now() + ms, timer };
    reminders.push(r); saveReminders(); armReminder(r); renderReminders();
    return r;
  }

  function renderReminders() {
    const box = $('#reminderList');
    const sorted = [...reminders].sort((a, b) => a.at - b.at);
    box.hidden = !sorted.length;
    box.innerHTML = sorted.map((r) => `<span class="reminder-chip" title="${escapeHtml(r.text)}">⏰ ${new Date(r.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${escapeHtml(r.text.length > 26 ? r.text.slice(0, 24) + '…' : r.text)}<button type="button" data-cancel="${r.id}" aria-label="Cancelar lembrete">×</button></span>`).join('');
  }

  function initReminders() {
    // lembretes que venceram com a página fechada disparam agora
    reminders.forEach(armReminder);
    renderReminders();
    $('#reminderList').addEventListener('click', (e) => {
      const id = e.target.dataset.cancel;
      if (!id) return;
      clearTimeout(reminderTimers[id]);
      reminders = reminders.filter((r) => r.id !== id); saveReminders(); renderReminders();
      toast('Lembrete cancelado');
    });
  }

  /* =========================================================
     Laboratório
     ========================================================= */
  let lastLabCode = null;
  function setResult(el, text, isError = false) { el.textContent = text; el.classList.toggle('error', isError); }

  function showLab(name) {
    $$('.lab-tab').forEach((t) => { const on = t.dataset.lab === name; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    $$('.lab-view').forEach((v) => v.classList.toggle('active', v.dataset.view === name));
  }

  function initLab() {
    $$('.lab-tab').forEach((tab) => tab.addEventListener('click', () => showLab(tab.dataset.lab)));

    $('#calculatorForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const out = $('#calculatorResult');
      const v = $('#calculatorInput').value.trim();
      if (!v) return setResult(out, 'Digite uma expressão', true);
      try {
        if (/=/.test(v) && /x/i.test(v)) {
          const r = V.solveEquation(v);
          return setResult(out, r.roots.length ? r.roots.map((x, i) => `x${r.roots.length > 1 ? i + 1 : ''} = ${fmt(x)}`).join('   ') : r.note);
        }
        setResult(out, '= ' + fmt(V.evaluate(v)));
      } catch (err) { setResult(out, err.message, true); }
    });

    $('#percentageForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const pct = parseFloat($('#percentageValue').value), base = parseFloat($('#percentageBase').value);
      const out = $('#percentageResult');
      if (isNaN(pct) || isNaN(base)) return setResult(out, 'Preencha os dois campos', true);
      setResult(out, `${fmt(pct)}% de ${fmt(base)} = ${fmt(pct * base / 100)}`);
    });

    $('#ruleForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const a = parseFloat($('#ruleA').value), b = parseFloat($('#ruleB').value), c = parseFloat($('#ruleC').value);
      const out = $('#ruleResult');
      if ([a, b, c].some(isNaN)) return setResult(out, 'Preencha A, B e C', true);
      if (a === 0) return setResult(out, 'A não pode ser zero', true);
      setResult(out, `${fmt(a)} : ${fmt(b)} = ${fmt(c)} : ${fmt(b * c / a)}`);
    });

    // Conversor: monta as opções a partir das unidades de math.js
    const groups = {};
    Object.entries(V.UNITS).forEach(([key, u]) => (groups[u.g] = groups[u.g] || []).push([key, u.label]));
    const fill = (sel) => {
      sel.innerHTML = Object.entries(groups).map(([g, us]) => `<optgroup label="${g[0].toUpperCase() + g.slice(1)}">${us.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</optgroup>`).join('');
    };
    fill($('#convertFrom')); fill($('#convertTo'));
    $('#convertFrom').value = 'm'; $('#convertTo').value = 'cm';
    $('#convertFrom').addEventListener('change', () => {
      const g = V.UNITS[$('#convertFrom').value].g;
      if (V.UNITS[$('#convertTo').value].g !== g) $('#convertTo').value = groups[g].find(([k]) => k !== $('#convertFrom').value)[0];
    });
    $('#swapUnits').addEventListener('click', () => { const a = $('#convertFrom').value; $('#convertFrom').value = $('#convertTo').value; $('#convertTo').value = a; });
    $('#converterForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = parseFloat($('#convertValue').value), from = $('#convertFrom').value, to = $('#convertTo').value;
      const out = $('#converterResult');
      try { setResult(out, `${fmt(v)} ${V.UNITS[from].label} = ${fmt(V.convert(v, from, to), 4)} ${V.UNITS[to].label}`); }
      catch (err) { setResult(out, err.message, true); }
    });

    // Gerador de código: opções vindas dos modelos
    $('#codeTemplate').innerHTML = Object.entries(V.TEMPLATE_NAME).map(([k, name]) => `<option value="${k}">${name[0].toUpperCase() + name.slice(1)}</option>`).join('');
    $('#generateCode').addEventListener('click', () => {
      lastLabCode = V.generateCode($('#codeType').value, $('#codeTemplate').value, $('#codeName').value);
      $('#codeOutput').textContent = lastLabCode.content;
      $('#codeActions').hidden = false;
      if (lastLabCode.lang !== $('#codeType').value) toast('Esse modelo só existe para web: gerei em HTML');
    });
    $('#copyCode').addEventListener('click', () => lastLabCode && copyText(lastLabCode.content));
    $('#downloadCode').addEventListener('click', () => lastLabCode && downloadFile(lastLabCode.filename, lastLabCode.content));
    $('#previewCode').addEventListener('click', () => lastLabCode && V.previewCode(lastLabCode.lang, lastLabCode.content, lastLabCode.template));

    // Gerador de imagens
    $('#generateImage').addEventListener('click', () => {
      const prompt = $('#imagePrompt').value.trim() || 'Ideia criativa';
      const style = $('#imageStyle').value;
      const img = $('#imagePreview');
      img.src = V.generateImage(prompt, style); img.hidden = false;
      $('#imageCaption').textContent = `“${prompt}” · estilo ${style}`;
      $('#downloadImage').hidden = false;
    });
    $('#imagePrompt').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#generateImage').click(); });
    $('#downloadImage').addEventListener('click', () => downloadDataUrl(V.slug($('#imagePrompt').value || 'imagem') + '.png', $('#imagePreview').src));
  }

  /* =========================================================
     Voz: falar (microfone) e ouvir (respostas lidas)
     ========================================================= */
  function speak(html) {
    if (!settings.voice || !('speechSynthesis' in window)) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    $$('pre, img, .bubble-actions, small', tmp).forEach((el) => el.remove());
    const text = tmp.textContent.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '').trim().slice(0, 400);
    if (!text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = 1.05;
    const ptVoice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('pt'));
    if (ptVoice) u.voice = ptVoice;
    speechSynthesis.speak(u);
  }

  function setVoice(on) {
    settings.voice = on; saveSettings();
    $('#voiceButton').textContent = on ? '🔊' : '🔈';
    $('#voiceButton').title = on ? 'Desativar voz' : 'Ler respostas em voz alta';
    $('#voiceButton').classList.toggle('on', on);
    if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
  }

  function initVoice() {
    setVoice(!!settings.voice);
    $('#voiceButton').addEventListener('click', () => { setVoice(!settings.voice); toast(settings.voice ? 'Voz ativada' : 'Voz desativada'); });

    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $('#micButton');
    if (!Rec) { mic.hidden = true; return; }
    let rec = null;
    mic.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new Rec();
      rec.lang = 'pt-BR'; rec.interimResults = true; rec.maxAlternatives = 1;
      mic.classList.add('listening');
      $('#chatInput').placeholder = 'Ouvindo...';
      rec.onresult = (e) => {
        const t = [...e.results].map((r) => r[0].transcript).join('');
        $('#chatInput').value = t;
        if (e.results[e.results.length - 1].isFinal) sendToChat(t);
      };
      rec.onerror = (e) => { if (e.error === 'not-allowed') toast('Permita o uso do microfone'); };
      rec.onend = () => { rec = null; mic.classList.remove('listening'); $('#chatInput').placeholder = 'Fale com o virgilio.ia...'; };
      rec.start();
    });
  }

  /* =========================================================
     Chat
     ========================================================= */
  let chatHistory = store.get(STORAGE.chat, []);
  const bardFace = V.bard ? V.bard.avatarDataUrl() : '';
  let sentHistory = [];
  let histIndex = -1;
  let busy = false;

  function addMessage(role, html, save = true) {
    const win = $('#chatWindow');
    const el = document.createElement('div');
    el.className = 'message ' + (role === 'ai' ? 'ai-message' : 'user-message');
    const time = timeNow();
    el.innerHTML = (role === 'ai' ? `<div class="message-avatar"><img src="${bardFace}" alt=""></div>` : '') + `<div class="bubble">${html}<time>${time}</time></div>`;
    win.appendChild(el);
    win.scrollTop = win.scrollHeight;
    $$('img', el).forEach((img) => img.addEventListener('load', () => { win.scrollTop = win.scrollHeight; }, { once: true }));
    if (save) {
      chatHistory.push({ role, html, time });
      chatHistory = chatHistory.slice(-60);
      store.set(STORAGE.chat, chatHistory);
    }
    return el;
  }

  function renderChatHistory() {
    const win = $('#chatWindow');
    win.innerHTML = '';
    if (!chatHistory.length) {
      addMessage('ai', p(`Oi, ${escapeHtml(settings.name)}. Eu sou o <b>virgilio.ia</b> e organizo o ruído com você. O que precisa sair do papel hoje?`) +
        p('<small>Dica: escreva "ajuda" para ver tudo o que eu sei fazer, ou toque no 🎤 para falar comigo.</small>'));
      return;
    }
    chatHistory.forEach((m) => { const el = addMessage(m.role, m.html, false); $('time', el).textContent = m.time; });
  }

  async function sendToChat(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    busy = true;
    sentHistory.push(text); histIndex = -1;
    addMessage('user', p(escapeHtml(text)));
    $('#chatInput').value = '';
    const typing = addMessage('ai', '<span class="typing"><span></span><span></span><span></span></span>', false);
    V.bard?.set('think');
    const started = Date.now();
    let reply;
    try { reply = await V.think(text); } catch (err) { console.error(err); reply = p('Ops, algo deu errado aqui. Tenta de novo?'); }
    const wait = Math.max(0, 350 + Math.random() * 350 - (Date.now() - started));
    setTimeout(() => {
      typing.remove();
      addMessage('ai', reply);
      // se a resposta não mudou o estado do bardo (ex.: música), ele "fala"
      const st = $('#assistantBard')?.getAttribute('data-state');
      if (st === 'think' || st === 'idle') {
        const tmp = document.createElement('div'); tmp.innerHTML = reply;
        V.bard?.set('talk', Math.min(4500, 600 + tmp.textContent.length * 25));
      }
      speak(reply);
      busy = false;
      $('#chatInput').focus();
    }, wait);
  }

  function initChat() {
    renderChatHistory();
    const input = $('#chatInput');

    $('#chatForm').addEventListener('submit', (e) => { e.preventDefault(); sendToChat(input.value); });
    $$('.suggestion').forEach((b) => b.addEventListener('click', () => sendToChat(b.dataset.prompt)));
    $('#clearChat').addEventListener('click', () => { chatHistory = []; store.set(STORAGE.chat, []); renderChatHistory(); toast('Conversa limpa'); });
    $('#exportChat').addEventListener('click', () => {
      const tmp = document.createElement('div');
      const lines = chatHistory.map((m) => { tmp.innerHTML = m.html; $$('.bubble-actions', tmp).forEach((x) => x.remove()); return `[${m.time}] ${m.role === 'ai' ? 'virgilio.ia' : settings.name}: ${tmp.innerText.trim()}`; });
      downloadFile('conversa-virgilio.txt', lines.join('\n\n'));
    });

    // seta para cima/baixo navega pelas mensagens enviadas
    input.addEventListener('keydown', (e) => {
      if (!sentHistory.length || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      histIndex = e.key === 'ArrowUp' ? (histIndex < 0 ? sentHistory.length - 1 : Math.max(0, histIndex - 1)) : (histIndex < 0 ? -1 : histIndex + 1);
      if (histIndex >= sentHistory.length) histIndex = -1;
      input.value = histIndex < 0 ? '' : sentHistory[histIndex];
    });

    // exemplos que mudam no placeholder
    let ex = 0;
    setInterval(() => { if (document.activeElement !== input && !input.value) input.placeholder = 'Ex.: ' + V.EXAMPLES[ex++ % V.EXAMPLES.length]; }, 4000);

    // Botões dentro das mensagens (copiar, baixar, testar)
    $('#chatWindow').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-chat-action]');
      if (!btn) return;
      const bubble = btn.closest('.bubble');
      const code = $('pre', bubble)?.textContent || '';
      const action = btn.dataset.chatAction;
      if (action === 'copy') copyText(code);
      if (action === 'download') downloadFile(btn.dataset.filename, code);
      if (action === 'preview') V.previewCode(btn.dataset.lang, code, btn.dataset.template);
      if (action === 'download-image') { const img = $('img', bubble); if (img) downloadDataUrl(btn.dataset.filename, img.src); }
      if (action === 'say' && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(btn.dataset.text); u.lang = btn.dataset.lang; speechSynthesis.cancel(); speechSynthesis.speak(u); }
    });

    // Atalho: "/" foca o chat
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    });
  }

  /* =========================================================
     Bardo do assistente
     ========================================================= */
  const BARD_LINES = [
    'Uma canção para alegrar a jornada!', 'Lá lá lá... ops, desafinei. 🎶', 'Toda grande aventura começa com uma tarefa pequena.',
    'Dizem que bardos não trabalham. Eu organizo seu dia!', 'Quer uma história? Diga "conte uma história".', 'Mais uma? Clique de novo!'
  ];
  function initBard() {
    const wrap = $('#assistantBard');
    if (!V.bard || !wrap) return;
    V.bard.mount(wrap, { size: 54 });
    wrap.addEventListener('click', () => {
      if (V.extensions?.isOn('musica')) {
        const title = V.bard.playSong();
        toast('🎵 ' + title);
      } else V.bard.set('cheer', 1500);
      const bubble = $('#bardSpeech');
      bubble.textContent = V.pick(BARD_LINES);
      bubble.classList.add('show');
      clearTimeout(initBard.t); initBard.t = setTimeout(() => bubble.classList.remove('show'), 3000);
    });
  }

  /* =========================================================
     Inicialização
     ========================================================= */
  V.app = { notify, refreshHeader, setTheme, setVoice, startFocus, stopFocus, addReminder, reminders: () => [...reminders], clearReminders() { const k = reminders.length; reminders.forEach((r) => clearTimeout(reminderTimers[r.id])); reminders = []; saveReminders(); renderReminders(); return k; }, addMessage, sendToChat };

  function start() {
    initHeader();
    initTasks();
    initLab();
    initReminders();
    initVoice();
    initChat();
    initBard();
    V.extensions?.init();
    $('#focusButton').addEventListener('click', () => (focus.timer ? stopFocus() : startFocus()));
    renderFocus();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => settings.theme === 'auto' && setTheme('auto'));
  }

  initLoader();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
