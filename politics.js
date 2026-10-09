'use strict';
/* =====================================================================
   POLITICS — interesses dos vereadores, negociação, governabilidade
   e cassação do mandato.
   ---------------------------------------------------------------------
   • Carregado depois de council.js e antes de projects.js / main.js.
   • Dados novos ficam em S.political e em campos extras de cada
     vereador (areas, region, demand, pers, neg, int, talks, mood).
     Saves antigos são completados por ensurePolitics(), sem apagar nada.
   • Não cria fechamento de mês próprio: polMonthly() é chamado de
     dentro do closeMonth() existente (uma vez por mês).
   • INTERESSE (v.int) ≠ RELAÇÃO (v.rel) ≠ APOIO (polSupport()).
   ===================================================================== */

/* ---------- PERFIS (aplicados pela posição do vereador na Câmara) ---------- */
/* areas: chaves dos indicadores (s,e,i,a,m,c,r,t,p) com peso de 0 a 1 */
const POL_PROFILES = [
  { pers: 'Pragmático',    neg: 1.10, region: 'Rio da Barra',      areas: { r: 1, i: .8, a: .7 },  demand: 'estradas vicinais' },
  { pers: 'Ideológico',    neg: 0.75, region: 'Centro',            areas: { t: 1, e: .6 },         demand: 'transparência nas contas' },
  { pers: 'Fisiológico',   neg: 1.25, region: 'Alto do Céu',       areas: { i: 1, p: .6 },         demand: 'pavimentação' },
  { pers: 'Técnico',       neg: 0.95, region: 'Centro',            areas: { s: 1, e: .5 },         demand: 'atendimento de saúde' },
  { pers: 'Comunitário',   neg: 1.05, region: 'Vila da COHAB',     areas: { e: 1, s: .6, p: .5 },  demand: 'escolas' },
  { pers: 'Ruralista',     neg: 1.00, region: 'Algodões',          areas: { r: 1, a: 1, c: .4 },   demand: 'água e poços' },
  { pers: 'Empresarial',   neg: 0.90, region: 'Centro',            areas: { c: 1, i: .6 },         demand: 'apoio ao comércio' },
  { pers: 'Ambientalista', neg: 0.85, region: 'Mário Melo',        areas: { m: 1, a: .6 },         demand: 'resíduos e arborização' },
  { pers: 'Oportunista',   neg: 1.20, region: 'Henrique Dias',     areas: { r: .8, p: .8 },        demand: 'transporte rural' },
  { pers: 'Fiscalizador',  neg: 0.70, region: 'Centro',            areas: { t: 1, c: .5 },         demand: 'equilíbrio fiscal' },
  { pers: 'Comunitário',   neg: 1.05, region: 'Alto da Conceição', areas: { i: .9, s: .7 },        demand: 'drenagem e iluminação' },
  { pers: 'Ruralista',     neg: 1.00, region: 'Albuquerque Né',    areas: { r: 1, e: .5 },         demand: 'transporte escolar' },
  { pers: 'Pragmático',    neg: 1.10, region: 'Nova Sertânia',     areas: { s: .8, p: .8, i: .5 }, demand: 'saúde nos bairros' }
];

const GOV_BANDS = [
  [80, 'Governo estável', 'g'], [65, 'Governo sob controle', 'g'], [50, 'Governo pressionado', 'y'],
  [35, 'Crise política', 'y'], [20, 'Governo ameaçado', 'r'], [0, 'Risco extremo', 'r']
];

/* ---------- UTILITÁRIOS ---------- */
const polChaos = () => S && S.diff === 'caos';
const polHard = () => ({ normal: 1, desafio: 1.25, caos: 1.55 }[S && S.diff] || 1);
const polNews = (t, s) => { if (typeof publishNews === 'function') publishNews('Câmara', t, s || ''); };
const polPay = (v, src) => { if (typeof addExpense === 'function') addExpense('administrative', v, src); else S.b -= v; };

