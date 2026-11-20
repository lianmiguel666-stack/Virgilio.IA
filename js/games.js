/* =========================================================
   virgilio.ia — conhecimento sobre GTA 6
   Só fatos anunciados oficialmente pela Rockstar Games até
   meados de 2026. Datas podem mudar: o Virgílio avisa isso e
   oferece buscar a versão mais recente na Wikipedia.
   ========================================================= */
(() => {
  'use strict';
  const { normalize, escapeHtml, p, list, pick } = V;

  const RELEASE = new Date(2026, 10, 19); // 19/11/2026: última data oficial que conheço
  const KNOWN_AS_OF = 'meados de 2026';

  const GTA6 = {
    resumo: [
      '<b>Grand Theft Auto VI</b> é o próximo GTA da <b>Rockstar Games</b> (do grupo Take-Two).',
      'A história se passa no estado fictício de <b>Leonida</b>, inspirado na Flórida, com a volta de <b>Vice City</b> (a "Miami" do GTA).',
      'Os protagonistas são <b>Lucia Caminos</b> e <b>Jason Duval</b>, um casal no estilo "Bonnie e Clyde".',
      'Plataformas anunciadas: <b>PlayStation 5</b> e <b>Xbox Series X|S</b>.'
    ],
    lancamento: () => {
      const days = V.daysBetween(new Date(), RELEASE);
      const linhas = [
        'A Rockstar prometeu primeiro o jogo para <b>2025</b>.',
        'Em maio de 2025 ela adiou para <b>26 de maio de 2026</b>.',
        'Em novembro de 2025 adiou de novo, para <b>19 de novembro de 2026</b>. É a última data oficial que eu conheço.'
      ];
      let agora;
      if (days > 0) agora = `Se essa data se mantiver, faltam <b>${days} dias</b>.`;
      else if (days === 0) agora = 'Pela última data que conheço, o lançamento é <b>hoje</b>! 🎉';
      else agora = `Pela última data que conheço, o jogo saiu há <b>${-days} dia${-days === 1 ? '' : 's'}</b>. Meu conhecimento vai até ${KNOWN_AS_OF}, então confira se não houve mais um adiamento.`;
      return p('📅 <b>Lançamento do GTA 6</b>') + list(linhas) + p(agora);
    },
    personagens: [
      '<b>Lucia Caminos</b>: protagonista. Aparece saindo da prisão no primeiro trailer. É a primeira protagonista mulher jogável de um GTA principal na era moderna.',
      '<b>Jason Duval</b>: protagonista. Cresceu cercado de golpistas e trabalha para traficantes nas Leonida Keys até conhecer Lucia.',
      'Personagens secundários mostrados no site oficial: <b>Cal Hampton</b>, <b>Boobie Ike</b>, <b>Dre\'Quan Priest</b>, a dupla <b>Real Dimez</b>, <b>Raul Bautista</b> e <b>Brian Heder</b>.'
    ],
    mapa: [
      '<b>Leonida</b> é o estado fictício do jogo, inspirado na Flórida.',
      '<b>Vice City</b>: a cidade principal, inspirada em Miami.',
      '<b>Leonida Keys</b>: ilhas inspiradas nas Florida Keys.',
      '<b>Grassrivers</b>: pântanos inspirados nos Everglades.',
      '<b>Port Gellhorn</b>, <b>Ambrosia</b> e o parque <b>Mount Kalaga</b>: outras regiões mostradas no site oficial.',
      'O tamanho exato do mapa <b>não foi divulgado</b> oficialmente. Números que circulam por aí são estimativas de fãs.'
    ],
    trailers: [
      '<b>Trailer 1</b>: 5 de dezembro de 2023 (saiu algumas horas antes porque vazou). Música: "Love Is a Long Road", de Tom Petty. Quebrou recordes de visualização no YouTube nas primeiras 24 horas.',
      '<b>Trailer 2</b>: 6 de maio de 2025, junto com o site oficial com personagens, locais e imagens. Música: "Hot Together", das Pointer Sisters.'
    ],
    plataformas: [
      'Anunciado para <b>PlayStation 5</b> e <b>Xbox Series X|S</b>.',
      '<b>PC:</b> a Rockstar não anunciou versão de PC até onde eu sei. Nos GTAs anteriores, o PC chegou depois dos consoles, mas isso é só histórico, não confirmação.'
    ],
    preco: [
      'O <b>preço oficial não tinha sido anunciado</b> até onde eu sei. Valores que circulam são especulação.',
      'Dica: confira na PlayStation Store, Microsoft Store ou no site da Rockstar.'
    ],
    historia: [
      'A Rockstar descreve a história como a de Lucia e Jason tentando sobreviver ao mundo do crime em Leonida depois que um golpe dá errado.',
      'O tom lembra "Bonnie e Clyde": um casal fora da lei, com sátira da cultura de redes sociais da Flórida.',
      'Detalhes do enredo e do final não foram revelados.'
    ],
    online: [
      'A Rockstar <b>não detalhou</b> como será o modo online do GTA 6.',
      'O GTA Online (do GTA 5) continua recebendo atualizações.'
    ],
    vazamento: [
      'Em <b>setembro de 2022</b>, um hacker vazou dezenas de vídeos de uma versão inicial de desenvolvimento.',
      'A Rockstar confirmou o vazamento e disse que ele não atrasaria o desenvolvimento.',
      'O responsável foi identificado e julgado no Reino Unido.'
    ],
    curiosidades: [
      'O GTA 5 saiu em 2013. São mais de 12 anos de espera pelo próximo GTA principal.',
      'O GTA 5 vendeu mais de 200 milhões de cópias, um dos jogos mais vendidos da história.',
      'Vice City já tinha aparecido em GTA: Vice City (2002), ambientado nos anos 80.',
      'O primeiro trailer foi visto mais de 90 milhões de vezes no YouTube em 24 horas.',
      'A Rockstar confirmou oficialmente que o jogo estava em desenvolvimento em fevereiro de 2022.'
    ],
    requisitos: [
      'Como só os consoles foram anunciados, <b>não há requisitos oficiais de PC</b>.',
      'Qualquer lista de "requisitos do GTA 6 para PC" que você vir agora é especulação.'
    ]
  };

  const TOPICS = [
    ['requisitos', /(requisit|roda no meu|placa de video|configuracao)/],
    ['plataformas', /(\bpc\b|computador|plataforma|console|ps5|ps4|playstation|xbox|celular|switch)/],
    ['preco', /(preco|custa|custar|valor|reais|dolares)/],
    ['personagens', /(personage|protagonist|lucia|jason|quem (e|sao)|elenco)/],
    ['mapa', /(mapa|cidade|vice city|leonida|onde se passa|lugar|ambient|estado|regiao|regioes)/],
    ['trailers', /(trailer|video|teaser)/],
    ['historia', /(historia|enredo|trama|sobre o que)/],
    ['online', /(online|multiplayer|multijogador)/],
    ['vazamento', /(vaza|leak|hacker)/],
    ['curiosidades', /(curiosidade|fato|sabia)/],
    ['lancamento', /(lanca|sai |sai\?|sai$|saiu|sair|data|quando|adiad|adiament|chega|dia que|falta)/]
  ];

  const TITLES = { personagens: '👥 Personagens', mapa: '🗺️ Onde se passa', trailers: '🎬 Trailers', plataformas: '🎮 Plataformas', preco: '💰 Preço', historia: '📖 História', online: '🌐 Online', vazamento: '🔓 O vazamento de 2022', curiosidades: '💡 Curiosidades', requisitos: '🖥️ Requisitos' };

  const footer = () => `<div class="bubble-actions">
      <button type="button" data-chat-send="pesquise GTA VI">🔎 Buscar o mais recente</button>
      <button type="button" data-chat-send="gta 6 personagens">Personagens</button>
      <button type="button" data-chat-send="gta 6 mapa">Mapa</button>
      <button type="button" data-chat-send="quando sai o gta 6">Lançamento</button>
    </div>` + p(`<small>Meu conhecimento sobre GTA 6 vai até ${KNOWN_AS_OF}. Fonte oficial: rockstargames.com/VI</small>`);

  function answer(n) {
    const found = TOPICS.filter(([, re]) => re.test(n)).map(([k]) => k);
    V.bard?.set('cheer', 1500);
    if (!found.length) {
      return p(pick(['🎮 Ah, GTA 6! O jogo mais esperado da década.', '🎮 GTA 6? Bardo também joga!', '🎮 Bora falar de GTA 6!'])) + list(GTA6.resumo) + GTA6.lancamento() + footer();
    }
    return found.slice(0, 2).map((k) => {
      if (k === 'lancamento') return GTA6.lancamento();
      if (k === 'curiosidades') return p(TITLES[k]) + list([pick(GTA6.curiosidades), pick(GTA6.curiosidades)].filter((v, i, a) => a.indexOf(v) === i));
      return p(`<b>${TITLES[k]}</b>`) + list(GTA6[k]);
    }).join('') + footer();
  }

  const skill = {
    name: 'gta6',
    test: (n) => /\bgta\s*(6|vi|seis)\b|grand theft auto (6|vi)|gta6|gtavi/.test(n) || (/\bgta\b/.test(n) && /(novo|proximo|lucia|jason|leonida|vice city|lancamento)/.test(n)),
    run: (n) => answer(n)
  };
  const gtaGeneral = {
    name: 'gta-geral',
    test: (n) => /\bgta\b|grand theft auto/.test(n) && !/\bgta\s*(6|vi|seis)\b/.test(n),
    run: (n) => {
      if (/\b(5|v|cinco)\b/.test(n)) return p('🎮 <b>GTA 5</b> saiu em 2013 e se passa em Los Santos (inspirada em Los Angeles). Tem três protagonistas: Michael, Franklin e Trevor. Vendeu mais de 200 milhões de cópias e o GTA Online segue ativo.') + p('Quer saber do próximo? Pergunte "o que você sabe do GTA 6".');
      return p('🎮 A série <b>Grand Theft Auto</b> é da Rockstar Games. Principais jogos:') + list(['GTA (1997) e GTA 2 (1999)', 'GTA III (2001)', 'GTA: Vice City (2002)', 'GTA: San Andreas (2004)', 'GTA IV (2008)', 'GTA V (2013)', '<b>GTA VI</b>: anunciado para PS5 e Xbox Series X|S']) + p('Pergunte "quando sai o GTA 6" ou "personagens do GTA 6".');
    }
  };

  // GTA vem primeiro: são perguntas bem específicas
  V.SKILLS.unshift(skill, gtaGeneral);
  V.EXAMPLES.push('o que você sabe do GTA 6', 'quando sai o GTA 6', 'personagens do GTA 6');
  V.GTA6 = GTA6;
})();
