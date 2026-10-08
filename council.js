'use strict';
/* COUNCIL — conselheiros, Câmara Municipal, busca de apoio e votação */

function advisors(e) {
  const A = [['💰', 'Finanças', S.b < 3000 ? 'O caixa está apertado. Cada real precisa render.' : 'Temos folga hoje, mas ela não dura para sempre.'],
    ['🧑‍💼', ROLE[e.cat] || 'Técnico da área', e.g >= 2 ? 'Isso não pode esperar. Se piorar, o custo dobra.' : 'Dá para resolver bem, mas há mais de um caminho.'],
    ['🗣️', S.ind.p < 45 ? 'Vereador da oposição' : 'Assessor de imprensa', S.ind.p < 45 ? 'A população está perdendo a paciência com a gestão.' : 'A imprensa vai acompanhar de perto essa decisão.']];
  return `<div>${adv().ic} <b>${adv().n}:</b> “${advisorComment('evt', e)}”</div>` + A.sort(() => Math.random() - .5).slice(0, 1).map(a => `<div>${a[0]} <b>${a[1]}:</b> “${a[2]}”</div>`).join('');
}


/* ---------- 2.0: CONSELHEIROS ---------- */
const ADV = {
  angelos:{ n:'Ângelos Pereira', ic:'🤝', role:'Articulador político', d:'Especialista em Câmara, vereadores e relações institucionais. Abre portas, mas executa com menos eficiência.', pol:6, cost:1.06, delay:.04, rel:3, pro:['Mais facilidade para conseguir apoio de vereadores','Relação inicial melhor com a Câmara'], con:['Projetos custam cerca de 6% a mais','Mais risco de atrasos nas obras'] },
  poli:{ n:'Poli Fecheu', ic:'📐', role:'Planejador e gestor', d:'Focado em orçamento, cronograma e execução. Entrega com eficiência, mas negocia com dificuldade.', pol:-4, cost:.92, delay:-.05, rel:-2, pro:['Projetos cerca de 8% mais baratos','Menos atrasos nas obras'], con:['Mais dificuldade em negociações políticas','Relação inicial mais fria com vereadores'] }
};
const adv = () => ADV[S.advisor] || ADV.poli;
const pk = a => a[Math.floor(Math.random() * a.length)];
function chooseAdvisor() {
  show('<h3>Escolha seu conselheiro</h3><p class="say">Durante seu mandato, você contará com um conselheiro principal. Cada conselheiro possui uma visão diferente de governo. Sua escolha modificará suas forças e limitações durante os quatro anos.</p><div class="diffs">' +
    Object.keys(ADV).map(k => { const a = ADV[k]; return `<button class="opt" data-act="adv" data-a="${k}"><span><b>${a.ic} ${a.n}</b> — ${a.role}<small>${a.d}</small><small>✅ ${a.pro.join(' · ')}</small><small>⚠️ ${a.con.join(' · ')}</small></span></button>`; }).join('') +
    '</div><p><small>Todos os personagens são fictícios.</small></p>', 1);
}
function advisorComment(c, o) {
  const A = S.advisor === 'angelos', avg = S.council.reduce((a, v) => a + v.rel, 0) / 13, n = S.projects.filter(p => p.st === 'exec').length;
  const big = o && o.cost > 1500;
  const T = {
    proj: A ? [big ? 'Prefeito, esse projeto pode ter resistência na Câmara. Talvez seja melhor conversar com alguns vereadores antes de pautar.' : 'A base deve acompanhar, mas vale ouvir os independentes antes.'] : [big ? 'O projeto é importante, mas precisamos olhar o impacto dele no orçamento dos próximos meses.' : 'Cabe no orçamento, desde que o cronograma seja realista.'],
    crise: A ? ['Em crise, a Câmara precisa estar do nosso lado. Vale ligar para alguns vereadores hoje.'] : ['Crise se resolve com prioridade e cronograma, não com improviso.'],
    fin: A ? ['Se o caixa apertar, a oposição vai usar isso na tribuna. Melhor chegar antes.'] : [S.b < 3000 ? 'O caixa está curto. Segure novas obras até o fluxo melhorar.' : 'Há folga no caixa, mas é melhor distribuir os gastos em parcelas.'],
    vote: A ? ['Conte os votos antes da sessão, prefeito. Durante a votação já não há o que negociar.'] : ['Se aprovar, já deixe o cronograma e o fluxo de pagamento prontos.'],
    bal: A ? [`A relação com a Câmara está ${relLbl(avg).toLowerCase()}. Isso vai pesar no próximo ano.`] : [`Temos ${n} projeto(s) em execução. Atenção a atrasos e ao caixa.`]
  };
  if (c === 'evt') return o.cat === 'Finanças' ? pk(T.fin) : o.g >= 3 ? pk(T.crise) : A ? (o.g >= 2 ? 'Isso pode ter repercussão na Câmara. Vale medir as reações antes.' : 'Pense em quem vai cobrar essa decisão na tribuna.') : (o.g >= 2 ? 'Decida rápido, mas anote o custo. Emergência sem controle vira rombo.' : 'Antes de gastar, veja se cabe no orçamento dos próximos meses.');
  return pk(T[c] || T.proj);
}

