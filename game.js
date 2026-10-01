'use strict';

/* =====================================================================
   SERTÂNIA: DESAFIO DE GESTÃO
   GAME.JS — núcleo da simulação

   Integra:
   - calendário
   - indicadores
   - popularidade
   - Economia 2.0
   - Câmara
   - Projetos
   - Eventos
   - Notícias
   - Save
   - Relatório final

   IMPORTANTE:
   A Economia 2.0 é controlada pelo economy.js.
   Este arquivo NÃO calcula novamente receitas/despesas.
   ===================================================================== */


/* =====================================================================
   CONFIGURAÇÕES BÁSICAS
   ===================================================================== */

const IND = [
  ['s', 'Saúde', '🏥'],
  ['e', 'Educação', '📚'],
  ['i', 'Infraestrutura', '🚧'],
  ['a', 'Abastecimento', '💧'],
  ['m', 'Meio ambiente', '🌱'],
  ['c', 'Economia', '💼'],
  ['r', 'Zona rural', '🌾'],
  ['t', 'Transparência', '🏛️'],
  ['p', 'Aprovação popular', '😊']
];

const K = IND.map(x => x[0]);
const LBL = Object.fromEntries(IND.map(x => [x[0], x[1]]));

const MES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const DIFF = {
  normal: {
    n: 'Normal',
    b: 20000,
    neg: 1,
    rev: 1,
    imp: .30,
    d: 'Eventos equilibrados.'
  },

  desafio: {
    n: 'Desafio',
    b: 15000,
    neg: 1.4,
    rev: .9,
    imp: .40,
    d: 'Mais eventos negativos e menos orçamento.'
  },

  caos: {
    n: 'Caos',
    b: 9000,
    neg: 1.9,
    rev: .8,
    imp: .60,
    d: 'Eventos frequentes, crises e orçamento extremamente limitado.'
  }
};


/* =====================================================================
   ESTADO GLOBAL
   ===================================================================== */

let S = null;


/* =====================================================================
   UTILITÁRIOS
   ===================================================================== */

const $ = s => document.querySelector(s);

const fmt = v =>
  'R$ ' +
  Math.round(Number(v) || 0).toLocaleString('pt-BR');

const clamp = v =>
  Math.max(0, Math.min(100, Number(v) || 0));

const rnd = (a, b) =>
  a + Math.random() * (b - a);

const fx = s => {
  const o = {};

  (s || '').split(' ').forEach(t => {
    if (!t) return;

    const key = t[0];
    const value = parseFloat(t.slice(1));

    if (!Number.isNaN(value)) {
      o[key] = (o[key] || 0) + value;
    }
  });

  return o;
};

