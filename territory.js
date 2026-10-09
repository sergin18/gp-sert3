'use strict';
/* =====================================================================
   TERRITORY — 🗺️ Território: Cidade e Zona Rural
   ---------------------------------------------------------------------
   • Carregado depois de projects.js e antes de main.js.
   • Dados ficam em S.territory (criado por ensureTerritory, seguro
     para saves antigos).
   • Obras locais são ações do Executivo (não passam pela Câmara),
     pagas pelo caixa único via addExpense('projects').
   • Os projetos grandes continuam no sistema de Projetos: a região
     só mostra atalhos para eles (sem duplicar nada).
   • Integra com politics.js: vereadores cuja região de interesse é a
     mesma da obra ganham relação e interesse.
   • Nomes: listas fornecidas no prompt do projeto. As áreas urbanas
     aparecem como "área urbana" (sem afirmar que são bairros oficiais).
     O mapa é ilustrativo: as posições não são geográficas.
   ===================================================================== */

/* ---------- REGIÕES ---------- */
/* [id, nome, tipo, x%, y%] */
const TER_CITY = [
  ['centro', 'Centro', 'Área urbana', 50, 48],
  ['altoceu', 'Alto do Céu', 'Área urbana', 30, 22],
  ['altoconc', 'Alto da Conceição', 'Área urbana', 68, 20],
  ['altorb', 'Alto do Rio Branco', 'Área urbana', 84, 40],
  ['mariomelo', 'Mário Melo', 'Área urbana', 18, 50],
  ['mmnova', 'Mário Melo Nova', 'Área urbana', 10, 70],
  ['novaser', 'Nova Sertânia', 'Área urbana', 34, 76],
  ['cohab', 'Vila da COHAB', 'Área urbana', 56, 80],
  ['ferrov', 'Ferro Velho', 'Área urbana', 76, 64],
  ['ferron', 'Ferro Novo', 'Área urbana', 90, 80],
  ['ceramica', 'Cerâmica', 'Área urbana', 14, 28],
  ['cocane', 'Jardim COCANE', 'Área urbana', 70, 44],
  ['pedrag', 'Pedra Grande', 'Área urbana', 36, 48]
];
const TER_RURAL = [
  ['d_sertania', 'Sertânia (sede)', 'Distrito', 50, 50],
  ['d_algodoes', 'Algodões', 'Distrito', 24, 26],
  ['d_hdias', 'Henrique Dias', 'Distrito', 78, 24],
  ['d_riobarra', 'Rio da Barra', 'Distrito', 22, 74],
  ['d_albne', 'Albuquerque Né', 'Distrito', 78, 76],
  ['p_pernambuquinho', 'Pernambuquinho', 'Povoado / localidade', 38, 14],
  ['p_cruzeiro', 'Cruzeiro do Nordeste', 'Povoado / localidade', 62, 12],
  ['p_moderna', 'Moderna', 'Povoado / localidade', 92, 48],
  ['p_umburanas', 'Umburanas', 'Povoado / localidade', 8, 50],
  ['p_manicoba', 'Maniçoba', 'Povoado / localidade', 38, 88],
  ['p_caroalina', 'Caroalina', 'Povoado / localidade', 62, 90],
  ['p_varzea', 'Várzea Velha', 'Povoado / localidade', 36, 40],
  ['p_waldemar', 'Waldemar Siqueira', 'Povoado / localidade', 64, 62]
];
const TER_ALL = TER_CITY.map(r => ({ id: r[0], n: r[1], tipo: r[2], x: r[3], y: r[4], zone: 'city' }))
  .concat(TER_RURAL.map(r => ({ id: r[0], n: r[1], tipo: r[2], x: r[3], y: r[4], zone: 'rural' })));
const terDef = id => TER_ALL.find(r => r.id === id);

