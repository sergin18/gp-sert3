'use strict';
/* =====================================================================
   ECONOMY 2.0 — núcleo financeiro de SERTÂNIA: DESAFIO DE GESTÃO
   ---------------------------------------------------------------------
   Unidade monetária: milhares de reais (500 = R$ 500.000).
   S.b é a ÚNICA fonte de verdade do caixa. Toda entrada ou saída passa
   por addRevenue / addExpense / recordCashEffect, que alteram S.b e
   registram a origem em S.economy.

   Depende apenas de globais do game.js usadas em tempo de execução:
   S, DIFF, clamp, rnd e, opcionalmente, toast.
   Compatível com o sistema antigo: year(), costMult(), cost(),
   revenue(), expenses(), apply() e closeMonth() mantêm a interface.
   ===================================================================== */

/* ORÇAMENTO E INDICADORES */
const year = () => Math.min(4, Math.floor(S.turn / 12) + 1);
const costMult = () => 1 + .06 * (year() - 1);
const cost = o => Math.round(o[1] * costMult() / 10) * 10;

/* ESTADO DA ECONOMIA */
const ECON_REV = ['taxes', 'transfers', 'agreements', 'amendments', 'extraordinary'];
const ECON_EXP = ['payroll', 'maintenance', 'services', 'administrative', 'projects', 'emergency'];
const ECON_FIXED_SHARE = { payroll: .50, maintenance: .18, services: .20, administrative: .12 };
const emptyMonth = () => { const m = {}; ECON_REV.concat(ECON_EXP).forEach(k => { m[k] = 0; }); return m; };

/* Cria/completa S.economy sem apagar nada (seguro para saves antigos). */
function ensureEconomy() {
  const E = S.economy || (S.economy = {});
  ECON_REV.concat(ECON_EXP).forEach(k => { if (typeof E[k] !== 'number') E[k] = 0; });
  ['monthlyRevenue', 'monthlyExpenses', 'monthlyResult', 'reserve', 'deficitMonths'].forEach(k => { if (typeof E[k] !== 'number') E[k] = 0; });
  ['history', 'log', 'notices', 'agreementsAvailable', 'agreementsPending', 'agreementsApproved', 'agreementsRejected', 'amendmentsAvailable', 'programsAvailable']
    .forEach(k => { if (!Array.isArray(E[k])) E[k] = []; });
  if (!E._month) E._month = emptyMonth();          // fluxos do mês corrente ainda não fechados
  if (typeof E.taxModifier !== 'number') E.taxModifier = 1;   // multiplicador de arrecadação (eventos/projetos)
  if (!E.expenseAdjust) E.expenseAdjust = {};      // ajustes permanentes por categoria de despesa fixa
  if (E._lastBalance === undefined) E._lastBalance = null;
  if (!E._programsInit) { E.programsAvailable = PROGRAM_TEMPLATES.map(p => ({ ...p, requirements: { ...p.requirements }, status: 'available' })); E._programsInit = true; }
  return E;
}
function econLog(kind, cat, value, source) {
  const E = S.economy; E.log.push({ turn: S.turn, kind, cat, value, source: source || '' });
  if (E.log.length > 120) E.log.shift();
}
function notify(msg) {
  const E = ensureEconomy(); E.notices.push({ turn: S.turn, msg }); if (E.notices.length > 40) E.notices.shift();
  if (typeof toast === 'function') toast('b', 'ECONOMIA', msg);
}

/* RECEITAS */
const economicClimate = () => { const core = (S.ind.s + S.ind.e + S.ind.i + S.ind.a) / 4; return Math.max(.9, Math.min(1.1, 1 + (core - 50) / 500)); };

/* Receita regular do mês. Com noise=true aplica a variação do fechamento. */
function getMonthlyRevenue(noise) {
  const E = ensureEconomy(), k = DIFF[S.diff].rev;
  let taxes = (70 + S.ind.c * 1.4) * economicClimate() * E.taxModifier * k;
  if (noise) taxes *= rnd(.94, 1.06);
  const o = { taxes: Math.round(taxes), transfers: Math.round(250 * k * (1 + .02 * (year() - 1))) };
  o.total = o.taxes + o.transfers;
  return o;
}
function addRevenue(cat, value, source) {
  if (!ECON_REV.includes(cat) || !(value > 0)) return false;
  const E = ensureEconomy();
  S.b += value; S.rec += value; E[cat] += value; E._month[cat] += value;
  econLog('in', cat, value, source); return true;
}