const safe = fn => {
  try {
    return typeof fn === 'function' ? fn() : undefined;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};


/* =====================================================================
   ECONOMIA 2.0
   ===================================================================== */

/*
   Garante que saves antigos tenham a estrutura econômica.

   O economy.js continua sendo o responsável pela criação/normalização.
*/
function ensureGameEconomy() {
  if (typeof ensureEconomy === 'function') {
    try {
      ensureEconomy();
      return;
    } catch (e) {
      console.warn('Falha ao inicializar Economia 2.0:', e);
    }
  }

  if (!S.economy) {
    S.economy = {};
  }

  const E = S.economy;

  const revenues = [
    'taxes',
    'transfers',
    'agreements',
    'amendments',
    'extraordinary'
  ];

  const expenses = [
    'payroll',
    'maintenance',
    'services',
    'administrative',
    'projects',
    'emergency'
  ];

  revenues.concat(expenses).forEach(k => {
    if (typeof E[k] !== 'number') E[k] = 0;
  });

  [
    'monthlyRevenue',
    'monthlyExpenses',
    'monthlyResult',
    'reserve',
    'deficitMonths'
  ].forEach(k => {
    if (typeof E[k] !== 'number') E[k] = 0;
  });

  [
    'history',
    'log',
    'notices',
    'agreementsAvailable',
    'agreementsPending',
    'agreementsApproved',
    'agreementsRejected',
    'amendmentsAvailable',
    'programsAvailable'
  ].forEach(k => {
    if (!Array.isArray(E[k])) E[k] = [];
  });

  if (!E._month) {
    E._month = {};
    revenues.concat(expenses).forEach(k => E._month[k] = 0);
  }

  if (typeof E.taxModifier !== 'number') {
    E.taxModifier = 1;
  }

  if (!E.expenseAdjust) {
    E.expenseAdjust = {};
  }

  if (E._lastBalance === undefined) {
    E._lastBalance = null;
  }
}


/* =====================================================================
   STATUS FINANCEIRO
   ===================================================================== */

function financialStatus() {
  ensureGameEconomy();

  const E = S.economy;
  const cash = Number(S.b) || 0;
  const deficit = Number(E.deficitMonths) || 0;
  const result = Number(E.monthlyResult) || 0;

  if (cash <= 2500 || deficit >= 4) {
    return 'crítico';
  }

  if (
    cash <= 5000 ||
    deficit >= 2 ||
    result < 0
  ) {
    return 'deficitário';
  }

  if (
    cash <= 8000 ||
    deficit >= 1
  ) {
    return 'atenção';
  }

  return 'saudável';
}


/* =====================================================================
   INFORMAÇÕES FINANCEIRAS
   ===================================================================== */

function getFinancialSnapshot() {
  ensureGameEconomy();

  const E = S.economy;

  return {
    cash: Number(S.b) || 0,
    revenue: Number(E.monthlyRevenue) || 0,
    expenses: Number(E.monthlyExpenses) || 0,
    result: Number(E.monthlyResult) || 0,
    reserve: Number(E.reserve) || 0,
    deficitMonths: Number(E.deficitMonths) || 0,
    status: financialStatus()
  };
}


/* =====================================================================
   CONSEQUÊNCIAS FINANCEIRAS
   ===================================================================== */

function applyFinancialConsequences() {
  ensureGameEconomy();

  const E = S.economy;
  const cash = Number(S.b) || 0;
  const deficit = Number(E.deficitMonths) || 0;

  /*
     Caixa saudável:
     nenhuma penalidade.
  */

  /*
     Caixa em atenção:
     pequena pressão.
  */
  if (cash <= 8000 && cash > 5000) {
    S.ind.p = clamp(
      S.ind.p - rnd(.05, .15)
    );
  }

  /*
     Caixa baixo.
  */
  if (cash <= 5000 && cash > 2500) {
    S.ind.p = clamp(
      S.ind.p - rnd(.15, .35)
    );
  }

  /*
     Caixa crítico.
  */
  if (cash <= 2500) {
    S.ind.p = clamp(
      S.ind.p - rnd(.25, .60)
    );
  }

  /*
     Déficit de 2 meses.
  */
  if (deficit >= 2) {
    S.ind.p = clamp(
      S.ind.p - rnd(.10, .25)
    );
  }

  /*
     Déficit prolongado.
  */
  if (deficit >= 3) {
    S.ind.p = clamp(
      S.ind.p - rnd(.15, .35)
    );
  }

  /*
     Déficit muito prolongado.
  */
  if (deficit >= 4) {
    S.ind.p = clamp(
      S.ind.p - rnd(.20, .45)
    );
  }
}


/* =====================================================================
   PRESSÃO SOBRE A CÂMARA
   ===================================================================== */

function applyFinancialCouncilPressure() {
  if (!Array.isArray(S.council)) return;

  ensureGameEconomy();

  const E = S.economy;
  const cash = Number(S.b) || 0;
  const deficit = Number(E.deficitMonths) || 0;

  let pressure = 0;

  if (cash <= 8000) {
    pressure += .05;
  }

  if (cash <= 5000) {
    pressure += .08;
  }

  if (cash <= 2500) {
    pressure += .12;
  }

  if (deficit >= 2) {
    pressure += .06;
  }

  if (deficit >= 3) {
    pressure += .08;
  }

  if (deficit >= 4) {
    pressure += .10;
  }

  if (pressure <= 0) return;

  /*
     Não derruba todos os vereadores.

     Apenas alguns vereadores recebem uma pequena deterioração,
     mantendo a Câmara dinâmica.
  */
  S.council.forEach(v => {
    if (!v) return;

    if (typeof v.rel !== 'number') {
      v.rel = 50;
    }

    if (typeof v.sup !== 'number') {
      v.sup = 0;
    }

    const chance = Math.min(.65, pressure);

    if (Math.random() < chance) {
      v.rel = clamp(
        v.rel - rnd(.15, .55)
      );
    }

    /*
       Sup também sofre uma pressão muito pequena.
    */
    if (Math.random() < chance * .5) {
      v.sup = Math.max(
        0,
        v.sup - rnd(.1, .35)
      );
    }
  });
}


/* =====================================================================
   RECUPERAÇÃO FINANCEIRA
   ===================================================================== */

function applyFinancialRecovery() {
  ensureGameEconomy();

  const E = S.economy;

  /*
     Quando o mês fecha positivo, a pressão sobre a população
     pode diminuir levemente.

     Não aumenta popularidade de forma exagerada.
  */
  if (
    Number(E.monthlyResult) > 0 &&
    Number(E.deficitMonths) === 0 &&
    Number(S.b) > 8000
  ) {
    S.ind.p = clamp(
      S.ind.p + rnd(.03, .10)
    );
  }
}


/* =====================================================================
   NOTÍCIAS FINANCEIRAS
   ===================================================================== */

function financialNews() {
  ensureGameEconomy();

  const E = S.economy;

  /*
     Não gerar notícia todo mês.
  */
  if (Math.random() > .18) return;

  const result = Number(E.monthlyResult) || 0;
  const deficit = Number(E.deficitMonths) || 0;
  const cash = Number(S.b) || 0;

  if (typeof publishNews !== 'function') return;

  if (deficit >= 2) {
    publishNews(
      'Economia',
      'Prefeitura enfrenta pressão nas contas',
      `O município registra ${deficit} mês(es) consecutivo(s) de resultado negativo.`
    );

    return;
  }

  if (result > 0 && cash > 8000) {
    publishNews(
      'Economia',
      'Município encerra período com resultado positivo',
      'As contas municipais apresentam resultado favorável no período.'
    );

    return;
  }

  if (cash <= 2500) {
    publishNews(
      'Economia',
      'Caixa municipal entra em nível de atenção',
      'A administração acompanha de perto a situação financeira do município.'
    );
  }
}


/* =====================================================================
   APLICAÇÃO DE IMPACTOS
   ===================================================================== */

function apply(o) {
  if (!o || typeof o !== 'object') return;

  for (const k in o) {
    const value = Number(o[k]) || 0;

    /*
       $ continua sendo tratado pelo Economy 2.0.
    */
    if (k === '$') {
      if (typeof recordCashEffect === 'function') {
        recordCashEffect(
          value,
          'Efeito de evento'
        );
      } else {
        S.b += value;
      }

      continue;
    }

    if (S.ind && S.ind[k] !== undefined) {
      S.ind[k] = clamp(
        S.ind[k] + value
      );
    }
  }
}


/* =====================================================================
   NOVO JOGO
   ===================================================================== */

function newGame(diff) {
  const D = DIFF[diff] || DIFF.normal;

  const ind = {};

  K.forEach(k => {
    ind[k] = Math.round(
      rnd(38, 62)
    );
  });

  ind.t = Math.round(
    rnd(45, 65)
  );

  ind.p = Math.round(
    rnd(50, 62)
  );

  S = {
    diff: diff || 'normal',

    /*
       Caixa inicial.
       Continua sendo S.b.
    */
    b: D.b,

    ind,

    turn: 0,

    recent: [],
    pending: [],

    flags: {},

    catSpend: {},

    feed: [],

    yl: [],
    tl: [],

    snap: { ...ind },
    prev: { ...ind },

    rec: 0,
    exp: 0,
    spent: 0,
    gain: 0,
    dec: 0,

    evs: 0,
    crises: 0,
    zero: 0,

    minB: D.b,
    minT: 0,

    bal: 0,

    advisor: null,

    council:
      typeof createCouncil === 'function'
        ? createCouncil(0)
        : [],

    projects: [],
    news: [],
    votes: [],
    unl: [],
    blocked: {},

    plN: 0,

    /*
       Economia 2.0.
       O save.js/economy.js normalizam o restante.
    */
    economy: {}
  };

  ensureGameEconomy();

  save();

  startGame();
}


/* =====================================================================
   INICIALIZAÇÃO
   ===================================================================== */

function startGame() {
  if (!S) return;

  ensureGameEconomy();

  /*
     Inicialização segura de estruturas antigas.
  */

  if (!Array.isArray(S.recent)) S.recent = [];
  if (!Array.isArray(S.pending)) S.pending = [];
  if (!Array.isArray(S.feed)) S.feed = [];
  if (!Array.isArray(S.yl)) S.yl = [];
  if (!Array.isArray(S.tl)) S.tl = [];
  if (!Array.isArray(S.projects)) S.projects = [];
  if (!Array.isArray(S.news)) S.news = [];
  if (!Array.isArray(S.votes)) S.votes = [];
  if (!Array.isArray(S.unl)) S.unl = [];

  if (!S.flags) S.flags = {};
  if (!S.blocked) S.blocked = {};
  if (!S.catSpend) S.catSpend = {};

  if (!S.council) {
    S.council =
      typeof createCouncil === 'function'
        ? createCouncil(0)
        : [];
  }

  render();
}


/* =====================================================================
   CALENDÁRIO
   ===================================================================== */

function currentYear() {
  return Math.min(
    4,
    Math.floor(S.turn / 12) + 1
  );
}

function currentMonthIndex() {
  return S.turn % 12;
}

function currentMonth() {
  return MES[currentMonthIndex()];
}


/* =====================================================================
   ATUALIZAÇÃO NATURAL DOS INDICADORES
   ===================================================================== */

function applyNaturalDecay() {
  /*
     Mantém o desgaste natural já utilizado no jogo.
  */

  ['s', 'e', 'i', 'a', 'r'].forEach(k => {
    S.ind[k] = clamp(
      S.ind[k] - rnd(.3, 1)
    );
  });

  S.ind.m = clamp(
    S.ind.m - rnd(0, .5)
  );
}


/* =====================================================================
   POPULARIDADE
   ===================================================================== */

function updatePopularity() {
  const core =
    (
      S.ind.s +
      S.ind.e +
      S.ind.i +
      S.ind.a
    ) / 4;

  let delta =
    (core - 50) / 40 +
    (S.ind.t - 50) / 80;

  /*
     Caixa muito baixo gera pressão adicional,
     mas pequena.
  */
  if (S.b < 1500) {
    delta -= 1.5;
  }

  /*
     Economia 2.0.
  */
  const E = S.economy || {};

  if (Number(E.deficitMonths) >= 3) {
    delta -= .15;
  }

  if (Number(E.deficitMonths) >= 4) {
    delta -= .20;
  }

  if (S.b <= 2500) {
    delta -= .20;
  }

  S.ind.p = clamp(
    S.ind.p +
    delta +
    rnd(-.6, .6)
  );
}


/* =====================================================================
   PROJETOS
   ===================================================================== */

function updateProjectsSafe() {
  /*
     projects.js continua sendo o dono da lógica de projetos.

     O game.js apenas chama a função existente.
  */

  if (typeof updateProjects === 'function') {
    try {
      updateProjects();
    } catch (e) {
      console.error(
        'Erro ao atualizar projetos:',
        e
      );
    }
  }
}


/* =====================================================================
   CÂMARA
   ===================================================================== */

function updateCouncilSafe() {
  if (!Array.isArray(S.council)) return;

  S.council.forEach(v => {
    if (!v) return;

    if (typeof v.sup !== 'number') {
      v.sup = 0;
    }

    if (typeof v.rel !== 'number') {
      v.rel = 50;
    }

    /*
       Apoio naturalmente perde força ao longo do tempo.
    */
    v.sup *= .8;

    /*
       Relação institucional continua ligada à popularidade.
    */
    v.rel = clamp(
      v.rel +
      (S.ind.p - 50) / 300 +
      rnd(-.4, .4)
    );
  });

  /*
     Camada financeira.
  */
  applyFinancialCouncilPressure();
}


/* =====================================================================
   IMPACTOS POSITIVOS DA ECONOMIA
   ===================================================================== */

function applyEconomicDevelopment() {
  ensureGameEconomy();

  /*
     Investimentos em economia podem, ao longo do tempo,
     melhorar discretamente a arrecadação.

     Não modifica diretamente o caixa.
     Apenas aproveita o sistema de taxModifier do economy.js
     quando ele existir.
  */

  if (
    S.ind.c >= 70 &&
    S.ind.t >= 55 &&
    typeof setTaxModifier === 'function'
  ) {
    try {
      const E = S.economy;

      /*
         Pequena melhoria estrutural.
         Nunca cresce indefinidamente.
      */
      const target = Math.min(
        1.10,
        1 + ((S.ind.c - 60) / 1000)
      );

      if (
        typeof E.taxModifier !== 'number' ||
        E.taxModifier < target
      ) {
        setTaxModifier(target);
      }
    } catch (e) {
      console.warn(
        'Não foi possível atualizar o ambiente econômico:',
        e
      );
    }
  }
}


/* =====================================================================
   EVENTOS
   ===================================================================== */

function runEvent() {
  /*
     Preserva o sistema existente.

     Não recriamos pick(), showEvent() ou choose().
  */

  if (
    typeof pick === 'function' &&
    typeof showEvent === 'function'
  ) {
    try {
      const event = pick();

      if (event) {
        showEvent(event);
      }
    } catch (e) {
      console.error(
        'Erro ao executar evento:',
        e
      );
    }
  }
}


/* =====================================================================
   PRESSÃO ECONÔMICA SOBRE EVENTOS
   ===================================================================== */

function financialEventPressure() {
  ensureGameEconomy();

  const E = S.economy;

  const deficit =
    Number(E.deficitMonths) || 0;

  const cash =
    Number(S.b) || 0;

  let pressure = 0;

  if (cash <= 5000) {
    pressure += .05;
  }

  if (cash <= 2500) {
    pressure += .08;
  }

  if (deficit >= 3) {
    pressure += .08;
  }

  if (deficit >= 4) {
    pressure += .10;
  }

  return Math.min(
    .35,
    pressure
  );
}


/* =====================================================================
   FECHAMENTO FINANCEIRO
   ===================================================================== */

function closeFinancialMonth() {
  ensureGameEconomy();

  if (typeof closeMonth !== 'function') {
    console.warn(
      'economy.js não disponibilizou closeMonth().'
    );

    return null;
  }

  try {
    /*
       ESTE É O ÚNICO fechamento financeiro.

       Não fazemos:
       S.b += revenue() - expenses()
    */
    return closeMonth();

  } catch (e) {
    console.error(
      'Erro no fechamento financeiro:',
      e
    );

    return null;
  }
}


/* =====================================================================
   PRÉVIA FINANCEIRA
   ===================================================================== */

function financialSummaryText() {
  const F = getFinancialSnapshot();

  if (F.result > 0) {
    return `Resultado positivo de ${fmt(F.result)}.`;
  }

  if (F.result < 0) {
    return `Resultado negativo de ${fmt(Math.abs(F.result))}.`;
  }

  return 'Resultado financeiro equilibrado.';
}


/* =====================================================================
   PRÓXIMO TURNO
   ===================================================================== */

function nextTurn() {
  if (!S) return;

  /*
     Fim do mandato.
  */
  if (S.turn >= 48) {
    endGame();
    return;
  }

  ensureGameEconomy();

  /*
     ================================================================
     1. FECHAMENTO FINANCEIRO
     ================================================================

     O economy.js faz:
     - receitas
     - despesas
     - resultado
     - déficit
     - histórico
     - caixa

     NÃO fazer contas financeiras aqui.
  */
  const monthResult =
    closeFinancialMonth();

  /*
     Guarda informações para relatórios antigos.
  */
  if (monthResult) {
    S.bal =
      Number(monthResult.result) || 0;
  }

  /*
     ================================================================
     2. DESGASTE NATURAL
     ================================================================
  */
  applyNaturalDecay();

  /*
     ================================================================
     3. POPULARIDADE
     ================================================================
  */
  updatePopularity();

  /*
     ================================================================
     4. PROJETOS
     ================================================================
  */
  updateProjectsSafe();

  /*
     ================================================================
     5. CÂMARA
     ================================================================
  */
  updateCouncilSafe();

  /*
     ================================================================
     6. IMPACTOS FINANCEIROS
     ================================================================
  */

  applyFinancialConsequences();
  applyFinancialRecovery();
  applyEconomicDevelopment();

  /*
     ================================================================
     7. IMPACTOS ALEATÓRIOS EXISTENTES
     ================================================================
  */

  const D =
    DIFF[S.diff] ||
    DIFF.normal;

  if (
    Math.random() < D.imp
  ) {
    /*
       Mantém a tabela IMP já existente,
       caso ela esteja declarada no projeto.
    */
    if (
      typeof IMP !== 'undefined' &&
      Array.isArray(IMP) &&
      IMP.length
    ) {
      const m =
        IMP[
          Math.floor(
            Math.random() * IMP.length
          )
        ];

      if (m) {
        apply(
          typeof m[1] === 'string'
            ? fx(m[1])
            : m[1]
        );

        if (
          typeof feed === 'function' &&
          m[0]
        ) {
          feed(m[0]);
        }

        if (
          typeof toast === 'function' &&
          m[0]
        ) {
          toast(
            'y',
            'ATENÇÃO',
            m[0]
          );
        }
      }
    }
  }

  /*
     ================================================================
     8. NOTÍCIAS FINANCEIRAS EVENTUAIS
     ================================================================
  */

  financialNews();

  /*
     ================================================================
     9. CONTROLE DE CAIXA MÍNIMO
     ================================================================
  */

  if (
    S.b < S.minB
  ) {
    S.minB = S.b;
    S.minT = S.turn;
  }

  /*
     ================================================================
     10. ESTATÍSTICAS
     ================================================================
  */

  if (
    monthResult &&
    Number(monthResult.result) < 0
  ) {
    S.dec++;
  }

  /*
     ================================================================
     11. AVANÇA O CALENDÁRIO
     ================================================================
  */

  S.turn++;

  /*
     ================================================================
     12. SNAPSHOTS
     ================================================================
  */

  S.prev = {
    ...S.ind
  };

  /*
     ================================================================
     13. SAVE
     ================================================================
  */

  save();

  /*
     ================================================================
     14. INTERFACE
     ================================================================
  */

  render();

  /*
     ================================================================
     15. EVENTO
     ================================================================
  */

  runEvent();

  /*
     Save novamente porque o evento pode alterar o estado.
  */
  save();

  render();
}


/* =====================================================================
   RENDER
   ===================================================================== */

function render() {
  if (!S) return;

  ensureGameEconomy();

  const E = S.economy;

  /*
     ---------------------------------------------------------------
     CAIXA
     ---------------------------------------------------------------
  */

  const budget = $('#budget');

  if (budget) {
    budget.textContent =
      fmt(S.b);
  }

  /*
     ---------------------------------------------------------------
     RECEITA
     ---------------------------------------------------------------
  */

  const fRec = $('#fRec');

  if (fRec) {
    fRec.textContent =
      fmt(E.monthlyRevenue || 0);
  }

  /*
     ---------------------------------------------------------------
     GASTOS
     ---------------------------------------------------------------
  */

  const fGas = $('#fGas');

  if (fGas) {
    fGas.textContent =
      fmt(E.monthlyExpenses || 0);
  }

  /*
     ---------------------------------------------------------------
     DESPESAS / PROJEÇÃO
     ---------------------------------------------------------------
  */

  const fDes = $('#fDes');

  if (fDes) {
    let value = 0;

    if (
      typeof expenses === 'function'
    ) {
      try {
        value = expenses();
      } catch (e) {
        value =
          E.monthlyExpenses || 0;
      }
    } else {
      value =
        E.monthlyExpenses || 0;
    }

    fDes.textContent =
      fmt(value);
  }

  /*
     ---------------------------------------------------------------
     RECEITA / PROJEÇÃO
     ---------------------------------------------------------------
  */

  const fRev = $('#fRev');

  if (fRev) {
    let value = 0;

    if (
      typeof revenue === 'function'
    ) {
      try {
        value = revenue();
      } catch (e) {
        value =
          E.monthlyRevenue || 0;
      }
    } else {
      value =
        E.monthlyRevenue || 0;
    }

    fRev.textContent =
      fmt(value);
  }

  /*
     ---------------------------------------------------------------
     CALENDÁRIO
     ---------------------------------------------------------------
  */

  const yearEl =
    $('#year');

  if (yearEl) {
    yearEl.textContent =
      currentYear();
  }

  const monthEl =
    $('#month');

  if (monthEl) {
    monthEl.textContent =
      currentMonth();
  }

  /*
     ---------------------------------------------------------------
     INDICADORES
     ---------------------------------------------------------------
  */

  K.forEach(k => {
    const value =
      Math.round(
        Number(S.ind[k]) || 0
      );

    const selectors = [
      '#ind-' + k,
      '#' + k,
      '[data-ind="' + k + '"]'
    ];

    let el = null;

    for (const selector of selectors) {
      try {
        el = $(selector);
        if (el) break;
      } catch (e) {}
    }

    if (el) {
      if (
        'value' in el
      ) {
        el.value = value;
      }

      el.textContent =
        value;
    }
  });

  /*
     ---------------------------------------------------------------
     STATUS FINANCEIRO
     ---------------------------------------------------------------
  */

  const status =
    financialStatus();

  const financialEls = [
    $('#financialStatus'),
    $('#economyStatus'),
    $('[data-financial-status]')
  ];

  financialEls.forEach(el => {
    if (!el) return;

    el.textContent =
      status;

    el.dataset.status =
      status;
  });

  /*
     ---------------------------------------------------------------
     DÉFICIT
     ---------------------------------------------------------------
  */

  const deficitEls = [
    $('#deficitMonths'),
    $('#economyDeficit'),
    $('[data-deficit]')
  ];

  deficitEls.forEach(el => {
    if (!el) return;

    el.textContent =
      E.deficitMonths || 0;
  });

  /*
     ---------------------------------------------------------------
     RESULTADO
     ---------------------------------------------------------------
  */

  const resultEls = [
    $('#monthlyResult'),
    $('#economyResult'),
    $('[data-monthly-result]')
  ];

  resultEls.forEach(el => {
    if (!el) return;

    el.textContent =
      fmt(E.monthlyResult || 0);
  });

  /*
     ---------------------------------------------------------------
     RESERVA
     ---------------------------------------------------------------
  */

  const reserveEls = [
    $('#reserve'),
    $('#economyReserve'),
    $('[data-reserve]')
  ];

  reserveEls.forEach(el => {
    if (!el) return;

    el.textContent =
      fmt(E.reserve || 0);
  });

  /*
     ---------------------------------------------------------------
     TURNO
     ---------------------------------------------------------------
  */

  const turnEls = [
    $('#turn'),
    $('#turnNumber'),
    $('[data-turn]')
  ];

  turnEls.forEach(el => {
    if (!el) return;

    el.textContent =
      S.turn;
  });

  /*
     ---------------------------------------------------------------
     RENDER EXTERNO
     ---------------------------------------------------------------

     Caso existam funções de outros módulos responsáveis por
     partes específicas da interface, elas continuam independentes.
  */

  safe(() => {
    if (
      typeof renderCouncil === 'function'
    ) {
      renderCouncil();
    }
  });

  safe(() => {
    if (
      typeof renderProjects === 'function'
    ) {
      renderProjects();
    }
  });

  safe(() => {
    if (
      typeof renderNews === 'function'
    ) {
      renderNews();
    }
  });
}


/* =====================================================================
   RELATÓRIO FINANCEIRO
   ===================================================================== */

function getFinancialReportData() {
  ensureGameEconomy();

  const E = S.economy;

  let totalRevenue = 0;
  let totalExpenses = 0;

  /*
     O histórico da Economia 2.0 é a fonte principal.
  */
  if (
    Array.isArray(E.history)
  ) {
    E.history.forEach(h => {
      totalRevenue +=
        Number(h.totalRevenue) || 0;

      totalExpenses +=
        Number(h.totalExpenses) || 0;
    });
  }

  /*
     Fallback para saves antigos.
  */
  if (
    totalRevenue === 0 &&
    typeof S.rec === 'number'
  ) {
    totalRevenue =
      S.rec;
  }

  if (
    totalExpenses === 0 &&
    typeof S.exp === 'number'
  ) {
    totalExpenses =
      S.exp;
  }

  const agreementsReceived =
    E.log
      .filter(
        x =>
          x.kind === 'in' &&
          x.cat === 'agreements'
      )
      .reduce(
        (sum, x) =>
          sum + (Number(x.value) || 0),
        0
      );

  const amendmentsUsed =
    E.log
      .filter(
        x =>
          x.kind === 'in' &&
          x.cat === 'amendments'
      )
      .reduce(
        (sum, x) =>
          sum + (Number(x.value) || 0),
        0
      );

  return {
    totalRevenue,
    totalExpenses,

    result:
      totalRevenue -
      totalExpenses,

    deficitMonths:
      Number(E.deficitMonths) || 0,

    minCash:
      Number(S.minB) || 0,

    reserve:
      Number(E.reserve) || 0,

    agreementsReceived,

    amendmentsUsed,

    finalStatus:
      financialStatus(),

    finalCash:
      Number(S.b) || 0
  };
}


/* =====================================================================
   RELATÓRIO GERAL
   ===================================================================== */

function report() {
  if (!S) return '';

  ensureGameEconomy();

  const F =
    getFinancialReportData();

  /*
     Indicadores.
  */

  const sorted =
    K
      .map(k => ({
        key: k,
        value:
          Number(S.ind[k]) || 0
      }))
      .sort(
        (a, b) =>
          b.value -
          a.value
      );

  const best =
    sorted[0];

  const worst =
    sorted[sorted.length - 1];

  /*
     Investimentos.
  */

  const investment =
    Number(S.gain) || 0;

  /*
     Texto financeiro.
  */

  const financeText =
    `Receitas acumuladas: ${fmt(F.totalRevenue)}. ` +
    `Despesas acumuladas: ${fmt(F.totalExpenses)}. ` +
    `Resultado financeiro: ${fmt(F.result)}. ` +
    `Menor caixa registrado: ${fmt(F.minCash)}. ` +
    `Reserva final: ${fmt(F.reserve)}. ` +
    `Meses em déficit: ${F.deficitMonths}. ` +
    `Convênios recebidos: ${fmt(F.agreementsReceived)}. ` +
    `Emendas utilizadas: ${fmt(F.amendmentsUsed)}. ` +
    `Situação financeira final: ${F.finalStatus}.`;

  /*
     Mantém o relatório em formato de texto simples,
     para continuar compatível com o HTML existente.
  */

  return `
    <div class="report">

      <h2>Relatório de Gestão</h2>

      <p>
        <strong>Mandato encerrado.</strong>
      </p>

      <h3>Desempenho da gestão</h3>

      <p>
        Melhor indicador:
        <strong>
          ${LBL[best.key]}
        </strong>
        (${Math.round(best.value)}/100).
      </p>

      <p>
        Indicador que mais precisa de atenção:
        <strong>
          ${LBL[worst.key]}
        </strong>
        (${Math.round(worst.value)}/100).
      </p>

      <h3>Finanças municipais</h3>

      <p>
        ${financeText}
      </p>

      <p>
        Caixa final:
        <strong>
          ${fmt(F.finalCash)}
        </strong>
      </p>

      <h3>Gestão financeira</h3>

      <p>
        Investimentos e recursos movimentados:
        <strong>
          ${fmt(investment)}
        </strong>
      </p>

      <p>
        A gestão encerrou o mandato com
        situação financeira classificada como
        <strong>
          ${F.finalStatus}
        </strong>.
      </p>

      <h3>Resumo</h3>

      <p>
        Popularidade final:
        <strong>
          ${Math.round(S.ind.p)}/100
        </strong>.
      </p>

      <p>
        Transparência:
        <strong>
          ${Math.round(S.ind.t)}/100
        </strong>.
      </p>

      <p>
        Crises registradas:
        <strong>
          ${S.crises || 0}
        </strong>.
      </p>

      <p>
        Eventos enfrentados:
        <strong>
          ${S.evs || 0}
        </strong>.
      </p>

    </div>
  `;
}


/* =====================================================================
   FIM DO MANDATO
   ===================================================================== */

function endGame() {
  if (!S) return;

  ensureGameEconomy();

  /*
     Evita processamento duplicado.
  */
  if (S.done) return;

  S.done = true;

  /*
     Última atualização do estado.
  */
  const F =
    getFinancialReportData();

  S.finalFinance = {
    revenue:
      F.totalRevenue,

    expenses:
      F.totalExpenses,

    result:
      F.result,

    deficitMonths:
      F.deficitMonths,

    minCash:
      F.minCash,

    reserve:
      F.reserve,

    agreementsReceived:
      F.agreementsReceived,

    amendmentsUsed:
      F.amendmentsUsed,

    finalCash:
      F.finalCash,

    status:
      F.finalStatus
  };

  /*
     Preserva relatório antigo.
  */
  const html =
    report();

  /*
     Procura elementos comuns de relatório.
  */

  const targets = [
    $('#report'),
    $('#finalReport'),
    $('#reportContent'),
    $('#endReport')
  ];

  const target =
    targets.find(Boolean);

  if (target) {
    target.innerHTML =
      html;
  }

  /*
     Modal existente, se houver.
  */
  const modal =
    $('#reportModal') ||
    $('#endModal') ||
    $('#modalReport');

  if (modal) {
    modal.classList.add('show');
    modal.classList.add('active');

    if (
      modal.style
    ) {
      modal.style.display =
        '';
    }
  }

  /*
     Notícia de encerramento.
  */
  if (
    typeof publishNews === 'function'
  ) {
    try {
      publishNews(
        'Prefeitura',
        'Mandato chega ao fim',
        'A administração municipal encerra seu ciclo de quatro anos e apresenta seu balanço de gestão.'
      );
    } catch (e) {}
  }

  save();

  render();
}


/* =====================================================================
   FUNÇÕES DE COMPATIBILIDADE
   ===================================================================== */

/*
   Essas funções permitem que partes antigas do jogo continuem
   chamando informações que pertenciam ao game.js.
*/

function getYear() {
  return currentYear();
}

function getMonth() {
  return currentMonth();
}

function getTurn() {
  return S ? S.turn : 0;
}


/* =====================================================================
   CARREGAMENTO AUTOMÁTICO
   ===================================================================== */

function loadGame() {
  if (typeof load !== 'function') {
    return false;
  }

  try {
    const saved =
      load();

    if (!saved) {
      return false;
    }

    S = saved;

    ensureGameEconomy();

    /*
       Recuperação defensiva de estruturas.
    */

    if (!S.ind) {
      const ind = {};

      K.forEach(k => {
        ind[k] = 50;
      });

      S.ind = ind;
    }

    if (!Array.isArray(S.projects)) {
      S.projects = [];
    }

    if (!Array.isArray(S.news)) {
      S.news = [];
    }

    if (!Array.isArray(S.votes)) {
      S.votes = [];
    }

    if (!Array.isArray(S.council)) {
      S.council =
        typeof createCouncil === 'function'
          ? createCouncil(0)
          : [];
    }

    render();

    return true;

  } catch (e) {
    console.error(
      'Erro ao carregar jogo:',
      e
    );

    return false;
  }
}


/* =====================================================================
   INICIALIZAÇÃO DO MÓDULO
   ===================================================================== */

(function initGame() {

  /*
     O game.js pode ser carregado antes dos demais módulos.
     Por isso não assumimos que S já existe imediatamente.
  */

  if (typeof window !== 'undefined') {

    window.addEventListener(
      'load',
      () => {

        /*
           Se algum sistema externo já criou S,
           apenas inicializamos a economia.
        */
        if (S) {
          ensureGameEconomy();
          render();
          return;
        }

        /*
           Tenta recuperar save.
        */
        if (
          typeof load === 'function'
        ) {
          const loaded =
            loadGame();

          if (loaded) {
            return;
          }
        }

      }
    );
  }

})();


/* =====================================================================
   EXPORTAÇÕES GLOBAIS
   ===================================================================== */

/*
   Mantém as funções acessíveis aos outros módulos e ao HTML,
   caso os botões existentes usem onclick.
*/

if (typeof window !== 'undefined') {

  window.S = S;

  window.newGame = newGame;
  window.startGame = startGame;
  window.nextTurn = nextTurn;
  window.render = render;
  window.report = report;
  window.endGame = endGame;

  window.financialStatus =
    financialStatus;

  window.getFinancialSnapshot =
    getFinancialSnapshot;

  window.getFinancialReportData =
    getFinancialReportData;

  window.loadGame =
    loadGame;

  window.currentYear =
    currentYear;

  window.currentMonth =
    currentMonth;

  window.apply =
    apply;
}
