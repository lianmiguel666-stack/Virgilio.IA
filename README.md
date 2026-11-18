# virgilio.ia ✦

Assistente pessoal que roda direto no navegador, feito em **HTML, CSS e JavaScript puro** (sem servidor, sem instalação).

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
| ⚙️ Ajustes | `modo escuro`, `ative a voz`, botão 🎤 para falar com ele |

Também tem: painel de tarefas com filtros e exportação, modo foco (Pomodoro), calculadora segura (sem `eval`), conversor de unidades, gerador de código e gerador de imagens no "Laboratório".

## Como usar no computador

1. Baixe o projeto (botão verde **Code → Download ZIP**) e descompacte.
2. Abra o arquivo `index.html` no navegador. Pronto.

Tudo (tarefas, conversa, lembretes, memória) fica salvo no navegador, no `localStorage`. Só a pesquisa na Wikipedia e o clima usam a internet.

**Imagem de carregamento própria:** coloque um arquivo `carregamento.png` dentro da pasta `assets/`.

## Estrutura

```
index.html            página principal
css/style.css         visual (claro e escuro)
js/core.js            utilidades compartilhadas (objeto global V)
js/math.js            calculadora, equações, conversões e datas
js/templates-extra.js modelos extras de código
js/codegen.js         gerador de código (HTML, CSS, JS, Python)
js/image.js           gerador de imagens em canvas
js/knowledge.js       piadas, curiosidades, Wikipedia, clima, textos, sorteios
js/brain.js           o "cérebro" do chat: lista de habilidades
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
