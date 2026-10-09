'use strict';
/* =====================================================================
   SHARE — "foto do mandato" para postar nas redes
   ---------------------------------------------------------------------
   • Carregado depois de territory.js e antes de main.js.
   • Desenha um cartão 1080x1350 (formato retrato do Instagram) num
     <canvas> e baixa como PNG. No celular, tenta abrir o menu de
     compartilhar do aparelho; se não der, baixa a imagem.
   • Não altera a nota do mandato: só LÊ mandateScore(),
     mandateScoreLabel() e mandateScoreDetails() do game.js.
   • Sem bibliotecas externas.
   ===================================================================== */

/* ---------- DADOS DO CARTÃO ---------- */
function shareData() {
  const cassado = !!(S.political && S.political.cassado);
  const score = typeof mandateScore === 'function' ? mandateScore() : 0;
  const P = Array.isArray(S.projects) ? S.projects : [];
  const T = S.territory && S.territory.regions ? Object.values(S.territory.regions) : [];
  return {
    cassado,
    score,
    label: cassado ? 'Mandato cassado' : (typeof mandateScoreLabel === 'function' ? mandateScoreLabel(score) : ''),
    details: typeof mandateScoreDetails === 'function' ? mandateScoreDetails() : [],
    diff: (typeof DIFF !== 'undefined' && DIFF[S.diff]) ? DIFF[S.diff].n : '',
    advisor: typeof adv === 'function' && S.advisor ? adv().n : '',
    months: Math.min(48, Number(S.turn) || 0),
    stats: [
      [S.dec || 0, 'decisões'],
      [S.crises || 0, 'crises'],
      [P.filter(p => p.st === 'entregue').length, 'obras entregues'],
      [T.reduce((a, r) => a + (r.done || 0), 0), 'ações nas localidades']
    ],
    cash: typeof fmt === 'function' ? fmt(S.b) : ''
  };
}

