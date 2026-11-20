/* =========================================================
   virgilio.ia — programas completos em JavaScript (Node),
   Python e PHP, e as versões PHP dos modelos de página.

   PROGRAMAS: rodam no terminal (node / python / php).
   PHP_PAGES: páginas PHP de verdade (formulário que processa
   os dados, lista salva em arquivo, contador com sessão...).
   ========================================================= */
window.VIRGILIO_PROGRAMS = {
  adivinhacao: {
    name: 'jogo de adivinhação',
    explain: ['Sorteia um número secreto de 1 a 100', 'Lê os palpites do teclado e valida a entrada', 'Diz "mais alto" ou "mais baixo" e conta as tentativas'],
    js: String.raw`const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const segredo = Math.floor(Math.random() * 100) + 1;
let tentativas = 0;

const linhas = rl[Symbol.asyncIterator]();
async function perguntar(texto) {
  process.stdout.write(texto);
  const { value } = await linhas.next();
  return (value ?? '').trim();
}

async function main() {
  console.log('Pensei em um número de 1 a 100. Tente adivinhar!');
  while (true) {
    const palpite = Number(await perguntar('Seu palpite: '));
    if (!Number.isInteger(palpite) || palpite < 1 || palpite > 100) {
      console.log('Digite um número inteiro entre 1 e 100.');
      continue;
    }
    tentativas++;
    if (palpite === segredo) {
      console.log('Acertou em ' + tentativas + ' tentativa(s)!');
      break;
    }
    console.log(palpite < segredo ? 'Mais alto!' : 'Mais baixo!');
  }
  rl.close();
}

main();`,
    py: String.raw`import random

segredo = random.randint(1, 100)
tentativas = 0
print("Pensei em um número de 1 a 100. Tente adivinhar!")

while True:
    resposta = input("Seu palpite: ").strip()
    if not resposta.isdigit() or not 1 <= int(resposta) <= 100:
        print("Digite um número inteiro entre 1 e 100.")
        continue
    tentativas += 1
    palpite = int(resposta)
    if palpite == segredo:
        print(f"Acertou em {tentativas} tentativa(s)!")
        break
    print("Mais alto!" if palpite < segredo else "Mais baixo!")`,
    php: String.raw`function perguntar(string $texto): string
{
    echo $texto;
    return trim((string) fgets(STDIN));
}

$segredo = random_int(1, 100);
$tentativas = 0;
echo "Pensei em um número de 1 a 100. Tente adivinhar!\n";

while (true) {
    $resposta = perguntar("Seu palpite: ");
    if (!ctype_digit($resposta) || (int) $resposta < 1 || (int) $resposta > 100) {
        echo "Digite um número inteiro entre 1 e 100.\n";
        continue;
    }
    $tentativas++;
    $palpite = (int) $resposta;
    if ($palpite === $segredo) {
        echo "Acertou em $tentativas tentativa(s)!\n";
        break;
    }
    echo $palpite < $segredo ? "Mais alto!\n" : "Mais baixo!\n";
}`
  },

  senha: {
    name: 'gerador de senhas',
    explain: ['Usa um gerador aleatório seguro (crypto / secrets / random_int)', 'Garante pelo menos uma minúscula, maiúscula, número e símbolo', 'O tamanho vem do terminal: ex. 20'],
    js: String.raw`const crypto = require('crypto');

const tamanho = Math.max(8, Number(process.argv[2]) || 16);
const grupos = [
  'abcdefghijkmnopqrstuvwxyz',
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  '23456789',
  '!@#$%&*?-_+='
];

function gerarSenha(n) {
  const todos = grupos.join('');
  const senha = grupos.map((g) => g[crypto.randomInt(g.length)]); // um de cada tipo
  while (senha.length < n) senha.push(todos[crypto.randomInt(todos.length)]);
  for (let i = senha.length - 1; i > 0; i--) { // embaralha (Fisher-Yates)
    const j = crypto.randomInt(i + 1);
    [senha[i], senha[j]] = [senha[j], senha[i]];
  }
  return senha.join('');
}

console.log('Senhas com ' + tamanho + ' caracteres:');
for (let i = 1; i <= 5; i++) console.log(i + ') ' + gerarSenha(tamanho));`,
    py: String.raw`import secrets
import sys

GRUPOS = [
    "abcdefghijkmnopqrstuvwxyz",
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "23456789",
    "!@#$%&*?-_+=",
]


def gerar_senha(tamanho: int) -> str:
    todos = "".join(GRUPOS)
    senha = [secrets.choice(g) for g in GRUPOS]  # um de cada tipo
    while len(senha) < tamanho:
        senha.append(secrets.choice(todos))
    secrets.SystemRandom().shuffle(senha)
    return "".join(senha)


tamanho = max(8, int(sys.argv[1])) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 16
print(f"Senhas com {tamanho} caracteres:")
for i in range(1, 6):
    print(f"{i}) {gerar_senha(tamanho)}")`,
    php: String.raw`const GRUPOS = [
    'abcdefghijkmnopqrstuvwxyz',
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    '23456789',
    '!@#$%&*?-_+=',
];

function gerarSenha(int $tamanho): string
{
    $todos = implode('', GRUPOS);
    $senha = [];
    foreach (GRUPOS as $grupo) {
        $senha[] = $grupo[random_int(0, strlen($grupo) - 1)]; // um de cada tipo
    }
    while (count($senha) < $tamanho) {
        $senha[] = $todos[random_int(0, strlen($todos) - 1)];
    }
    for ($i = count($senha) - 1; $i > 0; $i--) { // embaralha com segurança
        $j = random_int(0, $i);
        [$senha[$i], $senha[$j]] = [$senha[$j], $senha[$i]];
    }
    return implode('', $senha);
}

$tamanho = max(8, (int) ($argv[1] ?? 16));
echo "Senhas com $tamanho caracteres:\n";
for ($i = 1; $i <= 5; $i++) {
    echo "$i) " . gerarSenha($tamanho) . "\n";
}`
  },

  temperatura: {
    name: 'conversor de temperatura',
    explain: ['Menu com Celsius, Fahrenheit e Kelvin', 'Funções separadas para cada conversão', 'Aceita vírgula ou ponto no número'],
    js: String.raw`const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const linhas = rl[Symbol.asyncIterator]();
async function perguntar(texto) {
  process.stdout.write(texto);
  const { value } = await linhas.next();
  return (value ?? '').trim();
}

const conversoes = {
  1: { nome: 'Celsius → Fahrenheit', fn: (c) => c * 9 / 5 + 32, de: '°C', para: '°F' },
  2: { nome: 'Fahrenheit → Celsius', fn: (f) => (f - 32) * 5 / 9, de: '°F', para: '°C' },
  3: { nome: 'Celsius → Kelvin', fn: (c) => c + 273.15, de: '°C', para: 'K' },
  4: { nome: 'Kelvin → Celsius', fn: (k) => k - 273.15, de: 'K', para: '°C' }
};

async function main() {
  while (true) {
    console.log('\n=== Conversor de temperatura ===');
    Object.entries(conversoes).forEach(([n, c]) => console.log(n + ') ' + c.nome));
    console.log('0) Sair');
    const opcao = (await perguntar('Escolha: ')).trim();
    if (opcao === '0') break;
    const conv = conversoes[opcao];
    if (!conv) { console.log('Opção inválida.'); continue; }
    const valor = Number((await perguntar('Valor em ' + conv.de + ': ')).replace(',', '.'));
    if (Number.isNaN(valor)) { console.log('Número inválido.'); continue; }
    console.log(valor + ' ' + conv.de + ' = ' + conv.fn(valor).toFixed(2) + ' ' + conv.para);
  }
  rl.close();
}

main();`,
    py: String.raw`CONVERSOES = {
    "1": ("Celsius → Fahrenheit", lambda c: c * 9 / 5 + 32, "°C", "°F"),
    "2": ("Fahrenheit → Celsius", lambda f: (f - 32) * 5 / 9, "°F", "°C"),
    "3": ("Celsius → Kelvin", lambda c: c + 273.15, "°C", "K"),
    "4": ("Kelvin → Celsius", lambda k: k - 273.15, "K", "°C"),
}

while True:
    print("\n=== Conversor de temperatura ===")
    for numero, (nome, *_rest) in CONVERSOES.items():
        print(f"{numero}) {nome}")
    print("0) Sair")
    opcao = input("Escolha: ").strip()
    if opcao == "0":
        break
    if opcao not in CONVERSOES:
        print("Opção inválida.")
        continue
    nome, funcao, de, para = CONVERSOES[opcao]
    try:
        valor = float(input(f"Valor em {de}: ").replace(",", "."))
    except ValueError:
        print("Número inválido.")
        continue
    print(f"{valor} {de} = {funcao(valor):.2f} {para}")`,
    php: String.raw`function perguntar(string $texto): string
{
    echo $texto;
    return trim((string) fgets(STDIN));
}

$conversoes = [
    '1' => ['Celsius → Fahrenheit', fn($c) => $c * 9 / 5 + 32, '°C', '°F'],
    '2' => ['Fahrenheit → Celsius', fn($f) => ($f - 32) * 5 / 9, '°F', '°C'],
    '3' => ['Celsius → Kelvin', fn($c) => $c + 273.15, '°C', 'K'],
    '4' => ['Kelvin → Celsius', fn($k) => $k - 273.15, 'K', '°C'],
];

while (true) {
    echo "\n=== Conversor de temperatura ===\n";
    foreach ($conversoes as $numero => $conv) {
        echo "$numero) {$conv[0]}\n";
    }
    echo "0) Sair\n";
    $opcao = perguntar('Escolha: ');
    if ($opcao === '0') {
        break;
    }
    if (!isset($conversoes[$opcao])) {
        echo "Opção inválida.\n";
        continue;
    }
    [$nome, $funcao, $de, $para] = $conversoes[$opcao];
    $texto = str_replace(',', '.', perguntar("Valor em $de: "));
    if (!is_numeric($texto)) {
        echo "Número inválido.\n";
        continue;
    }
    $valor = (float) $texto;
    printf("%s %s = %.2f %s\n", $valor, $de, $funcao($valor), $para);
}`
  },

  media: {
    name: 'média de notas',
    explain: ['Pergunta quantas notas e lê cada uma', 'Calcula média, maior e menor nota', 'Diz se o aluno foi aprovado (7+), está de recuperação (5 a 6,9) ou reprovado'],
    js: String.raw`const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const linhas = rl[Symbol.asyncIterator]();
async function perguntar(texto) {
  process.stdout.write(texto);
  const { value } = await linhas.next();
  return (value ?? '').trim();
}

async function lerNota(i) {
  while (true) {
    const nota = Number((await perguntar('Nota ' + i + ': ')).replace(',', '.'));
    if (!Number.isNaN(nota) && nota >= 0 && nota <= 10) return nota;
    console.log('Digite uma nota de 0 a 10.');
  }
}

async function main() {
  const nome = (await perguntar('Nome do aluno: ')).trim() || 'Aluno';
  const quantidade = Number(await perguntar('Quantas notas? ')) || 4;
  const notas = [];
  for (let i = 1; i <= quantidade; i++) notas.push(await lerNota(i));

  const media = notas.reduce((soma, n) => soma + n, 0) / notas.length;
  const situacao = media >= 7 ? 'APROVADO' : media >= 5 ? 'RECUPERAÇÃO' : 'REPROVADO';

  console.log('\n' + nome + ': média ' + media.toFixed(1) + ' → ' + situacao);
  console.log('Maior nota: ' + Math.max(...notas) + ' | Menor nota: ' + Math.min(...notas));
  rl.close();
}

main();`,
    py: String.raw`def ler_nota(i: int) -> float:
    while True:
        try:
            nota = float(input(f"Nota {i}: ").replace(",", "."))
            if 0 <= nota <= 10:
                return nota
        except ValueError:
            pass
        print("Digite uma nota de 0 a 10.")


nome = input("Nome do aluno: ").strip() or "Aluno"
quantidade = input("Quantas notas? ").strip()
quantidade = int(quantidade) if quantidade.isdigit() and int(quantidade) > 0 else 4
notas = [ler_nota(i) for i in range(1, quantidade + 1)]

media = sum(notas) / len(notas)
if media >= 7:
    situacao = "APROVADO"
elif media >= 5:
    situacao = "RECUPERAÇÃO"
else:
    situacao = "REPROVADO"

print(f"\n{nome}: média {media:.1f} → {situacao}")
print(f"Maior nota: {max(notas)} | Menor nota: {min(notas)}")`,
    php: String.raw`function perguntar(string $texto): string
{
    echo $texto;
    return trim((string) fgets(STDIN));
}

function lerNota(int $i): float
{
    while (true) {
        $texto = str_replace(',', '.', perguntar("Nota $i: "));
        if (is_numeric($texto) && $texto >= 0 && $texto <= 10) {
            return (float) $texto;
        }
        echo "Digite uma nota de 0 a 10.\n";
    }
}

$nome = perguntar('Nome do aluno: ') ?: 'Aluno';
$quantidade = (int) perguntar('Quantas notas? ') ?: 4;
$notas = [];
for ($i = 1; $i <= $quantidade; $i++) {
    $notas[] = lerNota($i);
}

$media = array_sum($notas) / count($notas);
$situacao = $media >= 7 ? 'APROVADO' : ($media >= 5 ? 'RECUPERAÇÃO' : 'REPROVADO');

printf("\n%s: média %.1f → %s\n", $nome, $media, $situacao);
echo 'Maior nota: ' . max($notas) . ' | Menor nota: ' . min($notas) . "\n";`
  },

  agenda: {
    name: 'agenda de contatos',
    explain: ['CRUD completo: listar, adicionar, buscar e remover', 'Os contatos ficam salvos no arquivo contatos.json', 'Ao abrir de novo, os dados continuam lá'],
    js: String.raw`const fs = require('fs');
const readline = require('readline');

const ARQUIVO = 'contatos.json';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const linhas = rl[Symbol.asyncIterator]();
async function perguntar(texto) {
  process.stdout.write(texto);
  const { value } = await linhas.next();
  return (value ?? '').trim();
}

const carregar = () => (fs.existsSync(ARQUIVO) ? JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')) : []);
const salvar = (contatos) => fs.writeFileSync(ARQUIVO, JSON.stringify(contatos, null, 2));

async function main() {
  let contatos = carregar();
  while (true) {
    console.log('\n=== Agenda (' + contatos.length + ' contatos) ===');
    console.log('1) Listar  2) Adicionar  3) Buscar  4) Remover  0) Sair');
    const opcao = await perguntar('Escolha: ');

    if (opcao === '1') {
      if (!contatos.length) console.log('Agenda vazia.');
      contatos.forEach((c, i) => console.log((i + 1) + '. ' + c.nome + ' — ' + c.telefone + ' — ' + c.email));
    } else if (opcao === '2') {
      const nome = await perguntar('Nome: ');
      if (!nome) { console.log('O nome é obrigatório.'); continue; }
      const telefone = await perguntar('Telefone: ');
      const email = await perguntar('E-mail: ');
      contatos.push({ nome, telefone, email });
      salvar(contatos);
      console.log('Contato salvo!');
    } else if (opcao === '3') {
      const termo = (await perguntar('Buscar por: ')).toLowerCase();
      const achados = contatos.filter((c) => c.nome.toLowerCase().includes(termo));
      console.log(achados.length ? achados.map((c) => c.nome + ' — ' + c.telefone).join('\n') : 'Nenhum contato encontrado.');
    } else if (opcao === '4') {
      const n = Number(await perguntar('Número do contato: ')) - 1;
      if (contatos[n]) { console.log('Removido: ' + contatos.splice(n, 1)[0].nome); salvar(contatos); }
      else console.log('Número inválido.');
    } else if (opcao === '0') {
      break;
    } else {
      console.log('Opção inválida.');
    }
  }
  rl.close();
}

main();`,
    py: String.raw`import json
from pathlib import Path

ARQUIVO = Path("contatos.json")


def carregar() -> list:
    return json.loads(ARQUIVO.read_text(encoding="utf-8")) if ARQUIVO.exists() else []


def salvar(contatos: list) -> None:
    ARQUIVO.write_text(json.dumps(contatos, ensure_ascii=False, indent=2), encoding="utf-8")


contatos = carregar()
while True:
    print(f"\n=== Agenda ({len(contatos)} contatos) ===")
    print("1) Listar  2) Adicionar  3) Buscar  4) Remover  0) Sair")
    opcao = input("Escolha: ").strip()

    if opcao == "1":
        if not contatos:
            print("Agenda vazia.")
        for i, c in enumerate(contatos, 1):
            print(f"{i}. {c['nome']} — {c['telefone']} — {c['email']}")
    elif opcao == "2":
        nome = input("Nome: ").strip()
        if not nome:
            print("O nome é obrigatório.")
            continue
        contatos.append({
            "nome": nome,
            "telefone": input("Telefone: ").strip(),
            "email": input("E-mail: ").strip(),
        })
        salvar(contatos)
        print("Contato salvo!")
    elif opcao == "3":
        termo = input("Buscar por: ").strip().lower()
        achados = [c for c in contatos if termo in c["nome"].lower()]
        for c in achados:
            print(f"{c['nome']} — {c['telefone']}")
        if not achados:
            print("Nenhum contato encontrado.")
    elif opcao == "4":
        n = input("Número do contato: ").strip()
        if n.isdigit() and 1 <= int(n) <= len(contatos):
            print("Removido:", contatos.pop(int(n) - 1)["nome"])
            salvar(contatos)
        else:
            print("Número inválido.")
    elif opcao == "0":
        break
    else:
        print("Opção inválida.")`,
    php: String.raw`const ARQUIVO = 'contatos.json';

function perguntar(string $texto): string
{
    echo $texto;
    return trim((string) fgets(STDIN));
}

function carregar(): array
{
    return file_exists(ARQUIVO) ? json_decode(file_get_contents(ARQUIVO), true) ?? [] : [];
}

function salvar(array $contatos): void
{
    file_put_contents(ARQUIVO, json_encode($contatos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$contatos = carregar();
while (true) {
    echo "\n=== Agenda (" . count($contatos) . " contatos) ===\n";
    echo "1) Listar  2) Adicionar  3) Buscar  4) Remover  0) Sair\n";
    $opcao = perguntar('Escolha: ');

    switch ($opcao) {
        case '1':
            if (!$contatos) {
                echo "Agenda vazia.\n";
            }
            foreach ($contatos as $i => $c) {
                echo ($i + 1) . ". {$c['nome']} — {$c['telefone']} — {$c['email']}\n";
            }
            break;
        case '2':
            $nome = perguntar('Nome: ');
            if ($nome === '') {
                echo "O nome é obrigatório.\n";
                break;
            }
            $contatos[] = ['nome' => $nome, 'telefone' => perguntar('Telefone: '), 'email' => perguntar('E-mail: ')];
            salvar($contatos);
            echo "Contato salvo!\n";
            break;
        case '3':
            $termo = mb_strtolower(perguntar('Buscar por: '));
            $achados = array_filter($contatos, fn($c) => str_contains(mb_strtolower($c['nome']), $termo));
            foreach ($achados as $c) {
                echo "{$c['nome']} — {$c['telefone']}\n";
            }
            if (!$achados) {
                echo "Nenhum contato encontrado.\n";
            }
            break;
        case '4':
            $n = (int) perguntar('Número do contato: ') - 1;
            if (isset($contatos[$n])) {
                echo 'Removido: ' . array_splice($contatos, $n, 1)[0]['nome'] . "\n";
                salvar($contatos);
            } else {
                echo "Número inválido.\n";
            }
            break;
        case '0':
            exit(0);
        default:
            echo "Opção inválida.\n";
    }
}`
  },

  servidor: {
    name: 'API de tarefas (servidor)',
    phpWeb: true,
    explain: ['Servidor web com uma API REST de tarefas', 'GET /api/tarefas lista, POST /api/tarefas cria (JSON {"titulo": "..."})', 'Sem bibliotecas extras: só o que já vem na linguagem'],
    js: String.raw`const http = require('http');

const PORTA = 3000;
let proximoId = 1;
const tarefas = [];

function responder(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(dados));
}

const servidor = http.createServer((req, res) => {
  if (req.url === '/api/tarefas' && req.method === 'GET') return responder(res, 200, tarefas);

  if (req.url === '/api/tarefas' && req.method === 'POST') {
    let corpo = '';
    req.on('data', (parte) => { corpo += parte; });
    req.on('end', () => {
      try {
        const { titulo } = JSON.parse(corpo || '{}');
        if (!titulo) return responder(res, 400, { erro: 'Envie um "titulo".' });
        const tarefa = { id: proximoId++, titulo, feita: false };
        tarefas.push(tarefa);
        responder(res, 201, tarefa);
      } catch {
        responder(res, 400, { erro: 'JSON inválido.' });
      }
    });
    return;
  }

  responder(res, 404, { erro: 'Rota não encontrada. Use /api/tarefas' });
});

servidor.listen(PORTA, () => console.log('API rodando em http://localhost:' + PORTA + '/api/tarefas'));`,
    py: String.raw`import json
from http.server import BaseHTTPRequestHandler, HTTPServer

PORTA = 8000
tarefas = []


class Api(BaseHTTPRequestHandler):
    def responder(self, status: int, dados) -> None:
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        if self.path == "/api/tarefas":
            return self.responder(200, tarefas)
        self.responder(404, {"erro": "Rota não encontrada. Use /api/tarefas"})

    def do_POST(self):
        if self.path != "/api/tarefas":
            return self.responder(404, {"erro": "Rota não encontrada."})
        tamanho = int(self.headers.get("Content-Length", 0))
        try:
            dados = json.loads(self.rfile.read(tamanho) or b"{}")
        except json.JSONDecodeError:
            return self.responder(400, {"erro": "JSON inválido."})
        if not dados.get("titulo"):
            return self.responder(400, {"erro": 'Envie um "titulo".'})
        tarefa = {"id": len(tarefas) + 1, "titulo": dados["titulo"], "feita": False}
        tarefas.append(tarefa)
        self.responder(201, tarefa)


print(f"API rodando em http://localhost:{PORTA}/api/tarefas")
HTTPServer(("", PORTA), Api).serve_forever()`,
    php: String.raw`// As tarefas ficam salvas em tarefas.json, ao lado deste arquivo.
const ARQUIVO = __DIR__ . '/tarefas.json';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

function responder(int $status, $dados): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

$tarefas = file_exists(ARQUIVO) ? json_decode(file_get_contents(ARQUIVO), true) ?? [] : [];
$rota = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (!str_ends_with($rota, '/api/tarefas')) {
    responder(404, ['erro' => 'Rota não encontrada. Use /api/tarefas']);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder(200, $tarefas);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    if (!is_array($dados) || empty($dados['titulo'])) {
        responder(400, ['erro' => 'Envie um JSON com "titulo".']);
    }
    $tarefa = ['id' => count($tarefas) + 1, 'titulo' => $dados['titulo'], 'feita' => false];
    $tarefas[] = $tarefa;
    file_put_contents(ARQUIVO, json_encode($tarefas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    responder(201, $tarefa);
}

responder(405, ['erro' => 'Método não permitido.']);`
  }
};

