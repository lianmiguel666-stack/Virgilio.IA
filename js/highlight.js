/* =========================================================
   virgilio.ia — cores no código (syntax highlight simples)
   Suporta JavaScript, Python, PHP, HTML e CSS.
   ========================================================= */
(() => {
  'use strict';
  const { escapeHtml } = V;

  const KEYWORDS = {
    js: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof of in this null undefined true false require',
    py: 'def return if elif else for while in not and or is import from as class try except finally raise with lambda pass break continue None True False global yield print self',
    php: 'function return if else elseif foreach for while do switch case break continue new class public private protected static const echo print array fn match default try catch throw null true false isset empty require include use namespace exit die',
    css: '',
    html: ''
  };

  // Cada regra: [classe, regex]. A primeira que casar na posição atual vence.
  function rules(lang) {
    const kw = KEYWORDS[lang] ? new RegExp('\\b(?:' + KEYWORDS[lang].split(' ').join('|') + ')\\b', 'y') : null;
    const common = [
      ['str', /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y],
      ['num', /\b\d+(?:\.\d+)?\b/y]
    ];
    if (lang === 'py') return [['com', /#[^\n]*/y], ['str', /f?"""[\s\S]*?"""|f?'''[\s\S]*?'''/y], ...common.map(([c, r]) => c === 'str' ? ['str', /f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*'/y] : [c, r]), ['kw', kw], ['fn', /\b[a-zA-Z_]\w*(?=\()/y]];
    if (lang === 'php') return [['com', /\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//y], ['tag', /<\?php|\?>|<\?=/y], ['var', /\$[a-zA-Z_]\w*/y], ...common, ['kw', kw], ['fn', /\b[a-zA-Z_]\w*(?=\()/y], ['tag', /<\/?[a-zA-Z][\w-]*|\/?>/y]];
    if (lang === 'css') return [['com', /\/\*[\s\S]*?\*\//y], ['str', /"[^"\n]*"|'[^'\n]*'/y], ['kw', /[a-z-]+(?=\s*:)/y], ['num', /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|s|deg)?\b/y], ['fn', /[.#][a-zA-Z][\w-]*/y]];
    if (lang === 'html') return [['com', /<!--[\s\S]*?-->/y], ['tag', /<\/?[a-zA-Z][\w-]*|\/?>|<!doctype html>/iy], ['attr', /\b[a-z-]+(?==)/y], ['str', /"[^"]*"|'[^']*'/y], ['com', /\/\/[^\n]*/y], ['kw', new RegExp('\\b(?:' + KEYWORDS.js.split(' ').join('|') + ')\\b', 'y')], ['num', /\b\d+(?:\.\d+)?\b/y]];
    return [['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y], ...common, ['kw', kw], ['fn', /\b[a-zA-Z_$][\w$]*(?=\()/y]];
  }

  function highlight(code, lang = 'js') {
    const rs = rules(lang).filter(([, r]) => r);
    let out = '', i = 0, plain = '';
    while (i < code.length) {
      let matched = false;
      for (const [cls, re] of rs) {
        re.lastIndex = i;
        const m = re.exec(code);
        if (m && m[0].length) {
          if (plain) { out += escapeHtml(plain); plain = ''; }
          out += `<span class="tk-${cls}">${escapeHtml(m[0])}</span>`;
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // avança uma "palavra" inteira para não colorir pedaços de identificadores
        const w = /[\w$]+|[\s\S]/y; w.lastIndex = i;
        const m = w.exec(code);
        plain += m[0]; i += m[0].length;
      }
    }
    return out + escapeHtml(plain);
  }

  // Colore todos os <pre class="hl" data-lang> dentro de um elemento
  function highlightIn(root) {
    root.querySelectorAll('pre.hl:not([data-done])').forEach((pre) => {
      pre.innerHTML = highlight(pre.textContent, pre.dataset.lang || 'js');
      pre.dataset.done = '1';
    });
  }

  Object.assign(V, { highlight, highlightIn });
})();