/* ---------- ESTADO / MIGRAÇÃO ---------- */
function ensurePolitics() {
  if (!S) return;
  const P = S.political || (S.political = {});
  if (typeof P.gov !== 'number') P.gov = 70;
  if (typeof P.pressure !== 'number') P.pressure = 0;
  if (typeof P.rejected !== 'number') P.rejected = 0;
  if (typeof P.lowMonths !== 'number') P.lowMonths = 0;
  if (typeof P.lastCass !== 'number') P.lastCass = -99;
  if (typeof P.cassAttempts !== 'number') P.cassAttempts = 0;
  if (typeof P.cassPending !== 'boolean') P.cassPending = false;
  if (typeof P.cassado !== 'boolean') P.cassado = false;
  if (!Array.isArray(P.log)) P.log = [];
  (S.council || []).forEach((v, i) => {
    const pr = POL_PROFILES[i % POL_PROFILES.length];
    if (!v.areas) v.areas = { ...pr.areas };
    if (!v.region) v.region = pr.region;
    if (!v.demand) v.demand = pr.demand;
    if (!v.pers) v.pers = pr.pers;
    if (typeof v.neg !== 'number') v.neg = pr.neg;
    if (typeof v.int !== 'number') v.int = 50;
    if (typeof v.talks !== 'number') v.talks = 0;
    if (typeof v.mood !== 'number') v.mood = 0;
  });
}

/* ---------- INTERESSE x RELAÇÃO x APOIO ---------- */
function polInterestIn(v, effects) {
  let sc = 0;
  for (const k in (effects || {})) if (v.areas[k] && effects[k] > 0) sc += v.areas[k] * effects[k];
  return clamp(30 + sc * 3);
}
/* Apoio = probabilidade (0–100) de votar a favor do governo */
function polSupport(v, effects) {
  const G = S.political ? S.political.gov : 60;
  const interest = effects ? polInterestIn(v, effects) : (v.int || 50);
  const base = v.gov === 1 ? 12 : v.gov === 0 ? -12 : 0;
  return clamp(v.rel * .5 + interest * .3 + (G - 50) * .3 + base + (v.mood || 0));
}

/* ---------- NEGOCIAÇÃO ---------- */
const POL_ACTIONS = {
  conversar: { n: 'Conversar',        cost: 0,   rel: 3,  int: 2,  risk: .15 },
  reuniao:   { n: 'Fazer reunião',    cost: 20,  rel: 5,  int: 4,  risk: .12 },
  estudo:    { n: 'Prometer estudo',  cost: 0,   rel: 4,  int: 6,  risk: .30, promise: true },
  demanda:   { n: 'Atender demanda',  cost: 150, rel: 9,  int: 12, risk: .08, indic: true },
  regiao:    { n: 'Apoiar a região',  cost: 300, rel: 12, int: 15, risk: .05, indic: true }
};
const polActCost = A => Math.round(A.cost * (typeof costMult === 'function' ? costMult() : 1));