/* ---------- Versões PHP das páginas ----------
   logic: código PHP que roda antes da página
   markup: HTML com PHP misturado
   css: estilos extras (somados aos estilos base)        */
window.VIRGILIO_PHP_PAGES = {
  base: {
    logic: String.raw`$hora = (int) date('H');
$saudacao = $hora < 12 ? 'Bom dia' : ($hora < 18 ? 'Boa tarde' : 'Boa noite');`,
    markup: String.raw`<main class="card">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <p><?= $saudacao ?>! Hoje é <?= date('d/m/Y') ?> e são <?= date('H:i') ?>.</p>
    <p>Página gerada pelo PHP no servidor.</p>
  </main>`
  },
  formulario: {
    logic: String.raw`$erros = [];
$enviado = false;
$nome = $email = $mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $mensagem = trim($_POST['mensagem'] ?? '');

    if ($nome === '') $erros[] = 'Preencha o nome.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $erros[] = 'Digite um e-mail válido.';
    if (mb_strlen($mensagem) < 5) $erros[] = 'A mensagem precisa de pelo menos 5 letras.';

    if (!$erros) {
        // salva em um arquivo de texto (troque por banco de dados ou e-mail)
        $linha = date('Y-m-d H:i') . " | $nome | $email | " . str_replace("\n", ' ', $mensagem) . PHP_EOL;
        file_put_contents(__DIR__ . '/mensagens.txt', $linha, FILE_APPEND | LOCK_EX);
        $enviado = true;
        $nome = $email = $mensagem = '';
    }
}

function e(string $texto): string
{
    return htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');
}`,
    markup: String.raw`<main class="card">
    <h1><?= e($titulo) ?></h1>
    <?php if ($enviado): ?>
      <p class="ok">Obrigado! Sua mensagem foi enviada.</p>
    <?php endif; ?>
    <?php foreach ($erros as $erro): ?>
      <p class="erro"><?= e($erro) ?></p>
    <?php endforeach; ?>
    <form method="post">
      <input name="nome" placeholder="Seu nome" value="<?= e($nome) ?>">
      <input name="email" type="email" placeholder="Seu e-mail" value="<?= e($email) ?>">
      <textarea name="mensagem" rows="4" placeholder="Sua mensagem"><?= e($mensagem) ?></textarea>
      <button type="submit">Enviar</button>
    </form>
  </main>`,
    css: String.raw`form { display: grid; gap: 10px; text-align: left; }
textarea { padding: 10px 12px; border: 1px solid #dfe5da; border-radius: 10px; font: inherit; }
.erro { color: #d2554a; margin: 4px 0; }
.ok { color: #2563eb; font-weight: 600; }`
  },
  contador: {
    logic: String.raw`session_start();
$_SESSION['contador'] = $_SESSION['contador'] ?? 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';
    if ($acao === 'mais') $_SESSION['contador']++;
    if ($acao === 'menos') $_SESSION['contador']--;
    if ($acao === 'zerar') $_SESSION['contador'] = 0;
    header('Location: ' . $_SERVER['PHP_SELF']); // evita reenviar ao atualizar
    exit;
}`,
    markup: String.raw`<main class="card">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <p class="numero"><?= $_SESSION['contador'] ?></p>
    <form method="post" class="acoes">
      <button name="acao" value="menos">−</button>
      <button name="acao" value="zerar">Zerar</button>
      <button name="acao" value="mais">+</button>
    </form>
  </main>`,
    css: String.raw`.numero { font-size: 64px; font-weight: 700; margin: 12px 0; }
.acoes { display: flex; gap: 8px; justify-content: center; }`
  },
  lista: {
    logic: String.raw`$arquivo = __DIR__ . '/tarefas.json';
$tarefas = file_exists($arquivo) ? json_decode(file_get_contents($arquivo), true) ?? [] : [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';
    $i = (int) ($_POST['i'] ?? -1);
    if ($acao === 'adicionar' && trim($_POST['texto'] ?? '') !== '') {
        $tarefas[] = ['texto' => trim($_POST['texto']), 'feita' => false];
    } elseif ($acao === 'alternar' && isset($tarefas[$i])) {
        $tarefas[$i]['feita'] = !$tarefas[$i]['feita'];
    } elseif ($acao === 'remover' && isset($tarefas[$i])) {
        array_splice($tarefas, $i, 1);
    }
    file_put_contents($arquivo, json_encode($tarefas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}`,
    markup: String.raw`<main class="card">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <form method="post" class="linha">
      <input name="texto" placeholder="Nova tarefa" autocomplete="off">
      <button name="acao" value="adicionar">Adicionar</button>
    </form>
    <ul id="lista">
      <?php foreach ($tarefas as $i => $t): ?>
        <li class="<?= $t['feita'] ? 'feita' : '' ?>">
          <form method="post"><input type="hidden" name="i" value="<?= $i ?>">
            <button class="texto" name="acao" value="alternar"><?= htmlspecialchars($t['texto']) ?></button>
            <button class="remover" name="acao" value="remover">×</button>
          </form>
        </li>
      <?php endforeach; ?>
    </ul>
  </main>`,
    css: String.raw`.linha { display: flex; gap: 8px; }
.linha input { flex: 1; }
#lista { list-style: none; padding: 0; margin: 16px 0 0; text-align: left; }
#lista form { display: flex; justify-content: space-between; border: 1px solid #dfe5da; border-radius: 10px; margin-bottom: 6px; }
#lista .texto { flex: 1; text-align: left; background: none; color: inherit; font-weight: 500; }
#lista .feita .texto { text-decoration: line-through; color: #637066; }
#lista .remover { background: none; color: #d2554a; }`
  },
  calculadora: {
    logic: String.raw`$resultado = null;
$a = $_POST['a'] ?? '';
$b = $_POST['b'] ?? '';
$op = $_POST['op'] ?? '+';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && is_numeric($a) && is_numeric($b)) {
    $resultado = match ($op) {
        '+' => $a + $b,
        '-' => $a - $b,
        '*' => $a * $b,
        '/' => $b == 0 ? 'Não dá para dividir por zero' : $a / $b,
        default => 'Operação inválida',
    };
}`,
    markup: String.raw`<main class="card">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <form method="post" class="calc">
      <input name="a" type="number" step="any" value="<?= htmlspecialchars($a) ?>" required>
      <select name="op">
        <?php foreach (['+' => '+', '-' => '−', '*' => '×', '/' => '÷'] as $valor => $simbolo): ?>
          <option value="<?= $valor ?>" <?= $op === $valor ? 'selected' : '' ?>><?= $simbolo ?></option>
        <?php endforeach; ?>
      </select>
      <input name="b" type="number" step="any" value="<?= htmlspecialchars($b) ?>" required>
      <button type="submit">=</button>
    </form>
    <p class="resultado"><?= $resultado === null ? 'Resultado' : (is_numeric($resultado) ? number_format($resultado, 2, ',', '.') : $resultado) ?></p>
  </main>`,
    css: String.raw`.calc { display: flex; gap: 6px; }
.calc input { flex: 1; width: 0; }
.resultado { font-size: 28px; font-weight: 700; margin-top: 16px; }`
  },
  relogio: {
    logic: String.raw`date_default_timezone_set('America/Sao_Paulo');
$dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];`,
    markup: String.raw`<main class="card">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <p class="hora" id="hora"><?= date('H:i:s') ?></p>
    <p><?= ucfirst($dias[(int) date('w')]) ?>, <?= date('d/m/Y') ?></p>
    <small>A hora inicial vem do servidor (PHP). O JavaScript mantém o relógio andando.</small>
  </main>
  <script>
    setInterval(() => {
      document.getElementById('hora').textContent = new Date().toLocaleTimeString('pt-BR');
    }, 1000);
  </script>`,
    css: String.raw`.hora { font-size: 56px; font-weight: 700; font-variant-numeric: tabular-nums; margin: 8px 0; }`
  },
  api: {
    logic: String.raw`$conselho = null;
$erro = null;
if (isset($_GET['buscar'])) {
    $resposta = @file_get_contents('https://api.adviceslip.com/advice');
    $dados = $resposta ? json_decode($resposta, true) : null;
    if ($dados && isset($dados['slip']['advice'])) {
        $conselho = $dados['slip']['advice'];
    } else {
        $erro = 'Não consegui acessar a API agora.';
    }
}`,
    markup: String.raw`<main class="card">
    <h1><?= htmlspecialchars($titulo) ?></h1>
    <p>O PHP busca um conselho em uma API pública e mostra aqui.</p>
    <blockquote><?= $conselho ? '"' . htmlspecialchars($conselho) . '"' : htmlspecialchars($erro ?? 'Clique no botão.') ?></blockquote>
    <form><button name="buscar" value="1">Buscar conselho</button></form>
  </main>`,
    css: String.raw`blockquote { font-size: 18px; font-style: italic; margin: 20px 0; }`
  }
};
