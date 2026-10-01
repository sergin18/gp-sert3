'use strict';

/* ================================================================
   GAME — estado central, calendário, indicadores, interface
   e fim do mandato

   IMPORTANTE:
   - Economia permanece em economy.js
   - Eventos permanecem em events.js
   - Câmara permanece em council.js
   - Projetos permanecem em projects.js
   - Notícias permanecem em news.js
   - Salvamento permanece em save.js
   - Botões permanecem em main.js
================================================================ */


/* ---------- ESTADO E CONSTANTES ---------- */

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

const LBL = Object.fromEntries(
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


/* ---------- UTILITÁRIOS ---------- */

const $ = s => document.querySelector(s);

const fmt = v =>
  'R$ ' +
  Math.round((Number(v) || 0) * 1000)
    .toLocaleString('pt-BR');

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


/* ---------- CALENDÁRIO ---------- */

/* (removido: definido em economy.js/council.js) */


/* ---------- ECONOMIA ---------- */

/*
   Estas funções NÃO substituem economy.js.
   Elas apenas permitem que o game converse com ele
   sem quebrar caso algum campo ainda não exista.
*/

function ensureGameEconomy() {
  if (!S) return;

  if (
    typeof ensureEconomy === 'function'
  ) {
    ensureEconomy();
  }

  if (!S.economy) {
    S.economy = {};
  }
}

function financialStatus() {

  ensureGameEconomy();

  if (!S || !S.economy) {
    return 'saudável';
  }

  const cash =
    Number(S.b) || 0;

  const deficit =
    Number(S.economy.deficitMonths) || 0;

  const result =
    Number(S.economy.monthlyResult) || 0;

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

function applyFinancialConsequences() {

  ensureGameEconomy();

  if (!S || !S.economy) {
    return;
  }

  const cash =
    Number(S.b) || 0;

  const deficit =
    Number(S.economy.deficitMonths) || 0;

  if (
    cash <= 8000 &&
    cash > 5000
  ) {
    S.ind.p = clamp(
      S.ind.p - rnd(.02, .06)
    );
  }

  if (
    cash <= 5000 &&
    cash > 2500
  ) {
    S.ind.p = clamp(
      S.ind.p - rnd(.04, .10)
    );
  }

  if (cash <= 2500) {
    S.ind.p = clamp(
      S.ind.p - rnd(.08, .16)
    );
  }

  if (deficit >= 2) {
    S.ind.p = clamp(
      S.ind.p - rnd(.02, .07)
    );
  }

  if (deficit >= 3) {
    S.ind.p = clamp(
      S.ind.p - rnd(.03, .09)
    );
  }

  if (deficit >= 4) {
    S.ind.p = clamp(
      S.ind.p - rnd(.04, .12)
    );
  }
}

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
    Number(S.economy?.deficitMonths) || 0;

  let pressure = 0;

  if (cash <= 8000) {
    pressure += .08;
  }

  if (cash <= 5000) {
    pressure += .08;
  }

  if (cash <= 2500) {
    pressure += .10;
  }

  if (deficit >= 2) {
    pressure += .08;
  }

  if (deficit >= 3) {
    pressure += .08;
  }

  if (deficit >= 4) {
    pressure += .10;
  }

  pressure =
    Math.min(.45, pressure);

  if (pressure <= 0) {
    return;
  }

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
          v.rel - rnd(.15, .45)
        );
    }

    if (
      Math.random() <
      pressure * .35
    ) {
      v.sup =
        Math.max(
          0,
          v.sup - rnd(.05, .20)
        );
    }

  });
}

function financialNews() {

  ensureGameEconomy();

  if (
    !S ||
    !S.economy ||
    typeof publishNews !== 'function'
  ) {
    return;
  }

  if (Math.random() > .14) {
    return;
  }

  const result =
    Number(S.economy.monthlyResult) || 0;

  const deficit =
    Number(S.economy.deficitMonths) || 0;

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


/* ---------- NOVO JOGO ---------- */

function newGame(diff) {

  const D =
    DIFF[diff] ||
    DIFF.normal;

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

    economy: {},

    done: 0
  };

  ensureGameEconomy();

  if (
    typeof save === 'function'
  ) {
    save();
  }

  startGame();
}