function polNegotiate(vid, act) {
  ensurePolitics();
  const v = S.council.find(x => x.id === vid), A = POL_ACTIONS[act];
  if (!v || !A) return;
  if (v.talks >= 2) { toast('y', 'ATENÇÃO', v.name + ' já foi procurado duas vezes este mês.'); return polOpenCouncilor(vid); }
  const c = polActCost(A);
  if (c > 0 && S.b < c) { toast('r', 'SEM RECURSOS', 'O caixa não comporta essa ação.'); return; }
  if (c > 0) polPay(c, 'Articulação política: ' + v.name);
  v.talks++;

  const advBonus = typeof adv === 'function' ? (adv().pol || 0) : 0;
  const chance = clamp((55 + (v.rel - 50) * .4 + (S.political.gov - 50) * .2 + advBonus) * v.neg / polHard());
  const roll = Math.random() * 100 + (polChaos() ? (Math.random() * 30 - 15) : 0);
  let res, txt;
  if (roll < chance * .55)     { res = 'aceita';   v.rel = clamp(v.rel + A.rel); v.int = clamp(v.int + A.int); v.mood = Math.min(10, v.mood + 3); txt = 'aceitou e ficou mais próximo do governo.'; }
  else if (roll < chance)      { res = 'parcial';  v.rel = clamp(v.rel + Math.ceil(A.rel / 2)); v.int = clamp(v.int + Math.ceil(A.int / 2)); txt = 'aceitou parcialmente, mas quer ver resultados.'; }
  else if (roll < chance + 20) { res = 'condicao'; v.int = clamp(v.int + 2); txt = 'pediu outra condição: quer ação concreta em ' + v.demand + ' (' + v.region + ').'; }
  else if (Math.random() < A.risk * polHard()) { res = 'afasta'; v.rel = clamp(v.rel - 4); v.mood = Math.max(-10, v.mood - 3); txt = 'recusou e se afastou do governo.'; }
  else                         { res = 'neutro';   txt = 'ouviu, mas preferiu ficar neutro.'; }

  if (A.indic && res !== 'afasta' && typeof apply === 'function') {
    const k = Object.keys(v.areas)[0];
    apply({ [k]: act === 'regiao' ? 3 : 2 });
  }
  if (A.promise) S.political.log.push({ t: S.turn, type: 'promessa', vid, due: S.turn + 6 });
  save();
  toast(res === 'aceita' || res === 'parcial' ? 'g' : res === 'afasta' ? 'r' : 'b', A.n.toUpperCase(), v.name + ' ' + txt);
  if (typeof render === 'function') render();
  polOpenCouncilor(vid);
}

/* ---------- TELAS ---------- */
const polBar = (val, cls) => `<div class="polbar"><i class="${cls}" style="width:${Math.round(val)}%"></i></div>`;

function polOpenCouncilor(vid) {
  ensurePolitics();
  const v = S.council.find(x => x.id === vid); if (!v) return;
  const areas = Object.keys(v.areas).map(k => LBL[k] || k).join(', ');
  const sup = polSupport(v);
  show(`<h3>${v.name}</h3><p><span class="tag">${v.party || ''}</span> <span class="tag">${v.pers}</span></p>
    <p><b>Prioridades:</b> ${areas}<br><b>Região de interesse:</b> ${v.region}<br><b>Demanda principal:</b> ${v.demand}</p>
    <p>Relação com o prefeito ${polBar(v.rel, 'rel')}</p>
    <p>Interesse na agenda do governo ${polBar(v.int, 'int')}</p>
    <p>Tendência de voto: <b>${sup >= 60 ? 'favorável' : sup >= 40 ? 'indefinido' : 'contrário'}</b> · contatos este mês: ${v.talks}/2</p>
    ${Object.entries(POL_ACTIONS).map(([k, a]) => `<button class="opt" data-act="polneg" data-a="${v.id}" data-b="${k}" ${v.talks >= 2 ? 'disabled' : ''}><span>${a.n}</span><b>${a.cost ? fmt(polActCost(a)) : 'grátis'}</b></button>`).join('')}
    <p><button class="btn" data-act="polcam">Voltar</button> <button class="btn" data-act="close">Fechar</button></p>`, 0);
}

function polOpenPanel() {
  ensurePolitics();
  const b = polBand();
  show(`<h3>⚖️ Governabilidade</h3><p class="say">Situação do governo: <b class="st-${b[2]}">${b[1]}</b></p>${polBar(S.political.gov, 'gov-' + b[2])}
    <p>Interesse, relação e apoio são coisas diferentes: um vereador pode gostar da sua obra e ainda assim votar contra. Clique num vereador para negociar (até 2 contatos por mês cada).</p>
    <div class="polgrid">${S.council.map(v => { const s = polSupport(v);
      return `<button class="polv" data-act="polver" data-a="${v.id}"><b>${v.name}</b><small>${v.pers} · ${v.region}</small><small>${s >= 60 ? '🟢 favorável' : s >= 40 ? '🟡 indefinido' : '🔴 contrário'}</small></button>`; }).join('')}</div>
    <p><button class="btn" data-act="close">Fechar</button></p>`, 0, 'wide');
}

