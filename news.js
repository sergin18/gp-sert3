'use strict';
/* NEWS — Tribuna do Mocotó (jornal fictício da simulação) */

const NI = { Prefeitura:'🏛️', 'Câmara':'⚖️', 'Saúde':'🏥', 'Educação':'📚', Economia:'💼', Infraestrutura:'🚧', 'Zona rural':'🌾', 'Política Municipal':'🗳️', Cotidiano:'☕' };
const NC = { 'Saúde':'Saúde','Educação':'Educação','Economia':'Economia','Infraestrutura':'Infraestrutura','Zona rural':'Zona rural','Água':'Zona rural','Transparência':'Política Municipal','Administração':'Política Municipal','Política pública':'Política Municipal' };
function publishNews(c, t, s) { S.news.unshift({ c, t, s, y: year(), m: S.turn % 12, n: 1 }); S.news = S.news.slice(0, 40); }
function openTribuna() {
  const N = S.news, top = N[0];
  show(`<div class="paper"><h1>TRIBUNA DO MOCOTÓ</h1><div class="sl">O portal de notícias de Sertânia · Informação, política e acontecimentos da cidade.</div>` + (top ? `<small>MANCHETE PRINCIPAL · ${NI[top.c] || '📰'} ${top.c}</small><div class="head">${top.t}</div><p>${top.s}</p><small>${MES[top.m]}, ano ${top.y}</small><h4>ÚLTIMAS NOTÍCIAS</h4>` + N.slice(1, 13).map(n => `<div class="nw"><small>${NI[n.c] || '📰'} ${n.c} · ${MES[n.m]}, ano ${n.y}</small><b>${n.t}</b>${n.s}</div>`).join('') : '<p>Sem notícias por enquanto. Avance o mês.</p>') + '</div><p><button class="btn" data-act="close">Fechar</button></p>', 0, 'wide');
  N.forEach(n => n.n = 0); renderGov();
}
