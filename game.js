'use strict';
/* GAME — estado central, calendário, indicadores, interface e fim do mandato */

/* ---------- ESTADO E CONSTANTES ---------- */
const IND = [['s','Saúde','🏥'],['e','Educação','📚'],['i','Infraestrutura','🚧'],['a','Abastecimento','💧'],['m','Meio ambiente','🌱'],['c','Economia','💼'],['r','Zona rural','🌾'],['t','Transparência','🏛️'],['p','Aprovação popular','😊']];
const K = IND.map(x => x[0]);
const LBL = Object.fromEntries(IND.map(x => [x[0], x[1]]));
const MES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIFF = {
  normal:{n:'Normal',b:20000,neg:1,rev:1,imp:.3,d:'Eventos equilibrados.'},
  desafio:{n:'Desafio',b:15000,neg:1.4,rev:.9,imp:.4,d:'Mais eventos negativos e menos orçamento.'},
  caos:{n:'Caos',b:9000,neg:1.9,rev:.8,imp:.6,d:'Eventos frequentes, crises e orçamento extremamente limitado.'}
};
let S = null;
const $ = s => document.querySelector(s);
const fmt = v => 'R$ ' + Math.round(v * 1000).toLocaleString('pt-BR');
const clamp = v => Math.max(0, Math.min(100, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const fx = s => { const o = {}; (s || '').split(' ').forEach(t => { if (t) o[t[0]] = (o[t[0]] || 0) + parseFloat(t.slice(1)); }); return o; };


function newGame(diff) {
  const D = DIFF[diff];
  const ind = {}; K.forEach(k => ind[k] = Math.round(rnd(38, 62)));
  ind.t = Math.round(rnd(45, 65)); ind.p = Math.round(rnd(50, 62));
  S = { diff, b: D.b, ind, turn: 0, recent: [], pending: [], flags: {}, catSpend: {}, feed: [], yl: [], tl: [], snap: { ...ind }, prev: { ...ind },
    rec: 0, exp: 0, spent: 0, gain: 0, dec: 0, evs: 0, crises: 0, zero: 0, minB: D.b, minT: 0, bal: 0, advisor: null, council: createCouncil(0), projects: [], news: [], votes: [], unl: [], blocked: {}, plN: 0 };
  save(); startGame();
}

function nextTurn() {
  if (S.turn >= 48) return endGame();
  const D = DIFF[S.diff];
  closeMonth();
  ['s','e','i','a','r'].forEach(k => S.ind[k] = clamp(S.ind[k] - rnd(.3, 1)));
  S.ind.m = clamp(S.ind.m - rnd(0, .5));
  const core = (S.ind.s + S.ind.e + S.ind.i + S.ind.a) / 4;
  S.ind.p = clamp(S.ind.p + (core - 50) / 40 + (S.ind.t - 50) / 80 - (S.b < 1500 ? 1.5 : 0) + rnd(-.6, .6));
  if (Math.random() < D.imp) { const m = IMP[Math.floor(Math.random() * IMP.length)]; apply(fx(m[1])); feed(m[0]); toast('y', 'ATENÇÃO', m[0]); }
  updateProjects(); S.council.forEach(v => { v.sup *= .8; v.rel = clamp(v.rel + (S.ind.p - 50) / 300 + rnd(-.4, .4)); });
  if (S.ind.p >= 70 && Math.random() < .12) publishNews('Prefeitura', 'Gestão comemora novos investimentos', 'A avaliação da população segue em alta.');
  if (S.b < S.minB) { S.minB = S.b; S.minT = S.turn; }
  render();
  showEvent(pick());
}


/* ---------- INTERFACE ---------- */
function feed(t) { S.feed.unshift({ t, d: `Ano ${year()} — ${MES[S.turn % 12]}` }); S.feed = S.feed.slice(0, 14); }
function toast(k, title, text) {
  const d = document.createElement('div'); d.className = 'toast ' + k;
  const ic = { b: '🔵', y: '🟡', r: '🔴', g: '🟢' }[k];
  d.innerHTML = `<b>${ic} ${title}</b>${text}`; $('#toasts').appendChild(d);
  setTimeout(() => d.remove(), 5200);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
}
function openModal(lock, cls) { $('#overlay').hidden = false; $('#overlay').dataset.lock = lock ? 1 : ''; $('#modal').className = 'modal ' + (cls || ''); }
function closeModal() { $('#overlay').hidden = true; if (S) $('#bNext').disabled = false; }
function info(html) { $('#modal').innerHTML = html + '<p><button class="btn main" id="cl">Fechar</button></p>'; openModal(false); $('#cl').onclick = closeModal; }
function hot(a) { document.querySelectorAll('.z').forEach(z => z.classList.toggle('hot', z.id === 'a-' + a)); }
function buildInds() {
  $('#inds').innerHTML = IND.map(x => `<div class="ind" id="i-${x[0]}"><div class="h"><span>${x[2]} ${x[1]}</span></div><div class="v"></div><div class="bar"><i></i></div></div>`).join('');
}
function render() {
  const y = year();
  $('#date').textContent = S.turn >= 48 ? 'Fim do mandato' : `Ano ${y} — ${MES[S.turn % 12]}`;
  $('#budget').textContent = fmt(S.b);
  IND.forEach(x => {
    const v = Math.round(S.ind[x[0]]), el = $('#i-' + x[0]), bar = el.querySelector('i');
    el.querySelector('.v').textContent = x[0] === 'p' ? v + '%' : v;
    bar.style.width = v + '%'; bar.className = v < 35 ? 'low' : v < 60 ? 'mid' : '';
    const d = v - Math.round(S.prev[x[0]]);
    if (d) { const c = document.createElement('span'); c.className = 'chip ' + (d > 0 ? 'p' : 'n'); c.textContent = (d > 0 ? '+' : '') + d; el.appendChild(c); setTimeout(() => c.remove(), 2300); }
    S.prev[x[0]] = S.ind[x[0]];
  });
  zones();
  $('#fRec').textContent = fmt(S.rec); $('#fGas').textContent = fmt(S.spent + S.exp);
  $('#fDes').textContent = fmt(expenses()); $('#fRev').textContent = fmt(revenue());
  $('#feed').innerHTML = S.news.length ? S.news.slice(0, 5).map(n => `<li>${NI[n.c] || '📰'} ${n.t}<small>${n.c} · ${MES[n.m]}, ano ${n.y}</small></li>`).join('') : '<li>Nenhuma notícia ainda. Avance para o primeiro mês.</li>';
  renderGov();
  $('#bNext').disabled = !$('#overlay').hidden;
}
function screen(id) { ['home', 'game', 'end'].forEach(s => $('#' + s).hidden = s !== id); window.scrollTo(0, 0); }
function startGame() {
  screen('game'); buildInds(); S.prev = { ...S.ind }; render();
  if (!S.advisor) chooseAdvisor(); else if (S.bal) balance(); else if (S.turn >= 48) endGame();
}
function home() {
  screen('home'); const h = hasSave();
  $('#bContinue').hidden = !h; $('#bErase').hidden = !h;
}
function pickDiff(cb) {
  $('#modal').innerHTML = '<h3>Escolha a dificuldade</h3><div class="diffs">' + Object.keys(DIFF).map(k =>
    `<button class="opt" data-d="${k}"><span>${DIFF[k].n}<small>${DIFF[k].d}</small></span><b>${fmt(DIFF[k].b)}</b></button>`).join('') + '</div><p><button class="btn small" id="cl">Cancelar</button></p>';
  openModal(false); $('#cl').onclick = closeModal;
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { closeModal(); cb(b.dataset.d); });
}


function renderGov() {
  const f = S.council.filter(v => tend(v, null) === 'yes').length, ex = S.projects.filter(p => p.st === 'exec').length, avg = S.council.reduce((a, v) => a + v.rel, 0) / 13, un = S.news.filter(n => n.n).length;
  $('#gov').innerHTML = `<h3>Situação do governo</h3><div class="gv"><div><span>🏛️ Câmara</span><b>${f}/13</b><small>apoio</small></div><div><span>📋 Projetos</span><b>${ex}</b><small>em execução</small></div><div><span>🤝 Relação institucional</span><b>${relLbl(avg).split(' ')[0]}</b></div><div><span>📰 Notícias</span><b>${un}</b><small>novas</small></div></div>`;
}

const show = (html, lock, cls) => { $('#modal').innerHTML = html; openModal(lock, cls); };

/* ---------- BALANÇO ANUAL ---------- */
function balance() {
  const y = S.turn / 12, L = S.yl.filter(x => x.y === y);
  const top = L.slice().sort((a, b) => b.c - a.c).slice(0, 3).filter(x => x.c > 0);
  const probs = L.filter(x => x.g >= 2).map(x => x.t).slice(0, 4);
  const ups = K.filter(k => S.ind[k] - S.snap[k] >= 3).map(k => `${LBL[k]} (+${Math.round(S.ind[k] - S.snap[k])})`);
  const pend = K.filter(k => k !== 'p' && S.ind[k] < 40).map(k => `${LBL[k]} (${Math.round(S.ind[k])})`);
  const ul = a => a.length ? '<ul>' + a.map(t => `<li>${t}</li>`).join('') + '</ul>' : '<p>Nada a destacar.</p>';
  $('#modal').innerHTML = `<h3>Balanço do ano ${y}</h3>
    <div class="stats"><div class="stat"><b>${fmt(S.b)}</b><span>Orçamento restante</span></div><div class="stat"><b>${Math.round(S.ind.s)}/100</b><span>Saúde</span></div>
    <div class="stat"><b>${Math.round(S.ind.e)}/100</b><span>Educação</span></div><div class="stat"><b>${Math.round(S.ind.i)}/100</b><span>Infraestrutura</span></div>
    <div class="stat"><b>${Math.round(S.ind.p)}%</b><span>Aprovação</span></div></div>
    <h4>Principais decisões</h4>${ul(top.map(x => `${x.t}: ${x.o} (${fmt(x.c)})`))}
    <h4>Principais problemas</h4>${ul(probs)}
    <h4>Melhorias conquistadas</h4>${ul(ups)}
    <h4>Problemas que ficaram pendentes</h4>${ul(pend.concat(S.pending.length ? [S.pending.length + ' consequência(s) de decisões antigas ainda por vir'] : []))}
    <p class="say">${adv().ic} ${adv().n}: “${advisorComment('bal')}”</p>
    <button class="btn main" id="nextY">${y >= 4 ? 'VER FIM DO MANDATO' : 'INICIAR ANO ' + (y + 1)}</button>`;
  openModal(true);
  $('#nextY').onclick = () => { S.bal = 0; S.snap = { ...S.ind }; save(); closeModal(); if (y >= 4) endGame(); else render(); };
}

/* ---------- FINAL DO MANDATO ---------- */
function report() {
  const cats = Object.entries(S.catSpend).filter(c => c[1] > 0).sort((a, b) => b[1] - a[1]);
  const sorted = K.filter(k => k !== 'p').sort((a, b) => S.ind[b] - S.ind[a]);
  const best = sorted[0], worst = sorted[sorted.length - 1], p = [];
  p.push(cats.length >= 2 ? `Durante o mandato, a administração concentrou seus investimentos em ${cats[0][0].toLowerCase()} e ${cats[1][0].toLowerCase()}, em um total de ${fmt(S.spent)} aplicados em ${S.dec} decisões.`
    : `Durante o mandato, a administração aplicou ${fmt(S.spent)} em ${S.dec} decisões.`);
  p.push(`O melhor desempenho ficou com ${LBL[best].toLowerCase()} (${Math.round(S.ind[best])}/100), enquanto ${LBL[worst].toLowerCase()} terminou em ${Math.round(S.ind[worst])}/100.`);
  if (S.b > 8000) p.push(`As contas fecharam com folga (${fmt(S.b)}), o que pode indicar prudência, mas também investimentos que deixaram de ser feitos.`);
  else if (S.b < 1500) p.push(`O caixa terminou no limite (${fmt(S.b)}), sendo o momento mais apertado em ${MES[S.minT % 12]} do ano ${Math.min(4, Math.floor(S.minT / 12) + 1)}.`);
  else p.push(`O orçamento terminou em ${fmt(S.b)}. O momento mais apertado foi em ${MES[S.minT % 12]} do ano ${Math.min(4, Math.floor(S.minT / 12) + 1)}, com ${fmt(S.minB)}.`);
  p.push(S.crises ? `${S.crises} crise(s) exigiram respostas emergenciais.` : 'Nenhuma crise grave precisou ser enfrentada.');
  if (S.zero >= 12) p.push(`Em ${S.zero} ocasiões, a opção foi não gastar ou adiar, o que aliviou o caixa mas deixou problemas se acumularem.`);
  p.push(S.ind.t >= 70 ? 'A transparência foi um ponto forte da gestão.' : S.ind.t < 40 ? 'A transparência ficou frágil, o que pesou na confiança da população.' : 'A transparência ficou em nível intermediário.');
  p.push(S.ind.p >= 70 ? 'A população termina o mandato com avaliação favorável.' : S.ind.p < 40 ? 'A população termina o mandato insatisfeita.' : 'A população terminou dividida quanto à gestão.');
  return p.join(' ');
}
function endGame() {
  S.done = 1; save(); deleteSave();
  screen('end'); closeModal(); hot(null);
  const st = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  const big = IND.map(x => st(x[0] === 'p' ? Math.round(S.ind.p) + '%' : Math.round(S.ind[x[0]]) + '/100', x[1].toUpperCase())).join('');
  const tl = S.tl.slice(-14).map(t => `<p><b>Ano ${t.y}, ${MES[t.m]}:</b> ${t.t}</p>`).join('') || '<p>Nenhum acontecimento de grande porte.</p>';
  $('#end').innerHTML = `<h1>FIM DO MANDATO</h1>
    <div class="stats">${st(fmt(S.b), 'ORÇAMENTO FINAL')}${big}</div>
    <div class="stats">${st(S.dec, 'Decisões tomadas')}${st(S.evs, 'Eventos enfrentados')}${st(S.crises, 'Crises enfrentadas')}${st(fmt(S.spent), 'Investimentos realizados')}${st(fmt(S.gain), 'Economias e receitas extras')}</div>
    <h3>Relatório final</h3><p class="report">${report()}</p>
    <h3>Linha do tempo</h3><div class="timeline">${tl}</div>
    ${legacy()}
    <p class="quote">“Administrar uma cidade não é escolher entre o certo e o errado. É decidir o que fazer quando não é possível fazer tudo.”</p>
    <div class="btns" style="justify-content:center"><button class="btn main" id="again">JOGAR NOVAMENTE</button><button class="btn main" id="newE">NOVO MANDATO</button><button class="btn" id="menuE">Menu</button></div>`;
  const d = S.diff;
  $('#again').onclick = () => newGame(d);
  $('#newE').onclick = () => pickDiff(newGame);
  $('#menuE').onclick = home;
}


/* ---------- CIDADE VIVA ---------- */
const ZN = { centro:['🏛️🏥🏫',['t','c','s'],'Centro urbano'], bairros:['🏠🏘️🏠',['s','e'],'Bairros'], rural:['🌾🐐🌵',['r'],'Zona rural'], comunid:['🛖💧🛖',['a'],'Comunidades rurais'], estradas:['🛣️🚌🚧',['i'],'Estradas'] };
const CI = { 'Saúde':'🏥','Educação':'🏫','Infraestrutura':'🚧','Zona rural':'🌾','Água':'💧','Economia':'💼','Meio ambiente':'🌱','Cultura':'🎭','Transparência':'🏛️','Emergência':'🚨','Finanças':'💰','Assistência social':'🤝','Mobilidade':'🚌','Administração':'🗂️','Política pública':'📑' };
const AREA = { centro:'Centro urbano', bairros:'Bairros', rural:'Zona rural', comunid:'Comunidades rurais', estradas:'Estradas' };
const ROLE = { 'Saúde':'Secretária de Saúde','Educação':'Secretário de Educação','Infraestrutura':'Engenheiro da prefeitura','Água':'Técnica de abastecimento','Zona rural':'Extensionista rural','Economia':'Assessor de desenvolvimento','Finanças':'Contadora da prefeitura' };
function zones() {
  for (const k in ZN) {
    const z = $('#a-' + k), v = ZN[k][1].reduce((a, x) => a + S.ind[x], 0) / ZN[k][1].length, st = v < 35 ? 'bad' : v < 55 ? 'warn' : 'ok';
    ['ok', 'warn', 'bad'].forEach(c => z.classList.toggle(c, c === st));
    z.innerHTML = `<span class="ic">${ZN[k][0]}</span><small>${ZN[k][2]} ${st === 'bad' ? '⚠️' : st === 'ok' ? '✨' : ''}</small>`;
  }
  const w = S.ind.a < 30 ? '🏜️' : S.rain >= S.turn ? '🌧️' : '☀️';
  $('#wx').textContent = w + (S.ind.p >= 60 ? '😊' : S.ind.p >= 40 ? '😐' : '😠');
}
