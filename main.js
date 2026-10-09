'use strict';
/* MAIN — ponto de entrada: ações da interface e inicialização */

const ACT = { close: closeModal, cam: openCouncil, proj: openProjects, cons: openAdvisor, trib: openTribuna, create: openCreate,
  adv: a => { S.advisor = a; S.council.forEach(v => { v.rel = clamp(v.rel + adv().rel); }); save(); closeModal(); render(); toast('g', 'RESULTADO POSITIVO', adv().n + ' é seu conselheiro.'); },
  seek: (a, b) => seekSupport(a, b), ficha: a => ficha(a), area: a => areaList(a), mk: a => createProject(a), pautar: a => pautar(a), apoio: a => apoioPick(a), vote: a => voteIntro(a),
  go: a => runVote(S.projects.find(p => p.id === a)), skip: () => { SK = true; }, advice: () => { $('#advq').textContent = '“' + advisorComment(pk(['proj', 'fin', 'vote', 'crise'])) + '”'; } };

/* Ações do módulo de governabilidade (politics.js) */
if (typeof POL_ACT === 'object') Object.assign(ACT, POL_ACT);
/* Ações do módulo de território (territory.js) */
if (typeof TER_ACT === 'object') Object.assign(ACT, TER_ACT);

document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) ACT[b.dataset.act](b.dataset.a, b.dataset.b); });

/* ---------- INICIALIZAÇÃO ---------- */
$('#bNew').onclick = () => pickDiff(newGame);
$('#bContinue').onclick = () => { S = load(); if (S) startGame(); };
$('#bErase').onclick = () => { if (confirm('Apagar o progresso salvo?')) { deleteSave(); home(); } };
$('#bHow').onclick = () => info(`<h3>Como jogar</h3><ul><li>Você terá um orçamento municipal.</li><li>Cada rodada apresenta uma situação.</li><li>Você precisa escolher uma ação.</li><li>Toda decisão possui consequências.</li><li>Algumas consequências aparecem somente várias rodadas depois.</li><li>Eventos acontecem aleatoriamente.</li><li>Não existe uma estratégia perfeita.</li><li>Toda escolha envolve prioridades e renúncias.</li><li>O mandato possui 4 anos.</li><li>A Câmara pode abrir processo de cassação se o governo perder totalmente o apoio.</li><li>Ao final, o desempenho da gestão será apresentado.</li></ul>`);
$('#bAbout').onclick = () => info('<h3>Sobre o simulador</h3><p>“Sertânia: Desafio de Gestão” é uma simulação fictícia e educativa inspirada na realidade de um município do sertão pernambucano. Não representa a Prefeitura de Sertânia, e nenhuma pessoa real, orçamento ou decisão é retratada.</p><p>Os valores são inventados. O objetivo é mostrar que gestão pública envolve recursos limitados, problemas simultâneos e prioridades em conflito.</p>');
$('#bNext').onclick = () => nextTurn();
$('#bMenu').onclick = () => { save(); home(); };
$('#overlay').onclick = e => { if (e.target.id === 'overlay' && !$('#overlay').dataset.lock) closeModal(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#overlay').hidden && !$('#overlay').dataset.lock) closeModal(); });
home();
