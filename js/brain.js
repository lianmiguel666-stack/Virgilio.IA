/* =========================================================
   virgilio.ia — o "cérebro" do chat
   Cada habilidade (skill) tem um teste e uma resposta.
   A primeira habilidade que reconhecer a mensagem responde.
   Para ensinar algo novo ao virgilio.ia, adicione um item
   na lista SKILLS lá embaixo.
   ========================================================= */
(() => {
  'use strict';
  const { normalize, escapeHtml, fmt, p, list, pick, capitalize, settings, saveSettings, store, STORAGE } = V;

  // Memória da conversa (para entender "e em python?", "outra", etc.)
  const ctx = { lastCode: null, lastSkill: null, lastImage: null };

  /* ---------- Memória de longo prazo (fatos sobre você) ---------- */
  let facts = store.get(STORAGE.memory, []);
  const saveFacts = () => store.set(STORAGE.memory, facts);

  /* ---------- Helpers ---------- */
  const codeBlock = (code) => `<pre>${escapeHtml(code.content)}</pre>
    <div class="bubble-actions">
      <button type="button" data-chat-action="copy">Copiar</button>
      <button type="button" data-chat-action="download" data-filename="${code.filename}">Baixar ${code.filename}</button>
      ${code.lang !== 'py' ? `<button type="button" data-chat-action="preview" data-lang="${code.lang}" data-template="${code.template}">Testar</button>` : ''}
    </div>`;

  const after = (text, re) => { const m = text.match(re); return m ? m[m.length - 1].trim().replace(/[?.!]+$/, '') : ''; };

  function makeCode(lang, template, name) {
    const code = V.generateCode(lang, template, name);
    ctx.lastCode = code;
    let intro = `Pronto! Aqui está: <b>${V.TEMPLATE_NAME[template]}</b> em <b>${V.LANG_NAME[code.lang]}</b>.`;
    if (lang === 'py' && code.lang !== 'py') intro += ' Esse modelo só existe para web, então fiz em HTML.';
    if (template === 'base') intro += ' Não reconheci um modelo específico, então fiz a estrutura base.';
    if (code.lang === 'js' || code.lang === 'css') intro += ` Para a página completa, diga "agora em HTML".`;
    if (code.lang === 'py') intro += ' Salve e rode com <code>python ' + code.filename + '</code>.';
    return p(intro) + codeBlock(code) + p('<small>Outros modelos: ' + Object.values(V.TEMPLATE_NAME).slice(1).join(', ') + '.</small>');
  }

  const detectLang = (n) => /python|\bpy\b/.test(n) ? 'py' : /\bcss\b|estilo|estiliz/.test(n) ? 'css' : /html|pagina|site|tela/.test(n) ? 'html' : /javascript|\bjs\b|script/.test(n) ? 'js' : null;

  function parseDelay(n) {
    // "em 10 minutos", "daqui a 2 horas", "daqui 30 segundos", "em meia hora"
    let m = n.match(/(?:em|daqui(?:\s+a)?|dentro de|depois de)\s+(\d+(?:[.,]\d+)?|um|uma|dois|duas|tres|cinco|dez|quinze|vinte|trinta|meia)\s*(segundos?|seg|s|minutos?|min|m|horas?|h)\b/);
    if (m) {
      const v = V.parseNum(m[1]);
      const unit = m[2][0] === 's' ? 1 : m[2][0] === 'h' ? 3600 : 60;
      return { ms: v * unit * 1000, match: m[0] };
    }
    // "às 15:30", "as 9h", "às 18h30"
    m = n.match(/\bas\s+(\d{1,2})(?:[:h](\d{2}))?\s*(?:h|horas)?\b/);
    if (m) {
      const d = new Date(); d.setHours(+m[1], +(m[2] || 0), 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      return { ms: d - Date.now(), match: m[0], at: d };
    }
    return null;
  }

  const humanDuration = (ms) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return s + ' segundo' + (s === 1 ? '' : 's');
    const m = Math.round(s / 60);
    if (m < 60) return m + ' minuto' + (m === 1 ? '' : 's');
    const h = Math.floor(m / 60), r = m % 60;
    return h + 'h' + (r ? String(r).padStart(2, '0') : '');
  };

  /* =========================================================
     Habilidades
     ========================================================= */
  const SKILLS = [
    /* ---------- conversa ---------- */
    {
      name: 'saudacao',
      test: (n) => /^(oi+|ola|e ai|eai|hey|salve|bom dia|boa tarde|boa noite|opa|fala)\b/.test(n) && n.length < 30,
      run: () => {
        const h = new Date().getHours();
        const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
        const open = V.tasksApi.open().length;
        V.bard?.set('cheer', 1500);
        return p(`${pick(['Saudações', g, 'Salve'])}, ${escapeHtml(settings.name)}! ${open ? `Você tem <b>${open}</b> tarefa${open > 1 ? 's' : ''} aberta${open > 1 ? 's' : ''}. ` : ''}${pick(['Que jornada vamos começar hoje?', 'Como posso ajudar?', 'Meu alaúde e eu estamos às ordens.'])}`);
      }
    },
    { name: 'tudo-bem', test: (n) => /^(e ai,? )?(tudo bem|td bem|tudo certo|como (voce )?(esta|vai)( voce)?|beleza)\s*\??$/.test(n), run: () => p(pick(['Tudo ótimo por aqui, pronto para ajudar! E você?', 'Funcionando a todo vapor! O que vamos fazer hoje?'])) },
    { name: 'obrigado', test: (n) => /^(muito |mto )?(obrigad|valeu|vlw|brigad|agradeco)/.test(n), run: () => p(pick(['Por nada! ✦', 'Sempre que precisar!', 'Disponha. Bora pro próximo passo?'])) },
    {
      name: 'identidade',
      test: (n) => /(quem e voce|qual (e )?(o )?seu nome|como (voce )?se chama|o que voce e|voce e uma ia)/.test(n),
      run: () => { V.bard?.set('cheer', 1800); return p('Eu sou <b>Virgílio</b>, o bardo do <b>virgilio.ia</b>! 🪶 Troquei as tavernas pelo seu navegador: organizo tarefas, crio scripts, desenho imagens, faço contas, pesquiso, vejo o clima, conto histórias e toco alaúde. Clique em mim para ouvir uma canção.'); }
    },
    {
      name: 'ajuda',
      test: (n) => /^(ajuda|help|comandos|menu|\?)$|o que (voce )?(faz|sabe|pode)(?! sobre)|suas funcoes|me ajuda com o que/.test(n),
      run: () => p('Aqui vai tudo o que eu sei fazer:') + list([
        '📋 <b>Tarefas:</b> "adicionar tarefa estudar 45 min urgente", "terminei estudar", "minhas tarefas", "apague a tarefa X"',
        '🗓️ <b>Planejar:</b> "o que fazer primeiro?", "organize meu dia", "iniciar foco"',
        '⏰ <b>Lembretes:</b> "me lembre em 10 minutos de beber água", "me lembre às 18h de ligar pra mãe", "timer de 5 minutos"',
        '💻 <b>Scripts:</b> "crie um jogo da velha em HTML", "cronômetro em JS", "quiz em python" e depois "agora em HTML"',
        '🎨 <b>Imagens:</b> "gere uma imagem de pôr do sol na praia"',
        '🧮 <b>Matemática:</b> "quanto é 2^10", "resolva 2x + 3 = 11", "x² - 5x + 6 = 0", "tabuada do 7", "20% de 250"',
        '📏 <b>Conversões:</b> "5 km em milhas", "30 °C em fahrenheit", "2 GB em MB", "90 minutos em horas"',
        '📅 <b>Datas:</b> "quantos dias até o natal", "que dia da semana foi 15/11/1889", "idade de quem nasceu em 10/05/2008"',
        '🌎 <b>Pesquisa:</b> "o que é fotossíntese", "quem foi Santos Dumont", "clima em São Paulo"',
        '🧠 <b>Memória:</b> "meu nome é ...", "lembre que minha cor favorita é azul", "o que você sabe sobre mim"',
        '✍️ <b>Textos:</b> "resuma: (texto)", "conte as palavras: (texto)", "maiúsculas: (texto)"',
        '🎲 <b>Diversão:</b> "conte uma piada", "frase motivacional", "curiosidade", "jogue um dado", "cara ou coroa", "sorteie entre A, B e C", "gere uma senha"',
        '🧩 <b>Extensões:</b> "toque uma música", "conte uma história sobre dragões", "faça um poema sobre o mar", "nota: ...", "traduza para inglês: bom dia", "100 dólares em reais". Ligue e desligue no botão 🧩',
        '⚙️ <b>Ajustes:</b> "modo escuro", "ative a voz" (eu leio as respostas em voz alta) e o botão 🎤 para falar comigo'
      ])
    },

    /* ---------- configurações ---------- */
    {
      name: 'nome',
      test: (n) => /^(meu nome e|me chame de|pode me chamar de|eu me chamo)\s+\S/.test(n),
      run: (n, text) => {
        const name = capitalize(after(text, /(?:meu nome é|meu nome e|me chame de|pode me chamar de|eu me chamo)\s+(.+)/i).split(/\s+/).slice(0, 3).join(' '));
        settings.name = name; saveSettings(); V.app.refreshHeader();
        return p(`Prazer, <b>${escapeHtml(name)}</b>! Vou te chamar assim daqui pra frente.`);
      }
    },
    {
      name: 'cidade',
      test: (n) => /^(minha cidade e|eu moro em|moro em)\s+\S/.test(n),
      run: (n, text) => {
        settings.city = capitalize(after(text, /(?:minha cidade é|minha cidade e|eu moro em|moro em)\s+(.+)/i));
        saveSettings();
        return p(`Anotado: você mora em <b>${escapeHtml(settings.city)}</b>. Agora é só perguntar "como está o clima?".`);
      }
    },
    {
      name: 'tema',
      test: (n) => /(modo|tema)\s+(escuro|claro|noturno|dark|light)|^(escuro|claro)$/.test(n),
      run: (n) => {
        const dark = /escuro|noturno|dark/.test(n);
        V.app.setTheme(dark ? 'dark' : 'light');
        return p(dark ? '🌙 Modo escuro ativado.' : '☀️ Modo claro ativado.');
      }
    },
    {
      name: 'voz',
      test: (n) => /(ativ|lig|desativ|deslig|desligue|pare de)\w*\s+(a\s+)?(voz|fala|falar)|fale (as )?respostas|leia (as )?respostas|fique (em )?silencio|modo mudo/.test(n),
      run: (n) => {
        const off = /desativ|deslig|pare|silencio|mudo/.test(n);
        if (!off && !('speechSynthesis' in window)) return p('Seu navegador não tem suporte a voz. 😕');
        V.app.setVoice(!off);
        return p(off ? '🔇 Voz desativada.' : '🔊 Voz ativada! Vou ler minhas respostas em voz alta.');
      }
    },

    /* ---------- memória ---------- */
    {
      name: 'memoria-salvar',
      test: (n) => /^(lembre|lembra|guarde|guarda|grave|memorize|anote)\s+(que|isso:?)\s+\S/.test(n),
      run: (n, text) => {
        const fact = after(text, /^(?:lembre|lembra|guarde|guarda|grave|memorize|anote)\s+(?:que|isso:?)\s+(.+)/i);
        facts = facts.filter((f) => normalize(f) !== normalize(fact));
        facts.push(fact); saveFacts();
        return p(`Guardado na memória: “${escapeHtml(fact)}”. 🧠`);
      }
    },
    {
      name: 'memoria-listar',
      test: (n) => /(o que (voce )?sabe sobre mim|do que (voce )?se lembra|sua memoria|minhas informacoes)/.test(n),
      run: () => {
        const items = [`Seu nome: <b>${escapeHtml(settings.name)}</b>`];
        if (settings.city) items.push(`Sua cidade: <b>${escapeHtml(settings.city)}</b>`);
        facts.forEach((f) => items.push(escapeHtml(f)));
        return p('Isto é o que eu sei sobre você:') + list(items) + (facts.length ? '' : p('<small>Me conte algo com "lembre que ...".</small>'));
      }
    },
    {
      name: 'memoria-apagar',
      test: (n) => /(esqueca|apague|limpe)\s+(tudo|(a|sua) memoria|o que (voce )?sabe)/.test(n),
      run: () => { facts = []; saveFacts(); return p('Pronto, esqueci tudo o que você tinha me contado.'); }
    },
    {
      name: 'memoria-perguntar',
      test: (n) => /^(qual|quando|onde|quem|como)\s+(e|era|sao|fica)?\s*(o |a |os |as )?(meu|minha|meus|minhas)\s+\S/.test(n),
      run: (n) => {
        const key = n.replace(/^(qual|quando|onde|quem|como)\s+(e|era|sao|fica)?\s*(o |a |os |as )?(meu|minha|meus|minhas)\s+/, '').replace(/[?.!]/g, '').trim();
        if (/^nome/.test(key)) return p(`Seu nome é <b>${escapeHtml(settings.name)}</b>.`);
        if (/^cidade/.test(key) && settings.city) return p(`Você mora em <b>${escapeHtml(settings.city)}</b>.`);
        const words = key.split(/\s+/).filter((w) => w.length > 2);
        const found = facts.filter((f) => words.every((w) => normalize(f).includes(w)));
        if (found.length) return p('Você me contou:') + list(found.map(escapeHtml));
        return p(`Você ainda não me contou isso. Diga, por exemplo: "lembre que meu ${escapeHtml(key)} é ...".`);
      }
    },

    /* ---------- lembretes e timer ---------- */
    {
      name: 'lembrete',
      test: (n) => /(lembr|avis|alarme|desperta)/.test(n) && !!parseDelay(n),
      run: (n, text) => {
        const delay = parseDelay(n);
        // remove do texto original (com acentos) a parte do tempo e o comando
        const loose = new RegExp(delay.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aeiouc]/g, '.').replace(/\s+/g, '\\s+'), 'i');
        let what = text.replace(loose, ' ')
          .replace(/^\s*(me\s+)?(lembre|lembra|lembrar|avise|avisa|alarme|desperte)(-me|\s+me)?\s*/i, '')
          .replace(/^\s*(de|que|para|pra)\s+/i, '').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
        if (!what) what = 'seu lembrete';
        const r = V.app.addReminder(what, delay.ms);
        const when = delay.at ? 'às ' + delay.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'em ' + humanDuration(delay.ms);
        return p(`⏰ Combinado! Vou te lembrar de <b>${escapeHtml(r.text)}</b> ${when}.`) +
          (('Notification' in window) && Notification.permission === 'default' ? p('<small>Permita as notificações para eu avisar mesmo com a aba em segundo plano.</small>') : '');
      }
    },
    {
      name: 'timer',
      test: (n) => /^(timer|temporizador|cronometro|contagem)\b/.test(n) || /(timer|temporizador) de/.test(n),
      run: (n) => {
        const m = n.match(/(\d+(?:[.,]\d+)?|um|uma|dois|cinco|dez|quinze|vinte|trinta|meia)\s*(segundos?|seg|s|minutos?|min|horas?|h)\b/);
        if (!m) return p('Por quanto tempo? Ex.: "timer de 5 minutos".');
        const ms = V.parseNum(m[1]) * (m[2][0] === 's' ? 1 : m[2][0] === 'h' ? 3600 : 60) * 1000;
        V.app.addReminder('⏱ Timer de ' + humanDuration(ms) + ' acabou!', ms, true);
        return p(`⏱ Timer de <b>${humanDuration(ms)}</b> iniciado. Eu aviso quando acabar.`);
      }
    },
    {
      name: 'lembretes-listar',
      test: (n) => /(meus|quais|ver|listar)\s+(os\s+)?(lembretes|alarmes|timers)/.test(n),
      run: () => {
        const rs = V.app.reminders();
        if (!rs.length) return p('Você não tem lembretes ativos.');
        return p('Seus lembretes:') + list(rs.map((r) => `<b>${new Date(r.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</b> ${escapeHtml(r.text)}`));
      }
    },
    {
      name: 'lembretes-cancelar',
      test: (n) => /(cancel|apag|remov)\w*\s+(os\s+|todos os\s+)?(lembretes|alarmes|timers)/.test(n),
      run: () => { const k = V.app.clearReminders(); return p(k ? `Cancelei ${k} lembrete${k > 1 ? 's' : ''}.` : 'Não havia lembretes ativos.'); }
    },

    /* ---------- código ---------- */
    {
      name: 'codigo-continuacao',
      test: (n) => !!ctx.lastCode && /^(e |agora |faz |faca |manda |mostra )?(em |no |para |pra )?(o )?(python|html|css|javascript|js)( tambem| agora)?\??$/.test(n),
      run: (n) => makeCode(detectLang(n), ctx.lastCode.template, V.TEMPLATE_NAME[ctx.lastCode.template])
    },
    {
      name: 'codigo',
      test: (n) => {
        const verb = /\b(cri|ger|fac|faz|escrev|mont|me (de|da|manda)|quero|preciso de|programe|desenvolv|construa|codifique)/.test(n);
        const noun = /(script|codigo|\bprograma\b|pagina|\bsite\b|html|\bcss\b|javascript|\bjs\b|python|\bpy\b|funcao|\bapp\b|aplicativo|jogo da velha|landing)/.test(n);
        const strongTemplate = /(cronometro|quiz|jogo da velha|landing|calculadora|relogio digital)/.test(n);
        return (noun && (verb || /^(um |uma |o |a )?(script|codigo|programa|pagina|site|html|css|javascript|js|python)\b/.test(n)))
          || (verb && strongTemplate) || (!!detectLang(n) && V.detectTemplate(n) !== 'base');
      },
      run: (n, text) => {
        const template = V.detectTemplate(n);
        const name = (text.match(/(?:chamad[oa]|com o nome|nome)\s+["“]?([\w\s-]{2,40}?)["”]?(?:\s+em\s|$)/i) || [])[1] || V.TEMPLATE_NAME[template];
        return makeCode(detectLang(n) || (template === 'landing' ? 'html' : 'js'), template, capitalize(name.trim()));
      }
    },

    /* ---------- imagem ---------- */
    {
      name: 'imagem',
      test: (n) => (/(imagem|figura|desenho|arte|wallpaper|papel de parede|ilustracao|foto|quadro|pintura)/.test(n) && /\b(ger|cri|desenh|fac|faz|quero|mostr|pint)/.test(n)) || (/^(outra|mais uma)( imagem)?$/.test(n) && ctx.lastImage),
      run: (n, text) => {
        let subject, style;
        if (/^(outra|mais uma)/.test(n) && ctx.lastImage) { subject = ctx.lastImage.subject + ' ' + Date.now() % 1000; style = ctx.lastImage.style; }
        else {
          style = /paisagem|montanha|praia|campo|natureza|por do sol|floresta|lago|mar\b/.test(n) ? 'paisagem'
            : /tecnolog|robo|futur|digital|cyber|codigo|circuito/.test(n) ? 'tecnologia'
            : /minimal|simples|limpa/.test(n) ? 'minimalista' : 'abstrato';
          subject = after(text, /(?:imagem|figura|desenho|arte|wallpaper|ilustração|ilustracao|foto|quadro|pintura)\s+(?:de|do|da|sobre|com|mostrando)?\s*(.+)/i) || text;
          subject = subject.replace(/\s+(em|no)\s+estilo\s+\w+$/i, '');
        }
        ctx.lastImage = { subject: subject.replace(/\s\d+$/, ''), style };
        const url = V.generateImage(subject, style);
        return p(`Aqui está: <b>${escapeHtml(ctx.lastImage.subject)}</b> (estilo ${style}).`) +
          `<img src="${url}" alt="${escapeHtml(subject)}">` +
          `<div class="bubble-actions"><button type="button" data-chat-action="download-image" data-filename="${V.slug(subject)}.png">Baixar PNG</button></div>` +
          p('<small>Diga "outra" para uma nova versão.</small>');
      }
    },

    /* ---------- tarefas ---------- */
    {
      name: 'tarefa-concluir',
      test: (n) => /^(terminei|conclui|finalizei|fiz|acabei|feito:?|marque como feita)\s+\S/.test(n),
      run: (n, text) => {
        const q = after(text, /^(?:terminei|conclu[ií]|finalizei|fiz|acabei|feito:?|marque como feita)\s+(?:a\s+tarefa\s+|de\s+)?(.+)/i);
        const t = V.tasksApi.find(q);
        if (!t) return p(`Não achei uma tarefa aberta parecida com “${escapeHtml(q)}”. Escreva "minhas tarefas" para ver a lista.`);
        V.tasksApi.setStatus(t.id, 'done');
        const nxt = V.tasksApi.best();
        return p(`Boa! Marquei <b>${escapeHtml(t.title)}</b> como concluída. ✓`) + (nxt ? p(`Próximo passo sugerido: <b>${escapeHtml(nxt.title)}</b>.`) : p('Você zerou suas tarefas abertas. 🎉'));
      }
    },
    {
      name: 'tarefa-apagar',
      test: (n) => /^(apague|apaga|exclua|exclui|remova|remove|delete|tire)\s+(a\s+)?tarefa\s+\S/.test(n),
      run: (n, text) => {
        const q = after(text, /tarefa\s+(.+)/i);
        const t = V.tasksApi.find(q, true);
        if (!t) return p(`Não achei a tarefa “${escapeHtml(q)}”.`);
        V.tasksApi.remove(t.id);
        return p(`Excluí <b>${escapeHtml(t.title)}</b>.`);
      }
    },
    {
      name: 'tarefa-adicionar',
      test: (n) => /^(adicion\w*|add|anot\w*|cri\w*|nova)\s+(uma\s+)?(nova\s+)?tarefa\b/.test(n) || /^(me\s+)?lembr\w*\s+(de|que)\s+/.test(n) || /^(preciso|tenho que|tenho de|devo)\s+/.test(n),
      run: (n, text) => {
        let title = after(text, /^(?:adicion\w*|add|anot\w*|cri\w*|nova)\s+(?:uma\s+)?(?:nova\s+)?tarefa\s*:?\s*(?:de\s+|para\s+)?(.+)/i)
          || after(text, /^(?:me\s+)?lembr\w*\s+(?:de\s+|que\s+)(.+)/i)
          || after(text, /^(?:preciso|tenho que|tenho de|devo)\s+(.+)/i);
        const priority = /urgente|importante|prioridade alta/i.test(title) ? 'high' : /quando der|sem pressa|depois/i.test(title) ? 'low' : 'medium';
        title = title.replace(/\s*[,(-]?\s*(urgente|importante|prioridade alta|quando der|sem pressa)\)?/gi, '').trim();
        const durMatch = title.match(/\s*(?:em|por|de|,)?\s*(\d+)\s*(min|minutos|h|hora|horas)\b/i);
        let duration = 25;
        if (durMatch) { duration = /h/i.test(durMatch[2]) ? Number(durMatch[1]) * 60 : Number(durMatch[1]); title = title.replace(durMatch[0], '').trim(); }
        const today = !/amanh[ãa]|semana que vem|depois/i.test(title);
        title = title.replace(/\s*(para\s+|pra\s+)?(amanh[ãa]|hoje|semana que vem)\s*$/i, '').trim();
        const category = /estud|prova|ler|aula|curso|li[cç][aã]o|dever|trabalho escolar|revis/i.test(title) ? 'Estudo'
          : /casa|limpar|lavar|cozinh|comprar|mercado|arrumar|louça|roupa/i.test(title) ? 'Casa'
          : /academia|treino|m[eé]dico|amig|fam[ií]l|m[aã]e|pai|anivers/i.test(title) ? 'Pessoal' : 'Trabalho';
        if (title.length < 2) return p('Qual é a tarefa? Ex.: "adicionar tarefa revisar o projeto".');
        const t = V.tasksApi.add({ title: capitalize(title), category, priority, duration, today });
        return p(`Anotado! <b>${escapeHtml(t.title)}</b> (${{ high: 'alta', medium: 'média', low: 'baixa' }[priority]} prioridade, ${category}, ${duration} min${today ? ', hoje' : ''}).`);
      }
    },
    {
      name: 'organizar',
      test: (n) => /(organiz|planej|meu dia|cronograma|agenda do dia|montar (o|um) plano)/.test(n),
      run: () => {
        const open = V.tasksApi.open().sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) || a.duration - b.duration);
        if (!open.length) return p('Ainda não há tarefas para organizar. Adicione algumas e eu monto um cronograma.');
        let clock = new Date(); clock.setSeconds(0); clock.setMinutes(Math.ceil(clock.getMinutes() / 5) * 5);
        const hhmm = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const chosen = open.slice(0, 8);
        const items = chosen.map((t, i) => {
          const start = new Date(clock); clock = new Date(clock.getTime() + t.duration * 60000);
          const line = `<b>${hhmm(start)}–${hhmm(clock)}</b> ${escapeHtml(t.title)}`;
          clock = new Date(clock.getTime() + ((i + 1) % 3 === 0 ? 15 : 5) * 60000);
          return line;
        });
        const total = chosen.reduce((s, t) => s + t.duration, 0);
        return p('Montei um plano começando agora (pausa de 5 min, e 15 min a cada 3 tarefas):') + list(items, true) +
          p(`Total de foco: <b>${Math.floor(total / 60) ? Math.floor(total / 60) + 'h ' : ''}${total % 60}min</b>.`);
      }
    },
    {
      name: 'priorizar',
      test: (n) => /(priori|o que (devo )?fazer primeiro|comecar por|começar por|por onde (eu )?comec|qual (tarefa )?fazer|proximo passo|o que faco agora)/.test(n),
      run: () => {
        const t = V.tasksApi.best();
        if (!t) return p('Sua lista está vazia. Me diga uma coisa que precisa fazer hoje e eu anoto.');
        const why = t.status === 'doing' ? 'você já começou e terminar dá impulso' : t.priority === 'high' ? 'é de alta prioridade' : `é rápida (${t.duration} min) e gera embalo`;
        return p(`Comece por <b>${escapeHtml(t.title)}</b>, porque ${why}.`) + p('Quer foco total? Diga "iniciar foco".');
      }
    },
    {
      name: 'tarefas-listar',
      test: (n) => /(minhas tarefas|listar tarefas|lista de tarefas|quais (sao )?(as )?(minhas )?tarefas|mostr\w* (as |minhas )?tarefas|o que (eu )?tenho (pra|para) (fazer|hoje))/.test(n),
      run: () => {
        const open = V.tasksApi.open();
        if (!open.length) return p('Você não tem tarefas abertas. Quer adicionar uma? Ex.: "adicionar tarefa estudar 30 min".');
        return p(`Você tem <b>${open.length}</b> tarefa${open.length > 1 ? 's' : ''} aberta${open.length > 1 ? 's' : ''}:`) +
          list(open.slice(0, 10).map((t) => `${escapeHtml(t.title)} <small>(${{ high: 'Alta', medium: 'Média', low: 'Baixa' }[t.priority]}, ${t.duration} min${t.status === 'doing' ? ', em andamento' : ''})</small>`));
      }
    },
    {
      name: 'foco',
      test: (n) => /(foco|pomodoro|concentrar)/.test(n),
      run: (n) => {
        if (/(parar|pausar|pausa|encerrar)/.test(n)) { V.app.stopFocus(); return p('Pausei o modo foco.'); }
        V.app.startFocus();
        return p('Modo foco iniciado: 25 minutos. Silencia o celular e fecha as abas que não precisa. Eu aviso quando acabar. ⏱');
      }
    },

    /* ---------- matemática ---------- */
    {
      name: 'equacao',
      test: (n, text) => /x/.test(n) && /=/.test(text) && /\d/.test(text) && !/https?:/.test(n),
      run: (n, text) => {
        const eq = text.replace(/^.*?(?:resolva|resolver|calcule|ache x em|equa[cç][aã]o:?)\s*/i, '').replace(/[?]/g, '').trim();
        try {
          const r = V.solveEquation(eq);
          let html = p(`Equação: <code>${escapeHtml(eq)}</code>`);
          if (r.degree === 2) html += p(`É do 2º grau: a = ${fmt(r.a)}, b = ${fmt(r.b)}, c = ${fmt(r.c)}.<br>Δ = b² − 4ac = <b>${fmt(r.delta)}</b>`);
          if (r.degree === 1) html += p(`É do 1º grau: ${fmt(r.b)}x ${r.c >= 0 ? '+' : '−'} ${fmt(Math.abs(r.c))} = 0`);
          if (r.roots.length) html += p(r.roots.length === 1 ? `Solução: <b>x = ${fmt(r.roots[0])}</b>` : `Soluções: <b>x₁ = ${fmt(r.roots[0])}</b> e <b>x₂ = ${fmt(r.roots[1])}</b>`);
          if (r.note) html += p(r.note);
          return html;
        } catch (err) { return p(err.message + '. Ex.: "resolva 2x + 3 = 11".'); }
      }
    },
    {
      name: 'tabuada',
      test: (n) => /tabuada\s+(do|da|de)?\s*\d+/.test(n),
      run: (n) => {
        const k = +n.match(/tabuada\s+(?:do|da|de)?\s*(\d+)/)[1];
        return p(`Tabuada do <b>${k}</b>:`) + `<pre>${Array.from({ length: 10 }, (_, i) => `${String(k).padStart(2)} × ${String(i + 1).padStart(2)} = ${k * (i + 1)}`).join('\n')}</pre>`;
      }
    },
    {
      name: 'porcentagem',
      test: (n) => /\d\s*%\s*(de|do|da)\s*\d/.test(n) || /quanto (por cento|%)/.test(n),
      run: (n) => {
        let m = n.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de|do|da)\s*(\d+(?:[.,]\d+)?)/);
        if (m) { const a = V.parseNum(m[1]), b = V.parseNum(m[2]); return p(`${fmt(a)}% de ${fmt(b)} = <b>${fmt(a * b / 100)}</b>`); }
        m = n.match(/(\d+(?:[.,]\d+)?)\s*(?:e|sao|representa)\s*quanto (?:por cento|%)\s*(?:de|do|da)\s*(\d+(?:[.,]\d+)?)/);
        if (m) { const a = V.parseNum(m[1]), b = V.parseNum(m[2]); return p(`${fmt(a)} é <b>${fmt(a / b * 100, 2)}%</b> de ${fmt(b)}`); }
        return p('Ex.: "20% de 250" ou "30 é quanto por cento de 120".');
      }
    },
    {
      name: 'conversao',
      test: (n) => {
        const m = n.match(/(-?\d+(?:[.,]\d+)?)\s*([a-z°²³/]+(?:\/h)?)\s+(?:em|para|pra|to|=)\s+([a-z°²³/]+)/);
        return !!(m && V.UNIT_ALIASES[m[2]] && V.UNIT_ALIASES[m[3]]);
      },
      run: (n) => {
        const m = n.match(/(-?\d+(?:[.,]\d+)?)\s*([a-z°²³/]+(?:\/h)?)\s+(?:em|para|pra|to|=)\s+([a-z°²³/]+)/);
        const v = V.parseNum(m[1]), from = V.UNIT_ALIASES[m[2]], to = V.UNIT_ALIASES[m[3]];
        try { return p(`${fmt(v)} ${V.UNITS[from].label} = <b>${fmt(V.convert(v, from, to), 4)} ${V.UNITS[to].label}</b>`); }
        catch (err) { return p(err.message + '.'); }
      }
    },
    {
      name: 'conta',
      test: (n, text) => {
        const t = text.replace(/^(quanto (é|e|da|dá)|calcule|calcula|resolva|resultado de|conta:?)\s*/i, '').replace(/[?=]+\s*$/, '').trim();
        return /\d/.test(t) && (/[-+*/^%x×÷()!²³]/.test(t) || /raiz|sqrt|sen|cos|tan|log/.test(normalize(t))) && /^[\d\s.,+\-*/^%()x×÷√!²³a-zçãéíõ]+$/i.test(t);
      },
      run: (n, text) => {
        const t = text.replace(/^(quanto (é|e|da|dá)|calcule|calcula|resolva|resultado de|conta:?)\s*/i, '').replace(/[?=]+\s*$/, '').trim();
        try { return p(`${escapeHtml(t)} = <b>${fmt(V.evaluate(t))}</b>`); } catch (err) { return null; }
      }
    },

    /* ---------- datas ---------- */
    {
      name: 'hora',
      test: (n) => /(que horas|que dia (e|eh) hoje|data de hoje|hoje e que dia|qual (a|e a) data)/.test(n),
      run: () => { const d = new Date(); return p(`Agora são <b>${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</b> de ${V.fmtDate(d)}.`); }
    },
    {
      name: 'dias-ate',
      test: (n) => /(quantos dias|quanto tempo|falta quanto|faltam quantos dias)\s*(falta[m]?\s*)?(para|pra|ate)/.test(n),
      run: (n, text) => {
        const d = V.parseDate(text);
        if (!d) return p('Não entendi a data. Ex.: "quantos dias até 25/12" ou "até o natal".');
        const days = V.daysBetween(new Date(), d.date);
        if (days === 0) return p('É hoje! 🎉');
        return p(days > 0 ? `Faltam <b>${days} dias</b> para ${V.fmtDate(d.date)} (cerca de ${fmt(days / 7, 1)} semanas).` : `Já passaram <b>${-days} dias</b> desde ${V.fmtDate(d.date)}.`);
      }
    },
    {
      name: 'dia-da-semana',
      test: (n) => /(que|qual) dia da semana/.test(n),
      run: (n, text) => {
        const d = V.parseDate(text);
        if (!d) return p('Me diga a data, por exemplo: "que dia da semana foi 15/11/1889".');
        return p(`${d.date.toLocaleDateString('pt-BR')} ${d.date < new Date() ? 'foi' : 'cai'} numa <b>${d.date.toLocaleDateString('pt-BR', { weekday: 'long' })}</b>.`);
      }
    },
    {
      name: 'idade',
      test: (n) => /(idade|quantos anos)/.test(n) && /(\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\b(19|20)\d{2}\b)/.test(n),
      run: (n, text) => {
        const now = new Date();
        const d = V.parseDate(text);
        if (d && d.hasYear) {
          let age = now.getFullYear() - d.date.getFullYear();
          const bday = new Date(now.getFullYear(), d.date.getMonth(), d.date.getDate());
          if (bday > now) age--;
          let next = bday > now ? bday : new Date(now.getFullYear() + 1, d.date.getMonth(), d.date.getDate());
          return p(`Quem nasceu em ${d.date.toLocaleDateString('pt-BR')} tem <b>${age} anos</b>. Faltam ${V.daysBetween(now, next)} dias para o próximo aniversário. 🎂`);
        }
        const y = +n.match(/\b((?:19|20)\d{2})\b/)[1];
        return p(`Quem nasceu em ${y} tem <b>${now.getFullYear() - y - 1} ou ${now.getFullYear() - y} anos</b>, dependendo se já fez aniversário este ano.`);
      }
    },

    /* ---------- clima ---------- */
    {
      name: 'clima',
      test: (n) => /(clima|previsao do tempo|previsao|temperatura|vai chover|esta chovendo|como esta o tempo|tempo (em|de|para|hoje))/.test(n) && !/\d+\s*(°|graus)/.test(n),
      run: async (n, text) => {
        let city = after(text, /\b(?:em|de|para|pra|no|na)\s+([A-Za-zÀ-ú' .-]{2,})\??$/i).replace(/^(hoje|amanh[aã])$/i, '');
        city = city.replace(/\s+(hoje|amanh[aã]|agora)$/i, '').trim();
        if (!city || /^(tempo|hoje)$/i.test(city)) city = settings.city || '';
        if (!city) return p('De qual cidade? Ex.: "clima em Curitiba". Dica: diga "moro em ..." e eu guardo.');
        try {
          const w = await V.weather(city);
          if (!w) return p(`Não encontrei a cidade “${escapeHtml(city)}”.`);
          const dayName = (s, i) => i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : capitalize(new Date(s + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long' }));
          return p(`${w.now.desc[1]} <b>${escapeHtml(w.place)}</b>: ${fmt(w.now.temp, 0)}°C agora, ${w.now.desc[0]} (sensação de ${fmt(w.now.feels, 0)}°C, umidade ${w.now.humidity}%, vento ${fmt(w.now.wind, 0)} km/h).`) +
            list(w.days.map((d, i) => `${d.desc[1]} <b>${dayName(d.date, i)}:</b> ${fmt(d.min, 0)}° a ${fmt(d.max, 0)}°, ${d.desc[0]}, ${d.rain ?? 0}% de chance de chuva`));
        } catch { return p('Não consegui consultar o clima agora. Verifique sua internet e tente de novo.'); }
      }
    },

    /* ---------- aleatórios ---------- */
    {
      name: 'dado',
      test: (n) => /(jog|rol|lanc)\w*\s+(um|uns|\d+|dois|tres)?\s*dados?|^dados?$/.test(n),
      run: (n) => {
        const qty = Math.min(10, V.parseNum((n.match(/(\d+|dois|tres)\s*dados/) || [])[1]) || 1);
        const faces = +(n.match(/d(\d+)\b/) || [])[1] || 6;
        const rolls = Array.from({ length: qty }, () => V.randomInt(1, faces));
        const dice = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return p(`🎲 ${rolls.map((r) => faces === 6 ? dice[r] + ' ' + r : r).join('  ·  ')}${qty > 1 ? ` (soma: <b>${rolls.reduce((a, b) => a + b, 0)}</b>)` : ''}`);
      }
    },
    { name: 'moeda', test: (n) => /(cara ou coroa|jog\w* (uma )?moeda)/.test(n), run: () => p(`🪙 Deu <b>${V.randomInt(0, 1) ? 'cara' : 'coroa'}</b>!`) },
    {
      name: 'numero-aleatorio',
      test: (n) => /numero (aleatorio|ao acaso|sorteado)|sorteie um numero|sortear um numero/.test(n),
      run: (n) => {
        const m = n.match(/(-?\d+)\s*(?:e|a|ate|-)\s*(-?\d+)/);
        const [a, b] = m ? [+m[1], +m[2]] : [1, 100];
        return p(`🎯 Entre ${a} e ${b}: <b>${V.randomInt(a, b)}</b>`);
      }
    },
    {
      name: 'sorteio',
      test: (n) => /(sorteie|sortear|escolha|escolher|decida)\s+(entre|um|uma)?\s*:?\s*.+(,| ou | e )/.test(n),
      run: (n, text) => {
        const body = after(text, /(?:sorteie|sortear|escolha|escolher|decida)\s+(?:entre|um|uma)?\s*:?\s*(.+)/i);
        const options = body.split(/\s*,\s*|\s+ou\s+|\s+e\s+/i).map((s) => s.trim()).filter(Boolean);
        if (options.length < 2) return p('Me dê pelo menos duas opções. Ex.: "sorteie entre pizza, hambúrguer e sushi".');
        return p(`🎰 Entre ${options.map((o) => escapeHtml(o)).join(', ')}... deu <b>${escapeHtml(options[V.randomInt(0, options.length - 1)])}</b>!`);
      }
    },
    {
      name: 'senha',
      test: (n) => /(ger|cri|faz|faca|sugir|me de)\w*\s+(uma\s+)?senha|^senha( forte)?$/.test(n),
      run: (n) => {
        const len = Math.min(64, Math.max(8, +(n.match(/(\d+)\s*(caracteres|letras|digitos)?/) || [])[1] || 16));
        const pass = V.password(len);
        return p(`🔐 Senha forte com ${len} caracteres:`) + `<pre>${escapeHtml(pass)}</pre><div class="bubble-actions"><button type="button" data-chat-action="copy">Copiar</button></div>` +
          p('<small>Gerada aqui no seu navegador, ninguém mais vê.</small>');
      }
    },

    /* ---------- diversão ---------- */
    { name: 'piada', test: (n) => /(piada|me faca rir|algo engracado|conte uma graca)/.test(n), run: () => p('😄 ' + V.joke()) },
    { name: 'frase', test: (n) => /(frase|motiva|inspira|citacao|pensamento do dia)/.test(n), run: () => p('✨ ' + V.quote()) },
    { name: 'curiosidade', test: (n) => /(curiosidade|fato (curioso|interessante|aleatorio)|voce sabia)/.test(n), run: () => p('💡 ' + V.fact()) },
    { name: 'conselho', test: (n) => /(conselho|dica|me ajud\w* a focar|procrastin|sem vontade|desanimad|cansad)/.test(n), run: () => p('🧭 ' + V.advice()) },

    /* ---------- textos ---------- */
    {
      name: 'texto-ferramentas',
      test: (n) => /^(resuma|resumir|resumo|conte (as )?palavras|contar palavras|quantas palavras|maiusculas?|minusculas?|inverta|inverter|palavras.chave|titulo|capitalize)\b[^:]*:\s*\S/.test(n),
      run: (n, text) => {
        const body = text.slice(text.indexOf(':') + 1).trim();
        if (/^(resum)/.test(n)) {
          const s = V.textStats(body);
          return p('<b>Resumo:</b> ' + escapeHtml(V.summarize(body, s.sentences > 8 ? 4 : 2))) + p(`<small>Palavras-chave: ${V.keywords(body).map(escapeHtml).join(', ')}</small>`);
        }
        if (/palavras|quantas/.test(n) && !/chave/.test(n)) { const s = V.textStats(body); return list([`<b>${s.words}</b> palavras`, `<b>${s.chars}</b> caracteres (${s.charsNoSpace} sem espaços)`, `<b>${s.sentences}</b> frases`, `~${s.readMin} min de leitura`]); }
        if (/^maiuscul/.test(n)) return `<pre>${escapeHtml(body.toUpperCase())}</pre><div class="bubble-actions"><button type="button" data-chat-action="copy">Copiar</button></div>`;
        if (/^minuscul/.test(n)) return `<pre>${escapeHtml(body.toLowerCase())}</pre><div class="bubble-actions"><button type="button" data-chat-action="copy">Copiar</button></div>`;
        if (/^(titulo|capitalize)/.test(n)) return `<pre>${escapeHtml(V.titleCase(body))}</pre><div class="bubble-actions"><button type="button" data-chat-action="copy">Copiar</button></div>`;
        if (/^invert/.test(n)) return p(escapeHtml([...body].reverse().join('')));
        if (/chave/.test(n)) return p('Palavras-chave: <b>' + V.keywords(body, 8).map(escapeHtml).join(', ') + '</b>');
        return null;
      }
    },
    {
      name: 'texto-longo',
      test: (n, text) => text.length > 280,
      run: (n, text) => {
        const s = V.textStats(text);
        return p('Que texto grande! Aqui vai um resumo:') + p(escapeHtml(V.summarize(text, 3))) +
          p(`<small>${s.words} palavras · ~${s.readMin} min de leitura · palavras-chave: ${V.keywords(text).map(escapeHtml).join(', ')}</small>`);
      }
    },

    /* ---------- tarefa por intenção ("preciso...") vem antes da pesquisa ---------- */

    /* ---------- pesquisa na Wikipedia ---------- */
    {
      name: 'wikipedia',
      test: (n) => /^(o que (e|eh|sao|foi|significa)|quem (e|foi|era|sao|inventou|descobriu|criou)|me (fale|conte|explique)( mais)? sobre|fale sobre|explique|pesquise|pesquisa|procure|defina|definicao de|significado de|onde fica|qual a capital|o que voce sabe sobre)\b/.test(n),
      run: async (n, text) => {
        let term = text.replace(/^(o que (é|e|eh|são|sao|foi|significa)|quem (é|e|foi|era|são|sao|inventou|descobriu|criou)|me (fale|conte|explique)( mais)? sobre|fale sobre|explique|pesquise( sobre)?|pesquisa( sobre)?|procure( sobre)?|defina|definição de|definicao de|significado de|onde fica|o que você sabe sobre|o que voce sabe sobre)\s*/i, '')
          .replace(/^(o|a|os|as|um|uma)\s+/i, '').replace(/[?.!]+$/, '').trim();
        if (/^qual a capital/i.test(text)) term = 'capital ' + text.replace(/^qual (é )?a capital (d[oae]s?\s+)?/i, '').replace(/[?]/g, '');
        if (!term) return p('Sobre o que você quer saber?');
        try {
          const w = await V.wikiSummary(term);
          if (!w) return p(`Não encontrei nada sobre “${escapeHtml(term)}” na Wikipedia.`);
          const extract = w.extract.length > 700 ? w.extract.slice(0, 700).replace(/\s\S*$/, '') + '...' : w.extract;
          return (w.image ? `<img class="wiki-thumb" src="${escapeHtml(w.image)}" alt="${escapeHtml(w.title)}">` : '') +
            p(`📚 <b>${escapeHtml(w.title)}</b>`) + p(escapeHtml(extract)) +
            (w.url ? p(`<small>Fonte: <a href="${escapeHtml(w.url)}" target="_blank" rel="noopener">Wikipedia</a></small>`) : '');
        } catch { return p('Não consegui acessar a Wikipedia agora. Verifique sua internet e tente de novo.'); }
      }
    }
  ];

  /* ---------- Resposta padrão ---------- */
  async function fallback(n, text) {
    // Pergunta aberta? tenta a Wikipedia com as palavras principais
    if (/\?$/.test(text.trim()) || /^(como|por que|porque|qual|quais|quando|onde)\b/.test(n)) {
      const kw = V.keywords(text, 3).join(' ');
      if (kw) {
        try {
          const w = await V.wikiSummary(kw);
          if (w) return p(`Não tenho certeza, mas encontrei isto sobre <b>${escapeHtml(w.title)}</b>:`) + p(escapeHtml(w.extract.slice(0, 450).replace(/\s\S*$/, '')) + '...') +
            (w.url ? p(`<small><a href="${escapeHtml(w.url)}" target="_blank" rel="noopener">Ler mais na Wikipedia</a></small>`) : '');
        } catch { /* sem internet */ }
      }
    }
    return p(pick(['Hmm, ainda não sei responder isso. 🙂', 'Essa eu ainda não aprendi.', 'Não entendi muito bem.'])) +
      p('Experimente: "adicionar tarefa ...", "crie um jogo da velha", "o que é buraco negro", "clima em Recife", "me lembre em 10 minutos de beber água". Escreva <b>ajuda</b> para ver tudo.');
  }

  async function think(raw) {
    const text = raw.trim();
    const n = normalize(text);
    let offHint = null;
    for (const skill of SKILLS) {
      if (skill.ext && !V.extensions?.isOn(skill.ext)) { // extensão desligada
        try { if (!offHint && skill.test(n, text)) offHint = skill.ext; } catch { /* ignore */ }
        continue;
      }
      let ok = false;
      try { ok = skill.test(n, text); } catch { ok = false; }
      if (!ok) continue;
      const out = await skill.run(n, text);
      if (out) { ctx.lastSkill = skill.name; return out; }
    }
    ctx.lastSkill = 'fallback';
    if (offHint) {
      const ext = V.extensions.list.find((e) => e.id === offHint);
      return p(`Isso faz parte da extensão ${ext.icon} <b>${ext.name}</b>, que está desligada. Diga "ligar extensão ${normalize(ext.name).split(' ')[0]}" ou use o botão 🧩.`);
    }
    return fallback(n, text);
  }

  // "Dicas" de autocompletar para o campo do chat
  const EXAMPLES = ['ajuda', 'o que devo fazer primeiro?', 'organize meu dia', 'me lembre em 10 minutos de beber água', 'crie um jogo da velha em HTML',
    'gere uma imagem de pôr do sol na praia', 'clima em São Paulo', 'o que é inteligência artificial', 'resolva x² - 5x + 6 = 0', 'quantos dias até o natal',
    'conte uma piada', 'frase motivacional', 'sorteie entre pizza, sushi e hambúrguer', 'gere uma senha', 'timer de 5 minutos', '30 °c em fahrenheit', 'modo escuro'];

  Object.assign(V, { think, SKILLS, EXAMPLES, brainCtx: ctx });
})();
