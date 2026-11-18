# virgilio.ia ✦

Assistente pessoal que roda direto no navegador, feito em **HTML, CSS e JavaScript puro** (sem servidor, sem instalação).

Quem responde é **Virgílio, o bardo**: um mascote em pixel art que fica parado, fala, pensa e toca alaúde de verdade (com som). Clique nele para ouvir uma canção.

**Abrir o site:** https://lianmiguel666-stack.github.io/Virgilio.IA/

## O que ele faz

| Área | Exemplos para digitar no chat |
| --- | --- |
| 📋 Tarefas | `adicionar tarefa estudar 45 min urgente`, `terminei estudar`, `minhas tarefas`, `apague a tarefa X` |
| 🗓️ Planejamento | `o que devo fazer primeiro?`, `organize meu dia`, `iniciar foco` |
| ⏰ Lembretes | `me lembre em 10 minutos de beber água`, `me lembre às 18h de ligar pra mãe`, `timer de 5 minutos` |
| 💻 Scripts | `crie um jogo da velha em HTML`, `faça um cronômetro`, `quiz em python`, depois `agora em HTML` |
| 🎨 Imagens | `gere uma imagem de pôr do sol na praia`, depois `outra` |
| 🧮 Matemática | `quanto é 2^10`, `5! + raiz de 16`, `resolva 2x + 3 = 11`, `x² - 5x + 6 = 0`, `tabuada do 7`, `20% de 250` |
| 📏 Conversões | `5 km em milhas`, `30 °c em fahrenheit`, `2 gb em mb`, `100 km/h em m/s` |
| 📅 Datas | `quantos dias até o natal`, `que dia da semana foi 15/11/1889`, `idade de quem nasceu em 10/05/2008` |
| 🌎 Pesquisa | `o que é fotossíntese`, `quem foi Santos Dumont` (Wikipedia), `clima em São Paulo` (Open-Meteo) |
| 🧠 Memória | `meu nome é ...`, `moro em ...`, `lembre que minha cor favorita é azul`, `o que você sabe sobre mim` |
| ✍️ Textos | `resuma: (texto)`, `conte as palavras: (texto)`, `maiúsculas: (texto)` |
| 🎲 Diversão | `conte uma piada`, `frase motivacional`, `curiosidade`, `jogue 2 dados`, `cara ou coroa`, `sorteie entre A, B e C`, `gere uma senha` |
| 🧩 Extensões | `toque uma música`, `conte uma história sobre dragões`, `faça um poema sobre o mar`, `nota: ...`, `traduza para inglês: bom dia`, `100 dólares em reais` |
| ⚙️ Ajustes | `modo escuro`, `ative a voz`, botão 🎤 para falar com ele |

Também tem: painel de tarefas com filtros e exportação, modo foco (Pomodoro), calculadora segura (sem `eval`), conversor de unidades, gerador de código e gerador de imagens no "Laboratório".

## Extensões

No botão 🧩 do topo você liga e desliga:

| Extensão | O que faz |
| --- | --- |
| 🎵 Músicas do bardo | 4 melodias tocadas no alaúde (Web Audio) |
| 📜 Histórias e poemas | Histórias e versos rimados inventados na hora |
| 🗒️ Notas rápidas | Bloco de notas ao lado das tarefas |
| 🌐 Tradutor | Traduz para 11 idiomas (MyMemory) |
| 💱 Cotação de moedas | Dólar, euro, libra, bitcoin e outras (open.er-api.com) |
| 💧 Lembrete de água | Aviso a cada hora com a página aberta |
| 🌤️ Clima no topo | Temperatura da sua cidade no cabeçalho |

Para criar uma extensão, copie um item da lista `EXTENSIONS` em `js/extensions.js`.

## Como usar no computador

1. Baixe o projeto (botão verde **Code → Download ZIP**) e descompacte.
2. Abra o arquivo `index.html` no navegador. Pronto.

Tudo (tarefas, conversa, lembretes, memória) fica salvo no navegador, no `localStorage`. Só a Wikipedia, o clima, o tradutor e as moedas usam a internet.

**Imagem de carregamento própria:** coloque um arquivo `carregamento.png` dentro da pasta `assets/`.

## Estrutura

```
index.html            página principal
css/style.css         visual (claro e escuro)
js/core.js            utilidades compartilhadas (objeto global V)
js/mascot.js          o bardo Virgílio em pixel art, animações e melodias
js/math.js            calculadora, equações, conversões e datas
js/templates-extra.js modelos extras de código
js/codegen.js         gerador de código (HTML, CSS, JS, Python)
js/image.js           gerador de imagens em canvas
js/knowledge.js       piadas, curiosidades, Wikipedia, clima, textos, sorteios
js/brain.js           o "cérebro" do chat: lista de habilidades
js/extensions.js      extensões que ligam e desligam
js/app.js             interface: tarefas, lembretes, voz, chat
assets/icon.svg       ícone
```

## Ensinar algo novo ao virgilio.ia

Abra `js/brain.js` e adicione um item na lista `SKILLS`:

```js
{
  name: 'bom-dia-especial',
  test: (n) => /cafe da manha/.test(n),          // n = mensagem em minúsculas, sem acentos
  run: (n, text) => p('Que tal pão com ovo? 🍳')  // devolve o HTML da resposta
}
```

A primeira habilidade cujo `test` der verdadeiro responde. Coloque as mais específicas antes das mais genéricas.
