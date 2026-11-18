/* =========================================================
   virgilio.ia — extensões
   Cada extensão pode ser ligada/desligada no painel 🧩.
   Uma extensão pode trazer habilidades novas para o chat
   (skills), um widget na tela, ou as duas coisas.

   Para criar a sua, copie um dos objetos de EXTENSIONS.
   ========================================================= */
(() => {
  'use strict';
  const { $, escapeHtml, normalize, fmt, p, list, pick, capitalize, settings, saveSettings, store, STORAGE, toast, fetchJson, uid } = V;

  settings.extensions = settings.extensions || {};

  /* ---------- Histórias e poemas ---------- */
  const STORY = {
    heroes: ['uma jovem cartógrafa', 'um ferreiro distraído', 'uma gata falante', 'um robô aprendiz', 'uma estudante curiosa', 'um velho pescador', 'um dragão tímido'],
    places: ['numa vila escondida entre montanhas', 'numa cidade de ruas azuis', 'num navio que voava', 'numa floresta onde as árvores cochichavam', 'numa biblioteca sem fim', 'numa ilha que mudava de lugar'],
    problems: ['perdeu a chave do próprio coração', 'precisava entregar uma carta antes do pôr do sol', 'descobriu que a lua tinha sumido', 'encontrou um mapa sem nenhum caminho desenhado', 'acordou sem lembrar o próprio nome', 'ouviu uma música que ninguém mais escutava'],
    helpers: ['uma coruja que só falava em rimas', 'um menino que colecionava ventos', 'um bardo de chapéu azul', 'uma estrela cadente atrasada', 'um mercador de segredos'],
    endings: ['e aprendeu que coragem é só medo dando o primeiro passo', 'e voltou para casa mais leve do que partiu', 'e desde então a vila tem uma festa todo ano naquele dia', 'e percebeu que o tesouro era o caminho', 'e escreveu tudo num caderno que você talvez encontre um dia']
  };
  function story(topic) {
    const hero = pick(STORY.heroes);
    const t = topic ? ` que sonhava com ${topic}` : '';
    return [
      `Era uma vez ${hero}${t}, ${pick(STORY.places)}.`,
      `Certo dia, ${hero.split(' ').slice(1).join(' ')} ${pick(STORY.problems)}.`,
      `No caminho encontrou ${pick(STORY.helpers)}, que lhe disse: "nenhuma jornada começa pronta, só começa".`,
      `Depois de muitas voltas, risadas e um ou outro tropeço, o desafio foi vencido ${pick(STORY.endings)}.`
    ];
  }

  // Estrofes rimadas; {S} = assunto com artigo ("o mar"), {N} = só o nome ("mar")
  const STANZAS = [
    ['Ó {N}, que inspira esta canção,', 'teu nome ecoa no meu coração;', 'contigo aprendi de novo a sonhar,', 'e por ti eu não paro de cantar.'],
    ['Pela estrada longa da jornada', 'levo {S} na voz e na alvorada;', 'se a noite insiste em escurecer,', 'é {S} que me faz amanhecer.'],
    ['Toco o alaúde devagar', 'para {S} poder escutar:', 'cada corda guarda um segredo,', 'cada verso espanta o medo.'],
    ['Não há tesouro, ouro ou brilho', 'que valha mais que este estribilho:', 'cantar {S} sob o luar', 'até o sol voltar a brilhar.'],
    ['Quem nunca parou pra notar', 'o que {S} tem a ensinar', 'não sabe a graça de viver', 'nem o prazer de aprender.']
  ];
  function poem(topic) {
    let S = (topic || 'a vida').trim();
    if (!/^(o|a|os|as|um|uma|meu|minha|seu|sua)\s/i.test(S)) S = S; // nomes próprios ficam como estão
    const N = S.replace(/^(o|a|os|as|um|uma)\s+/i, '');
    const pickTwo = STANZAS.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    return pickTwo.map((st) => st.map((l) => l.replace('{S}', S).replace('{N}', N)));
  }

  /* ---------- Tradutor ---------- */
  const LANGS = { ingles: 'en', espanhol: 'es', frances: 'fr', italiano: 'it', alemao: 'de', japones: 'ja', portugues: 'pt-BR', chines: 'zh-CN', russo: 'ru', coreano: 'ko', latim: 'la' };
  async function translate(text, target, source = 'pt-BR') {
    const data = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`);
    return data?.responseData?.translatedText;
  }

  /* ---------- Moedas ---------- */
  const CURRENCIES = {
    dolar: 'USD', dolares: 'USD', usd: 'USD', real: 'BRL', reais: 'BRL', brl: 'BRL', euro: 'EUR', euros: 'EUR', eur: 'EUR',
    libra: 'GBP', libras: 'GBP', iene: 'JPY', ienes: 'JPY', peso: 'ARS', pesos: 'ARS', bitcoin: 'BTC', yuan: 'CNY', franco: 'CHF'
  };
  let ratesCache = null;
  async function rates() {
    if (ratesCache && Date.now() - ratesCache.t < 3600000) return ratesCache.r;
    const d = await fetchJson('https://open.er-api.com/v6/latest/USD');
    if (!d || !d.rates) throw new Error('sem cotação');
    ratesCache = { t: Date.now(), r: d.rates };
    return d.rates;
  }

  /* ---------- Notas rápidas ---------- */
  let notes = store.get(STORAGE.notes, []);
  const saveNotes = () => store.set(STORAGE.notes, notes);
  function renderNotes() {
    const box = $('#notesList');
    if (!box) return;
    box.innerHTML = notes.length ? notes.map((n) => `<div class="note" data-id="${n.id}"><p>${escapeHtml(n.text)}</p><button type="button" data-del="${n.id}" aria-label="Apagar nota">×</button></div>`).join('')
      : '<p class="notes-empty">Nenhuma nota ainda. Escreva acima ou diga no chat "nota: comprar pão".</p>';
  }
  function addNote(text) { notes.unshift({ id: uid(), text: text.slice(0, 300), at: Date.now() }); saveNotes(); renderNotes(); }

  /* ---------- Clima no topo ---------- */
  async function refreshWeatherPill() {
    const pill = $('#weatherPill');
    if (!pill) return;
    if (!settings.city) { pill.hidden = false; pill.textContent = '🌤️ defina sua cidade'; pill.title = 'Diga no chat: "moro em ..."'; return; }
    try {
      const w = await V.weather(settings.city);
      if (!w) throw new Error();
      pill.hidden = false;
      pill.textContent = `${w.now.desc[1]} ${fmt(w.now.temp, 0)}°C`;
      pill.title = `${w.place}: ${w.now.desc[0]}`;
    } catch { pill.hidden = false; pill.textContent = '🌤️ sem conexão'; }
  }

  /* ---------- Lembrete de água ---------- */
  let waterTimer = null;

  /* =========================================================
     Lista de extensões
     ========================================================= */
  const EXTENSIONS = [
    {
      id: 'musica', icon: '🎵', name: 'Músicas do bardo', default: true,
      desc: 'O Virgílio toca melodias no alaúde. Clique nele ou diga "toque uma música".',
      skills: [{
        name: 'musica',
        test: (n) => /^(toque|toca|tocar|cante|canta|cantar)\b|^(uma |toque uma )?musica( pra mim)?$|quais musicas/.test(n),
        run: (n) => {
          const songs = V.bard.songs();
          if (/quais musicas|lista de musicas/.test(n)) return p('Meu repertório:') + list(songs.map((s) => '🎵 ' + s));
          const wanted = songs.find((s) => n.includes(normalize(s).split(' ').pop()));
          const title = V.bard.playSong(wanted);
          return p(`🎵 Afinando o alaúde... Tocando <b>${title}</b>!`) + p('<small>Diga "quais músicas" para ver o repertório.</small>');
        }
      }]
    },
    {
      id: 'historias', icon: '📜', name: 'Histórias e poemas', default: true,
      desc: 'Como todo bardo, ele inventa histórias e poemas: "conte uma história sobre dragões", "faça um poema sobre o mar".',
      skills: [
        {
          name: 'historia',
          test: (n) => /(conte|conta|invente|crie|me de)\s+(uma\s+)?(historia|lenda|conto|fabula)/.test(n),
          run: (n, text) => {
            const topic = (text.match(/(?:sobre|de|com)\s+(.+?)[?.!]*$/i) || [])[1];
            V.bard.set('talk', 4000);
            return p('📜 <i>Aproxime-se, viajante, e ouça...</i>') + story(topic && topic.length < 40 ? topic : '').map((l) => p(escapeHtml(l))).join('');
          }
        },
        {
          name: 'poema',
          test: (n) => /(poema|poesia|verso|versos|rima|soneto)\b/.test(n) && /(faca|faz|escreva|crie|me de|declame|recite|um|uma)/.test(n),
          run: (n, text) => {
            const topic = (text.match(/(?:sobre|para|pra|de)\s+(.+?)[?.!]*$/i) || [])[1];
            V.bard.set('play', 3000);
            return p('🪶 <i>Uns versos de improviso:</i>') + poem(topic && topic.length < 40 ? topic : '').map((st) => `<blockquote class="poem">${st.map(escapeHtml).join('<br>')}</blockquote>`).join('');
          }
        }
      ]
    },
    {
      id: 'notas', icon: '🗒️', name: 'Notas rápidas', default: true,
      desc: 'Um bloco de notas ao lado das tarefas. No chat: "nota: ideia para o trabalho" e "minhas notas".',
      widget: 'notesPanel',
      skills: [
        {
          name: 'nota-add',
          test: (n) => /^(nota|anotacao|anote isso|salve a nota)\s*:\s*\S/.test(n),
          run: (n, text) => { const t = text.slice(text.indexOf(':') + 1).trim(); addNote(t); return p(`🗒️ Nota salva: “${escapeHtml(t)}”`); }
        },
        {
          name: 'nota-listar',
          test: (n) => /(minhas notas|ver notas|mostrar notas|listar notas)/.test(n),
          run: () => notes.length ? p('Suas notas:') + list(notes.slice(0, 10).map((x) => escapeHtml(x.text))) : p('Você ainda não tem notas. Diga "nota: ..." para criar.')
        }
      ],
      onEnable() {
        renderNotes();
        const form = $('#notesForm');
        if (form && !form.dataset.ready) {
          form.dataset.ready = '1';
          form.addEventListener('submit', (e) => { e.preventDefault(); const v = $('#notesInput').value.trim(); if (v) { addNote(v); $('#notesInput').value = ''; } });
          $('#notesList').addEventListener('click', (e) => { const id = e.target.dataset.del; if (id) { notes = notes.filter((x) => x.id !== id); saveNotes(); renderNotes(); } });
        }
      }
    },
    {
      id: 'tradutor', icon: '🌐', name: 'Tradutor', default: true,
      desc: 'Traduz frases: "traduza para inglês: bom dia" ou "como se diz obrigado em japonês". Usa a internet.',
      skills: [{
        name: 'traduzir',
        test: (n) => /^(traduz|traduza|traduzir|traducao)\b/.test(n) || /como (se )?(diz|fala|escreve)\s+.+\s+em\s+[a-z]+\??$/.test(n),
        run: async (n, text) => {
          let target, body;
          let m = n.match(/como (?:se )?(?:diz|fala|escreve)\s+(.+)\s+em\s+([a-z]+)\??$/);
          if (m) { target = LANGS[m[2]]; body = text.match(/(?:diz|fala|escreve)\s+(.+)\s+em\s+\S+\??$/i)[1].replace(/^["“]|["”]$/g, ''); }
          else {
            m = n.match(/para\s+(?:o\s+)?([a-z]+)/);
            target = m ? LANGS[m[1]] : 'en';
            body = text.includes(':') ? text.slice(text.indexOf(':') + 1).trim() : text.replace(/^(traduz\w*|tradu[çc][ãa]o)\s+(para\s+(o\s+)?\S+\s+)?/i, '').trim();
          }
          if (!target) return p('Ainda não conheço esse idioma. Tente: inglês, espanhol, francês, italiano, alemão, japonês, chinês, russo, coreano ou latim.');
          if (!body) return p('O que você quer traduzir? Ex.: "traduza para espanhol: bom dia".');
          try {
            const out = await translate(body, target, target === 'pt-BR' ? 'en' : 'pt-BR');
            if (!out) throw new Error();
            return p(`🌐 <b>${escapeHtml(out)}</b>`) + `<div class="bubble-actions"><button type="button" data-chat-action="say" data-lang="${target}" data-text="${escapeHtml(out)}">🔊 Ouvir</button></div>`;
          } catch { return p('Não consegui traduzir agora. Verifique sua internet.'); }
        }
      }]
    },
    {
      id: 'moedas', icon: '💱', name: 'Cotação de moedas', default: true,
      desc: 'Converte moedas com a cotação do dia: "100 dólares em reais", "cotação do euro". Usa a internet.',
      skills: [{
        name: 'moeda',
        test: (n) => /(cotacao|quanto (esta|ta|vale|custa) o)\s+(do |da |o )?(dolar|euro|libra|iene|peso|bitcoin|yuan|franco)/.test(n)
          || /\d+(?:[.,]\d+)?\s*(dolar|dolares|reais|real|euros?|libras?|ienes?|pesos?|usd|brl|eur|bitcoin|yuan)\s+(em|para|pra)\s+(dolar|dolares|reais|real|euros?|libras?|ienes?|pesos?|usd|brl|eur|bitcoin|yuan)/.test(n),
        run: async (n) => {
          try {
            const r = await rates();
            let m = n.match(/(\d+(?:[.,]\d+)?)\s*([a-z]+)\s+(?:em|para|pra)\s+([a-z]+)/);
            let amount = 1, from, to = 'BRL';
            if (m && CURRENCIES[m[2]] && CURRENCIES[m[3]]) { amount = V.parseNum(m[1]); from = CURRENCIES[m[2]]; to = CURRENCIES[m[3]]; }
            else { from = CURRENCIES[n.match(/(dolar|euro|libra|iene|peso|bitcoin|yuan|franco)/)[1]]; }
            if (!r[from] || !r[to]) return p('Não tenho a cotação dessa moeda.');
            const value = amount / r[from] * r[to];
            const money = (v, c) => v.toLocaleString('pt-BR', { style: 'currency', currency: c, maximumFractionDigits: c === 'BTC' ? 8 : 2 });
            return p(`💱 ${money(amount, from)} = <b>${money(value, to)}</b>`) + p('<small>Cotação de referência do dia (open.er-api.com). Bancos e casas de câmbio cobram taxas.</small>');
          } catch { return p('Não consegui buscar a cotação agora. Verifique sua internet.'); }
        }
      }]
    },
    {
      id: 'agua', icon: '💧', name: 'Lembrete de água', default: false,
      desc: 'A cada hora com a página aberta, o bardo lembra você de beber água.',
      onEnable() {
        clearInterval(waterTimer);
        waterTimer = setInterval(() => {
          V.app.notify('💧 Hora de beber água!', 'Um copo agora faz bem para o foco.');
          V.app.addMessage('ai', p('💧 Pausa rápida: beba um copo de água, viajante!'));
          V.bard.set('cheer', 2000);
        }, 60 * 60 * 1000);
      },
      onDisable() { clearInterval(waterTimer); waterTimer = null; }
    },
    {
      id: 'clima', icon: '🌤️', name: 'Clima no topo', default: false,
      desc: 'Mostra a temperatura da sua cidade no topo da página. Diga no chat "moro em ..." para escolher a cidade.',
      widget: 'weatherPill',
      onEnable: refreshWeatherPill
    }
  ];

  /* ---------- Motor das extensões ---------- */
  const isOn = (id) => {
    const ext = EXTENSIONS.find((e) => e.id === id);
    return !!ext && (id in settings.extensions ? settings.extensions[id] : ext.default);
  };

  function applyExtension(ext) {
    const on = isOn(ext.id);
    if (ext.widget) { const w = document.getElementById(ext.widget); if (w) w.hidden = !on; }
    if (on) ext.onEnable?.(); else ext.onDisable?.();
  }

  function toggle(id, value) {
    const ext = EXTENSIONS.find((e) => e.id === id);
    if (!ext) return false;
    settings.extensions[id] = value ?? !isOn(id);
    saveSettings();
    applyExtension(ext);
    renderPanel();
    return settings.extensions[id];
  }

  function renderPanel() {
    const grid = $('#extGrid');
    if (!grid) return;
    grid.innerHTML = EXTENSIONS.map((e) => `
      <label class="ext-card ${isOn(e.id) ? 'on' : ''}">
        <span class="ext-icon">${e.icon}</span>
        <span class="ext-text"><strong>${e.name}</strong><small>${e.desc}</small></span>
        <input type="checkbox" class="ext-switch" data-ext="${e.id}" ${isOn(e.id) ? 'checked' : ''} aria-label="Ligar ${e.name}">
      </label>`).join('');
    const count = EXTENSIONS.filter((e) => isOn(e.id)).length;
    const badge = $('#extCount'); if (badge) badge.textContent = count;
  }

  // Coloca as habilidades das extensões no cérebro (antes das habilidades de memória)
  const at = V.SKILLS.findIndex((s) => s.name === 'memoria-salvar');
  const extSkills = EXTENSIONS.flatMap((e) => (e.skills || []).map((s) => ({ ...s, ext: e.id })));
  V.SKILLS.splice(at < 0 ? 0 : at, 0, ...extSkills);

  // Habilidade para ligar/desligar extensões pelo chat
  V.SKILLS.splice(at < 0 ? 0 : at, 0, {
    name: 'extensoes',
    test: (n) => /(extensoes|extensao|plugins?|modulos)/.test(n),
    run: (n) => {
      const target = EXTENSIONS.find((e) => n.includes(normalize(e.name).split(' ')[0]) || n.includes(e.id));
      if (target && /(desativ|deslig|desabilit)/.test(n)) { toggle(target.id, false); return p(`🧩 Extensão <b>${target.name}</b> desligada.`); }
      if (target && /(ativ|lig|habilit)/.test(n)) { toggle(target.id, true); return p(`🧩 Extensão <b>${target.name}</b> ligada.`); }
      if (/(abr|mostr|painel|configur)/.test(n)) V.extensions.open();
      return p('🧩 Suas extensões (ligue e desligue no botão 🧩 lá em cima, ou diga "ligar extensão clima"):') + list(EXTENSIONS.map((e) => `${e.icon} ${e.name}: <b>${isOn(e.id) ? 'ligada' : 'desligada'}</b>`));
    }
  });

  function init() {
    renderPanel();
    EXTENSIONS.forEach(applyExtension);
    $('#extGrid').addEventListener('change', (e) => {
      const id = e.target.dataset.ext;
      if (id) { const on = toggle(id, e.target.checked); toast(`${EXTENSIONS.find((x) => x.id === id).name}: ${on ? 'ligada' : 'desligada'}`); }
    });
    $('#extButton').addEventListener('click', () => V.extensions.open());
  }

  V.extensions = {
    list: EXTENSIONS, isOn, toggle, init, refreshWeatherPill,
    open() { renderPanel(); $('#extDialog').showModal(); }
  };
})();