/* DESPESAS */
function getMonthlyExpenses() {
  const E = ensureEconomy(), base = 300 * (1 + .05 * (year() - 1)), o = {}; let t = 0;
  for (const c in ECON_FIXED_SHARE) { o[c] = Math.max(0, Math.round(base * ECON_FIXED_SHARE[c] + (E.expenseAdjust[c] || 0))); t += o[c]; }
  o.total = t; return o;
}
function addExpense(cat, value, source) {
  if (!ECON_EXP.includes(cat) || !(value > 0)) return false;
  const E = ensureEconomy();
  S.b -= value; S.exp += value; E[cat] += value; E._month[cat] += value;
  econLog('out', cat, value, source); return true;
}
/* Ajuste permanente (mensal) de uma despesa fixa: delta positivo encarece, negativo economiza. */
function adjustFixedExpense(cat, delta) { const E = ensureEconomy(); if (cat in ECON_FIXED_SHARE) E.expenseAdjust[cat] = (E.expenseAdjust[cat] || 0) + delta; }
function setTaxModifier(m) { ensureEconomy().taxModifier = Math.max(.5, Math.min(1.5, m)); }

/* FECHAMENTO MENSAL */
function closeMonth() {
  const E = ensureEconomy(), m = E._month;
  // fluxos que ocorreram fora do registro (decisões de eventos, parcelas de obras) desde o último fechamento
  const tracked = ECON_REV.reduce((a, k) => a + m[k], 0) - ECON_EXP.reduce((a, k) => a + m[k], 0);
  const otherFlows = E._lastBalance === null ? 0 : Math.round(S.b - E._lastBalance - tracked);
  processAgreements();
  const rv = getMonthlyRevenue(true), ex = getMonthlyExpenses();
  const regular = rv.total, fixed = ex.total;
  S.b += regular - fixed; S.rec += regular; S.exp += fixed;              // S.b continua sendo o caixa oficial
  E.taxes += rv.taxes; E.transfers += rv.transfers;
  ['payroll', 'maintenance', 'services', 'administrative'].forEach(c => { E[c] += ex[c]; });
  const revenueCat = { taxes: rv.taxes + m.taxes, transfers: rv.transfers + m.transfers, agreements: m.agreements, amendments: m.amendments, extraordinary: m.extraordinary };
  const expenseCat = { payroll: ex.payroll + m.payroll, maintenance: ex.maintenance + m.maintenance, services: ex.services + m.services, administrative: ex.administrative + m.administrative, projects: m.projects, emergency: m.emergency };
  const totalRevenue = ECON_REV.reduce((a, k) => a + revenueCat[k], 0), totalExpenses = ECON_EXP.reduce((a, k) => a + expenseCat[k], 0);
  const result = totalRevenue - totalExpenses;
  E.monthlyRevenue = totalRevenue; E.monthlyExpenses = totalExpenses; E.monthlyResult = result;
  updateDeficit(result);
  E.history.push({ month: S.turn + 1, year: year(), revenue: revenueCat, expenses: expenseCat, totalRevenue, totalExpenses, result, otherFlows, balanceAfter: Math.round(S.b), deficitMonths: E.deficitMonths });
  if (E.history.length > 60) E.history.shift();
  E._month = emptyMonth(); E._lastBalance = S.b;
  if (S.turn % 3 === 0) { generateAgreements(); generateAmendments(); }
  return E.history[E.history.length - 1];
}

/* RESULTADO E DÉFICIT */
/* Mês com resultado negativo soma 1 à sequência; qualquer mês sem déficit zera a sequência. */
function updateDeficit(result) { const E = ensureEconomy(); E.deficitMonths = result < 0 ? E.deficitMonths + 1 : 0; }
const isInDeficit = () => ensureEconomy().deficitMonths > 0;
function getFinancialResult() {
  const E = ensureEconomy(), r = getMonthlyRevenue(false).total, x = getMonthlyExpenses().total;
  return { cash: S.b, reserve: E.reserve, lastRevenue: E.monthlyRevenue, lastExpenses: E.monthlyExpenses, lastResult: E.monthlyResult,
    projectedRevenue: r, projectedExpenses: x, projectedResult: r - x, deficitMonths: E.deficitMonths };
}