/* ---------- OBRAS E AÇÕES LOCAIS ---------- */
/* c = custo (milhares), m = meses até concluir, f = efeito nos indicadores, cond = melhora local */
const TER_WORKS = {
  pav:      { n: 'Pavimentação de ruas',        ic: '🚧', c: 260, m: 2, f: { i: 2, p: 1 },       cond: 12 },
  luz:      { n: 'Iluminação pública',          ic: '💡', c: 120, m: 1, f: { i: 1, p: 1 },       cond: 8 },
  dren:     { n: 'Drenagem e galerias',         ic: '🌧️', c: 220, m: 2, f: { i: 2, s: 1 },       cond: 10 },
  limp:     { n: 'Mutirão de limpeza',          ic: '🧹', c: 50,  m: 1, f: { m: 1, s: 1 },       cond: 6 },
  praca:    { n: 'Reforma de praça',            ic: '🌳', c: 140, m: 2, f: { m: 1, p: 2 },       cond: 8 },
  ubs:      { n: 'Reforço no posto de saúde',   ic: '🏥', c: 180, m: 1, f: { s: 2, p: 1 },       cond: 9 },
  escola:   { n: 'Reparos na escola',           ic: '📚', c: 160, m: 2, f: { e: 2, p: 1 },       cond: 9 },
  comercio: { n: 'Apoio ao comércio local',     ic: '💼', c: 90,  m: 1, f: { c: 2 },             cond: 6 },
  estrada:  { n: 'Recuperação de estrada vicinal', ic: '🛣️', c: 240, m: 2, f: { i: 1, r: 2 },   cond: 12 },
  agua:     { n: 'Cisternas e carro-pipa',      ic: '💧', c: 150, m: 1, f: { a: 2, r: 1 },       cond: 10 },
  poco:     { n: 'Perfuração de poço',          ic: '⛲', c: 210, m: 2, f: { a: 2, r: 2 },       cond: 12 },
  transp:   { n: 'Transporte escolar rural',    ic: '🚌', c: 110, m: 1, f: { e: 2, r: 1 },       cond: 8 },
  saudeit:  { n: 'Saúde itinerante',            ic: '🩺', c: 90,  m: 1, f: { s: 2, r: 1 },       cond: 7 },
  agric:    { n: 'Apoio à agricultura',         ic: '🌾', c: 130, m: 2, f: { r: 2, c: 1 },       cond: 9 },
  luzr:     { n: 'Iluminação e acessos',        ic: '🔦', c: 100, m: 1, f: { i: 1, r: 1 },       cond: 7 }
};
const TER_POOL = {
  city:  ['pav', 'luz', 'dren', 'limp', 'praca', 'ubs', 'escola', 'comercio'],
  rural: ['estrada', 'agua', 'poco', 'transp', 'saudeit', 'agric', 'luzr']
};
/* Áreas do sistema de Projetos ligadas a cada zona (para os atalhos) */
const TER_PROJ_AREAS = {
  city:  ['Infraestrutura', 'Saúde', 'Educação', 'Meio ambiente', 'Economia', 'Mobilidade'],
  rural: ['Zona rural', 'Água', 'Infraestrutura', 'Educação']
};

/* ---------- UTILITÁRIOS ---------- */
const terPick = a => a[Math.floor(Math.random() * a.length)];
const terFail = () => ({ normal: .06, desafio: .10, caos: .18 }[S && S.diff] || .06);
const terCost = w => Math.round(w.c * (typeof costMult === 'function' ? costMult() : 1) / 10) * 10;
const terState = c => c >= 70 ? ['g', 'Bem atendida', '😊 A população aprova'] : c >= 50 ? ['y', 'Regular', '😐 A população espera mais']
  : c >= 30 ? ['y', 'Precária', '😠 Moradores reclamam'] : ['r', 'Crítica', '📢 Moradores protestam'];
const terCouncilors = name => (S.council || []).filter(v => v.region === name);

/* ---------- ESTADO / MIGRAÇÃO ---------- */
function ensureTerritory() {
  if (!S) return;
  const T = S.territory || (S.territory = {});
  if (!T.regions || typeof T.regions !== 'object') T.regions = {};
  if (!Array.isArray(T.works)) T.works = [];
  if (typeof T.tab !== 'string') T.tab = 'city';
  TER_ALL.forEach(r => {
    let R = T.regions[r.id];
    if (!R) {
      R = T.regions[r.id] = { cond: Math.round(rnd(38, 62)), demands: [], done: 0 };
      const pool = TER_POOL[r.zone].slice();
      for (let i = 0; i < 2; i++) { const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; R.demands.push({ wk: k, since: S.turn || 0 }); }
    }
    if (typeof R.cond !== 'number') R.cond = 50;
    if (!Array.isArray(R.demands)) R.demands = [];
    if (typeof R.done !== 'number') R.done = 0;
  });
  return T;
}

