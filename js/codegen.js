/* =========================================================
   virgilio.ia — gerador de código
   Modelos prontos em HTML, CSS, JavaScript e Python.
   Usado pela aba "Desenvolvimento" e pelo chat.
   ========================================================= */
(() => {
  'use strict';
  const { normalize, escapeHtml, toast } = V;

  const slug = (s) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meu-projeto';
  const EXT = { html: 'html', css: 'css', js: 'js', py: 'py', php: 'php' };
  const LANG_NAME = { html: 'HTML', css: 'CSS', js: 'JavaScript', py: 'Python', php: 'PHP' };
  const TEMPLATE_NAME = {
    base: 'estrutura base', contador: 'contador de cliques', relogio: 'relógio digital', formulario: 'formulário de contato',
    lista: 'lista de tarefas', calculadora: 'calculadora', cronometro: 'cronômetro', jogodavelha: 'jogo da velha',
    quiz: 'quiz de perguntas', landing: 'página de apresentação', tema: 'botão de modo escuro', api: 'consulta a uma API'
  };

  const BASE_CSS = String.raw`* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #f5f7f2;
  color: #18201b;
}
.card {
  background: #fff;
  padding: 32px;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .08);
  width: min(420px, 92vw);
  text-align: center;
}
button {
  border: 0;
  border-radius: 12px;
  padding: 10px 18px;
  background: #2f6b4f;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
button:hover { background: #18201b; }
input, select {
  padding: 10px 12px;
  border: 1px solid #dfe5da;
  border-radius: 10px;
  font: inherit;
}`;

  const TEMPLATES = {
    base: {
      markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p id="mensagem">Projeto criado com o virgilio.ia.</p>
    <button id="botao">Clique aqui</button>
  </main>`,
      css: '',
      js: String.raw`document.addEventListener('DOMContentLoaded', () => {
  const botao = document.getElementById('botao');
  const mensagem = document.getElementById('mensagem');

  botao.addEventListener('click', () => {
    mensagem.textContent = 'Funcionou! Agora é só adaptar.';
  });
});`,
      py: String.raw`def main():
    nome = input("Qual o seu nome? ")
    print("Olá, " + nome + "! Projeto __TITLE__ rodando.")


if __name__ == "__main__":
    main()`
    },
    contador: {
      markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p class="numero" id="valor">0</p>
    <div class="acoes">
      <button id="menos">−</button>
      <button id="zerar">Zerar</button>
      <button id="mais">+</button>
    </div>
  </main>`,
      css: String.raw`.numero { font-size: 64px; font-weight: 700; margin: 12px 0; }
.acoes { display: flex; gap: 8px; justify-content: center; }`,
      js: String.raw`let contador = Number(localStorage.getItem('contador')) || 0;
const valor = document.getElementById('valor');

function atualizar() {
  valor.textContent = contador;
  localStorage.setItem('contador', contador);
}

document.getElementById('mais').addEventListener('click', () => { contador++; atualizar(); });
document.getElementById('menos').addEventListener('click', () => { contador--; atualizar(); });
document.getElementById('zerar').addEventListener('click', () => { contador = 0; atualizar(); });

atualizar();`,
      py: String.raw`contador = 0
print("Contador: digite + para somar, - para subtrair, 0 para zerar, s para sair")

while True:
    opcao = input("> ").strip()
    if opcao == "+":
        contador += 1
    elif opcao == "-":
        contador -= 1
    elif opcao == "0":
        contador = 0
    elif opcao == "s":
        break
    print("Valor:", contador)`
    },
    relogio: {
      markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p class="hora" id="hora">00:00:00</p>
    <p id="data"></p>
  </main>`,
      css: String.raw`.hora {
  font-size: 56px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin: 8px 0;
}`,
      js: String.raw`const hora = document.getElementById('hora');
const data = document.getElementById('data');

function atualizarRelogio() {
  const agora = new Date();
  hora.textContent = agora.toLocaleTimeString('pt-BR');
  data.textContent = agora.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000);`,
      py: String.raw`import time
from datetime import datetime

try:
    while True:
        agora = datetime.now().strftime("%H:%M:%S")
        print("\r" + agora, end="", flush=True)
        time.sleep(1)
except KeyboardInterrupt:
    print("\nRelógio encerrado.")`
    },
    formulario: {
      markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <form id="formulario" novalidate>
      <input id="nome" placeholder="Seu nome" required>
      <input id="email" type="email" placeholder="Seu e-mail" required>
      <textarea id="mensagemTexto" placeholder="Sua mensagem" rows="4" required></textarea>
      <button type="submit">Enviar</button>
      <p id="aviso"></p>
    </form>
  </main>`,
      css: String.raw`form { display: grid; gap: 10px; text-align: left; }
textarea {
  padding: 10px 12px;
  border: 1px solid #dfe5da;
  border-radius: 10px;
  font: inherit;
  resize: vertical;
}
#aviso { margin: 0; font-size: 14px; }
.erro { color: #d2554a; }
.ok { color: #2f6b4f; }`,
      js: String.raw`const form = document.getElementById('formulario');
const aviso = document.getElementById('aviso');

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const texto = document.getElementById('mensagemTexto').value.trim();

  if (!nome || !email || !texto) {
    aviso.textContent = 'Preencha todos os campos.';
    aviso.className = 'erro';
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    aviso.textContent = 'Digite um e-mail válido.';
    aviso.className = 'erro';
    return;
  }

  aviso.textContent = 'Obrigado, ' + nome + '! Mensagem enviada.';
  aviso.className = 'ok';
  form.reset();
});`,
      py: String.raw`def pedir(campo):
    valor = ""
    while not valor:
        valor = input(campo + ": ").strip()
    return valor


nome = pedir("Nome")
email = pedir("E-mail")
while "@" not in email:
    print("E-mail inválido.")
    email = pedir("E-mail")
mensagem = pedir("Mensagem")

print("\nObrigado, " + nome + "! Recebemos sua mensagem.")`
    },
    lista: {
      markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <form id="formTarefa" class="linha">
      <input id="novaTarefa" placeholder="Nova tarefa" autocomplete="off">
      <button type="submit">Adicionar</button>
    </form>
    <ul id="lista"></ul>
  </main>`,
      css: String.raw`.linha { display: flex; gap: 8px; }
.linha input { flex: 1; }
#lista { list-style: none; padding: 0; margin: 16px 0 0; text-align: left; }
#lista li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #dfe5da;
  border-radius: 10px;
  margin-bottom: 6px;
  cursor: pointer;
}
#lista li.feita span { text-decoration: line-through; color: #637066; }
#lista li button { background: none; color: #d2554a; padding: 4px 8px; }`,
      js: String.raw`const lista = document.getElementById('lista');
const input = document.getElementById('novaTarefa');
let tarefas = JSON.parse(localStorage.getItem('tarefas') || '[]');

function salvar() { localStorage.setItem('tarefas', JSON.stringify(tarefas)); }

function desenhar() {
  lista.innerHTML = '';
  tarefas.forEach((tarefa, i) => {
    const li = document.createElement('li');
    li.className = tarefa.feita ? 'feita' : '';
    const texto = document.createElement('span');
    texto.textContent = tarefa.texto;
    const remover = document.createElement('button');
    remover.textContent = '×';
    remover.addEventListener('click', (e) => {
      e.stopPropagation();
      tarefas.splice(i, 1); salvar(); desenhar();
    });
    li.addEventListener('click', () => {
      tarefa.feita = !tarefa.feita; salvar(); desenhar();
    });
    li.append(texto, remover);
    lista.appendChild(li);
  });
}

document.getElementById('formTarefa').addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;
  tarefas.push({ texto, feita: false });
  input.value = '';
  salvar(); desenhar();
});

desenhar();`,
      py: String.raw`tarefas = []

while True:
    print("\n1) Adicionar  2) Listar  3) Concluir  4) Sair")
    opcao = input("Escolha: ").strip()
    if opcao == "1":
        tarefas.append({"texto": input("Tarefa: "), "feita": False})
    elif opcao == "2":
        for i, t in enumerate(tarefas, 1):
            marca = "x" if t["feita"] else " "
            print(f"{i}. [{marca}] {t['texto']}")
    elif opcao == "3":
        n = int(input("Número da tarefa: ")) - 1
        if 0 <= n < len(tarefas):
            tarefas[n]["feita"] = True
    elif opcao == "4":
        break`
    },
    calculadora: {
      markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <form id="calc" class="calc">
      <input id="a" type="number" step="any" placeholder="Número 1" required>
      <select id="op">
        <option value="+">+</option>
        <option value="-">−</option>
        <option value="*">×</option>
        <option value="/">÷</option>
      </select>
      <input id="b" type="number" step="any" placeholder="Número 2" required>
      <button type="submit">=</button>
    </form>
    <p class="resultado" id="resultado">Resultado</p>
  </main>`,
      css: String.raw`.calc { display: flex; gap: 6px; }
.calc input { flex: 1; width: 0; }
.resultado { font-size: 28px; font-weight: 700; margin-top: 16px; }`,
      js: String.raw`const operacoes = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (b === 0 ? NaN : a / b)
};

document.getElementById('calc').addEventListener('submit', (e) => {
  e.preventDefault();
  const a = parseFloat(document.getElementById('a').value);
  const b = parseFloat(document.getElementById('b').value);
  const op = document.getElementById('op').value;
  const r = operacoes[op](a, b);
  document.getElementById('resultado').textContent =
    Number.isFinite(r) ? r.toLocaleString('pt-BR') : 'Não dá para dividir por zero';
});`,
      py: String.raw`operacoes = {
    "+": lambda a, b: a + b,
    "-": lambda a, b: a - b,
    "*": lambda a, b: a * b,
    "/": lambda a, b: a / b if b != 0 else None,
}

a = float(input("Número 1: ").replace(",", "."))
op = input("Operação (+ - * /): ").strip()
b = float(input("Número 2: ").replace(",", "."))

if op not in operacoes:
    print("Operação inválida")
else:
    r = operacoes[op](a, b)
    print("Não dá para dividir por zero" if r is None else f"Resultado: {r}")`
    }
  };

  function buildHtmlPage(title, tpl) {
    const css = (BASE_CSS + (tpl.css ? '\n' + tpl.css : '')).replace(/^/gm, '    ');
    const js = tpl.js.replace(/^/gm, '    ');
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
  ${tpl.markup.replace(/__TITLE__/g, title)}
  <script>
${js}
  <\/script>
</body>
</html>`;
  }

  // Página PHP: lógica no topo + HTML com PHP misturado
  function buildPhpPage(title, tpl, phpTpl, header) {
    const css = (BASE_CSS + (tpl.css ? '\n' + tpl.css : '') + (phpTpl && phpTpl.css ? '\n' + phpTpl.css : '')).replace(/^/gm, '    ');
    const logic = phpTpl ? phpTpl.logic : '';
    const markup = phpTpl ? phpTpl.markup : tpl.markup.replace(/__TITLE__/g, '<?= htmlspecialchars($titulo) ?>');
    const js = !phpTpl && tpl.js ? '\n  <script>\n' + tpl.js.replace(/^/gm, '    ') + '\n  <\/script>' : '';
    return `<?php
${header}
// Rode com: php -S localhost:8000  e abra http://localhost:8000/

$titulo = '${String(title).replace(/'/g, "\\'")}';
${logic}
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($titulo) ?></title>
  <style>
${css}
  </style>
</head>
<body>
  ${markup}${js}
</body>
</html>`;
  }

  const RUN = {
    js: (f, tpl) => tpl && tpl.program ? `node ${f}` : null,
    py: (f) => `python ${f}`,
    php: (f, tpl) => tpl && tpl.program && !tpl.phpWeb ? `php ${f}` : `php -S localhost:8000  (e abra http://localhost:8000/${f})`
  };

  function generateCode(lang, template = 'base', name = 'meu-projeto') {
    const tpl = TEMPLATES[template] || TEMPLATES.base;
    const title = escapeHtml((name || 'meu-projeto').trim().slice(0, 60)) || 'meu-projeto';
    const file = slug(name);
    const header = (c) => `${c} ${file} — ${TEMPLATE_NAME[template]} (gerado pelo virgilio.ia)`;
    let content;

    // Programas de terminal (Node, Python, PHP)
    if (tpl.program) {
      if (lang === 'html' || lang === 'css') lang = 'js';
      const runCmd = RUN[lang](file + '.' + EXT[lang], tpl);
      const how = runCmd ? `Como rodar: ${runCmd}` : '';
      if (lang === 'php') content = `<?php\n${header('//')}\n// ${how}\n\n${tpl.php}\n`;
      else if (lang === 'py') content = `${header('#')}\n# ${how}\n\n${tpl.py}\n`;
      else content = `${header('//')}\n// ${how}\n\n${tpl.js}\n`;
      return { lang, template, content, filename: file + '.' + EXT[lang], node: lang === 'js', run: runCmd, explain: tpl.explain };
    }

    if (lang === 'html') content = buildHtmlPage(title, tpl);
    else if (lang === 'css') content = `/* ${file} — ${TEMPLATE_NAME[template]} (gerado pelo virgilio.ia) */\n${BASE_CSS}${tpl.css ? '\n\n' + tpl.css : ''}`;
    else if (lang === 'php') content = buildPhpPage(title, tpl, PHP_PAGES[template], header('//'));
    else if (lang === 'py') {
      if (!tpl.py) return generateCode('html', template, name); // modelo só existe para web
      content = `${header('#')}\n\n${tpl.py.replace(/__TITLE__/g, name || 'meu-projeto')}`;
    }
    else content = `${header('//')}\n// Use junto com o HTML do mesmo modelo.\n\n${tpl.js}`;
    const filename = (lang === 'css' ? 'style' : lang === 'js' ? 'script' : lang === 'php' ? 'index' : file) + '.' + EXT[lang];
    return { lang, template, content, filename, run: RUN[lang] ? RUN[lang](filename, tpl) : null, explain: tpl.explain };
  }

  function previewCode(lang, content, template = 'base') {
    if (lang === 'py' || lang === 'php' || (TEMPLATES[template] || {}).program) { toast('Esse código roda no computador: baixe o arquivo e siga o "Como rodar".'); return; }
    const tpl = TEMPLATES[template] || TEMPLATES.base;
    let html = content;
    if (lang === 'css') html = buildHtmlPage('Prévia', { ...tpl, css: '' }).replace(BASE_CSS.replace(/^/gm, '    '), content.replace(/^/gm, '    '));
    if (lang === 'js') html = buildHtmlPage('Prévia', { ...tpl, js: content });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    if (!win) toast('Libere pop-ups para ver a prévia');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------- Novos modelos ---------- */
  Object.assign(TEMPLATES, window.VIRGILIO_EXTRA_TEMPLATES || {});
  const PHP_PAGES = window.VIRGILIO_PHP_PAGES || {};
  Object.entries(window.VIRGILIO_PROGRAMS || {}).forEach(([key, prog]) => {
    TEMPLATES[key] = { ...prog, program: true };
    TEMPLATE_NAME[key] = prog.name;
  });

  // Palavras que o chat usa para descobrir qual modelo você quer
  const TEMPLATE_KEYWORDS = [
    ['adivinhacao', /adivinha|advinha|chute|numero secreto/],
    ['senha', /gerador de senhas?|gerar senhas?|gera senhas?|senhas? fortes?|password/],
    ['temperatura', /temperatura|celsius|fahrenheit|kelvin/],
    ['media', /media|notas|boletim|aprovad/],
    ['agenda', /agenda|contatos|crud/],
    ['servidor', /servidor|backend|api rest|rest api|\bapi de\b|endpoint/],
    ['jogodavelha', /jogo da velha|velha|tic.?tac/],
    ['cronometro', /cronometro|stopwatch/],
    ['quiz', /quiz|pergunta|questionario|prova/],
    ['landing', /landing|apresentacao|portfolio|pagina inicial|site pessoal|vitrine/],
    ['tema', /modo escuro|dark|tema escuro|claro e escuro/],
    ['api', /\bapi\b|fetch|requisicao|buscar dados|consumir/],
    ['contador', /contador|clique|cliques/],
    ['relogio', /relogio|hora|horario/],
    ['formulario', /formulario|cadastro|contato|login/],
    ['lista', /lista|tarefa|to-?do|afazer/],
    ['calculadora', /calculadora|calcular|soma/]
  ];
  const detectTemplate = (n) => (TEMPLATE_KEYWORDS.find(([, re]) => re.test(n)) || ['base'])[0];

  Object.assign(V, { TEMPLATES, TEMPLATE_NAME, LANG_NAME, generateCode, previewCode, detectTemplate, codeSlug: slug });
})();