/* RESERVA */
/* A reserva nunca é criada automaticamente: só por ação explícita. Ela fica fora de S.b. */
const getReserve = () => ensureEconomy().reserve;
function addReserve(value) { const E = ensureEconomy(); if (!(value > 0) || S.b < value) return false; S.b -= value; E.reserve += value; econLog('reserve', 'reserve', value, 'Depósito na reserva'); return true; }
function useReserve(value) { const E = ensureEconomy(), v = Math.min(Math.max(0, value), E.reserve); if (!v) return 0; E.reserve -= v; S.b += v; econLog('reserve', 'reserve', -v, 'Uso da reserva'); return v; }
function setReserve(target) { const d = Math.max(0, target) - getReserve(); return d > 0 ? addReserve(Math.min(d, Math.max(0, S.b))) : (d < 0 ? useReserve(-d) > 0 : true); }

/* Gasto vinculado: o dinheiro externo entra e é aplicado na finalidade; o caixa livre só perde a contrapartida. */
function receiveEarmarked(cat, amount, counterpart, source) {
  addRevenue(cat, amount, source); addExpense('projects', amount + counterpart, source);
}
function canPayCounterpart(c) { return S.b >= c; }
function pickFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* CONVÊNIOS */
/* Fluxo: available → requested → analysis → approved → received  (ou → rejected / expired). */
const AGREEMENT_TEMPLATES = [
  { id: 'saude_ubs', title: 'Convênio para reforma de unidade de saúde', area: 's', amount: 800, counterpart: 100, deadline: 4, impact: 4, difficulty: 'medium', chance: 65 },
  { id: 'escola_reforma', title: 'Convênio para reforma de escolas', area: 'e', amount: 900, counterpart: 120, deadline: 4, impact: 4, difficulty: 'medium', chance: 62 },
  { id: 'estradas_rurais', title: 'Convênio para recuperação de estradas rurais', area: 'r', amount: 1200, counterpart: 200, deadline: 5, impact: 5, difficulty: 'hard', chance: 50 },
  { id: 'agua_pocos', title: 'Convênio para poços e adutoras', area: 'a', amount: 1000, counterpart: 150, deadline: 4, impact: 5, difficulty: 'medium', chance: 60 },
  { id: 'infra_pav', title: 'Convênio para pavimentação urbana', area: 'i', amount: 1500, counterpart: 250, deadline: 6, impact: 5, difficulty: 'hard', chance: 48 },
  { id: 'eco_feira', title: 'Convênio para feira e apoio ao comércio', area: 'c', amount: 500, counterpart: 60, deadline: 3, impact: 3, difficulty: 'easy', chance: 70 },
  { id: 'amb_residuos', title: 'Convênio para gestão de resíduos', area: 'm', amount: 600, counterpart: 70, deadline: 3, impact: 4, difficulty: 'easy', chance: 68 },
  { id: 'rural_agri', title: 'Convênio para apoio à agricultura familiar', area: 'r', amount: 700, counterpart: 80, deadline: 4, impact: 4, difficulty: 'medium', chance: 64 }
];
const DIFFICULTY_CHANCE = { easy: 10, medium: 0, hard: -12 };
const AGREEMENT_LISTS = ['agreementsAvailable', 'agreementsPending', 'agreementsApproved'];
const AGREEMENT_PREP_COST = a => Math.max(20, Math.round(a.amount * .04));   // custo administrativo de preparar o pedido

/* Chance real de aprovação (5–95). Usa só dados que já existem; ignora o que ainda não foi integrado. */
function agreementChance(a) {
  let c = a.chance + (DIFFICULTY_CHANCE[a.difficulty] || 0);
  c += (S.ind.t - 50) * .25;                                                  // transparência
  c -= ensureEconomy().deficitMonths * 2;                                     // finanças desorganizadas
  c -= (DIFF[S.diff].neg - 1) * 8;                                            // dificuldade do jogo
  if (S.council && S.council.length) c += (S.council.reduce((x, v) => x + v.rel, 0) / S.council.length - 50) * .15;   // relação institucional
  if (S.advisor === 'poli') c += 4; else if (S.advisor === 'angelos') c += 3; // capacidade administrativa / articulação
  return Math.round(Math.max(5, Math.min(95, c)));
}
function findAgreement(id) {
  const E = ensureEconomy();
  for (const l of AGREEMENT_LISTS) { const i = E[l].findIndex(a => a.id === id); if (i >= 0) return { a: E[l][i], list: l, i }; }
  return null;
}
function moveAgreement(id, toList) { const E = ensureEconomy(), f = findAgreement(id); if (!f) return null; E[f.list].splice(f.i, 1); if (toList) E[toList].push(f.a); return f.a; }