/* ---------- DESENHO ---------- */
function shareRound(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function shareDraw() {
  const D = shareData(), W = 1080, H = 1350;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const SERIF = 'Georgia, "Times New Roman", serif', SANS = '"Segoe UI", system-ui, sans-serif';
  const GREEN = '#1f5d43', SAND = '#f1e6cb', PAPER = '#fbf6e8', OCHRE = '#c8902f', RED = '#b23a2e', INK = '#2a2118', EARTH = '#5b3e29';
  const tone = D.cassado ? RED : D.score >= 7 ? '#2f8a5f' : D.score >= 5 ? OCHRE : RED;

  // fundo: céu, sol e serras
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#f6d68a'); sky.addColorStop(.45, SAND); sky.addColorStop(1, '#e4d3aa');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f3b94a'; c.beginPath(); c.arc(860, 170, 90, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#c9a66b'; c.beginPath(); c.moveTo(0, 330);
  c.quadraticCurveTo(220, 230, 430, 310); c.quadraticCurveTo(650, 380, 820, 280); c.quadraticCurveTo(960, 220, W, 300);
  c.lineTo(W, 420); c.lineTo(0, 420); c.fill();

  // cabeçalho
  c.textAlign = 'center'; c.fillStyle = GREEN;
  c.font = `bold 92px ${SERIF}`; c.fillText('SERTÂNIA', W / 2, 140);
  c.font = `bold 30px ${SANS}`; c.fillStyle = EARTH; c.fillText('DESAFIO DE GESTÃO · MEU MANDATO', W / 2, 192);

  // cartão principal
  shareRound(c, 70, 260, W - 140, 980, 36); c.fillStyle = PAPER; c.fill();
  c.lineWidth = 4; c.strokeStyle = '#e4d3aa'; c.stroke();

  // nota
  c.beginPath(); c.arc(W / 2, 450, 140, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
  c.lineWidth = 18; c.strokeStyle = '#eee3c8'; c.stroke();
  if (!D.cassado) {
    c.beginPath(); c.arc(W / 2, 450, 140, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(10, D.score)) / 10);
    c.strokeStyle = tone; c.lineCap = 'round'; c.stroke(); c.lineCap = 'butt';
  }
  c.fillStyle = tone; c.textBaseline = 'middle';
  if (D.cassado) { c.font = `bold 64px ${SANS}`; c.fillText('⚖️', W / 2, 450); }
  else {
    c.font = `bold 108px ${SERIF}`; c.fillText(D.score.toFixed(1), W / 2, 440);
    c.font = `bold 30px ${SANS}`; c.fillStyle = '#8a7a62'; c.fillText('de 10', W / 2, 515);
  }
  c.textBaseline = 'alphabetic';
  c.fillStyle = tone; c.font = `bold 50px ${SERIF}`; c.fillText(D.label.toUpperCase(), W / 2, 660);
  c.fillStyle = '#6d5d47'; c.font = `28px ${SANS}`;
  const sub = [D.diff && 'Modo ' + D.diff, D.advisor && 'com ' + D.advisor, D.cassado ? `afastado no mês ${D.months}` : '4 anos de mandato'].filter(Boolean).join(' · ');
  c.fillText(sub, W / 2, 708);

  // barras por área (até 9, em 2 colunas)
  const det = D.details.slice(0, 9), colW = 410, x0 = 125, y0 = 760;
  c.textAlign = 'left';
  det.forEach((d, i) => {
    const col = i < 5 ? 0 : 1, row = i < 5 ? i : i - 5, x = x0 + col * (colW + 50), y = y0 + row * 62;
    const v = Math.max(0, Math.min(100, d.value));
    c.fillStyle = INK; c.font = `bold 24px ${SANS}`; c.fillText(d.label, x, y);
    c.textAlign = 'right'; c.fillStyle = '#8a7a62'; c.fillText(String(Math.round(v)), x + colW, y); c.textAlign = 'left';
    shareRound(c, x, y + 12, colW, 14, 7); c.fillStyle = '#eadfc4'; c.fill();
    if (v > 0) { shareRound(c, x, y + 12, Math.max(14, colW * v / 100), 14, 7); c.fillStyle = v >= 70 ? '#2f8a5f' : v >= 50 ? OCHRE : RED; c.fill(); }
  });

  // números do mandato
  const sy = 1100, sw = (W - 200) / 4;
  c.textAlign = 'center';
  D.stats.forEach((s, i) => {
    const x = 100 + sw * i + sw / 2;
    c.fillStyle = GREEN; c.font = `bold 54px ${SERIF}`; c.fillText(String(s[0]), x, sy);
    c.fillStyle = '#6d5d47'; c.font = `22px ${SANS}`; c.fillText(s[1], x, sy + 38);
  });
  c.fillStyle = '#8a7a62'; c.font = `24px ${SANS}`; c.fillText('Caixa final: ' + D.cash, W / 2, 1200);

  // rodapé
  c.fillStyle = GREEN; c.font = `italic 28px ${SERIF}`;
  c.fillText('“Governar é decidir o que fazer quando não dá para fazer tudo.”', W / 2, 1290);
  c.fillStyle = EARTH; c.font = `20px ${SANS}`;
  c.fillText('Simulação educativa fictícia · Desenvolvido por Serg!n', W / 2, 1328);
  return cv;
}

/* ---------- SALVAR / COMPARTILHAR ---------- */
function shareMandate() {
  let cv;
  try { cv = shareDraw(); } catch (err) { console.error('share:', err); toast('r', 'ERRO', 'Não foi possível gerar a imagem.'); return; }
  const name = 'meu-mandato-sertania.png';
  cv.toBlob(async blob => {
    if (!blob) { toast('r', 'ERRO', 'Não foi possível gerar a imagem.'); return; }
    const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Meu mandato em Sertânia', text: 'Veja como foi meu mandato em Sertânia: Desafio de Gestão!' }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('g', 'IMAGEM SALVA', 'A foto do mandato foi baixada. É só postar!');
  }, 'image/png');
}

/* ---------- INTEGRAÇÃO ---------- */
const SHARE_ACT = { share: () => shareMandate() };

/* Tela de fim de mandato: acrescenta o botão depois que o endGame original monta a tela */
(function () {
  const original = endGame;
  endGame = function () {
    const r = original.apply(this, arguments);
    const box = document.querySelector('#end .btns');
    if (box && !box.querySelector('[data-act="share"]')) {
      const b = document.createElement('button');
      b.className = 'btn main share-btn'; b.dataset.act = 'share'; b.textContent = '📸 SALVAR FOTO DO MANDATO';
      box.prepend(b);
    }
    return r;
  };
})();