/* ---------- CÂMARA ---------- */
const VER = [['Miltinho de Moça','s',1,60],['Vando do Caroço','r',0,55],['Nandoia','e',1,50],['Pano','i',2,45],['Julio Carritel','c',1,70],['Pati Gasosa','m',0,50],['Poseidon do Ônibus','i',1,55],['Wellington das Corridas','c',2,40],['Cosme Santos','a',1,65],['Rielson do Jeans','c',0,60],['André Chaveiro','r',2,45],['Luísa Mel','e',0,55],['Alex Alfaiate','s',2,50]];
const BASE = ['Oposição', 'Governo', 'Independente'];
const relLbl = r => r <= 20 ? 'Muito distante' : r <= 40 ? 'Difícil diálogo' : r <= 60 ? 'Neutro' : r <= 80 ? 'Boa relação' : 'Grande proximidade';
const TI = { yes: '🟢 Tendência: apoiar', no: '🔴 Tendência: contrário', und: '🟡 Tendência: indeciso' };
function createCouncil(b) {
  return VER.map((v, i) => ({ id: 'v' + (i + 1), name: v[0], party: v[2] === 1 ? 'Partido Municipalista' : v[2] === 0 ? 'Frente Popular do Sertão' : i % 2 ? 'Aliança Sertaneja' : 'Movimento Cidadão',
    prof: v[1], gov: v[2], inf: v[3], rel: Math.round(clamp((v[2] === 1 ? 64 : v[2] === 0 ? 42 : 52) + rnd(-8, 8) + b)), rb: Math.round(rnd(50, 90)), sup: 0, last: -9 }));
}
const AC = { 'Saúde':'s','Educação':'e','Infraestrutura':'i','Água':'a','Meio ambiente':'m','Economia':'c','Zona rural':'r','Cultura':'c','Assistência social':'s','Mobilidade':'i' };
function lean(v, p) {
  return v.rel * .65 + (v.gov === 1 ? 8 : v.gov === 0 ? -8 : 0) + (p && AC[p.area] === v.prof ? 9 : 0) + (S.ind.p - 50) * .2 + (v.sup || 0) + (p && p.sup ? p.sup[v.id] || 0 : 0) + adv().pol * .35 - (p ? p.cost / 1000 * 2.4 : 0);
}
const tend = (v, p) => { const l = lean(v, p); return l >= 51 ? 'yes' : l <= 39 ? 'no' : 'und'; };
const memberCard = v => `<div class="vc"><b>${v.name}</b>🏛️ ${BASE[v.gov]} · ${v.party}<br>🤝 Relação: ${relLbl(v.rel)}<div class="bar"><i class="${v.rel < 35 ? 'low' : v.rel < 60 ? 'mid' : ''}" style="width:${v.rel}%"></i></div>❤️ Interesse: ${LBL[v.prof]}<br>🗳️ ${TI[tend(v, null)]}<br><button class="btn small" data-act="seek" data-a="${v.id}">🤝 BUSCAR APOIO</button></div>`;
function openCouncil() {
  const f = S.council.filter(v => tend(v, null) === 'yes').length;
  show(`<h3>🏛️ Câmara Municipal de Sertânia</h3><p>Apoio atual ao governo: <b>${f}/13</b>. Negocie antes da votação: durante a sessão não há mais conversa.</p><p class="say">${adv().ic} ${adv().n}: “${advisorComment('vote')}”</p><div class="vm">${S.council.map(memberCard).join('')}</div><p><button class="btn" data-act="close">Fechar</button></p>`, 0, 'wide');
}
function seekSupport(vid, pid) {
  const v = S.council.find(x => x.id === vid), p = pid ? S.projects.find(x => x.id === pid) : null, back = p ? `data-act="apoio" data-a="${p.id}"` : 'data-act="cam"';
  if (v.last === S.turn) return toast('y', 'ATENÇÃO', v.name + ' já foi procurado neste mês.');
  if (p && p.seeks >= 3) return toast('y', 'ATENÇÃO', 'Este projeto já teve 3 rodadas de articulação.');
  v.last = S.turn; if (p) p.seeks++;
  const x = (v.rel - 40) / 100 + adv().pol / 100 + rnd(-.25, .25) + (S.ind.p - 50) / 300 + (v.gov === 0 ? -.08 : 0) + (v.rb - 60) / 400 - (p ? 0 : 0);
  let m, dr, ds;
  if (x > .22) { m = `${v.name} sinalizou apoio ao governo.`; dr = 8; ds = 10; }
  else if (x > 0) { m = `${v.name} prefere aguardar antes de assumir compromisso.`; dr = 2; ds = 0; }
  else { m = `A conversa não foi bem recebida por ${v.name}.`; dr = -5; ds = -4; }
  v.rel = clamp(v.rel + dr);
  if (p) p.sup[v.id] = (p.sup[v.id] || 0) + ds; else v.sup = (v.sup || 0) + ds;
  save();
  show(`<h3>🤝 Conversa com ${v.name}</h3><p class="say">${adv().ic} ${adv().n}: “${advisorComment('vote')}”</p><div class="news">${m}</div><p><span class="chip2">${dr >= 0 ? '+' : ''}${dr} relação</span><span class="chip2">${ds > 0 ? 'apoio conquistado' : ds < 0 ? 'apoio perdido' : 'apoio permanece indefinido'}</span></p><button class="btn main" ${back}>Voltar</button>`, 0);
}