/* Mantém até `max` ofertas disponíveis, sem repetir convênios que já estão em andamento. */
function generateAgreements(max) {
  const E = ensureEconomy(), lim = max || 4;
  const used = new Set([].concat(E.agreementsAvailable, E.agreementsPending, E.agreementsApproved).map(a => a.id));
  const pool = AGREEMENT_TEMPLATES.filter(t => !used.has(t.id));
  const fresh = [];
  while (E.agreementsAvailable.length < lim && pool.length) {
    const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], k = costMult();
    const a = { ...t, amount: Math.round(t.amount * k / 10) * 10, counterpart: Math.round(t.counterpart * k / 10) * 10, status: 'available', expiresAt: S.turn + 6 };
    E.agreementsAvailable.push(a); fresh.push(a);
  }
  return fresh;
}
function requestAgreement(id) {
  const E = ensureEconomy(), f = findAgreement(id);
  if (!f || f.a.status !== 'available') return { ok: false, reason: 'Convênio indisponível.' };
  const prep = AGREEMENT_PREP_COST(f.a);
  if (S.b < prep) return { ok: false, reason: 'Caixa insuficiente para preparar o pedido.' };
  addExpense('administrative', prep, 'Preparação: ' + f.a.title);
  const a = moveAgreement(id, 'agreementsPending');
  a.status = 'requested'; a.requestedAt = S.turn; a.resolveAt = S.turn + a.deadline; a.prepCost = prep;
  return { ok: true, agreement: a, prepCost: prep };
}
/* Sorteia o resultado. A aprovação nunca é garantida. */
function resolveAgreement(id) {
  const f = findAgreement(id);
  if (!f || (f.a.status !== 'requested' && f.a.status !== 'analysis')) return { ok: false, reason: 'Convênio não está em análise.' };
  const chance = agreementChance(f.a), approved = Math.random() * 100 < chance;
  const a = moveAgreement(id, approved ? 'agreementsApproved' : 'agreementsRejected');
  a.status = approved ? 'approved' : 'rejected'; a.chanceUsed = chance;
  notify(approved ? `Convênio aprovado: ${a.title}.` : `Convênio rejeitado: ${a.title}.`);
  return { ok: true, approved, agreement: a, chance };
}
/* Libera o recurso aprovado: entra como receita de convênio, é aplicado na finalidade e o caixa paga só a contrapartida. */
function receiveAgreement(id) {
  const f = findAgreement(id);
  if (!f || f.a.status !== 'approved') return { ok: false, reason: 'Convênio não aprovado.' };
  const a = f.a;
  if (!canPayCounterpart(a.counterpart)) return { ok: false, reason: 'Caixa insuficiente para a contrapartida.' };
  receiveEarmarked('agreements', a.amount, a.counterpart, 'Convênio: ' + a.title);
  apply({ [a.area]: a.impact, p: 1 });
  a.status = 'received'; a.receivedAt = S.turn;
  notify(`Recurso do convênio recebido: ${a.title}.`);
  return { ok: true, agreement: a };
}
/* Chamado no fechamento do mês: expira ofertas, avança análises, decide e libera recursos. */
function processAgreements() {
  const E = ensureEconomy();
  E.agreementsAvailable.filter(a => S.turn >= a.expiresAt).forEach(a => { moveAgreement(a.id, null); a.status = 'expired'; });
  E.agreementsPending.slice().forEach(a => {
    if (S.turn >= a.resolveAt) resolveAgreement(a.id); else if (a.status === 'requested') a.status = 'analysis';
  });
  E.agreementsApproved.filter(a => a.status === 'approved').forEach(a => receiveAgreement(a.id));
}