/* ---------- GOVERNABILIDADE ---------- */
function polBand() { const g = S.political.gov; return GOV_BANDS.find(b => g >= b[0]); }

function polComputeGov() {
  const C = S.council, I = S.ind;
  const favor = C.filter(v => polSupport(v) >= 55).length / C.length * 100;
  const rel = C.reduce((a, v) => a + v.rel, 0) / C.length;
  const fin = S.b > 0 ? Math.min(100, 50 + S.b / 200) : Math.max(0, 40 + S.b / 100);
  const raw = favor * .28 + rel * .2 + I.p * .22 + I.t * .12 + fin * .18 - S.political.pressure - S.political.rejected * 2;
  S.political.gov = clamp(Math.round(S.political.gov * .6 + clamp(raw) * .4));   // muda aos poucos
  return S.political.gov;
}

/* Ganchos chamados pelos outros módulos */
function polOnRejected() { ensurePolitics(); S.political.rejected++; S.political.pressure = Math.min(25, S.political.pressure + 2); }
function polOnCrisis(w) { ensurePolitics(); S.political.pressure = Math.min(25, S.political.pressure + (w || 3)); }

/* Rotina mensal (chamada pelo closeMonth existente) */
function polMonthly() {
  ensurePolitics();
  const P = S.political;
  if (P.cassado) return;
  S.council.forEach(v => {
    v.talks = 0;
    v.mood = Math.round(v.mood * .7);
    if (polChaos() && Math.random() < .08) {
      const d = Math.random() < .5 ? -8 : 6; v.rel = clamp(v.rel + d);
      polNews(d < 0 ? `${v.name} rompe publicamente com o governo` : `${v.name} se reaproxima do governo`, 'Mudança de posição agita os bastidores da Câmara.');
    }
  });
  P.log.filter(l => l.type === 'promessa' && !l.done && l.due <= S.turn).forEach(l => {
    l.done = true; const v = S.council.find(x => x.id === l.vid);
    if (v) { v.rel = clamp(v.rel - 6); polNews(`${v.name} cobra estudo prometido`, 'Vereador diz que a promessa da prefeitura nunca saiu do papel.'); }
  });
  P.pressure = Math.max(0, P.pressure - 1.5);
  const before = P.gov, g = polComputeGov();
  const bandNow = polBand(), bandBefore = GOV_BANDS.find(b => before >= b[0]);
  if (bandNow !== bandBefore) toast(bandNow[2] === 'g' ? 'g' : bandNow[2], 'GOVERNABILIDADE', bandNow[1] + '.');
  P.lowMonths = g < 20 ? P.lowMonths + 1 : 0;
  polCheckCassation();
}

/* ---------- CASSAÇÃO ---------- */
/* Só com contexto: 3 meses seguidos em risco extremo, aprovação < 35,
   7+ vereadores contrários, nunca no 1º semestre, intervalo de 10 meses. */
function polCheckCassation() {
  const P = S.political;
  if (P.cassado || P.cassPending || S.turn < 6 || S.turn - P.lastCass < 10) return;
  const against = S.council.filter(v => polSupport(v) < 40).length;
  if (P.lowMonths >= 3 && S.ind.p < 35 && against >= 7) P.cassPending = true;
  else if (P.lowMonths === 2) toast('r', 'ALERTA POLÍTICO', 'Vereadores falam abertamente em processo de cassação. Ainda há tempo de reagir.');
}

function polOpenCassation() {
  const P = S.political;
  P.cassPending = false; P.lastCass = S.turn; P.cassAttempts++;
  polNews('Câmara abre processo de cassação contra o prefeito', 'Após meses de desgaste, vereadores aprovam a abertura do processo.');
  save();
  show(`<h3>⚖️ PROCESSO DE CASSAÇÃO</h3><p class="say">Após meses de desgaste, a Câmara aprovou a abertura do processo. São necessários <b>9 dos 13 votos</b> (2/3) para cassar o mandato.</p>
    <p>Antes da votação, você pode fazer uma defesa.</p>
    <button class="opt" data-act="poldef" data-a="discurso"><span>Defesa em plenário<small>Funciona melhor com boa transparência</small></span><b>grátis</b></button>
    <button class="opt" data-act="poldef" data-a="acordo" ${S.b < 400 ? 'disabled' : ''}><span>Acordo com a base<small>Melhora a relação com aliados e independentes</small></span><b>${fmt(400)}</b></button>
    <button class="opt" data-act="poldef" data-a="nada"><span>Ir direto à votação</span><b>—</b></button>`, 1);
}