/* ---------- VOTAÇÃO ---------- */
let SK = false;
const sleep = ms => new Promise(r => setTimeout(r, SK ? 0 : ms));
function beep(x) { try { const c = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()), o = c.createOscillator(), g = c.createGain(); o.frequency.value = x === 'SIM' ? 660 : x === 'NÃO' ? 300 : 440; g.gain.value = .05; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + .12); } catch (e) {} }
function voteIntro(id) {
  const p = S.projects.find(x => x.id === id), c = { yes: 0, no: 0, und: 0 }; S.council.forEach(v => c[tend(v, p)]++);
  show(`<div class="vtitle">CÂMARA MUNICIPAL DE SERTÂNIA</div><h4>Projeto de Lei nº ${p.pl}</h4><h3>${pdef(p.pid).title.toUpperCase()}</h3><p>13 vereadores</p>
    <div class="stats"><div class="stat"><b>🟢 ${c.yes}</b><span>Favoráveis</span></div><div class="stat"><b>🔴 ${c.no}</b><span>Contrários</span></div><div class="stat"><b>🟡 ${c.und}</b><span>Indecisos</span></div></div>
    <p class="say">${adv().ic} ${adv().n}: “${advisorComment('vote')}”</p><button class="btn main big" data-act="go" data-a="${id}">INICIAR VOTAÇÃO</button><button class="btn" data-act="ficha" data-a="${id}">Voltar</button>`, 0, 'vote');
}
async function runVote(p) {
  SK = false;
  const vs = S.council.map(v => ({ v, x: Math.random() < .05 ? 'AUS' : lean(v, p) + rnd(-9, 9) >= 40 ? 'SIM' : 'NÃO' })); let y = 0, n = 0;
  const paint = (h) => show(`<div class="vtitle">PL nº ${p.pl} · ${pdef(p.pid).title}</div><div class="vbar"><i style="width:${h.pct}%"></i></div>${h.body}<div class="vscore">SIM ${y} × NÃO ${n}</div><button class="btn small" data-act="skip">Pular animação</button>`, 1, 'vote');
  for (let i = 0; i < vs.length; i++) {
    if (i === vs.length - 1) { paint({ pct: i / 13 * 100, body: '<div class="vname">VOTAÇÃO EM ANDAMENTO</div><div class="vvote a">Último voto.</div>' }); await sleep(1900); }
    const x = vs[i].x; if (x === 'SIM') y++; else if (x === 'NÃO') n++;
    paint({ pct: (i + 1) / 13 * 100, body: `<div class="vname">${vs[i].v.name.toUpperCase()}</div><div class="vvote ${x === 'SIM' ? 'y' : x === 'NÃO' ? 'n' : 'a'}">${x === 'SIM' ? '🟢 SIM' : x === 'NÃO' ? '🔴 NÃO' : '⚪ AUSENTE'}</div>` });
    beep(x); await sleep(1100);
  }
  finishVote(p, y, n, vs);
}
function finishVote(p, y, n, vs) {
  let note = '';
  if (y === n) { const pr = S.council.slice().sort((a, b) => b.inf - a.inf)[0], pv = lean(pr, p) >= 45; if (pv) y++; else n++; note = `<p class="news">Empate. Pelo regimento fictício do simulador, o presidente da Câmara (${pr.name}, o vereador de maior influência) tem voto de qualidade: <b>${pv ? 'SIM' : 'NÃO'}</b>.</p>`; }
  const ok = y > n, t = pdef(p.pid).title;
  vs.forEach(o => { if (o.x === 'SIM') o.v.rel = clamp(o.v.rel + .5); else if (o.x === 'NÃO' && ok) o.v.rel = clamp(o.v.rel - .5); });
  p.votes = { y, n }; S.votes.push({ t, y, n });
  if (ok) { p.st = 'exec'; apply(fx('p1')); publishNews('Câmara', 'Câmara aprova ' + t.toLowerCase(), 'Projeto segue agora para execução pela Prefeitura.'); }
  else { p.st = 'rejeitado'; if (typeof polOnRejected === 'function') polOnRejected(); S.blocked[p.pid] = S.turn + 6; apply(fx('p-2')); publishNews('Câmara', 'Câmara rejeita projeto apresentado pela Prefeitura', 'Proposta não alcançou votos suficientes durante a sessão.'); }
  S.tl.push({ y: year(), m: S.turn % 12, t: (ok ? 'Aprovado: ' : 'Rejeitado: ') + t + ` (${y}×${n})` });
  save(); render();
  show(`<div class="vtitle">RESULTADO</div><div class="vscore">SIM ${y} × NÃO ${n}</div>${note}<h3>${ok ? '🟢 PROJETO APROVADO' : '🔴 PROJETO REJEITADO'}</h3><p>${ok ? 'A Câmara Municipal aprovou o projeto. O projeto seguirá para execução.' : 'A proposta não obteve votos suficientes. O projeto não poderá ser executado neste momento.'}</p>
    <p class="say">${adv().ic} ${adv().n}: “${ok ? advisorComment('vote') : 'Vamos entender quem não acompanhou e por quê.'}”</p><button class="btn main" data-act="proj">Ver projetos</button> <button class="btn" data-act="close">Fechar</button>`, 0, 'vote');
}