/* ---------- PRÓXIMO MÊS ---------- */

/*
   IMPORTANTE:
   closeMonth() é chamado UMA vez.
   Não existe S.turn++ aqui.
   O calendário financeiro fica sob responsabilidade
   do economy.js.
*/

function nextTurn() {

  if (!S) {
    return;
  }

  if (
    S.turn >= 48
  ) {
    return endGame();
  }

  const D =
    DIFF[S.diff] ||
    DIFF.normal;

  ensureGameEconomy();

  if (
    typeof closeMonth === 'function'
  ) {
    closeMonth();
  }

  applyFinancialConsequences();

  [
    's',
    'e',
    'i',
    'a',
    'r'
  ].forEach(k => {

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

  if (
    typeof IMP !== 'undefined' &&
    Array.isArray(IMP) &&
    Math.random() < D.imp
  ) {

    const m =
      IMP[
        Math.floor(
          Math.random() *
          IMP.length
        )
      ];

    if (
      typeof apply === 'function'
    ) {
      apply(
        fx(m[1])
      );
    }

    feed(m[0]);

    toast(
      'y',
      'ATENÇÃO',
      m[0]
    );
  }

  if (
    typeof updateProjects === 'function'
  ) {
    updateProjects();
  }

  if (
    Array.isArray(S.council)
  ) {

    S.council.forEach(v => {

      if (!v) return;

      v.sup =
        Number(v.sup) || 0;

      v.sup *= .8;

      v.rel =
        clamp(
          (Number(v.rel) || 50) +
          (S.ind.p - 50) / 300 +
          rnd(-.4, .4)
        );

    });

  }

  applyFinancialCouncilPressure();

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

  if (
    S.b < S.minB
  ) {

    S.minB = S.b;
    S.minT = S.turn;

  }

  if (
    typeof save === 'function'
  ) {
    save();
  }

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


/* ---------- INTERFACE ---------- */

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

function toast(k, title, text) {

  const box =
    $('#toasts');

  if (!box) return;

  const d =
    document.createElement('div');

  d.className =
    'toast ' + k;

  const ic = {
    b: '🔵',
    y: '🟡',
    r: '🔴',
    g: '🟢'
  }[k] || '🔵';

  d.innerHTML =
    `<b>${ic} ${title}</b>${text}`;

  box.appendChild(d);

  setTimeout(
    () => d.remove(),
    5200
  );

  while (
    box.children.length > 3
  ) {
    box.firstChild.remove();
  }
}

function openModal(lock, cls) {

  const overlay =
    $('#overlay');

  const modal =
    $('#modal');

  if (!overlay || !modal) {
    return;
  }

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

  const next =
    $('#bNext');

  if (
    next &&
    S
  ) {
    next.disabled = false;
  }
}

function info(html) {

  const modal =
    $('#modal');

  if (!modal) return;

  modal.innerHTML =
    html +
    '<p><button class="btn main" id="cl">Fechar</button></p>';

  openModal(false);

  const close =
    $('#cl');

  if (close) {
    close.onclick =
      closeModal;
  }
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

function buildInds() {

  const box =
    $('#inds');

  if (!box) return;

  box.innerHTML =
    IND.map(x => `
      <div class="ind" id="i-${x[0]}">
        <div class="h">
          <span>${x[2]} ${x[1]}</span>
        </div>

        <div class="v"></div>

        <div class="bar">
          <i></i>
        </div>
      </div>
    `).join('');
}


/* ---------- RENDERIZAÇÃO ---------- */

function render() {

  if (!S) return;

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

  IND.forEach(x => {

    const el =
      $('#i-' + x[0]);

    if (!el) return;

    const v =
      Math.round(
        S.ind[x[0]]
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
        v + '%';

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
        S.prev[x[0]]
      );

    if (d) {

      const c =
        document.createElement(
          'span'
        );

      c.className =
        'chip ' +
        (
          d > 0
            ? 'p'
            : 'n'
        );

      c.textContent =
        (
          d > 0
            ? '+'
            : ''
        ) + d;

      el.appendChild(c);

      setTimeout(
        () => c.remove(),
        2300
      );
    }

    S.prev[x[0]] =
      S.ind[x[0]];

  });

  zones();

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

  if (
    fDes &&
    typeof expenses === 'function'
  ) {
    fDes.textContent =
      fmt(expenses());
  }

  const fRev =
    $('#fRev');

  if (
    fRev &&
    typeof revenue === 'function'
  ) {
    fRev.textContent =
      fmt(revenue());
  }

  ensureGameEconomy();

  const E =
    S.economy ||
    {};

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
        E.monthlyResult ||
        0
      );
  }

  const deficitEl =
    $('#deficitMonths');

  if (deficitEl) {
    deficitEl.textContent =
      E.deficitMonths ||
      0;
  }

  const reserveEl =
    $('#reserve');

  if (reserveEl) {
    reserveEl.textContent =
      fmt(
        E.reserve ||
        0
      );
  }

  const feedBox =
    $('#feed');

  if (feedBox) {

    const news =
      Array.isArray(S.news)
        ? S.news
        : [];

    feedBox.innerHTML =
      news.length
        ? news
            .slice(0, 5)
            .map(n => `
              <li>
                ${(typeof NI !== 'undefined' && NI[n.c]) || '📰'}
                ${n.t}

                <small>
                  ${n.c} ·
                  ${MES[n.m] || ''},
                  ano ${n.y || ''}
                </small>
              </li>
            `)
            .join('')

        : '<li>Nenhuma notícia ainda. Avance para o primeiro mês.</li>';
  }

  renderGov();

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


/* ---------- TELAS ---------- */

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

function startGame() {

  if (!S) return;

  ensureGameEconomy();

  screen('game');

  buildInds();

  S.prev = {
    ...S.ind
  };

  render();

  if (!S.advisor) {

    chooseAdvisor();

  } else if (S.bal) {

    balance();

  } else if (
    S.turn >= 48
  ) {

    endGame();
  }
}

function home() {

  screen('home');

  const h =
    typeof hasSave === 'function'
      ? hasSave()
      : false;

  const continueBtn =
    $('#bContinue');

  const eraseBtn =
    $('#bErase');

  if (continueBtn) {
    continueBtn.hidden =
      !h;
  }

  if (eraseBtn) {
    eraseBtn.hidden =
      !h;
  }
}

function pickDiff(cb) {

  const modal =
    $('#modal');

  if (!modal) return;

  modal.innerHTML =
    '<h3>Escolha a dificuldade</h3>' +

    '<div class="diffs">' +

    Object.keys(DIFF)
      .map(k => `
        <button
          class="opt"
          data-d="${k}"
        >
          <span>
            ${DIFF[k].n}
            <small>
              ${DIFF[k].d}
            </small>
          </span>

          <b>
            ${fmt(DIFF[k].b)}
          </b>
        </button>
      `)
      .join('') +

    '</div>' +

    '<p>' +
      '<button class="btn small" id="cl">' +
        'Cancelar' +
      '</button>' +
    '</p>';

  openModal(false);

  const close =
    $('#cl');

  if (close) {
    close.onclick =
      closeModal;
  }

  document
    .querySelectorAll('[data-d]')
    .forEach(b => {

      b.onclick = () => {

        closeModal();

        cb(
          b.dataset.d
        );

      };

    });
}


/* ---------- GOVERNO ---------- */

function renderGov() {

  if (!S) return;

  const council =
    Array.isArray(S.council)
      ? S.council
      : [];

  const projects =
    Array.isArray(S.projects)
      ? S.projects
      : [];

  const news =
    Array.isArray(S.news)
      ? S.news
      : [];

  let f = 0;

  if (
    typeof tend === 'function'
  ) {

    f =
      council.filter(
        v =>
          tend(v, null) === 'yes'
      ).length;

  }

  const ex =
    projects.filter(
      p =>
        p &&
        p.st === 'exec'
    ).length;

  const avg =
    council.length
      ? council.reduce(
          (a, v) =>
            a +
            (
              Number(v.rel) ||
              0
            ),
          0
        ) / council.length
      : 0;

  const un =
    news.filter(
      n =>
        n &&
        n.n
    ).length;

  const gov =
    $('#gov');

  if (!gov) return;

  let rel =
    'Normal';

  if (
    typeof relLbl === 'function'
  ) {
    rel =
      relLbl(avg)
        .split(' ')[0];
  }

  gov.innerHTML = `
    <h3>Situação do governo</h3>

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
        <b>${rel}</b>
      </div>

      <div>
        <span>📰 Notícias</span>
        <b>${un}</b>
        <small>novas</small>
      </div>

    </div>
  `;
}

const show =
  (html, lock, cls) => {

    const modal =
      $('#modal');

    if (!modal) return;

    modal.innerHTML =
      html;

    openModal(
      lock,
      cls
    );
  };


/* ================================================================
   CONSELHEIRO
================================================================ */

/* (removido: definido em economy.js/council.js) */

/* (removido: definido em economy.js/council.js) */

/* (removido: definido em economy.js/council.js) */

/* (removido: definido em economy.js/council.js) */


/* ================================================================
   BALANÇO ANUAL
================================================================ */

function balance() {

  if (!S) return;

  const y =
    S.turn / 12;

  const L =
    Array.isArray(S.yl)
      ? S.yl.filter(
          x =>
            x.y === y
        )
      : [];

  const top =
    L
      .slice()
      .sort(
        (a, b) =>
          b.c - a.c
      )
      .slice(0, 3)
      .filter(
        x =>
          x.c > 0
      );

  const probs =
    L
      .filter(
        x =>
          x.g >= 2
      )
      .map(
        x =>
          x.t
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

  const modal =
    $('#modal');

  if (!modal) return;

  modal.innerHTML = `
    <h3>Balanço do ano ${y}</h3>

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

    <p class="say">
      ${adv().ic}
      ${adv().n}:
      “${advisorComment('bal')}”
    </p>

    <button
      class="btn main"
      id="nextY"
    >
      ${
        y >= 4
          ? 'VER FIM DO MANDATO'
          : 'INICIAR ANO ' + (y + 1)
      }
    </button>
  `;

  openModal(true);

  const next =
    $('#nextY');

  if (next) {

    next.onclick =
      () => {

        S.bal = 0;

        S.snap = {
          ...S.ind
        };

        if (
          typeof save === 'function'
        ) {
          save();
        }

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
   NOTA FINAL DO MANDATO
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

  if (!S) {
    return 0;
  }

  let score = 0;

  Object.entries(
    MANDATE_WEIGHTS
  ).forEach(
    ([k, weight]) => {

      score +=
        (
          Number(
            S.ind[k]
          ) || 0
        ) *
        weight;

    }
  );

  return Math.max(
    0,
    Math.min(
      10,
      score / 10
    )
  );
}

function mandateScoreLabel(score) {

  if (score >= 9) {
    return 'Excelente';
  }

  if (score >= 8) {
    return 'Muito bom';
  }

  if (score >= 7) {
    return 'Bom';
  }

  if (score >= 6) {
    return 'Regular';
  }

  if (score >= 5) {
    return 'Atenção';
  }

  return 'Crítico';
}

function mandateScoreDetails() {

  if (!S) {
    return [];
  }

  return Object.entries(
    MANDATE_WEIGHTS
  ).map(
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

function mandateScoreClass(score) {

  if (score >= 7) {
    return 'good';
  }

  if (score >= 5) {
    return 'mid';
  }

  return 'bad';
}


/* ================================================================
   RELATÓRIO FINAL
================================================================ */

function financialReportData() {

  ensureGameEconomy();

  const E =
    S.economy ||
    {};

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
    totalRevenue === 0 &&
    S.rec
  ) {
    totalRevenue =
      Number(S.rec) || 0;
  }

  if (
    totalExpenses === 0 &&
    S.exp
  ) {
    totalExpenses =
      Number(S.exp) || 0;
  }

  let agreements = 0;

  let amendments = 0;

  if (
    Array.isArray(E.log)
  ) {

    E.log.forEach(
      item => {

        if (!item) return;

        const type =
          String(
            item.type ||
            item.kind ||
            ''
          ).toLowerCase();

        const value =
          Number(
            item.value ||
            item.amount ||
            item.v
          ) || 0;

        if (
          type.includes(
            'conv'
          )
        ) {
          agreements +=
            value;
        }

        if (
          type.includes(
            'emen'
          )
        ) {
          amendments +=
            value;
        }

      }
    );
  }

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

    minCash:
      Number(
        S.minB
      ) || 0,

    finalCash:
      Number(
        S.b
      ) || 0,

    agreements,

    amendments,

    status:
      financialStatus()

  };
}

function report() {

  if (!S) {
    return '';
  }

  const cats =
    Object.entries(
      S.catSpend || {}
    )
    .filter(
      c =>
        Number(c[1]) > 0
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    );

  const sorted =
    K
      .filter(
        k =>
          k !== 'p'
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

  if (
    cats.length >= 2
  ) {

    p.push(
      `Durante o mandato, a administração concentrou seus investimentos em ${cats[0][0].toLowerCase()} e ${cats[1][0].toLowerCase()}, em um total de ${fmt(S.spent)} aplicados em ${S.dec} decisões.`
    );

  } else {

    p.push(
      `Durante o mandato, a administração aplicou ${fmt(S.spent)} em ${S.dec} decisões.`
    );

  }

  if (best) {

    p.push(
      `Entre os indicadores acompanhados, ${LBL[best].toLowerCase()} terminou com ${Math.round(S.ind[best])} pontos.`
    );

  }

  if (worst) {

    p.push(
      `${LBL[worst]} terminou com ${Math.round(S.ind[worst])} pontos e representa uma das áreas que exigirá atenção futura.`
    );

  }

  if (
    S.b > 8000
  ) {

    p.push(
      `As contas fecharam com ${fmt(S.b)} em caixa.`
    );

  } else if (
    S.b < 1500
  ) {

    p.push(
      `O caixa terminou em nível muito baixo, com ${fmt(S.b)}.`
    );

  } else {

    p.push(
      `O orçamento terminou em ${fmt(S.b)}.`
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
      `Em ${S.zero} ocasiões, a opção foi não gastar ou adiar decisões.`
    );

  }

  p.push(
    S.ind.t >= 70
      ? 'A transparência terminou em nível elevado.'
      : S.ind.t < 40
        ? 'A transparência terminou em nível baixo.'
        : 'A transparência terminou em nível intermediário.'
  );

  p.push(
    S.ind.p >= 70
      ? 'A aprovação popular terminou em nível elevado.'
      : S.ind.p < 40
        ? 'A aprovação popular terminou em nível baixo.'
        : 'A aprovação popular terminou em nível intermediário.'
  );

  const F =
    financialReportData();

  p.push(
    `O resultado financeiro acumulado registrado pelo simulador foi de ${fmt(F.result)}.`
  );

  return p.join(' ');
}


/* ================================================================
   LEGADO / RESUMO
================================================================ */

/* (removido: definido em economy.js/council.js) */


/* ================================================================
   FIM DO MANDATO
================================================================ */

function endGame() {

  if (!S) {
    return;
  }

  ensureGameEconomy();

  S.done = 1;

  if (
    typeof save === 'function'
  ) {
    save();
  }

  if (
    typeof deleteSave === 'function'
  ) {
    deleteSave();
  }

  screen('end');

  closeModal();

  hot(null);

  const st =
    (v, l) =>
      `
        <div class="stat">
          <b>${v}</b>
          <span>${l}</span>
        </div>
      `;

  const F =
    financialReportData();

  const score =
    mandateScore();

  const scoreLabel =
    mandateScoreLabel(
      score
    );

  const scoreClass =
    mandateScoreClass(
      score
    );

  const details =
    mandateScoreDetails();

  const scoreAreas =
    details
      .map(d => {

        const value =
          Math.max(
            0,
            Math.min(
              100,
              d.value
            )
          );

        const cls =
          value >= 70
            ? 'good'
            : value >= 50
              ? 'mid'
              : 'bad';

        return `
          <div class="mandate-area">

            <div class="mandate-area-top">

              <span>
                ${d.label}
              </span>

              <small>
                ${Math.round(
                  d.weight * 100
                )}%
              </small>

            </div>

            <div class="mandate-bar">

              <div
                class="mandate-bar-fill ${cls}"
                style="width:${value}%"
              ></div>

            </div>

          </div>
        `;

      })
      .join('');

  const mandateScoreHTML = `

    <div
      class="mandate-result ${scoreClass}"
    >

      <div class="mandate-score-title">
        DESEMPENHO GERAL DO MANDATO
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
        Resultado calculado a partir
        das principais áreas de gestão.
      </div>

      <div class="mandate-areas">

        ${scoreAreas}

      </div>

    </div>
  `;

  const tl =
    Array.isArray(S.tl)
      ? S.tl
          .slice(-14)
          .map(
            t =>
              `
                <p>
                  <b>
                    Ano ${t.y},
                    ${MES[t.m]}:
                  </b>
                  ${t.t}
                </p>
              `
          )
          .join('')
      : '';

  const timeline =
    tl ||
    '<p>Nenhum acontecimento de grande porte.</p>';

  const end =
    $('#end');

  if (!end) {
    return;
  }

  end.innerHTML = `

    <h1>FIM DO MANDATO</h1>

    ${mandateScoreHTML}

    <div class="stats">

      ${st(
        fmt(S.b),
        'ORÇAMENTO FINAL'
      )}

      ${st(
        S.dec,
        'DECISÕES TOMADAS'
      )}

      ${st(
        S.evs,
        'EVENTOS ENFRENTADOS'
      )}

      ${st(
        S.crises,
        'CRISES ENFRENTADAS'
      )}

      ${st(
        fmt(S.spent),
        'INVESTIMENTOS REALIZADOS'
      )}

      ${st(
        fmt(S.gain),
        'ECONOMIAS E RECEITAS EXTRAS'
      )}

    </div>

    <h3>Resumo financeiro</h3>

    <div class="stats">

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

    </div>

    <h3>Relatório final</h3>

    <p class="report">
      ${report()}
    </p>

    <h3>Linha do tempo</h3>

    <div class="timeline">
      ${timeline}
    </div>

    ${legacy()}

    <p class="quote">
      “Administrar uma cidade não é escolher
      entre o certo e o errado. É decidir
      o que fazer quando não é possível fazer tudo.”
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

    </div>
  `;

  const d =
    S.diff;

  const again =
    $('#again');

  if (again) {

    again.onclick =
      () =>
        newGame(d);

  }

  const newE =
    $('#newE');

  if (newE) {

    newE.onclick =
      () =>
        pickDiff(newGame);

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

  'Saúde': '🏥',

  'Educação': '🏫',

  'Infraestrutura': '🚧',

  'Zona rural': '🌾',

  'Água': '💧',

  'Economia': '💼',

  'Meio ambiente': '🌱',

  'Cultura': '🎭',

  'Transparência': '🏛️',

  'Emergência': '🚨',

  'Finanças': '💰',

  'Assistência social': '🤝',

  'Mobilidade': '🚌',

  'Administração': '🗂️',

  'Política pública': '📑'

};

const AREA = {

  centro: 'Centro urbano',

  bairros: 'Bairros',

  rural: 'Zona rural',

  comunid: 'Comunidades rurais',

  estradas: 'Estradas'

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

function zones() {

  if (!S) {
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

    const values =
      ZN[k][1]
        .map(
          x =>
            Number(
              S.ind[x]
            ) || 0
        );

    const v =
      values.length
        ? values.reduce(
            (a, x) =>
              a + x,
            0
          ) /
          values.length
        : 0;

    const st =
      v < 35
        ? 'bad'
        : v < 55
          ? 'warn'
          : 'ok';

    [
      'ok',
      'warn',
      'bad'
    ].forEach(c =>
      z.classList.toggle(
        c,
        c === st
      )
    );

    z.innerHTML = `
      <span class="ic">
        ${ZN[k][0]}
      </span>

      <small>
        ${ZN[k][2]}

        ${
          st === 'bad'
            ? '⚠️'
            : st === 'ok'
              ? '✨'
              : ''
        }

      </small>
    `;
  }

  const rain =
    Number(S.rain) || 0;

  const w =
    S.ind.a < 30
      ? '🏜️'
      : rain >= S.turn
        ? '🌧️'
        : '☀️';

  const wx =
    $('#wx');

  if (wx) {

    wx.textContent =
      w +
      (
        S.ind.p >= 60
          ? '😊'
          : S.ind.p >= 40
            ? '😐'
            : '😠'
      );

  }
}


/* ================================================================
   FIM DO GAME.JS
================================================================ */
