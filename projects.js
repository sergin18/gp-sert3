'use strict';
/* PROJECTS — projetos municipais, execução e desbloqueios */

/* ---------- PROJETOS ---------- */
const AL = ['Saúde','Educação','Infraestrutura','Água','Meio ambiente','Economia','Zona rural','Cultura','Assistência social','Mobilidade'];
const PR = [
  ['h_ubs','Saúde','Reforma de UBS',900,6,'s10 p3'],['h_amb','Saúde','Compra de ambulância',380,3,'s6 r2 p2'],['h_amp','Saúde','Ampliação de atendimento',1200,8,'s12 p4'],['h_hosp','Saúde','Expansão do Hospital Municipal',4200,18,'s22 p6 c2'],
  ['e_ref','Educação','Reforma de escolas',1000,8,'e12 p4'],['e_tr','Educação','Transporte escolar',600,4,'e7 r4 p3'],['e_mer','Educação','Qualidade da merenda',350,4,'e6 r3 p2'],['e_eq','Educação','Equipamentos escolares',500,5,'e8 p2'],
  ['i_pav','Infraestrutura','Pavimentação de bairros',1800,10,'i16 c4 p5',2],['i_luz','Infraestrutura','Iluminação pública',700,5,'i7 m2 p3',2],['i_est','Infraestrutura','Recuperação de estradas',1400,8,'i12 r8 p4',2,'estradaOk'],['i_dren','Infraestrutura','Sistema de drenagem',1600,10,'i10 p3',2,'dren'],
  ['r_poco','Zona rural','Perfuração de poços',800,6,'a10 r8 p3',2],['r_agri','Zona rural','Apoio à agricultura familiar',650,6,'r10 c4 p3',2],['r_trans','Zona rural','Transporte rural',450,4,'r7 c2',2],['a_adut','Água','Nova adutora',2200,12,'a18 p4',2],
  ['c_merc','Economia','Mercado municipal',1500,10,'c14 p4 r3',3],['c_inc','Economia','Incentivo ao comércio',500,4,'c8 p2',3],['c_feira','Economia','Feira regional',600,5,'c9 r3 p3',3],
  ['m_arb','Meio ambiente','Arborização urbana',350,5,'m8 p2 s1',3],['m_rec','Meio ambiente','Recuperação de áreas degradadas',700,8,'m12 r3',3],['m_res','Meio ambiente','Gestão de resíduos',900,8,'m12 s3 p3',3],
  ['u_cult','Cultura','Centro cultural',1100,8,'p7 c4 e2',3],['s_soc','Assistência social','Rede de proteção social',800,6,'p6 s3 e2',2],['mob_t','Mobilidade','Plano de mobilidade',900,7,'i6 c4 p3',3],
  ['g_obra','Infraestrutura','Grande obra de legado',3500,14,'i16 c8 p8',4],['g_esp','Economia','Programa especial Sertânia 2030',1800,10,'s5 e5 r5 p6',4],['g_pol','Saúde','Policlínica regional',2800,12,'s16 p6 c3',4],
  ['p_estEmerg','Infraestrutura','Recuperação emergencial de estradas',500,3,'i8 r7 p3',99],['p_saudeEmerg','Saúde','Ampliação emergencial da rede de atendimento',900,4,'s14 p4',99],['p_eduRec','Educação','Programa de recuperação educacional',600,5,'e12 p3',99],
  ['p_aguaEmerg','Água','Operação permanente de água',900,5,'a14 r5',99],['p_pocos','Zona rural','Poços emergenciais',700,4,'a10 r10',99],['p_aedes','Saúde','Controle permanente de arboviroses',350,4,'s7 m2',99]
].map(a => ({ id: a[0], area: a[1], title: a[2], cost: a[3], months: a[4], f: a[5], y: a[6] || 1, flag: a[7] }));
const pdef = id => PR.find(p => p.id === id);
const dt = t => `${MES[t % 12]} de ${2027 + Math.floor(t / 12)}`;
const eta = p => S.turn + Math.ceil((100 - p.prog) / (100 / p.months));
const fxTxt = s => Object.entries(fx(s)).filter(e => e[0] !== '$').map(e => `${LBL[e[0]]} <b>${e[1] > 0 ? '+' : ''}${e[1]}</b>`).join(' · ');
const ST = { proposto:['🟡','Aguardando pauta'], pauta:['🟡','Aguardando votação'], exec:['🔵','Em execução'], entregue:['🟢','Entregue'], rejeitado:['🔴','Rejeitado'] };
const scale = (o, k) => Object.fromEntries(Object.entries(o).map(e => [e[0], e[1] * k]));
const avail = area => PR.filter(p => p.area === area && (p.y <= year() || S.unl.includes(p.id)) && !S.projects.some(x => x.pid === p.id && x.st !== 'rejeitado') && !(S.blocked[p.id] > S.turn));
function unlock(id) { if (S.unl.includes(id)) return; S.unl.push(id); const d = pdef(id); toast('b', 'PROJETO DESBLOQUEADO', d.title); publishNews('Prefeitura', 'Prefeitura estuda novo projeto: ' + d.title.toLowerCase(), 'A situação da cidade abriu espaço para uma nova proposta.'); }
const projCard = p => { const d = pdef(p.pid), s = ST[p.st]; return `<div class="pc"><b>${CI[p.area] || '📋'} ${d.title}</b> <span class="chip2">${s[0]} ${s[1]}</span><br><small>${fmt(p.cost)} · ${p.months} meses${p.st === 'exec' ? ' · previsão: ' + dt(eta(p)) : ''}</small><div class="bar"><i style="width:${p.prog}%"></i></div><button class="btn small" data-act="ficha" data-a="${p.id}">Ver ficha</button></div>`; };
function openProjects() {
  show('<h3>📋 Projetos municipais</h3><button class="btn main" data-act="create">+ CRIAR NOVO PROJETO</button>' + (S.projects.length ? S.projects.slice().reverse().map(projCard).join('') : '<p>Nenhum projeto ainda. Novas opções surgem a cada ano e em resposta ao que acontece na cidade.</p>') + '<p><button class="btn" data-act="close">Fechar</button></p>', 0, 'wide');
}
function openCreate() {
  show('<h3>Criar projeto</h3><p>Escolha a área:</p><div class="vm">' + AL.map(a => { const n = avail(a).length; return `<button class="opt" data-act="area" data-a="${a}" ${n ? '' : 'disabled'}><span>${CI[a] || '📋'} ${a}</span><b>${n}</b></button>`; }).join('') + '</div><p><small>Áreas com 0 não têm projetos disponíveis agora.</small></p><button class="btn" data-act="proj">Voltar</button>', 0, 'wide');
}
function areaList(a) {
  show(`<h3>${CI[a] || ''} ${a}</h3>` + avail(a).map(d => `<button class="opt" data-act="mk" data-a="${d.id}"><span>${d.title}${S.unl.includes(d.id) ? ' 🔔' : ''}<small>Prazo: ${d.months} meses · ${fxTxt(d.f)}</small></span><b>${fmt(Math.round(d.cost * costMult() * adv().cost / 10) * 10)}</b></button>`).join('') + '<p><button class="btn" data-act="create">Voltar</button></p>', 0);
}
function createProject(pid) {
  const d = pdef(pid), p = { id: 'p' + (S.projects.length + 1), pid, area: d.area, cost: Math.round(d.cost * costMult() * adv().cost / 10) * 10, months: d.months, st: 'proposto', prog: 0, sup: {}, seeks: 0 };
  S.projects.push(p); save(); ficha(p.id);
}
function ficha(id) {
  const p = S.projects.find(x => x.id === id), d = pdef(p.pid), s = ST[p.st], ok = S.b >= p.cost * .25;
  const btn = p.st === 'proposto' ? `<button class="btn main" data-act="pautar" data-a="${id}" ${ok ? '' : 'disabled'}>PAUTAR NA CÂMARA</button>${ok ? '' : '<p><small>Orçamento insuficiente: é preciso ter ao menos 25% do valor em caixa.</small></p>'}`
    : p.st === 'pauta' ? `<button class="btn" data-act="apoio" data-a="${id}">🤝 BUSCAR APOIO</button> <button class="btn main" data-act="vote" data-a="${id}">IR PARA A VOTAÇÃO</button>` : p.st === 'rejeitado' ? '<p><small>Poderá ser reapresentado em alguns meses.</small></p>' : '';
  show(`<span class="tag">${CI[p.area] || ''} ${p.area}</span><span class="tag g0">${s[0]} ${s[1]}</span><h3>${d.title.toUpperCase()}</h3>${p.pl ? `<p><small>Projeto de Lei nº ${p.pl}</small></p>` : ''}
    <div class="stats"><div class="stat"><b>${fmt(p.cost)}</b><span>Investimento</span></div><div class="stat"><b>${p.months} meses</b><span>Prazo</span></div></div>
    <p><b>Impacto estimado:</b> ${fxTxt(d.f)}</p><div class="bar"><i style="width:${p.prog}%"></i></div>
    ${p.st === 'exec' ? `<p>${Math.round(p.prog)}% concluído · previsão: ${dt(eta(p))}${p.stall ? ' · <b>obra parada por falta de recursos</b>' : ''}</p>` : ''}${p.votes ? `<p>Votação: SIM ${p.votes.y} × NÃO ${p.votes.n}</p>` : ''}
    <p class="say">${adv().ic} ${adv().n}: “${advisorComment('proj', p)}”</p>${btn} <button class="btn" data-act="proj">Projetos</button>`, 0);
}
function pautar(id) {
  const p = S.projects.find(x => x.id === id); p.st = 'pauta'; p.pl = String(++S.plN).padStart(3, '0') + '/' + (2026 + year());
  publishNews('Câmara', 'Prefeitura envia projeto à Câmara: ' + pdef(p.pid).title, `O Projeto de Lei nº ${p.pl} entrou na pauta da Câmara.`); toast('b', 'NOVA OPORTUNIDADE', 'Projeto na pauta. Busque apoio antes da votação.'); save(); ficha(id);
}
function apoioPick(id) {
  const p = S.projects.find(x => x.id === id);
  show(`<h3>🤝 Buscar apoio</h3><p>${pdef(p.pid).title} · conversas restantes: <b>${3 - p.seeks}</b></p><div class="vm">` + S.council.map(v => `<div class="vc"><b>${v.name}</b>${BASE[v.gov]} · ${relLbl(v.rel)}<br>${TI[tend(v, p)]}<br><button class="btn small" data-act="seek" data-a="${v.id}" data-b="${id}" ${v.last === S.turn || p.seeks >= 3 ? 'disabled' : ''}>Conversar</button></div>`).join('') + `</div><p><button class="btn" data-act="ficha" data-a="${id}">Ficha</button> <button class="btn main" data-act="vote" data-a="${id}">IR PARA A VOTAÇÃO</button></p>`, 0, 'wide');
}
function updateProjects() {
  S.projects.filter(p => p.st === 'exec').forEach(p => {
    const d = pdef(p.pid), inst = p.cost / p.months, nc = NC[p.area] || 'Prefeitura';
    if (S.b < inst) { if (!p.stall) publishNews(nc, 'Obra parada por falta de recursos', d.title + ' aguarda caixa.'); p.stall = 1; return; }
    p.stall = 0; S.b -= inst; S.spent += inst; S.catSpend[p.area] = (S.catSpend[p.area] || 0) + inst;
    const r = Math.random(), dl = .1 + adv().delay; let step = 100 / p.months;
    if (r < dl) { step = 0; p.months++; publishNews(nc, 'Obra municipal sofre atraso e prazo é ampliado', d.title + ' terá um mês a mais de execução.'); }
    else if (r < dl + .06) { p.cost += Math.round(p.cost * .05); toast('y', 'ATENÇÃO', 'Custo de ' + d.title + ' aumentou.'); publishNews(nc, 'Custo de obra municipal aumenta', d.title + ' precisou de reajuste.'); }
    else if (r > .95) { step *= 2; publishNews(nc, 'Obra avança mais rápido que o previsto', d.title + ' ganhou ritmo.'); }
    const b = p.prog; p.prog = Math.min(100, p.prog + step);
    if (b < 50 && p.prog >= 50) { apply(scale(fx(d.f), .5)); toast('g', 'RESULTADO POSITIVO', d.title + ' chegou à metade.'); }
    if (p.prog >= 100) {
      p.st = 'entregue'; apply(scale(fx(d.f), .5)); if (d.flag) S.flags[d.flag] = 1; toast('g', 'RESULTADO POSITIVO', d.title + ' foi entregue!');
      publishNews(nc, 'Prefeitura entrega: ' + d.title.toLowerCase(), 'Obra concluída com investimento de ' + fmt(p.cost) + '.'); S.tl.push({ y: year(), m: S.turn % 12, t: 'Entregue: ' + d.title });
    }
  });
  [['e','p_eduRec'],['s','p_saudeEmerg'],['a','p_aguaEmerg'],['i','p_estEmerg']].forEach(x => { if (S.ind[x[0]] < 30) unlock(x[1]); });
}


const EVU = { chuvas:'p_estEmerg', estradaPiora:'p_estEmerg', crisSaude:'p_saudeEmerg', crisEdu:'p_eduRec', evasao:'p_eduRec', crisAgua:'p_aguaEmerg', seca:'p_pocos', dengue:'p_aedes' };