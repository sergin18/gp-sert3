'use strict';

/* ================================================================
   SERTÂNIA: DESAFIO DE GESTÃO
   GAME.JS — estado central, calendário, interface e fim do mandato

   IMPORTANTE:
   - economy.js continua responsável pela Economia 2.0
   - events.js continua responsável pelos eventos
   - council.js continua responsável pela Câmara
   - projects.js continua responsável pelos projetos
   - news.js continua responsável pela Tribuna do Mocotó
   - save.js continua responsável pelo salvamento
   - main.js continua responsável pelos botões principais
================================================================ */


/* ================================================================
   ESTADO E CONSTANTES
================================================================ */

const IND = [
  ['s','Saúde','🏥'],
  ['e','Educação','📚'],
  ['i','Infraestrutura','🚧'],
  ['a','Abastecimento','💧'],
  ['m','Meio ambiente','🌱'],
  ['c','Economia','💼'],
  ['r','Zona rural','🌾'],
  ['t','Transparência','🏛️'],
  ['p','Aprovação popular','😊']
];

const K = IND.map(x => x[0]);

const LBL =
  Object.fromEntries(
    IND.map(x => [x[0], x[1]])
  );

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
    imp: .3,
    d: 'Eventos equilibrados.'
  },

  desafio: {
    n: 'Desafio',
    b: 15000,
    neg: 1.4,
    rev: .9,
    imp: .4,
    d: 'Mais eventos negativos e menos orçamento.'
  },

  caos: {
    n: 'Caos',
    b: 9000,
    neg: 1.9,
    rev: .8,
    imp: .6,
    d: 'Eventos frequentes, crises e orçamento extremamente limitado.'
  }
};

let S = null;

/*
 * SK é utilizado pelo sistema de eventos/votação.
 * Mantemos a variável global para compatibilidade.
 */
let SK = false;


/* ================================================================
   UTILITÁRIOS
================================================================ */

const $ = s =>
  document.querySelector(s);

const fmt = v =>
  'R$ ' +
  Math.round(
    (Number(v) || 0) * 1000
  ).toLocaleString('pt-BR');

const clamp = v =>
  Math.max(
    0,
    Math.min(
      100,
      Number(v) || 0
    )
  );

const rnd = (a, b) =>
  a + Math.random() * (b - a);

const fx = s => {
  const o = {};

  (s || '')
    .split(' ')
    .forEach(t => {

      if (t) {
        o[t[0]] =
          (o[t[0]] || 0) +
          parseFloat(t.slice(1));
      }

    });

  return o;
};


/* ================================================================
   ECONOMIA 2.0 — INTEGRAÇÃO
================================================================ */

/*
 * A economia NÃO é recriada aqui.
 * economy.js continua sendo a fonte principal.
 */

function ensureGameEconomy() {

  if (!S) return;

  if (
    typeof ensureEconomy === 'function'
  ) {
    ensureEconomy();
  }
}


/* ================================================================
   SITUAÇÃO FINANCEIRA
================================================================ */

