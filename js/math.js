/* =========================================================
   virgilio.ia — matemática, equações, conversões e datas
   Calculadora segura: nada de eval(), usamos um parser próprio.
   ========================================================= */
(() => {
  'use strict';
  const { normalize, fmt } = V;

  /* ---------- Avaliador de expressões ---------- */
  // Aceita + - * / ^ %, parênteses, funções (raiz, sen, cos, log...) e variáveis (ex.: x).
  function evaluate(input, vars = {}) {
    const src = String(input).toLowerCase()
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/raiz(\s+quadrada)?(\s+de)?/g, 'sqrt').replace(/\bsen\b/g, 'sin')
      .replace(/(\d)\s*x\s*(?=\d)/g, '$1*') // "3 x 4" vira 3*4
      .replace(/\s+/g, '');
    const tokens = src.match(/\d+(?:[.,]\d+)*|[a-z]+|[-+*/^%()!]/g);
    if (!tokens || tokens.join('') !== src) throw new Error('Expressão inválida');

    // multiplicação implícita: 2x, 2(3), (1)(2), x(2)
    const toks = [];
    tokens.forEach((t, i) => {
      const prev = toks[toks.length - 1];
      const prevIsValue = prev && (/^\d/.test(prev) || prev === ')' || prev === '!' || (/^[a-z]+$/.test(prev) && !(prev in FUNCS)));
      const curIsValue = /^\d/.test(t) || t === '(' || (/^[a-z]+$/.test(t));
      if (i && prevIsValue && curIsValue) toks.push('*');
      toks.push(t);
    });

    let pos = 0;
    const peek = () => toks[pos];
    const next = () => toks[pos++];

    function parseNumber(tok) {
      let t = tok;
      if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.');
      else t = t.replace(',', '.');
      const n = Number(t);
      if (!Number.isFinite(n)) throw new Error('Número inválido');
      return n;
    }
    function primary() {
      const t = next();
      if (t === undefined) throw new Error('Expressão incompleta');
      if (/^\d/.test(t)) return parseNumber(t);
      if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('Falta fechar parênteses'); return v; }
      if (t in vars) return vars[t];
      if (t === 'pi') return Math.PI;
      if (t === 'e') return Math.E;
      if (FUNCS[t]) {
        if (peek() === '(') { next(); const v = expr(); if (next() !== ')') throw new Error('Falta fechar parênteses'); return FUNCS[t](v); }
        return FUNCS[t](unary());
      }
      throw new Error('Não entendi "' + t + '"');
    }
    function postfix() {
      let v = primary();
      while (peek() === '%' || peek() === '!') {
        const op = next();
        v = op === '%' ? v / 100 : factorial(v);
      }
      return v;
    }
    function power() { const b = postfix(); if (peek() === '^') { next(); return Math.pow(b, unary()); } return b; }
    function unary() { if (peek() === '-') { next(); return -unary(); } if (peek() === '+') { next(); return unary(); } return power(); }
    function term() {
      let v = unary();
      while (peek() === '*' || peek() === '/') {
        const op = next(); const r = unary();
        if (op === '/' && r === 0) throw new Error('Divisão por zero');
        v = op === '*' ? v * r : v / r;
      }
      return v;
    }
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = next(); const r = term(); v = op === '+' ? v + r : v - r; } return v; }

    const result = expr();
    if (pos < toks.length) throw new Error('Sobrou algo na expressão');
    if (!Number.isFinite(result)) throw new Error('Resultado indefinido');
    return Math.round(result * 1e10) / 1e10;
  }

  const deg = (f) => (x) => f(x * Math.PI / 180); // trigonometria em graus (mais comum na escola)
  const FUNCS = {
    sqrt: Math.sqrt, sin: deg(Math.sin), cos: deg(Math.cos), tan: deg(Math.tan),
    log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil
  };
  function factorial(n) {
    if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error('Fatorial só de inteiros entre 0 e 170');
    let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
  }

  /* ---------- Equações de 1º e 2º grau ---------- */
  // Ex.: "2x + 3 = 11", "x^2 - 5x + 6 = 0"
  function solveEquation(text) {
    const eq = String(text).toLowerCase().replace(/\s+/g, '');
    const parts = eq.split('=');
    if (parts.length !== 2 || !/x/.test(eq)) throw new Error('Equação inválida');
    const g = (x) => evaluate(parts[0], { x }) - evaluate(parts[1], { x });
    const c = g(0), s1 = g(1), sm1 = g(-1);
    const a = (s1 + sm1) / 2 - c;
    const b = (s1 - sm1) / 2;
    // confere se é mesmo polinômio de grau <= 2
    for (const x of [2, -3, 5]) {
      if (Math.abs(g(x) - (a * x * x + b * x + c)) > 1e-6 * Math.max(1, Math.abs(g(x)))) throw new Error('Só resolvo equações de 1º e 2º grau');
    }
    const r = (n) => Math.round(n * 1e8) / 1e8;
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) return { degree: 0, roots: [], note: Math.abs(c) < 1e-12 ? 'Qualquer valor de x serve.' : 'Não existe solução.' };
      return { degree: 1, a: 0, b: r(b), c: r(c), roots: [r(-c / b)] };
    }
    const delta = b * b - 4 * a * c;
    if (delta < -1e-12) return { degree: 2, a: r(a), b: r(b), c: r(c), delta: r(delta), roots: [], note: 'Δ negativo: não há raízes reais.' };
    const sq = Math.sqrt(Math.max(0, delta));
    const roots = [...new Set([r((-b + sq) / (2 * a)), r((-b - sq) / (2 * a))])];
    return { degree: 2, a: r(a), b: r(b), c: r(c), delta: r(delta), roots };
  }

  /* ---------- Conversões ---------- */
  const UNITS = {
    // comprimento (base: metro)
    mm: { g: 'comprimento', f: 0.001, label: 'mm' }, cm: { g: 'comprimento', f: 0.01, label: 'cm' }, m: { g: 'comprimento', f: 1, label: 'm' },
    km: { g: 'comprimento', f: 1000, label: 'km' }, pol: { g: 'comprimento', f: 0.0254, label: 'pol' }, pe: { g: 'comprimento', f: 0.3048, label: 'pés' }, mi: { g: 'comprimento', f: 1609.344, label: 'milhas' },
    // massa (base: grama)
    mg: { g: 'massa', f: 0.001, label: 'mg' }, g: { g: 'massa', f: 1, label: 'g' }, kg: { g: 'massa', f: 1000, label: 'kg' }, t: { g: 'massa', f: 1e6, label: 't' }, lb: { g: 'massa', f: 453.592, label: 'lb' },
    // volume (base: litro)
    ml: { g: 'volume', f: 0.001, label: 'mL' }, l: { g: 'volume', f: 1, label: 'L' }, m3: { g: 'volume', f: 1000, label: 'm³' },
    // tempo (base: segundo)
    s: { g: 'tempo', f: 1, label: 's' }, min: { g: 'tempo', f: 60, label: 'min' }, h: { g: 'tempo', f: 3600, label: 'h' }, dia: { g: 'tempo', f: 86400, label: 'dias' }, sem: { g: 'tempo', f: 604800, label: 'semanas' },
    // dados (base: byte)
    b: { g: 'dados', f: 1, label: 'B' }, kb: { g: 'dados', f: 1024, label: 'KB' }, mb: { g: 'dados', f: 1024 ** 2, label: 'MB' }, gb: { g: 'dados', f: 1024 ** 3, label: 'GB' }, tb: { g: 'dados', f: 1024 ** 4, label: 'TB' },
    // velocidade (base: m/s)
    kmh: { g: 'velocidade', f: 1 / 3.6, label: 'km/h' }, ms: { g: 'velocidade', f: 1, label: 'm/s' }, mph: { g: 'velocidade', f: 0.44704, label: 'mph' },
    // área (base: m²)
    m2: { g: 'área', f: 1, label: 'm²' }, km2: { g: 'área', f: 1e6, label: 'km²' }, ha: { g: 'área', f: 1e4, label: 'hectares' },
    // temperatura (tratada à parte)
    c: { g: 'temperatura', label: '°C' }, f: { g: 'temperatura', label: '°F' }, k: { g: 'temperatura', label: 'K' }
  };

  const UNIT_ALIASES = {
    mm: 'mm', milimetro: 'mm', milimetros: 'mm', cm: 'cm', centimetro: 'cm', centimetros: 'cm', m: 'm', metro: 'm', metros: 'm',
    km: 'km', quilometro: 'km', quilometros: 'km', polegada: 'pol', polegadas: 'pol', pol: 'pol', pe: 'pe', pes: 'pe', milha: 'mi', milhas: 'mi',
    mg: 'mg', miligrama: 'mg', miligramas: 'mg', g: 'g', grama: 'g', gramas: 'g', kg: 'kg', quilo: 'kg', quilos: 'kg', kilo: 'kg', kilos: 'kg',
    quilograma: 'kg', quilogramas: 'kg', tonelada: 't', toneladas: 't', libra: 'lb', libras: 'lb', lb: 'lb',
    ml: 'ml', mililitro: 'ml', mililitros: 'ml', l: 'l', litro: 'l', litros: 'l', m3: 'm3',
    s: 's', seg: 's', segundo: 's', segundos: 's', min: 'min', minuto: 'min', minutos: 'min', h: 'h', hora: 'h', horas: 'h',
    dia: 'dia', dias: 'dia', semana: 'sem', semanas: 'sem',
    b: 'b', byte: 'b', bytes: 'b', kb: 'kb', mb: 'mb', gb: 'gb', tb: 'tb', mega: 'mb', megas: 'mb', giga: 'gb', gigas: 'gb',
    kmh: 'kmh', 'km/h': 'kmh', ms: 'ms', 'm/s': 'ms', mph: 'mph',
    m2: 'm2', 'm²': 'm2', km2: 'km2', 'km²': 'km2', hectare: 'ha', hectares: 'ha', ha: 'ha',
    c: 'c', '°c': 'c', celsius: 'c', graus: 'c', f: 'f', '°f': 'f', fahrenheit: 'f', k: 'k', kelvin: 'k'
  };

  function convert(value, from, to) {
    const a = UNITS[from], b = UNITS[to];
    if (!a || !b) throw new Error('Unidade desconhecida');
    if (a.g !== b.g) throw new Error(`Não dá para converter ${a.g} em ${b.g}`);
    if (a.g === 'temperatura') {
      const toC = { c: (v) => v, f: (v) => (v - 32) * 5 / 9, k: (v) => v - 273.15 }[from](value);
      return { c: (v) => v, f: (v) => v * 9 / 5 + 32, k: (v) => v + 273.15 }[to](toC);
    }
    return value * a.f / b.f;
  }

  /* ---------- Datas ---------- */
  const MONTHS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const HOLIDAYS = { natal: '25/12', 'ano novo': '01/01', reveillon: '31/12', 'dia das criancas': '12/10', tiradentes: '21/04', independencia: '07/09', 'dia do trabalho': '01/05', halloween: '31/10', 'dia dos namorados': '12/06', finados: '02/11' };

  // Entende "25/12", "25/12/2027", "25 de dezembro", "natal"
  function parseDate(text) {
    const n = normalize(text);
    for (const [name, d] of Object.entries(HOLIDAYS)) if (n.includes(name)) return parseDate(d);
    let m = n.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);
    let day, month, year;
    if (m) { day = +m[1]; month = +m[2] - 1; year = m[3] ? +m[3] : null; }
    else {
      m = n.match(/(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?/);
      if (!m || MONTHS.indexOf(m[2]) < 0) return null;
      day = +m[1]; month = MONTHS.indexOf(m[2]); year = m[3] ? +m[3] : null;
    }
    if (year !== null && year < 100) year += 2000;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let d = new Date(year ?? today.getFullYear(), month, day);
    if (year === null && d < today) d = new Date(today.getFullYear() + 1, month, day); // próxima ocorrência
    if (d.getMonth() !== month) return null;
    return { date: d, hasYear: year !== null };
  }

  function daysBetween(a, b) {
    const A = new Date(a); A.setHours(0, 0, 0, 0);
    const B = new Date(b); B.setHours(0, 0, 0, 0);
    return Math.round((B - A) / 86400000);
  }

  const fmtDate = (d) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  Object.assign(V, { evaluate, solveEquation, UNITS, UNIT_ALIASES, convert, parseDate, daysBetween, fmtDate, fmt });
})();