/* ---------- TELAS ---------- */
function terOpen(tab) {
  const T = ensureTerritory();
  if (tab) T.tab = tab;
  const zone = T.tab, list = TER_ALL.filter(r => r.zone === zone);
  const pins = list.map(r => {
    const R = T.regions[r.id], st = terState(R.cond), busy = T.works.some(w => w.rid === r.id);
    const dm = R.demands.length;
    return `<button class="tpin tp-${st[0]} ${r.tipo === 'Distrito' ? 'tdist' : ''}" style="left:${r.x}%;top:${r.y}%" data-act="terreg" data-a="${r.id}" title="${r.n} · ${st[1]}">
      <span>${r.n}</span>${dm ? `<i>${dm}</i>` : ''}${busy ? '<em>🚧</em>' : ''}</button>`;
  }).join('');
  const crit = list.filter(r => T.regions[r.id].cond < 30).length;
  show(`<h3>🗺️ Território</h3>
    <div class="ttabs"><button class="${zone === 'city' ? 'on' : ''}" data-act="tertab" data-a="city">🏙️ Cidade</button><button class="${zone === 'rural' ? 'on' : ''}" data-act="tertab" data-a="rural">🌾 Zona rural</button></div>
    <div class="tmap tm-${zone}">${pins}</div>
    <p class="tleg"><span class="tp-g">●</span> bem atendida <span class="tp-y">●</span> regular/precária <span class="tp-r">●</span> crítica · número = demandas abertas · 🚧 obra em andamento</p>
    ${crit ? `<p class="say">⚠️ ${crit} localidade(s) em situação crítica.</p>` : ''}
    <p><small>Mapa ilustrativo: as posições não representam a geografia real.${zone === 'rural' ? ' Além dos distritos e povoados, o município tem numerosas comunidades e sítios.' : ''}</small></p>
    <p><button class="btn" data-act="close">Fechar</button></p>`, 0, 'wide');
}

function terOpenRegion(rid) {
  const T = ensureTerritory(), r = terDef(rid); if (!r) return;
  const R = T.regions[rid], st = terState(R.cond);
  const running = T.works.filter(w => w.rid === rid);
  const vs = terCouncilors(r.n);
  const pool = TER_POOL[r.zone];
  const demandSet = R.demands.map(d => d.wk);
  const works = pool.map(k => {
    const w = TER_WORKS[k], c = terCost(w), isD = demandSet.includes(k), isRun = running.some(x => x.wk === k);
    return `<button class="opt ${isD ? 'tdem' : ''}" data-act="terwork" data-a="${rid}" data-b="${k}" ${isRun || S.b < c ? 'disabled' : ''}>
      <span>${w.ic} ${w.n}${isD ? ' <b class="st-r">· demanda</b>' : ''}<small>${w.m} ${w.m > 1 ? 'meses' : 'mês'}${isRun ? ' · em andamento' : ''}</small></span><b>${fmt(c)}</b></button>`;
  }).join('');
  const projs = typeof avail === 'function'
    ? TER_PROJ_AREAS[r.zone].flatMap(a => avail(a)).filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i).slice(0, 3) : [];
  show(`<span class="tag">${r.tipo}</span> <span class="tag">${r.zone === 'city' ? '🏙️ Cidade' : '🌾 Zona rural'}</span>
    <h3>📍 ${r.n.toUpperCase()}</h3>
    <p>Situação: <b class="st-${st[0]}">${st[1]}</b> · ${st[2]}</p>
    <div class="polbar"><i class="gov-${st[0]}" style="width:${Math.round(R.cond)}%"></i></div>
    <p><b>Demandas da população:</b> ${R.demands.length ? R.demands.map(d => `${TER_WORKS[d.wk].ic} ${TER_WORKS[d.wk].n.toLowerCase()} <small>(há ${Math.max(0, S.turn - d.since)} mês(es))</small>`).join(' · ') : 'nenhuma no momento'}</p>
    ${running.length ? `<p><b>Em andamento:</b> ${running.map(w => TER_WORKS[w.wk].n + ' (até ' + (typeof dt === 'function' ? dt(w.at) : 'breve') + ')').join(' · ')}</p>` : ''}
    <p><b>Vereador(es) com interesse na região:</b> ${vs.length ? vs.map(v => `<button class="btn small" data-act="polver" data-a="${v.id}">${v.name}</button>`).join(' ') : 'nenhum vereador tem esta região como prioridade'}</p>
    ${vs.length ? '<p><small>Atender esta localidade melhora a relação e o interesse desses vereadores.</small></p>' : ''}
    <h4>Obras e ações locais</h4>${works}
    <p><small>Ações locais são do Executivo e não passam pela Câmara. Obras podem dar problema.</small></p>
    ${projs.length ? `<h4>Projetos municipais que beneficiam a região</h4>${projs.map(d => `<button class="opt" data-act="mk" data-a="${d.id}"><span>${d.title}<small>Projeto de Lei · vai à Câmara · ${d.months} meses</small></span><b>${fmt(Math.round(d.cost * costMult() * adv().cost / 10) * 10)}</b></button>`).join('')}` : ''}
    <p><button class="btn" data-act="tertab" data-a="${r.zone}">Voltar ao mapa</button> <button class="btn" data-act="close">Fechar</button></p>`, 0, 'wide');
}

