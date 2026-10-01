'use strict';
/* ECONOMY — orçamento, receitas, despesas e custos */

/* ---------- ORÇAMENTO E INDICADORES ---------- */
const year = () => Math.min(4, Math.floor(S.turn / 12) + 1);
const costMult = () => 1 + .06 * (year() - 1);
const cost = o => Math.round(o[1] * costMult() / 10) * 10;
const revenue = () => Math.round((330 + S.ind.c * 1.2) * DIFF[S.diff].rev);
const expenses = () => Math.round(300 * (1 + .05 * (year() - 1)));
function apply(o) { for (const k in o) { if (k === '$') { S.b += o[k]; if (o[k] > 0) S.gain += o[k]; } else if (S.ind[k] !== undefined) S.ind[k] = clamp(S.ind[k] + o[k]); } }


/* Fechamento financeiro do mês: única entrada de receitas e despesas fixas.
   S.b é a ÚNICA fonte de verdade do caixa do município. */
function closeMonth() {
  const rv = revenue(), ex = expenses();
  S.b += rv - ex; S.rec += rv; S.exp += ex;
}

/* Pontos de expansão (Economia 2.0): arrecadação por imposto, salários, emendas,
   convênios, transferências, déficit e reserva devem entrar aqui, somando-se em
   closeMonth() e alterando apenas S.b / S.rec / S.exp. */
