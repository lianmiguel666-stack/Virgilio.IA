/* =========================================================
   virgilio.ia — conhecimento e ferramentas de texto
   Piadas, frases, curiosidades, Wikipedia, clima,
   sorteios, senhas e ferramentas para textos.
   ========================================================= */
(() => {
  'use strict';
  const { normalize, pick, fetchJson } = V;

  const JOKES = [
    'Por que o livro de matemática estava triste? Porque tinha muitos problemas.',
    'O que o JavaScript disse para o HTML? "Sem mim você não tem graça nenhuma."',
    'Por que o programador foi ao médico? Porque estava com um bug no sistema.',
    'O que o zero disse para o oito? "Que cinto bonito!"',
    'Por que a planta não fala? Porque ela é muda.',
    'Qual é o café mais perigoso do mundo? O ex-presso.',
    'O que o tomate foi fazer no banco? Tirar extrato.',
    'Por que o computador foi para a escola? Para melhorar a memória RAM.',
    'Como o Wi-Fi pede alguém em casamento? "Você quer se conectar comigo?"',
    'Por que o pinheiro não se perde na floresta? Porque ele tem uma pinha (um mapa).',
    'Qual é o contrário de volátil? Vem cá sobrinho.',
    'Um programador diz: "Vou ao mercado. Minha esposa: traz um pão, e se tiver ovos, traz seis." Ele voltou com seis pães.'
  ];

  const QUOTES = [
    '"O segredo de progredir é começar." — Mark Twain',
    '"Feito é melhor que perfeito." — Sheryl Sandberg',
    '"Não espere por oportunidades, crie-as." — George Bernard Shaw',
    '"A disciplina é a ponte entre metas e realizações." — Jim Rohn',
    '"Pequenos passos todos os dias levam a grandes resultados."',
    '"Você não precisa ver a escada inteira, só dê o primeiro passo." — Martin Luther King Jr.',
    '"A persistência realiza o impossível." — provérbio chinês',
    '"Comece onde você está. Use o que você tem. Faça o que você pode." — Arthur Ashe',
    '"O sucesso é a soma de pequenos esforços repetidos dia após dia." — Robert Collier',
    '"Quem tem um porquê enfrenta qualquer como." — Friedrich Nietzsche'
  ];

  const FACTS = [
    'O coração de um polvo... são três! E o sangue dele é azul.',
    'O mel nunca estraga. Já encontraram mel comestível em tumbas egípcias de 3 mil anos.',
    'A luz do Sol leva cerca de 8 minutos e 20 segundos para chegar à Terra.',
    'O primeiro "bug" de computador foi uma mariposa de verdade presa num relé, em 1947.',
    'O Brasil tem a maior biodiversidade do planeta: cerca de 20% das espécies conhecidas.',
    'Um dia em Vênus dura mais que um ano em Vênus.',
    'O JavaScript foi criado em apenas 10 dias, em 1995, por Brendan Eich.',
    'Bananas são levemente radioativas por causa do potássio.',
    'O cérebro humano usa cerca de 20% da energia do corpo.',
    'A Grande Muralha da China não é visível a olho nu do espaço, ao contrário do que se diz.',
    'Os flamingos são rosa por causa da alimentação, rica em pigmentos de camarões e algas.',
    'Existem mais estrelas no universo do que grãos de areia em todas as praias da Terra.'
  ];

  const ADVICE = [
    'Divida a tarefa grande em passos de 15 minutos. O primeiro passo é o mais difícil.',
    'Desligue as notificações por 25 minutos e veja o quanto você rende.',
    'Antes de dormir, escolha as 3 tarefas mais importantes de amanhã.',
    'Se algo leva menos de 2 minutos, faça agora.',
    'Beba água e levante para alongar a cada hora. Seu foco agradece.',
    'Comece pela tarefa que você mais quer evitar. O resto do dia fica leve.'
  ];

  /* ---------- Wikipedia (português) ---------- */
  async function wikiSummary(term) {
    const q = term.trim();
    if (!q) return null;
    // 1) procura o artigo mais parecido
    const search = await fetchJson('https://pt.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=' + encodeURIComponent(q));
    const title = search?.query?.search?.[0]?.title;
    if (!title) return null;
    // 2) pega o resumo
    const sum = await fetchJson('https://pt.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')));
    if (!sum || !sum.extract) return null;
    return { title: sum.title, extract: sum.extract, url: sum.content_urls?.desktop?.page, image: sum.thumbnail?.source };
  }

  /* ---------- Clima (Open-Meteo, sem chave) ---------- */
  const WEATHER_CODES = {
    0: ['céu limpo', '☀️'], 1: ['quase limpo', '🌤️'], 2: ['parcialmente nublado', '⛅'], 3: ['nublado', '☁️'],
    45: ['neblina', '🌫️'], 48: ['neblina', '🌫️'], 51: ['garoa fraca', '🌦️'], 53: ['garoa', '🌦️'], 55: ['garoa forte', '🌧️'],
    61: ['chuva fraca', '🌧️'], 63: ['chuva', '🌧️'], 65: ['chuva forte', '🌧️'], 71: ['neve fraca', '🌨️'], 73: ['neve', '🌨️'], 75: ['neve forte', '❄️'],
    80: ['pancadas de chuva', '🌦️'], 81: ['pancadas de chuva', '🌧️'], 82: ['temporal', '⛈️'], 95: ['trovoadas', '⛈️'], 96: ['trovoadas com granizo', '⛈️'], 99: ['trovoadas com granizo', '⛈️']
  };
  async function weather(city) {
    const geo = await fetchJson('https://geocoding-api.open-meteo.com/v1/search?count=1&language=pt&format=json&name=' + encodeURIComponent(city));
    const place = geo?.results?.[0];
    if (!place) return null;
    const w = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=3`);
    const code = (c) => WEATHER_CODES[c] || ['tempo variado', '🌡️'];
    return {
      place: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
      now: { temp: w.current.temperature_2m, feels: w.current.apparent_temperature, humidity: w.current.relative_humidity_2m, wind: w.current.wind_speed_10m, desc: code(w.current.weather_code) },
      days: w.daily.time.map((t, i) => ({ date: t, max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i], rain: w.daily.precipitation_probability_max[i], desc: code(w.daily.weather_code[i]) }))
    };
  }

  /* ---------- Sorteios e aleatórios ---------- */
  function randomInt(min, max) {
    const lo = Math.ceil(Math.min(min, max)), hi = Math.floor(Math.max(min, max));
    const arr = new Uint32Array(1); crypto.getRandomValues(arr);
    return lo + (arr[0] % (hi - lo + 1));
  }
  function password(len = 16) {
    const sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%&*?-_+='];
    const all = sets.join('');
    const chars = sets.map((s) => s[randomInt(0, s.length - 1)]); // garante um de cada tipo
    while (chars.length < len) chars.push(all[randomInt(0, all.length - 1)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(0, i); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join('');
  }

  /* ---------- Ferramentas de texto ---------- */
  const STOPWORDS = new Set('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem e ou que se sua seu suas seus ao aos à às é foi ser são era como mais mas também muito já não sim isso esta este essa esse ela ele eles elas pelo pela entre sobre quando onde há tem ter'.split(' '));

  function textStats(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
    return { chars: text.length, charsNoSpace: text.replace(/\s/g, '').length, words: words.length, sentences, readMin: Math.max(1, Math.round(words.length / 200)) };
  }

  // Resumo extrativo: escolhe as frases com as palavras mais importantes
  function summarize(text, maxSentences = 3) {
    const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter((s) => s.length > 20) || [];
    if (sentences.length <= maxSentences) return sentences.join(' ');
    const freq = {};
    normalize(text).split(/[^a-z0-9]+/).forEach((w) => { if (w.length > 2 && !STOPWORDS.has(w)) freq[w] = (freq[w] || 0) + 1; });
    const scored = sentences.map((s, i) => {
      const ws = normalize(s).split(/[^a-z0-9]+/).filter((w) => freq[w]);
      const score = ws.reduce((sum, w) => sum + freq[w], 0) / Math.max(4, ws.length) + (i === 0 ? 0.5 : 0);
      return { s, i, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, maxSentences).sort((a, b) => a.i - b.i).map((x) => x.s).join(' ');
  }

  function keywords(text, n = 6) {
    const freq = {};
    text.toLowerCase().split(/[^a-zà-ú0-9]+/i).forEach((w) => { if (w.length > 3 && !STOPWORDS.has(normalize(w))) freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
  }

  const titleCase = (t) => t.toLowerCase().replace(/(^|\s)(\S)/g, (m, s, c) => s + c.toUpperCase());

  Object.assign(V, {
    JOKES, QUOTES, FACTS, ADVICE, wikiSummary, weather, randomInt, password,
    textStats, summarize, keywords, titleCase, joke: () => pick(JOKES), quote: () => pick(QUOTES), fact: () => pick(FACTS), advice: () => pick(ADVICE)
  });
})();