function openAdvisor() {
  const a = adv();
  show(`<h3>${a.ic} ${a.n}</h3><span class="tag">${a.role}</span><p>${a.d}</p><p>✅ ${a.pro.join('<br>✅ ')}</p><p>⚠️ ${a.con.join('<br>⚠️ ')}</p><p class="say" id="advq">“${advisorComment('proj')}”</p><button class="btn main" data-act="advice">Pedir outro conselho</button> <button class="btn" data-act="close">Fechar</button>`, 0);
}

function legacy() {
  const P = S.projects, c = s => P.filter(p => p.st === s).length, ap = c('exec') + c('entregue'), pres = P.filter(p => p.pl).length;
  const f = S.council.filter(v => tend(v, null) === 'yes').length, avg = S.council.reduce((a, v) => a + v.rel, 0) / 13, ti = S.votes.slice().sort((a, b) => Math.abs(a.y - a.n) - Math.abs(b.y - b.n))[0];
  const st = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  return `<h3>🏛️ Legado legislativo</h3><div class="stats">${st(pres, 'Projetos apresentados')}${st(ap, 'Aprovados')}${st(c('rejeitado'), 'Rejeitados')}${st(c('entregue'), 'Concluídos')}${st(c('exec'), 'Em execução')}</div>
    <p class="report">Ao lado de ${adv().n}, a gestão levou ${pres} projeto(s) à Câmara; ${ap} foram aprovados e ${c('rejeitado')} rejeitados. ${ti ? `A votação mais apertada foi “${ti.t}”, decidida em ${ti.y} × ${ti.n}.` : 'Nenhuma votação chegou a acontecer no plenário.'} A relação final com a Câmara é de ${relLbl(avg).toLowerCase()}, com apoio provável de ${f} dos 13 vereadores.</p>`;
}