'use strict';
/* =====================================================================
   SAVE — persistência de SERTÂNIA: DESAFIO DE GESTÃO
   ---------------------------------------------------------------------
   • Um único save: o objeto S inteiro (inclui S.economy da Economia 2.0).
   • Chaves: sertania_save_v2 (atual) e sertania_save_v1 (legado, só leitura).
   • Regra de migração: adicionar o que falta, nunca apagar o que existe.
   • Não depende de economy.js nem de council.js para carregar: usa as
     funções deles apenas se já estiverem disponíveis.
   ===================================================================== */

/* CHAVES */
const SAVE = 'sertania_save_v2', SAVE1 = 'sertania_save_v1';
const SAVE_VERSION = 3;   // 3 = save já passou pela migração da Economia 2.0

/* UTILITÁRIOS DE NORMALIZAÇÃO */
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = v => typeof v === 'number' && Number.isFinite(v);
/* Garante número em o[k]; valores inválidos viram `def`, valores válidos são preservados. */
function fixNum(o, k, def) { if (!isNum(o[k])) o[k] = def; }
function fixArr(o, k) { if (!Array.isArray(o[k])) o[k] = []; }
function fixObj(o, k) { if (!isObj(o[k])) o[k] = {}; }

/* MIGRAÇÃO DA ECONOMIA 2.0 */
const ECONOMY_NUM_DEFAULTS = {
  taxes: 0, transfers: 0, agreements: 0, amendments: 0, extraordinary: 0,
  payroll: 0, maintenance: 0, services: 0, administrative: 0, projects: 0, emergency: 0,
  monthlyRevenue: 0, monthlyExpenses: 0, monthlyResult: 0, reserve: 0, deficitMonths: 0, taxModifier: 1
};
const ECONOMY_ARRAYS = ['history', 'log', 'notices', 'agreementsAvailable', 'agreementsPending', 'agreementsApproved', 'agreementsRejected', 'amendmentsAvailable', 'programsAvailable'];
const ECONOMY_MONTH_KEYS = ['taxes', 'transfers', 'agreements', 'amendments', 'extraordinary', 'payroll', 'maintenance', 'services', 'administrative', 'projects', 'emergency'];

/* Completa s.economy sem remover nada (propriedades desconhecidas são mantidas). */
function migrateEconomy(s) {
  const fresh = !isObj(s.economy);
  if (fresh) s.economy = {};
  const E = s.economy;
  for (const k in ECONOMY_NUM_DEFAULTS) fixNum(E, k, ECONOMY_NUM_DEFAULTS[k]);
  ECONOMY_ARRAYS.forEach(k => fixArr(E, k));
  fixObj(E, '_month'); fixObj(E, 'expenseAdjust');
  ECONOMY_MONTH_KEYS.forEach(k => fixNum(E._month, k, 0));
  // programas: se a lista foi reconstruída, o economy.js a recria no primeiro uso
  if (typeof E._programsInit !== 'boolean') E._programsInit = E.programsAvailable.length > 0;
  if (E._programsInit && !E.programsAvailable.length) E._programsInit = false;
  // referência do último fechamento: save novo ou ausente parte do caixa atual, sem inventar histórico
  if (E._lastBalance === undefined || (E._lastBalance !== null && !isNum(E._lastBalance))) E._lastBalance = fresh && isNum(s.b) ? s.b : null;
  return s;
}

/* MIGRAÇÃO GERAL */
/* Interface mantida: migrate(s) recebe o save bruto e devolve o save completo. */
function migrate(s) {
  // campos do jogo base (só preenchidos se faltarem)
  fixObj(s, 'ind'); fixObj(s, 'flags'); fixObj(s, 'catSpend'); fixObj(s, 'blocked');
  ['recent', 'pending', 'feed', 'yl', 'tl', 'projects', 'news', 'votes', 'unl'].forEach(k => fixArr(s, k));
  ['rec', 'exp', 'spent', 'gain', 'dec', 'evs', 'crises', 'zero', 'minT', 'bal', 'plN', 'turn'].forEach(k => fixNum(s, k, 0));
  fixNum(s, 'b', 0); fixNum(s, 'minB', s.b);
  if (!isObj(s.snap) || !Object.keys(s.snap).length) s.snap = { ...s.ind };
  if (!isObj(s.prev) || !Object.keys(s.prev).length) s.prev = { ...s.ind };
  // Câmara e conselheiro (saves da versão 1)
  if (!Array.isArray(s.council) || !s.council.length) s.council = typeof createCouncil === 'function' ? createCouncil(0) : [];
  if (s.advisor === undefined) s.advisor = null;
  // Economia 2.0
  migrateEconomy(s);
  if (!(s.saveVersion >= SAVE_VERSION)) s.saveVersion = SAVE_VERSION;
  return s;
}

/* VALIDAÇÃO */
const isValidSave = s => isObj(s) && isObj(s.ind) && Object.keys(s.ind).length > 0;

/* LOAD */
/* Lê uma chave; devolve o save migrado ou null se não existir/estiver corrompido. */
function readSlot(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return isValidSave(s) ? migrate(s) : null;
  } catch (e) { return null; }
}
/* v2 → v1 → null. O v1 nunca é alterado ou apagado aqui; o próximo save() grava no v2. */
const load = () => readSlot(SAVE) || readSlot(SAVE1);

/* SAVE */
/* Grava o estado inteiro (inclui S.economy). Erros de localStorage nunca derrubam o jogo. */
const save = () => {
  try {
    if (!S) return false;
    localStorage.setItem(SAVE, JSON.stringify(S));
    return true;
  } catch (e) { return false; }
};

/* hasSave */
const hasSave = () => { const s = load(); return !!(s && s.ind && !s.done); };

/* deleteSave */
/* Remove as duas versões. A economia vive dentro do save principal, então nada fica para trás. */
const deleteSave = () => {
  try { localStorage.removeItem(SAVE); localStorage.removeItem(SAVE1); } catch (e) {}
};