/* EMENDAS */
/* Emendas têm finalidade fixa: o valor é aplicado no destino e não vira dinheiro livre. */
const AMENDMENT_TEMPLATES = [
  { id: 'em_pav', title: 'Emenda para pavimentação', area: 'i', amount: 1200, counterpart: 200, destination: 'infraestrutura', deadline: 6 },
  { id: 'em_saude', title: 'Emenda para equipamentos de saúde', area: 's', amount: 700, counterpart: 80, destination: 'saúde', deadline: 6 },
  { id: 'em_escola', title: 'Emenda para transporte escolar', area: 'e', amount: 600, counterpart: 60, destination: 'educação', deadline: 5 },
  { id: 'em_agua', title: 'Emenda para cisternas e poços', area: 'a', amount: 800, counterpart: 90, destination: 'abastecimento', deadline: 6 }
];
function generateAmendments(max) {
  const E = ensureEconomy(), lim = max || 2, taken = new Set(E.amendmentsAvailable.map(a => a.id)), fresh = [];
  const pool = AMENDMENT_TEMPLATES.filter(t => !taken.has(t.id) && !E.log.some(l => l.cat === 'amendments' && l.source === 'Emenda: ' + t.title));
  while (E.amendmentsAvailable.length < lim && pool.length && Math.random() < .5) {
    const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], k = costMult();
    const a = { ...t, amount: Math.round(t.amount * k / 10) * 10, counterpart: Math.round(t.counterpart * k / 10) * 10, status: 'available', expiresAt: S.turn + t.deadline };
    E.amendmentsAvailable.push(a); fresh.push(a);
  }
  return fresh;
}
function acceptAmendment(id) {
  const E = ensureEconomy(), i = E.amendmentsAvailable.findIndex(a => a.id === id);
  if (i < 0) return { ok: false, reason: 'Emenda indisponível.' };
  const a = E.amendmentsAvailable[i];
  if (!canPayCounterpart(a.counterpart)) return { ok: false, reason: 'Caixa insuficiente para a contrapartida.' };
  receiveEarmarked('amendments', a.amount, a.counterpart, 'Emenda: ' + a.title);
  apply({ [a.area]: Math.max(2, Math.round(a.amount / 250)), p: 1 });
  a.status = 'executed'; E.amendmentsAvailable.splice(i, 1);
  return { ok: true, amendment: a };
}
function declineAmendment(id) { const E = ensureEconomy(), i = E.amendmentsAvailable.findIndex(a => a.id === id); if (i < 0) return false; E.amendmentsAvailable.splice(i, 1); return true; }

/* PROGRAMAS */
const PROGRAM_TEMPLATES = [
  { id: 'agua_sertao', title: 'Programa Água para o Sertão', area: 'a', amount: 1500, counterpart: 150, requirements: { t: 45 }, impact: 8 },
  { id: 'escola_conectada', title: 'Programa Escola Conectada', area: 'e', amount: 1000, counterpart: 100, requirements: { t: 50 }, impact: 6 }
];
function programEligible(id) { const p = ensureEconomy().programsAvailable.find(x => x.id === id); return !!p && p.status === 'available' && Object.keys(p.requirements).every(k => S.ind[k] >= p.requirements[k]); }
function joinProgram(id) {
  const E = ensureEconomy(), p = E.programsAvailable.find(x => x.id === id);
  if (!p || p.status !== 'available') return { ok: false, reason: 'Programa indisponível.' };
  if (!programEligible(id)) return { ok: false, reason: 'Requisitos do programa não atendidos.' };
  if (!canPayCounterpart(p.counterpart)) return { ok: false, reason: 'Caixa insuficiente para a contrapartida.' };
  receiveEarmarked('transfers', p.amount, p.counterpart, 'Programa: ' + p.title);
  apply({ [p.area]: p.impact, p: 2 });
  p.status = 'joined'; return { ok: true, program: p };
}

/* RECEITAS E DESPESAS EXTRAORDINÁRIAS */
const addExtraordinaryRevenue = (value, source) => addRevenue('extraordinary', value, source);   // ex.: recurso inesperado
const addEmergencyExpense = (value, source) => addExpense('emergency', value, source);           // ex.: enchente, seca, acidente

/* COMPATIBILIDADE COM SISTEMA ANTIGO */
/* Previsões usadas pela interface atual ("Receita prevista" e "Despesas previstas"). */
const revenue = () => getMonthlyRevenue(false).total;
const expenses = () => getMonthlyExpenses().total;

/* Efeitos de eventos e projetos. Letras alteram indicadores; "$" altera o caixa (S.b) como antes
   e agora também é registrado na economia, sem mexer em S.rec/S.exp (comportamento anterior). */
function recordCashEffect(v, source) {
  const E = ensureEconomy();
  S.b += v;
  if (v > 0) { S.gain += v; E.extraordinary += v; E._month.extraordinary += v; econLog('in', 'extraordinary', v, source || 'Efeito de evento'); }
  else if (v < 0) { E.emergency += -v; E._month.emergency += -v; econLog('out', 'emergency', -v, source || 'Efeito de evento'); }
}
function apply(o) {
  for (const k in o) {
    if (k === '$') recordCashEffect(o[k]);
    else if (S.ind[k] !== undefined) S.ind[k] = clamp(S.ind[k] + o[k]);
  }
}
