/* =========================================================
   virgilio.ia — modelos extras do gerador de código
   Cada modelo tem: markup (HTML), css, js e py (opcional).
   "__TITLE__" é trocado pelo nome do projeto.
   ========================================================= */
window.VIRGILIO_EXTRA_TEMPLATES = {
  cronometro: {
    markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p class="tempo" id="tempo">00:00.0</p>
    <div class="acoes">
      <button id="iniciar">Iniciar</button>
      <button id="volta">Volta</button>
      <button id="zerar">Zerar</button>
    </div>
    <ol id="voltas"></ol>
  </main>`,
    css: String.raw`.tempo { font-size: 56px; font-weight: 700; font-variant-numeric: tabular-nums; margin: 12px 0; }
.acoes { display: flex; gap: 8px; justify-content: center; }
#voltas { text-align: left; max-height: 180px; overflow: auto; }`,
    js: String.raw`const tempo = document.getElementById('tempo');
const botaoIniciar = document.getElementById('iniciar');
const voltas = document.getElementById('voltas');
let inicio = 0;
let acumulado = 0;
let intervalo = null;

function formatar(ms) {
  const min = String(Math.floor(ms / 60000)).padStart(2, '0');
  const seg = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  const dec = Math.floor(ms / 100) % 10;
  return min + ':' + seg + '.' + dec;
}

function atual() { return acumulado + (intervalo ? Date.now() - inicio : 0); }

botaoIniciar.addEventListener('click', () => {
  if (intervalo) {
    acumulado = atual();
    clearInterval(intervalo);
    intervalo = null;
    botaoIniciar.textContent = 'Continuar';
  } else {
    inicio = Date.now();
    intervalo = setInterval(() => { tempo.textContent = formatar(atual()); }, 100);
    botaoIniciar.textContent = 'Pausar';
  }
});

document.getElementById('volta').addEventListener('click', () => {
  const li = document.createElement('li');
  li.textContent = formatar(atual());
  voltas.prepend(li);
});

document.getElementById('zerar').addEventListener('click', () => {
  clearInterval(intervalo);
  intervalo = null;
  acumulado = 0;
  tempo.textContent = formatar(0);
  voltas.innerHTML = '';
  botaoIniciar.textContent = 'Iniciar';
});`,
    py: String.raw`import time

input("Aperte Enter para iniciar o cronômetro...")
inicio = time.time()
voltas = []

while True:
    comando = input("Enter = volta, s = parar: ").strip().lower()
    decorrido = time.time() - inicio
    if comando == "s":
        break
    voltas.append(decorrido)
    print(f"Volta {len(voltas)}: {decorrido:.1f}s")

print(f"\nTempo total: {decorrido:.1f}s")`
  },

  jogodavelha: {
    markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p id="status">Vez do X</p>
    <div class="tabuleiro" id="tabuleiro"></div>
    <button id="reiniciar">Reiniciar</button>
  </main>`,
    css: String.raw`.tabuleiro {
  display: grid;
  grid-template-columns: repeat(3, 90px);
  gap: 6px;
  justify-content: center;
  margin: 16px 0;
}
.casa {
  width: 90px;
  height: 90px;
  font-size: 40px;
  font-weight: 700;
  background: #eef2ea;
  color: #18201b;
}
.casa:hover { background: #e1efe6; }
.casa.vencedora { background: #9ad3b0; }`,
    js: String.raw`const tabuleiro = document.getElementById('tabuleiro');
const status = document.getElementById('status');
const linhas = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let casas, vez, fim;

function novoJogo() {
  casas = Array(9).fill('');
  vez = 'X';
  fim = false;
  status.textContent = 'Vez do X';
  tabuleiro.innerHTML = '';
  casas.forEach((_, i) => {
    const botao = document.createElement('button');
    botao.className = 'casa';
    botao.addEventListener('click', () => jogar(i, botao));
    tabuleiro.appendChild(botao);
  });
}

function jogar(i, botao) {
  if (fim || casas[i]) return;
  casas[i] = vez;
  botao.textContent = vez;
  const vitoria = linhas.find((l) => l.every((c) => casas[c] === vez));
  if (vitoria) {
    vitoria.forEach((c) => tabuleiro.children[c].classList.add('vencedora'));
    status.textContent = vez + ' venceu!';
    fim = true;
  } else if (casas.every(Boolean)) {
    status.textContent = 'Deu velha!';
    fim = true;
  } else {
    vez = vez === 'X' ? 'O' : 'X';
    status.textContent = 'Vez do ' + vez;
  }
}

document.getElementById('reiniciar').addEventListener('click', novoJogo);
novoJogo();`,
    py: String.raw`casas = [" "] * 9
linhas = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]


def mostrar():
    for i in range(0, 9, 3):
        print(" " + " | ".join(casas[i:i+3]))
        if i < 6:
            print("---+---+---")


vez = "X"
while True:
    mostrar()
    jogada = input(f"Vez do {vez} (1-9): ").strip()
    if not jogada.isdigit() or not 1 <= int(jogada) <= 9 or casas[int(jogada) - 1] != " ":
        print("Jogada inválida")
        continue
    casas[int(jogada) - 1] = vez
    if any(all(casas[c] == vez for c in l) for l in linhas):
        mostrar()
        print(vez, "venceu!")
        break
    if " " not in casas:
        mostrar()
        print("Deu velha!")
        break
    vez = "O" if vez == "X" else "X"`
  },

  quiz: {
    markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p id="pergunta"></p>
    <div class="opcoes" id="opcoes"></div>
    <p id="placar"></p>
  </main>`,
    css: String.raw`.opcoes { display: grid; gap: 8px; margin: 16px 0; }
.opcoes button { background: #eef2ea; color: #18201b; text-align: left; }
.opcoes button.certa { background: #9ad3b0; }
.opcoes button.errada { background: #f5b5ad; }
#pergunta { font-size: 20px; font-weight: 600; }`,
    js: String.raw`const perguntas = [
  { texto: 'Qual é o maior planeta do Sistema Solar?', opcoes: ['Terra', 'Júpiter', 'Marte', 'Vênus'], certa: 1 },
  { texto: 'Quanto é 7 × 8?', opcoes: ['54', '56', '64', '48'], certa: 1 },
  { texto: 'Qual linguagem roda no navegador?', opcoes: ['Python', 'C', 'JavaScript', 'Java'], certa: 2 },
  { texto: 'Em que ano o Brasil ficou independente?', opcoes: ['1500', '1822', '1889', '1922'], certa: 1 }
];
let atual = 0;
let pontos = 0;

function mostrar() {
  const q = perguntas[atual];
  document.getElementById('pergunta').textContent = (atual + 1) + '. ' + q.texto;
  const opcoes = document.getElementById('opcoes');
  opcoes.innerHTML = '';
  q.opcoes.forEach((texto, i) => {
    const botao = document.createElement('button');
    botao.textContent = texto;
    botao.addEventListener('click', () => responder(i));
    opcoes.appendChild(botao);
  });
  document.getElementById('placar').textContent = 'Pontos: ' + pontos;
}

function responder(i) {
  const q = perguntas[atual];
  const botoes = document.querySelectorAll('#opcoes button');
  botoes.forEach((b) => (b.disabled = true));
  botoes[q.certa].classList.add('certa');
  if (i === q.certa) pontos++;
  else botoes[i].classList.add('errada');
  setTimeout(() => {
    atual++;
    if (atual < perguntas.length) mostrar();
    else {
      document.getElementById('pergunta').textContent = 'Fim! Você acertou ' + pontos + ' de ' + perguntas.length + '.';
      document.getElementById('opcoes').innerHTML = '<button onclick="location.reload()">Jogar de novo</button>';
      document.getElementById('placar').textContent = '';
    }
  }, 900);
}

mostrar();`,
    py: String.raw`perguntas = [
    ("Qual é o maior planeta do Sistema Solar?", ["Terra", "Júpiter", "Marte", "Vênus"], 2),
    ("Quanto é 7 x 8?", ["54", "56", "64", "48"], 2),
    ("Qual linguagem roda no navegador?", ["Python", "C", "JavaScript", "Java"], 3),
]

pontos = 0
for texto, opcoes, certa in perguntas:
    print("\n" + texto)
    for i, opcao in enumerate(opcoes, 1):
        print(f"  {i}) {opcao}")
    resposta = input("Sua resposta: ").strip()
    if resposta == str(certa):
        print("Acertou!")
        pontos += 1
    else:
        print("Errou! A certa era", opcoes[certa - 1])

print(f"\nVocê acertou {pontos} de {len(perguntas)}.")`
  },

  landing: {
    markup: String.raw`<header class="topo">
    <strong>__TITLE__</strong>
    <nav><a href="#sobre">Sobre</a><a href="#recursos">Recursos</a><a href="#contato">Contato</a></nav>
  </header>
  <section class="hero">
    <h1>__TITLE__</h1>
    <p>Uma frase curta que explica o que você faz e por que importa.</p>
    <button id="cta">Quero saber mais</button>
  </section>
  <section id="recursos" class="recursos">
    <article><h3>Rápido</h3><p>Explique o primeiro benefício.</p></article>
    <article><h3>Simples</h3><p>Explique o segundo benefício.</p></article>
    <article><h3>Seguro</h3><p>Explique o terceiro benefício.</p></article>
  </section>
  <footer id="contato">Feito com o virgilio.ia</footer>`,
    css: String.raw`body { display: block; }
.topo { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; }
.topo nav a { margin-left: 18px; color: inherit; text-decoration: none; }
.hero { text-align: center; padding: 80px 6vw; }
.hero h1 { font-size: clamp(32px, 6vw, 56px); margin: 0 0 12px; }
.hero p { color: #637066; max-width: 520px; margin: 0 auto 24px; }
.recursos { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 0 6vw 60px; }
.recursos article { background: #fff; padding: 24px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 0, 0, .06); }
footer { text-align: center; padding: 24px; color: #637066; }`,
    js: String.raw`document.getElementById('cta').addEventListener('click', () => {
  document.getElementById('recursos').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.topo nav a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const alvo = document.querySelector(link.getAttribute('href'));
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth' });
  });
});`
  },

  tema: {
    markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p>Clique para alternar entre claro e escuro. A escolha fica salva.</p>
    <button id="alternar">🌙 Modo escuro</button>
  </main>`,
    css: String.raw`body { transition: background .3s, color .3s; }
body.escuro { background: #10140f; color: #e8efe9; }
body.escuro .card { background: #1a211c; box-shadow: none; }`,
    js: String.raw`const botao = document.getElementById('alternar');

function aplicar(escuro) {
  document.body.classList.toggle('escuro', escuro);
  botao.textContent = escuro ? '☀️ Modo claro' : '🌙 Modo escuro';
  localStorage.setItem('tema-escuro', escuro ? '1' : '0');
}

botao.addEventListener('click', () => aplicar(!document.body.classList.contains('escuro')));

const salvo = localStorage.getItem('tema-escuro');
aplicar(salvo ? salvo === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches);`
  },

  api: {
    markup: String.raw`<main class="card">
    <h1>__TITLE__</h1>
    <p>Busca um conselho aleatório em uma API pública.</p>
    <blockquote id="resultado">Clique no botão.</blockquote>
    <button id="buscar">Buscar conselho</button>
  </main>`,
    css: String.raw`blockquote { font-size: 18px; font-style: italic; margin: 20px 0; min-height: 56px; }`,
    js: String.raw`const resultado = document.getElementById('resultado');

async function buscar() {
  resultado.textContent = 'Carregando...';
  try {
    const resposta = await fetch('https://api.adviceslip.com/advice', { cache: 'no-store' });
    if (!resposta.ok) throw new Error('Erro ' + resposta.status);
    const dados = await resposta.json();
    resultado.textContent = '"' + dados.slip.advice + '"';
  } catch (erro) {
    resultado.textContent = 'Não consegui buscar: ' + erro.message;
  }
}

document.getElementById('buscar').addEventListener('click', buscar);`,
    py: String.raw`import json
import urllib.request

with urllib.request.urlopen("https://api.adviceslip.com/advice") as resposta:
    dados = json.load(resposta)

print("Conselho:", dados["slip"]["advice"])`
  }
};