function financialStatus() {

  ensureGameEconomy();

  if (
    !S ||
    !S.economy
  ) {
    return 'saudável';
  }

  const cash =
    Number(S.b) || 0;

  const deficit =
    Number(
      S.economy.deficitMonths
    ) || 0;

  const result =
    Number(
      S.economy.monthlyResult
    ) || 0;

  if (
    cash <= 2500 ||
    deficit >= 4
  ) {
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


/* ================================================================
   CONSEQUÊNCIAS FINANCEIRAS
================================================================ */

function applyFinancialConsequences() {

  ensureGameEconomy();

  if (
    !S ||
    !S.economy
  ) {
    return;
  }

  const cash =
    Number(S.b) || 0;

  const deficit =
    Number(
      S.economy.deficitMonths
    ) || 0;

  if (
    cash <= 8000 &&
    cash > 5000
  ) {
    S.ind.p =
      clamp(
        S.ind.p -
        rnd(.02, .06)
      );
  }

  if (
    cash <= 5000 &&
    cash > 2500
  ) {
    S.ind.p =
      clamp(
        S.ind.p -
        rnd(.04, .10)
      );
  }

  if (cash <= 2500) {
    S.ind.p =
      clamp(
        S.ind.p -
        rnd(.08, .16)
      );
  }

  if (deficit >= 2) {
    S.ind.p =
      clamp(
        S.ind.p -
        rnd(.02, .07)
      );
  }

  if (deficit >= 3) {
    S.ind.p =
      clamp(
        S.ind.p -
        rnd(.03, .09)
      );
  }

  if (deficit >= 4) {
    S.ind.p =
      clamp(
        S.ind.p -
        rnd(.04, .12)
      );
  }
}


/* ================================================================
   PRESSÃO FINANCEIRA SOBRE A CÂMARA
================================================================ */

function applyFinancialCouncilPressure() {

  if (
    !S ||
    !Array.isArray(S.council)
  ) {
    return;
  }

  ensureGameEconomy();

  const cash =
    Number(S.b) || 0;

  const deficit =
    Number(
      S.economy?.deficitMonths
    ) || 0;

  let pressure = 0;

  if (cash <= 8000)
    pressure += .08;

  if (cash <= 5000)
    pressure += .08;

  if (cash <= 2500)
    pressure += .10;

  if (deficit >= 2)
    pressure += .08;

  if (deficit >= 3)
    pressure += .08;

  if (deficit >= 4)
    pressure += .10;

  pressure =
    Math.min(.45, pressure);

  if (pressure <= 0)
    return;

  S.council.forEach(v => {

    if (!v) return;

    if (
      typeof v.rel !== 'number'
    ) {
      v.rel = 50;
    }

    if (
      typeof v.sup !== 'number'
    ) {
      v.sup = 0;
    }

    if (
      Math.random() < pressure
    ) {
      v.rel =
        clamp(
          v.rel -
          rnd(.15, .45)
        );
    }

    if (
      Math.random() <
      pressure * .35
    ) {
      v.sup =
        Math.max(
          0,
          v.sup -
          rnd(.05, .20)
        );
    }

  });
}


/* ================================================================
   NOTÍCIAS FINANCEIRAS
================================================================ */

function financialNews() {

  ensureGameEconomy();

  if (
    !S ||
    !S.economy ||
    typeof publishNews !== 'function'
  ) {
    return;
  }

  if (
    Math.random() > .14
  ) {
    return;
  }

  const result =
    Number(
      S.economy.monthlyResult
    ) || 0;

  const deficit =
    Number(
      S.economy.deficitMonths
    ) || 0;

  const cash =
    Number(S.b) || 0;

  if (deficit >= 3) {

    publishNews(
      'Economia',
      'Contas municipais entram no radar',
      `A prefeitura acumula ${deficit} mês(es) consecutivo(s) de resultado financeiro negativo.`
    );

    return;
  }

  if (
    result > 0 &&
    cash > 8000
  ) {

    publishNews(
      'Economia',
      'Município fecha período com resultado positivo',
      'As contas municipais registraram resultado positivo no período.'
    );

    return;
  }

  if (cash <= 2500) {

    publishNews(
      'Economia',
      'Caixa municipal exige atenção',
      'A administração acompanha de perto a situação financeira do município.'
    );
  }
}


/* ================================================================
   NOVO JOGO
================================================================ */

function newGame(diff) {

  const D =
    DIFF[diff];

  if (!D) {
    return;
  }

  const ind = {};

  K.forEach(k => {
    ind[k] =
      Math.round(
        rnd(38, 62)
      );
  });

  ind.t =
    Math.round(
      rnd(45, 65)
    );

  ind.p =
    Math.round(
      rnd(50, 62)
    );

  S = {

    diff,

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

    snap: {
      ...ind
    },

    prev: {
      ...ind
    },

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

    economy: {}
  };

  SK = false;

  ensureGameEconomy();

  save();

  startGame();
}


/* ================================================================
   CALENDÁRIO
================================================================ */

function nextTurn() {

  if (!S) return;

  if (
    S.turn >= 48
  ) {
    return endGame();
  }

  const D =
    DIFF[S.diff];

  /*
   * IMPORTANTE:
   *
   * Não colocar S.turn++ aqui.
   * closeMonth() é quem controla
   * o avanço financeiro/calendário.
   */

  ensureGameEconomy();

  closeMonth();

  applyFinancialConsequences();


  /* DESGASTE NATURAL */

  ['s','e','i','a','r']
    .forEach(k => {

      S.ind[k] =
        clamp(
          S.ind[k] -
          rnd(.3, 1)
        );

    });

  S.ind.m =
    clamp(
      S.ind.m -
      rnd(0, .5)
    );


  /* APROVAÇÃO */

  const core =
    (
      S.ind.s +
      S.ind.e +
      S.ind.i +
      S.ind.a
    ) / 4;

  S.ind.p =
    clamp(
      S.ind.p +
      (core - 50) / 40 +
      (S.ind.t - 50) / 80 -
      (S.b < 1500 ? 1.5 : 0) +
      rnd(-.6, .6)
    );


  /* EVENTO DE IMPACTO */

  if (
    Math.random() < D.imp &&
    Array.isArray(IMP) &&
    IMP.length
  ) {

    const m =
      IMP[
        Math.floor(
          Math.random() *
          IMP.length
        )
      ];

    apply(
      fx(m[1])
    );

    feed(m[0]);

    toast(
      'y',
      'ATENÇÃO',
      m[0]
    );
  }


  /* PROJETOS */

  if (
    typeof updateProjects === 'function'
  ) {
    updateProjects();
  }


  /* CÂMARA */

  if (
    Array.isArray(S.council)
  ) {

    S.council.forEach(v => {

      v.sup *= .8;

      v.rel =
        clamp(
          v.rel +
          (S.ind.p - 50) / 300 +
          rnd(-.4, .4)
        );

    });
  }


  /* PRESSÃO FINANCEIRA */

  applyFinancialCouncilPressure();


  /* NOTÍCIA POSITIVA */

  if (
    S.ind.p >= 70 &&
    Math.random() < .12 &&
    typeof publishNews === 'function'
  ) {

    publishNews(
      'Prefeitura',
      'Gestão comemora novos investimentos',
      'A avaliação da população segue em alta.'
    );
  }


  financialNews();


  /* MENOR CAIXA */

  if (
    S.b < S.minB
  ) {

    S.minB = S.b;
    S.minT = S.turn;
  }


  save();

  render();

  if (
    typeof pick === 'function' &&
    typeof showEvent === 'function'
  ) {
    showEvent(
      pick()
    );
  }
}


/* ================================================================
   DATA / ANO
================================================================ */

function year() {

  if (!S) {
    return 1;
  }

  return Math.min(
    4,
    Math.floor(
      S.turn / 12
    ) + 1
  );
}


/* ================================================================
   FEED
================================================================ */

function feed(t) {

  if (!S) return;

  S.feed.unshift({
    t,
    d:
      `Ano ${year()} — ${MES[S.turn % 12]}`
  });

  S.feed =
    S.feed.slice(0, 14);
}


/* ================================================================
   TOAST
================================================================ */

function toast(
  k,
  title,
  text
) {

  const container =
    $('#toasts');

  if (!container)
    return;

  const d =
    document.createElement('div');

  d.className =
    'toast ' + k;

  const ic = {
    b: '🔵',
    y: '🟡',
    r: '🔴',
    g: '🟢'
  }[k] || 'ℹ️';

  d.innerHTML =
    `<b>${ic} ${title}</b>${text}`;

  container.appendChild(d);

  setTimeout(
    () => d.remove(),
    5200
  );

  while (
    container.children.length > 3
  ) {
    container.firstChild.remove();
  }
}


/* ================================================================
   MODAIS
================================================================ */

function openModal(
  lock,
  cls
) {

  const overlay =
    $('#overlay');

  const modal =
    $('#modal');

  if (!overlay || !modal)
    return;

  overlay.hidden = false;

  overlay.dataset.lock =
    lock ? 1 : '';

  modal.className =
    'modal ' +
    (cls || '');
}


function closeModal() {

  const overlay =
    $('#overlay');

  if (overlay) {
    overlay.hidden = true;
  }

  if (S) {

    const next =
      $('#bNext');

    if (next) {
      next.disabled = false;
    }
  }
}


function info(html) {

  const modal =
    $('#modal');

  if (!modal)
    return;

  modal.innerHTML =
    html +
    '<p><button class="btn main" id="cl">Fechar</button></p>';

  openModal(false);

  const cl =
    $('#cl');

  if (cl) {
    cl.onclick =
      closeModal;
  }
}


function show(
  html,
  lock,
  cls
) {

  const modal =
    $('#modal');

  if (!modal)
    return;

  modal.innerHTML =
    html;

  openModal(
    lock,
    cls
  );
}


function hot(a) {

  document
    .querySelectorAll('.z')
    .forEach(z => {

      z.classList.toggle(
        'hot',
        z.id === 'a-' + a
      );

    });
}


/* ================================================================
   INDICADORES
================================================================ */

function buildInds() {

  const container =
    $('#inds');

  if (!container)
    return;

  container.innerHTML =
    IND
      .map(x =>
        `<div class="ind" id="i-${x[0]}">

          <div class="h">
            <span>
              ${x[2]} ${x[1]}
            </span>
          </div>

          <div class="v"></div>

          <div class="bar">
            <i></i>
          </div>

        </div>`
      )
      .join('');
}


/* ================================================================
   RENDER PRINCIPAL
================================================================ */

function render() {

  if (!S)
    return;

  const y =
    year();

  const date =
    $('#date');

  if (date) {

    date.textContent =
      S.turn >= 48
        ? 'Fim do mandato'
        : `Ano ${y} — ${MES[S.turn % 12]}`;
  }


  const budget =
    $('#budget');

  if (budget) {
    budget.textContent =
      fmt(S.b);
  }


  /* INDICADORES */

  IND.forEach(x => {

    const el =
      $('#i-' + x[0]);

    if (!el)
      return;

    const v =
      Math.round(
        Number(
          S.ind[x[0]]
        ) || 0
      );

    const value =
      el.querySelector('.v');

    const bar =
      el.querySelector('i');

    if (value) {

      value.textContent =
        x[0] === 'p'
          ? v + '%'
          : v;
    }

    if (bar) {

      bar.style.width =
        Math.max(
          0,
          Math.min(
            100,
            v
          )
        ) + '%';

      bar.className =
        v < 35
          ? 'low'
          : v < 60
            ? 'mid'
            : '';
    }

    const d =
      v -
      Math.round(
        Number(
          S.prev[x[0]]
        ) || 0
      );

    if (d) {

      const c =
        document.createElement('span');

      c.className =
        'chip ' +
        (d > 0 ? 'p' : 'n');

      c.textContent =
        (d > 0 ? '+' : '') +
        d;

      el.appendChild(c);

      setTimeout(
        () => c.remove(),
        2300
      );
    }

    S.prev[x[0]] =
      S.ind[x[0]];
  });


  /* CIDADE */

  zones();


  /* INDICADORES FINANCEIROS ANTIGOS */

  const fRec =
    $('#fRec');

  if (fRec) {
    fRec.textContent =
      fmt(S.rec);
  }

  const fGas =
    $('#fGas');

  if (fGas) {
    fGas.textContent =
      fmt(
        S.spent +
        S.exp
      );
  }

  const fDes =
    $('#fDes');

  if (fDes) {
    fDes.textContent =
      fmt(
        typeof expenses === 'function'
          ? expenses()
          : 0
      );
  }

  const fRev =
    $('#fRev');

  if (fRev) {
    fRev.textContent =
      fmt(
        typeof revenue === 'function'
          ? revenue()
          : 0
      );
  }


  /* ECONOMIA 2.0 */

  ensureGameEconomy();

  const E =
    S.economy || {};


  const statusEl =
    $('#financialStatus');

  if (statusEl) {
    statusEl.textContent =
      financialStatus();
  }


  const resultEl =
    $('#monthlyResult');

  if (resultEl) {
    resultEl.textContent =
      fmt(
        E.monthlyResult || 0
      );
  }


  const deficitEl =
    $('#deficitMonths');

  if (deficitEl) {
    deficitEl.textContent =
      E.deficitMonths || 0;
  }


  const reserveEl =
    $('#reserve');

  if (reserveEl) {
    reserveEl.textContent =
      fmt(
        E.reserve || 0
      );
  }


  /* NOTÍCIAS */

  const feedEl =
    $('#feed');

  if (feedEl) {

    feedEl.innerHTML =
      S.news.length

        ? S.news
            .slice(0, 5)
            .map(n =>
              `<li>
                ${NI[n.c] || '📰'} ${n.t}
                <small>
                  ${n.c} · ${MES[n.m]}, ano ${n.y}
                </small>
              </li>`
            )
            .join('')

        : '<li>Nenhuma notícia ainda. Avance para o primeiro mês.</li>';
  }


  /* GOVERNO */

  if (
    typeof renderGov === 'function'
  ) {
    renderGov();
  }


  /* BOTÃO PRÓXIMO */

  const next =
    $('#bNext');

  const overlay =
    $('#overlay');

  if (
    next &&
    overlay
  ) {

    next.disabled =
      !overlay.hidden;
  }
}


/* ================================================================
   TROCA DE TELA
================================================================ */

function screen(id) {

  [
    'home',
    'game',
    'end'
  ].forEach(s => {

    const el =
      $('#' + s);

    if (el) {
      el.hidden =
        s !== id;
    }
  });

  window.scrollTo(
    0,
    0
  );
}


/* ================================================================
   INÍCIO DO JOGO
================================================================ */

function startGame() {

  if (!S)
    return;

  ensureGameEconomy();

  screen('game');

  buildInds();

  S.prev =
    {
      ...S.ind
    };

  render();

  if (!S.advisor) {

    if (
      typeof chooseAdvisor === 'function'
    ) {
      chooseAdvisor();
    }

  } else if (S.bal) {

    if (
      typeof balance === 'function'
    ) {
      balance();
    }

  } else if (
    S.turn >= 48
  ) {

    endGame();
  }
}


/* ================================================================
   MENU PRINCIPAL
================================================================ */

function home() {

  screen('home');

  const h =
    typeof hasSave === 'function'
      ? hasSave()
      : false;

  const cont =
    $('#bContinue');

  const erase =
    $('#bErase');

  if (cont) {
    cont.hidden =
      !h;
  }

  if (erase) {
    erase.hidden =
      !h;
  }
}


/* ================================================================
   ESCOLHA DE DIFICULDADE
================================================================ */

function pickDiff(cb) {

  const modal =
    $('#modal');

  if (!modal)
    return;

  modal.innerHTML =
    '<h3>Escolha a dificuldade</h3>' +

    '<div class="diffs">' +

    Object.keys(DIFF)
      .map(k =>
        `<button class="opt" data-d="${k}">

          <span>
            ${DIFF[k].n}

            <small>
              ${DIFF[k].d}
            </small>
          </span>

          <b>
            ${fmt(DIFF[k].b)}
          </b>

        </button>`
      )
      .join('') +

    '</div>' +

    '<p>' +
      '<button class="btn small" id="cl">' +
        'Cancelar' +
      '</button>' +
    '</p>';

  openModal(false);

  const cl =
    $('#cl');

  if (cl) {
    cl.onclick =
      closeModal;
  }

  document
    .querySelectorAll('[data-d]')
    .forEach(b => {

      b.onclick = () => {

        closeModal();

        if (
          typeof cb === 'function'
        ) {
          cb(
            b.dataset.d
          );
        }
      };

    });
}


/* ================================================================
   SITUAÇÃO DO GOVERNO
================================================================ */

function renderGov() {

  if (
    !S ||
    !Array.isArray(S.council)
  ) {
    return;
  }

  const f =
    S.council.filter(
      v =>
        typeof tend === 'function' &&
        tend(v, null) === 'yes'
    ).length;

  const ex =
    S.projects.filter(
      p =>
        p.st === 'exec'
    ).length;

  const avg =
    S.council.length
      ? S.council.reduce(
          (a, v) =>
            a +
            (Number(v.rel) || 0),
          0
        ) /
        S.council.length
      : 0;

  const un =
    S.news.filter(
      n => n.n
    ).length;

  const gov =
    $('#gov');

  if (!gov)
    return;

  const relation =
    typeof relLbl === 'function'
      ? relLbl(avg).split(' ')[0]
      : 'Estável';

  gov.innerHTML =
    `<h3>Situação do governo</h3>

    <div class="gv">

      <div>
        <span>🏛️ Câmara</span>
        <b>${f}/13</b>
        <small>apoio</small>
      </div>

      <div>
        <span>📋 Projetos</span>
        <b>${ex}</b>
        <small>em execução</small>
      </div>

      <div>
        <span>🤝 Relação institucional</span>
        <b>${relation}</b>
      </div>

      <div>
        <span>📰 Notícias</span>
        <b>${un}</b>
        <small>novas</small>
      </div>

    </div>`;
}


/* ================================================================
   BALANÇO ANUAL
================================================================ */

function balance() {

  if (!S)
    return;

  const y =
    S.turn / 12;

  const L =
    S.yl.filter(
      x =>
        x.y === y
    );

  const top =
    L
      .slice()
      .sort(
        (a, b) =>
          b.c - a.c
      )
      .slice(0, 3)
      .filter(
        x => x.c > 0
      );

  const probs =
    L
      .filter(
        x => x.g >= 2
      )
      .map(
        x => x.t
      )
      .slice(0, 4);

  const ups =
    K
      .filter(
        k =>
          S.ind[k] -
          S.snap[k] >= 3
      )
      .map(
        k =>
          `${LBL[k]} (+${Math.round(
            S.ind[k] -
            S.snap[k]
          )})`
      );

  const pend =
    K
      .filter(
        k =>
          k !== 'p' &&
          S.ind[k] < 40
      )
      .map(
        k =>
          `${LBL[k]} (${Math.round(
            S.ind[k]
          )})`
      );

  const ul =
    a =>
      a.length

        ? '<ul>' +
          a
            .map(
              t =>
                `<li>${t}</li>`
            )
            .join('') +
          '</ul>'

        : '<p>Nada a destacar.</p>';


  ensureGameEconomy();

  const E =
    S.economy || {};


  const finance =
    `<h4>Situação financeira</h4>

    <div class="stats">

      <div class="stat">
        <b>${fmt(
          E.monthlyRevenue || 0
        )}</b>
        <span>Receita do último mês</span>
      </div>

      <div class="stat">
        <b>${fmt(
          E.monthlyExpenses || 0
        )}</b>
        <span>Despesa do último mês</span>
      </div>

      <div class="stat">
        <b>${fmt(
          E.monthlyResult || 0
        )}</b>
        <span>Resultado financeiro</span>
      </div>

      <div class="stat">
        <b>${E.deficitMonths || 0}</b>
        <span>Meses consecutivos de déficit</span>
      </div>

    </div>

    <p>
      Situação financeira atual:
      <strong>
        ${financialStatus()}
      </strong>.
    </p>`;


  const modal =
    $('#modal');

  if (!modal)
    return;


  modal.innerHTML =
    `<h3>Balanço do ano ${y}</h3>

    <div class="stats">

      <div class="stat">
        <b>${fmt(S.b)}</b>
        <span>Orçamento restante</span>
      </div>

      <div class="stat">
        <b>${Math.round(S.ind.s)}/100</b>
        <span>Saúde</span>
      </div>

      <div class="stat">
        <b>${Math.round(S.ind.e)}/100</b>
        <span>Educação</span>
      </div>

      <div class="stat">
        <b>${Math.round(S.ind.i)}/100</b>
        <span>Infraestrutura</span>
      </div>

      <div class="stat">
        <b>${Math.round(S.ind.p)}%</b>
        <span>Aprovação</span>
      </div>

    </div>

    ${finance}

    <h4>Principais decisões</h4>

    ${ul(
      top.map(
        x =>
          `${x.t}: ${x.o} (${fmt(x.c)})`
      )
    )}

    <h4>Principais problemas</h4>

    ${ul(probs)}

    <h4>Melhorias conquistadas</h4>

    ${ul(ups)}

    <h4>Problemas que ficaram pendentes</h4>

    ${ul(
      pend.concat(
        S.pending.length
          ? [
              S.pending.length +
              ' consequência(s) de decisões antigas ainda por vir'
            ]
          : []
      )
    )}

    ${
      typeof adv === 'function' &&
      typeof advisorComment === 'function'
        ? `
          <p class="say">
            ${adv().ic}
            ${adv().n}:
            “${advisorComment('bal')}”
          </p>
        `
        : ''
    }

    <button class="btn main" id="nextY">

      ${
        y >= 4
          ? 'VER FIM DO MANDATO'
          : 'INICIAR ANO ' +
            (y + 1)
      }

    </button>`;

  openModal(true);

  const nextY =
    $('#nextY');

  if (nextY) {

    nextY.onclick =
      () => {

        S.bal = 0;

        S.snap =
          {
            ...S.ind
          };

        save();

        closeModal();

        if (y >= 4) {

          endGame();

        } else {

          render();
        }
      };
  }
}


/* ================================================================
   DADOS FINANCEIROS DO RELATÓRIO
================================================================ */

function financialReportData() {

  ensureGameEconomy();

  const E =
    S.economy || {};

  let totalRevenue = 0;
  let totalExpenses = 0;


  if (
    Array.isArray(E.history)
  ) {

    E.history.forEach(h => {

      totalRevenue +=
        Number(
          h.totalRevenue
        ) || 0;

      totalExpenses +=
        Number(
          h.totalExpenses
        ) || 0;
    });
  }


  if (
    !totalRevenue &&
    S.rec
  ) {

    totalRevenue =
      Number(S.rec) || 0;
  }


  if (
    !totalExpenses &&
    S.exp
  ) {

    totalExpenses =
      Number(S.exp) || 0;
  }


  const agreements =
    Array.isArray(E.log)

      ? E.log
          .filter(
            x =>
              x.kind === 'in' &&
              x.cat === 'agreements'
          )
          .reduce(
            (a, x) =>
              a +
              (
                Number(x.value) ||
                0
              ),
            0
          )

      : 0;


  const amendments =
    Array.isArray(E.log)

      ? E.log
          .filter(
            x =>
              x.kind === 'in' &&
              x.cat === 'amendments'
          )
          .reduce(
            (a, x) =>
              a +
              (
                Number(x.value) ||
                0
              ),
            0
          )

      : 0;


  return {

    totalRevenue,

    totalExpenses,

    result:
      totalRevenue -
      totalExpenses,

    deficitMonths:
      Number(
        E.deficitMonths
      ) || 0,

    reserve:
      Number(
        E.reserve
      ) || 0,

    agreements,

    amendments,

    minCash:
      Number(
        S.minB
      ) || 0,

    finalCash:
      Number(
        S.b
      ) || 0,

    status:
      financialStatus()
  };
}


/* ================================================================
   NOTA GERAL DO MANDATO
================================================================ */

const MANDATE_WEIGHTS = {

  s: .20,
  e: .20,
  i: .15,
  a: .10,
  m: .08,
  c: .10,
  r: .07,
  t: .10

};


function mandateScore() {

  let score = 0;

  for (
    const k in MANDATE_WEIGHTS
  ) {

    score +=
      (
        Number(
          S.ind[k]
        ) || 0
      ) *
      MANDATE_WEIGHTS[k];
  }

  return Math.max(
    0,
    Math.min(
      10,
      score / 10
    )
  );
}


function mandateScoreLabel(
  score
) {

  if (score >= 9)
    return 'Excelente';

  if (score >= 8)
    return 'Muito bom';

  if (score >= 7)
    return 'Bom';

  if (score >= 6)
    return 'Regular';

  if (score >= 5)
    return 'Atenção';

  return 'Crítico';
}


function mandateScoreDetails() {

  return Object
    .entries(
      MANDATE_WEIGHTS
    )
    .map(
      ([k, weight]) => ({

        key: k,

        label:
          LBL[k],

        value:
          Math.round(
            Number(
              S.ind[k]
            ) || 0
          ),

        weight,

        contribution:
          (
            Number(
              S.ind[k]
            ) || 0
          ) *
          weight

      })
    );
}


/* ================================================================
   RELATÓRIO FINAL
================================================================ */

function report() {

  const cats =
    Object
      .entries(
        S.catSpend || {}
      )
      .filter(
        c => c[1] > 0
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  const sorted =
    K
      .filter(
        k => k !== 'p'
      )
      .sort(
        (a, b) =>
          S.ind[b] -
          S.ind[a]
      );


  const best =
    sorted[0];

  const worst =
    sorted[
      sorted.length - 1
    ];


  const p = [];


  p.push(

    cats.length >= 2

      ? `Durante o mandato, a administração concentrou seus investimentos em ${cats[0][0].toLowerCase()} e ${cats[1][0].toLowerCase()}, em um total de ${fmt(S.spent)} aplicados em ${S.dec} decisões.`

      : `Durante o mandato, a administração aplicou ${fmt(S.spent)} em ${S.dec} decisões.`
  );


  if (
    best &&
    worst
  ) {

    p.push(
      `O melhor desempenho ficou com ${LBL[best].toLowerCase()} (${Math.round(S.ind[best])}/100), enquanto ${LBL[worst].toLowerCase()} terminou em ${Math.round(S.ind[worst])}/100.`
    );
  }


  if (S.b > 8000) {

    p.push(
      `As contas fecharam com folga (${fmt(S.b)}), o que pode indicar prudência, mas também investimentos que deixaram de ser feitos.`
    );

  } else if (S.b < 1500) {

    p.push(
      `O caixa terminou no limite (${fmt(S.b)}), sendo o momento mais apertado em ${MES[S.minT % 12]} do ano ${Math.min(4, Math.floor(S.minT / 12) + 1)}.`
    );

  } else {

    p.push(
      `O orçamento terminou em ${fmt(S.b)}. O momento mais apertado foi em ${MES[S.minT % 12]} do ano ${Math.min(4, Math.floor(S.minT / 12) + 1)}, com ${fmt(S.minB)}.`
    );
  }


  p.push(
    S.crises
      ? `${S.crises} crise(s) exigiram respostas emergenciais.`
      : 'Nenhuma crise grave precisou ser enfrentada.'
  );


  if (
    S.zero >= 12
  ) {

    p.push(
      `Em ${S.zero} ocasiões, a opção foi não gastar ou adiar, o que aliviou o caixa mas deixou problemas se acumularem.`
    );
  }


  p.push(

    S.ind.t >= 70

      ? 'A transparência foi um ponto forte da gestão.'

      : S.ind.t < 40

        ? 'A transparência ficou frágil, o que pesou na confiança da população.'

        : 'A transparência ficou em nível intermediário.'
  );


  p.push(

    S.ind.p >= 70

      ? 'A população termina o mandato com avaliação favorável.'

      : S.ind.p < 40

        ? 'A população termina o mandato insatisfeita.'

        : 'A população terminou dividida quanto à gestão.'
  );


  const F =
    financialReportData();


  p.push(
    `Ao longo do mandato, foram registrados ${fmt(F.totalRevenue)} em receitas e ${fmt(F.totalExpenses)} em despesas, com resultado financeiro acumulado de ${fmt(F.result)}.`
  );


  p.push(
    `O município passou por ${F.deficitMonths} mês(es) consecutivo(s) de déficit no momento final da gestão, e o menor caixa registrado foi de ${fmt(F.minCash)}.`
  );


  if (
    F.reserve > 0
  ) {

    p.push(
      `A gestão encerrou o mandato com ${fmt(F.reserve)} mantidos em reserva.`
    );
  }


  if (
    F.agreements > 0
  ) {

    p.push(
      `Foram recebidos ${fmt(F.agreements)} em recursos de convênios.`
    );
  }


  if (
    F.amendments > 0
  ) {

    p.push(
      `Também foram utilizados ${fmt(F.amendments)} em recursos de emendas.`
    );
  }


  p.push(
    `A situação financeira final foi classificada como ${F.status}.`
  );


  return p.join(' ');
}


/* ================================================================
   FIM DO MANDATO
================================================================ */

function endGame() {

  if (!S)
    return;

  ensureGameEconomy();

  S.done = 1;

  /*
   * Mantemos o resultado salvo.
   * hasSave() já ignora partidas com done = 1.
   */
  save();

  screen('end');

  closeModal();

  hot(null);


  const st =
    (v, l) =>
      `<div class="stat">
        <b>${v}</b>
        <span>${l}</span>
      </div>`;


  const big =
    IND
      .map(
        x =>
          st(
            x[0] === 'p'
              ? Math.round(
                  S.ind.p
                ) + '%'

              : Math.round(
                  S.ind[x[0]]
                ) + '/100',

            x[1].toUpperCase()
          )
      )
      .join('');


  const tl =
    S.tl
      .slice(-14)
      .map(
        t =>
          `<p>
            <b>
              Ano ${t.y},
              ${MES[t.m]}:
            </b>

            ${t.t}
          </p>`
      )
      .join('')

      ||

      '<p>Nenhum acontecimento de grande porte.</p>';


  const F =
    financialReportData();


  const financialStats =
    `<div class="stats">

      ${st(
        fmt(F.totalRevenue),
        'RECEITAS ACUMULADAS'
      )}

      ${st(
        fmt(F.totalExpenses),
        'DESPESAS ACUMULADAS'
      )}

      ${st(
        fmt(F.result),
        'RESULTADO FINANCEIRO'
      )}

      ${st(
        F.deficitMonths,
        'DÉFICITS CONSECUTIVOS'
      )}

      ${st(
        fmt(F.minCash),
        'MENOR CAIXA'
      )}

      ${st(
        fmt(F.reserve),
        'RESERVA FINAL'
      )}

      ${st(
        fmt(F.agreements),
        'CONVÊNIOS RECEBIDOS'
      )}

      ${st(
        fmt(F.amendments),
        'EMENDAS UTILIZADAS'
      )}

    </div>`;


  /* NOTA */

  const score =
    mandateScore();

  const scoreLabel =
    mandateScoreLabel(
      score
    );

  const scoreDetails =
    mandateScoreDetails();


  const scoreColor =
    score >= 8
      ? 'good'
      : score >= 6
        ? 'mid'
        : 'bad';


  const mandateScoreHTML =
    `<div class="mandate-result ${scoreColor}">

      <div class="mandate-result-header">

        <span>
          AVALIAÇÃO DO MANDATO
        </span>

        <small>
          Desempenho geral da gestão
        </small>

      </div>


      <div class="mandate-score-circle">

        <div class="mandate-score-value">

          ${score.toFixed(1)}

          <span>/10</span>

        </div>

      </div>


      <div class="mandate-score-label">
        ${scoreLabel}
      </div>


      <div class="mandate-score-subtitle">
        Resultado geral das áreas de gestão
      </div>


      <div class="mandate-areas">

        ${scoreDetails
          .map(d => {

            const percent =
              Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    d.value
                  ) || 0
                )
              );


            const areaColor =
              percent >= 70
                ? 'good'
                : percent >= 50
                  ? 'mid'
                  : 'bad';


            return `

              <div class="mandate-area">

                <div class="mandate-area-top">

                  <span>
                    ${d.label}
                  </span>

                  <small>
                    Peso
                    ${Math.round(
                      d.weight * 100
                    )}%
                  </small>

                </div>


                <div class="mandate-bar">

                  <div
                    class="mandate-bar-fill ${areaColor}"
                    style="width:${percent}%"
                  ></div>

                </div>

              </div>

            `;
          })
          .join('')}

      </div>

    </div>`;


  const end =
    $('#end');

  if (!end)
    return;


  end.innerHTML =
    `<h1>
      FIM DO MANDATO
    </h1>


    <div class="stats">

      ${st(
        fmt(S.b),
        'ORÇAMENTO FINAL'
      )}

      ${big}

    </div>


    ${mandateScoreHTML}


    ${financialStats}


    <div class="stats">

      ${st(
        S.dec,
        'Decisões tomadas'
      )}

      ${st(
        S.evs,
        'Eventos enfrentados'
      )}

      ${st(
        S.crises,
        'Crises enfrentadas'
      )}

      ${st(
        fmt(S.spent),
        'Investimentos realizados'
      )}

      ${st(
        fmt(S.gain),
        'Economias e receitas extras'
      )}

    </div>


    <h3>
      Relatório final
    </h3>


    <p class="report">
      ${report()}
    </p>


    <h3>
      Linha do tempo
    </h3>


    <div class="timeline">
      ${tl}
    </div>


    ${
      typeof legacy === 'function'
        ? legacy()
        : ''
    }


    <p class="quote">
      “Administrar uma cidade não é escolher entre o certo e o errado. É decidir o que fazer quando não é possível fazer tudo.”
    </p>


    <div
      class="btns"
      style="justify-content:center"
    >

      <button
        class="btn main"
        id="again"
      >
        JOGAR NOVAMENTE
      </button>


      <button
        class="btn main"
        id="newE"
      >
        NOVO MANDATO
      </button>


      <button
        class="btn"
        id="menuE"
      >
        Menu
      </button>

    </div>`;


  const d =
    S.diff;


  const again =
    $('#again');

  if (again) {

    again.onclick =
      () => newGame(d);
  }


  const newE =
    $('#newE');

  if (newE) {

    newE.onclick =
      () => pickDiff(
        newGame
      );
  }


  const menuE =
    $('#menuE');

  if (menuE) {

    menuE.onclick =
      home;
  }
}


/* ================================================================
   CIDADE VIVA
================================================================ */

const ZN = {

  centro: [
    '🏛️🏥🏫',
    ['t','c','s'],
    'Centro urbano'
  ],

  bairros: [
    '🏠🏘️🏠',
    ['s','e'],
    'Bairros'
  ],

  rural: [
    '🌾🐐🌵',
    ['r'],
    'Zona rural'
  ],

  comunid: [
    '🛖💧🛖',
    ['a'],
    'Comunidades rurais'
  ],

  estradas: [
    '🛣️🚌🚧',
    ['i'],
    'Estradas'
  ]

};


const CI = {

  'Saúde':
    '🏥',

  'Educação':
    '🏫',

  'Infraestrutura':
    '🚧',

  'Água':
    '💧',

  'Zona rural':
    '🌾',

  'Economia':
    '💼',

  'Meio ambiente':
    '🌱',

  'Cultura':
    '🎭',

  'Transparência':
    '🏛️',

  'Emergência':
    '🚨',

  'Finanças':
    '💰',

  'Assistência social':
    '🤝',

  'Mobilidade':
    '🚌',

  'Administração':
    '🗂️',

  'Política pública':
    '📑'

};


const AREA = {

  centro:
    'Centro urbano',

  bairros:
    'Bairros',

  rural:
    'Zona rural',

  comunid:
    'Comunidades rurais',

  estradas:
    'Estradas'

};


const ROLE = {

  'Saúde':
    'Secretária de Saúde',

  'Educação':
    'Secretário de Educação',

  'Infraestrutura':
    'Engenheiro da prefeitura',

  'Água':
    'Técnica de abastecimento',

  'Zona rural':
    'Extensionista rural',

  'Economia':
    'Assessor de desenvolvimento',

  'Finanças':
    'Contadora da prefeitura'

};


/* ================================================================
   ZONAS
================================================================ */

function zones() {

  if (
    !S ||
    !S.ind
  ) {
    return;
  }


  for (
    const k in ZN
  ) {

    const z =
      $('#a-' + k);

    if (!z) {
      continue;
    }


    const areas =
      ZN[k][1];


    if (
      !Array.isArray(areas) ||
      !areas.length
    ) {
      continue;
    }


    const values =
      areas.map(
        x =>
          Number(
            S.ind[x]
          ) || 0
      );


    const v =
      values.reduce(
        (a, x) =>
          a + x,
        0
      ) /
      values.length;


    const st =
      v < 35
        ? 'bad'
        : v < 55
          ? 'warn'
          : 'ok';


    ['ok','warn','bad']
      .forEach(c => {

        z.classList.toggle(
          c,
          c === st
        );

      });


    const signal =
      st === 'bad'
        ? '⚠️'
        : st === 'ok'
          ? '✨'
          : '';


    z.innerHTML =
      `<span class="ic">
        ${ZN[k][0]}
      </span>

      <small>
        ${ZN[k][2]}
        ${signal}
      </small>`;
  }


  const rain =
    Number(
      S.rain
    ) || 0;

  const turn =
    Number(
      S.turn
    ) || 0;


  const weather =
    S.ind.a < 30

      ? '🏜️'

      : rain >= turn

        ? '🌧️'

        : '☀️';


  const mood =
    S.ind.p >= 60

      ? '😊'

      : S.ind.p >= 40

        ? '😐'

        : '😠';


  const wx =
    $('#wx');


  if (wx) {

    wx.textContent =
      weather +
      mood;
  }
}


/* ================================================================
   FINAL
================================================================ */
