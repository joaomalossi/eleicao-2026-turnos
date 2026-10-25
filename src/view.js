// Gera o HTML do placar e das tabelas a partir do resultado do comparador.
import { numero, percentual, deltaVotos, deltaPp } from './formato.js';

export const NOMES = { 13: 'Lula', 22: 'Flávio Bolsonaro' };

const classeSinal = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const tagParcial = (c) => (c.parcial ? ' <span class="tag">parcial</span>' : '');

function descreverMargem(m) {
  if (!m.lider) return '—';
  return `${NOMES[m.lider]} +${numero(m.votos)} (${deltaPp(m.pp).replace('+', '')})`;
}

function cartao(c, n) {
  const d = c.candidatos[n];
  const lider = c.margem.t2.lider === n ? '<span class="lider">à frente</span>' : '';
  return `
    <div class="cand c${n}">
      <div class="cand-nome"><span class="dot c${n}"></span>${NOMES[n]} ${lider}</div>
      <div class="cand-pct">${percentual(d.t2.pct)}</div>
      <div class="cand-votos">${numero(d.t2.votos)} votos</div>
      <div class="cand-t1">1º turno: ${percentual(d.t1.pct)} · ${numero(d.t1.votos)} votos</div>
      <div class="cand-ganho">${d.ganhoVotos === null ? '<span class="muted">Aguardando apuração</span>' : `
        <span class="${classeSinal(d.ganhoVotos)}">${deltaVotos(d.ganhoVotos)} votos</span>${tagParcial(c)}
        · <span class="${classeSinal(d.ganhoPp)}">${deltaPp(d.ganhoPp)}</span>`}
      </div>
    </div>`;
}

export function renderPlacar(c, titulo) {
  const p13 = c.candidatos['13'].t2.pct;
  const p22 = c.candidatos['22'].t2.pct;
  const barra = p13 + p22 > 0
    ? `<span class="c13" style="width:${p13}%"></span><span class="c22" style="width:${p22}%"></span>`
    : '';
  return `
    <div class="placar-apuracao">
      <span><strong>${titulo}</strong> · 2º turno</span>
      <span>Apuração: <strong>${percentual(c.apuracao)}</strong> das seções</span>
    </div>
    <div class="barra" role="img" aria-label="Lula ${percentual(p13)}, Flávio Bolsonaro ${percentual(p22)}">${barra}</div>
    <div class="cands">${cartao(c, '13')}${cartao(c, '22')}</div>
    <dl class="margem">
      <div><dt>Margem no 1º turno</dt><dd>${descreverMargem(c.margem.t1)}</dd></div>
      <div><dt>Margem no 2º turno${c.parcial ? ' (parcial)' : ''}</dt><dd>${descreverMargem(c.margem.t2)}</dd></div>
      <div><dt>Ganhou terreno</dt><dd>${c.ganhouTerreno ? `<span class="dot c${c.ganhouTerreno}"></span> ${NOMES[c.ganhouTerreno]}` : '—'}</dd></div>
    </dl>`;
}