function polDefense(kind) {
  if (kind === 'acordo' && S.b >= 400) {
    polPay(400, 'Acordo político');
    S.council.forEach(v => { if (v.gov !== 0) v.rel = clamp(v.rel + 8); });
  }
  if (kind === 'discurso') S.council.forEach(v => { v.mood += S.ind.t >= 50 ? 4 : -2; });
  polRunCassationVote();
}

function polRunCassationVote() {
  const votes = S.council.map(v => ({ v, cass: Math.random() * 100 < clamp(100 - polSupport(v) - 5) }));
  const yes = votes.filter(x => x.cass).length, cassado = yes >= 9;
  const list = votes.map(x => `<div>${x.cass ? '🔴' : '🟢'} ${x.v.name} — ${x.cass ? 'pela cassação' : 'contra a cassação'}</div>`).join('');
  if (cassado) {
    S.political.cassado = true; S.done = 1;
    polNews('Mandato cassado: Câmara afasta o prefeito', `Foram ${yes} votos pela cassação.`);
    save();
    show(`<h2 class="st-r">MANDATO CASSADO</h2><p><b>${yes} votos</b> pela cassação.</p><div class="pollist">${list}</div>
      <p class="say">Após uma sucessão de crises políticas, aprovação em queda e perda de apoio na Câmara, o governo não conseguiu reunir votos suficientes para permanecer no cargo.</p>
      <p><button class="btn main" data-act="share">📸 Salvar foto do mandato</button> <button class="btn" data-act="polhome">Voltar ao início</button></p>`, 1, 'wide');
  } else {
    const P = S.political;
    P.pressure = Math.max(0, P.pressure - 10); P.gov = Math.max(P.gov, 30); P.lowMonths = 0;
    polNews('Prefeito sobrevive à votação de cassação', `Apenas ${yes} vereadores votaram pelo afastamento.`);
    save();
    show(`<h2 class="st-g">CRISE SUPERADA</h2><p>Apenas <b>${yes} votos</b> pela cassação (eram necessários 9).</p><div class="pollist">${list}</div>
      <p class="say">O governo sobreviveu, mas o recado foi dado. Reconstruir a base agora é prioridade.</p>
      <p><button class="btn main" data-act="polcont">Continuar mandato</button></p>`, 1, 'wide');
  }
}

/* ---------- INTEGRAÇÃO ---------- */
/* Ações de botão: main.js junta este objeto ao ACT */
const POL_ACT = {
  polcam: () => polOpenPanel(),
  polver: a => polOpenCouncilor(a),
  polneg: (a, b) => polNegotiate(a, b),
  poldef: a => polDefense(a),
  polcont: () => { closeModal(); if (typeof render === 'function') render(); },
  polhome: () => { closeModal(); home(); }
};

/* Mês: roda depois do closeMonth original (continua um único fechamento) */
(function () {
  const original = closeMonth;
  closeMonth = function () {
    const r = original.apply(this, arguments);
    try { polMonthly(); } catch (err) { console.error('politics:', err); }
    return r;
  };
})();

/* Evento do mês: se há cassação pendente, ela substitui o evento */
(function () {
  const original = showEvent;
  showEvent = function (e) {
    if (S && S.political && S.political.cassPending) return polOpenCassation();
    return original.apply(this, arguments);
  };
})();

/* Mandato cassado não avança mais */
(function () {
  const original = nextTurn;
  nextTurn = function () {
    if (S && S.political && S.political.cassado) return;
    return original.apply(this, arguments);
  };
})();