/* ---------- AÇÕES ---------- */
function terWork(rid, wk) {
  const T = ensureTerritory(), r = terDef(rid), w = TER_WORKS[wk];
  if (!r || !w) return;
  if (T.works.some(x => x.rid === rid && x.wk === wk)) return;
  const c = terCost(w);
  if (S.b < c) { toast('r', 'SEM RECURSOS', 'O caixa não comporta essa obra.'); return; }
  if (typeof addExpense === 'function') addExpense('projects', c, 'Obra local: ' + w.n + ' — ' + r.n); else S.b -= c;
  T.works.push({ rid, wk, at: S.turn + w.m, cost: c });
  toast('b', 'OBRA INICIADA', w.n + ' em ' + r.n + '.');
  if (typeof feed === 'function') feed('Obra iniciada: ' + w.n + ' em ' + r.n);
  save();
  if (typeof render === 'function') render();
  terOpenRegion(rid);
}

/* ---------- ROTINA MENSAL ---------- */
function terMonthly() {
  const T = ensureTerritory();
  if (S.political && S.political.cassado) return;

  // 1) obras que terminam neste mês
  const due = T.works.filter(w => w.at <= S.turn);
  T.works = T.works.filter(w => w.at > S.turn);
  due.forEach(w => {
    const r = terDef(w.rid), R = T.regions[w.rid], W = TER_WORKS[w.wk];
    if (!r || !R || !W) return;
    if (Math.random() < terFail()) {
      R.cond = clamp(R.cond - 2);
      publishNews(r.zone === 'city' ? 'Infraestrutura' : 'Zona rural', `Obra em ${r.n} apresenta problemas`, `${W.n} foi entregue com falhas e moradores reclamam.`);
      toast('y', 'ATENÇÃO', W.n + ' em ' + r.n + ' apresentou problemas.');
      terCouncilors(r.n).forEach(v => { v.mood = Math.max(-10, (v.mood || 0) - 2); });
      return;
    }
    apply(W.f);
    R.cond = clamp(R.cond + W.cond); R.done++;
    R.demands = R.demands.filter(d => d.wk !== w.wk);
    terCouncilors(r.n).forEach(v => {
      v.rel = clamp(v.rel + 4);
      if (typeof v.int === 'number') v.int = clamp(v.int + 6);
      v.mood = Math.min(10, (v.mood || 0) + 2);
    });
    publishNews(r.zone === 'city' ? 'Infraestrutura' : 'Zona rural', `Prefeitura conclui ${W.n.toLowerCase()} em ${r.n}`, 'Moradores aprovam a melhoria na localidade.');
    toast('g', 'RESULTADO POSITIVO', W.n + ' concluída em ' + r.n + '.');
  });

  // 2) regiões: desgaste, demandas antigas e novas demandas
  const newChance = { normal: .10, desafio: .14, caos: .20 }[S.diff] || .10;
  TER_ALL.forEach(r => {
    const R = T.regions[r.id];
    R.cond = clamp(R.cond - rnd(0, .8));
    R.demands.forEach(d => {
      if (!d.warned && S.turn - d.since >= 8) {
        d.warned = 1;
        R.cond = clamp(R.cond - 3);
        apply({ p: -1 });
        terCouncilors(r.n).forEach(v => { v.mood = Math.max(-10, (v.mood || 0) - 3); v.rel = clamp(v.rel - 2); });
        publishNews('Cotidiano', `Moradores de ${r.n} cobram ${TER_WORKS[d.wk].n.toLowerCase()}`, 'A demanda está sem resposta há meses.');
      }
    });
    if (R.demands.length < 3 && Math.random() < newChance) {
      const free = TER_POOL[r.zone].filter(k => !R.demands.some(d => d.wk === k));
      if (free.length) R.demands.push({ wk: terPick(free), since: S.turn });
    }
  });
}

/* ---------- INTEGRAÇÃO ---------- */
const TER_ACT = {
  ter: () => terOpen(),
  tertab: a => terOpen(a),
  terreg: a => terOpenRegion(a),
  terwork: (a, b) => terWork(a, b)
};

/* Roda depois do closeMonth (que já inclui a rotina política). Um único fechamento por mês. */
(function () {
  const original = closeMonth;
  closeMonth = function () {
    const r = original.apply(this, arguments);
    try { terMonthly(); } catch (err) { console.error('territory:', err); }
    return r;
  };
})();
