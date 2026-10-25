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

function margemCurta(m) {
  if (!m.lider) return '—';
  return `<span class="dot c${m.lider}"></span> ${deltaPp(m.pp).replace('+', '')}`;
}

function celulasCandidato(c, n) {
  const d = c.candidatos[n];
  const venc = c.margem.t2.lider === n ? ' venc' : '';
  const sem = d.ganhoVotos === null;
  return `
    <td class="grupo-ini${venc}">${sem ? '—' : percentual(d.t2.pct)}</td>
    <td>${sem ? '—' : numero(d.t2.votos)}</td>
    <td class="muted">${percentual(d.t1.pct)}</td>
    <td class="${sem ? '' : classeSinal(d.ganhoPp)}">${sem ? '—' : deltaPp(d.ganhoPp).replace(' p.p.', '')}</td>
    <td class="${sem ? '' : classeSinal(d.ganhoVotos)}">${sem ? '—' : deltaVotos(d.ganhoVotos) + tagParcial(c)}</td>`;
}

// linhas: [{ nome, c }] já ordenadas.
export function renderTabela(linhas, rotuloLocal) {
  const cab = (n) => `<th colspan="5" class="grupo-ini"><span class="dot c${n}"></span> ${NOMES[n]}</th>`;
  const sub = '<th class="grupo-ini">2º turno</th><th>Votos</th><th>1º turno</th><th>Ganho p.p.</th><th>Ganho votos</th>';
  const corpo = linhas.map(({ nome, c }) => `
    <tr>
      <td class="local">${nome}</td>
      <td>${percentual(c.apuracao)}</td>
      ${celulasCandidato(c, '13')}
      ${celulasCandidato(c, '22')}
      <td class="grupo-ini">${margemCurta(c.margem.t1)}</td>
      <td>${margemCurta(c.margem.t2)}</td>
      <td>${c.ganhouTerreno ? `<span class="dot c${c.ganhouTerreno}"></span> ${NOMES[c.ganhouTerreno].split(' ')[0]}` : '—'}</td>
    </tr>`).join('');
  return `
    <thead>
      <tr><th></th><th></th>${cab('13')}${cab('22')}<th colspan="3" class="grupo-ini">Margem</th></tr>
      <tr><th>${rotuloLocal}</th><th>Apuração</th>${sub}${sub}<th class="grupo-ini">1º turno</th><th>2º turno</th><th>Ganhou terreno</th></tr>
    </thead>
    <tbody>${corpo}</tbody>`;
}
