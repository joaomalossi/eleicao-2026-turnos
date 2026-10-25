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

function vencedor(c) {
  const n = c.margem.t2.lider;
  if (c.candidatos['13'].ganhoVotos === null) return '—';
  if (!n) return 'Empate';
  return `<span class="dot c${n}"></span> ${NOMES[n].split(' ')[0]}`;
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
  const corpo = linhas.map(({ nome, c, fonte }) => `
    <tr>
      <td class="local">${nome}${fonte === 'bu' ? ' <span class="tag tag-bu" title="Soma dos boletins de urna já publicados (não oficial)">BU</span>' : ''}</td>
      <td>${percentual(c.apuracao)}</td>
      <td class="venc">${vencedor(c)}</td>
      ${celulasCandidato(c, '13')}
      ${celulasCandidato(c, '22')}
      <td class="grupo-ini">${margemCurta(c.margem.t1)}</td>
      <td>${margemCurta(c.margem.t2)}</td>
      <td>${c.ganhouTerreno ? `<span class="dot c${c.ganhouTerreno}"></span> ${NOMES[c.ganhouTerreno].split(' ')[0]}` : '—'}</td>
    </tr>`).join('');
  return `
    <thead>
      <tr><th></th><th></th><th></th>${cab('13')}${cab('22')}<th colspan="3" class="grupo-ini">Margem</th></tr>
      <tr><th>${rotuloLocal}</th><th>Apuração</th><th title="Quem tem mais votos no 2º turno (enquanto a apuração não chega a 100%, é quem está na frente)">Vencedor</th>${sub}${sub}<th class="grupo-ini">1º turno</th><th>2º turno</th><th>Ganhou terreno</th></tr>
    </thead>
    <tbody>${corpo}</tbody>`;
}

// Total dos países já com votos: quem está ganhando no exterior.
// c = comparar(total do 1º turno, total do 2º turno); temBu = alguma parcela vem de boletim de urna.
export function renderTotalExterior(c, nPaises, temBu) {
  const n = c.margem.t2.lider;
  const pct = (k) => c.candidatos[k].t2.pct;
  const titulo = n
    ? `<span class="dot c${n}"></span> ${NOMES[n]} ${c.parcial ? 'está ganhando' : 'venceu'} no exterior com <strong>${percentual(pct(n))}</strong> dos votos válidos`
    : 'Empate no exterior';
  const cand = (k) => `<span class="dot c${k}"></span> ${NOMES[k]} ${percentual(pct(k))} · ${numero(c.candidatos[k].t2.votos)} votos <span class="muted">(1º turno: ${percentual(c.candidatos[k].t1.pct)})</span>`;
  return `
    <p class="total-ext-titulo">${titulo}${temBu ? ' <span class="tag tag-bu" title="Inclui a soma não oficial dos boletins de urna">BU</span>' : ''}</p>
    <div class="barra" role="img" aria-label="Lula ${percentual(pct('13'))}, Flávio Bolsonaro ${percentual(pct('22'))}"><span class="c13" style="width:${pct('13')}%"></span><span class="c22" style="width:${pct('22')}%"></span></div>
    <p class="total-ext-cands">${cand('13')}<br>${cand('22')}</p>
    <p class="total-ext-nota">Soma de ${nPaises} ${nPaises === 1 ? 'país' : 'países'} com votos do 2º turno · ${percentual(c.apuracao)} das seções do exterior
    · margem ${descreverMargem(c.margem.t2)}${c.parcial ? ' (parcial)' : ''}</p>`;
}

// Resumo dos boletins de urna do exterior (não oficial).
export function renderResumoBu(bu, linhas) {
  const comBu = linhas.filter((l) => l.fonte === 'bu');
  if (!comBu.length) return '';
  const soma = (n) => comBu.reduce((t, l) => t + l.c.candidatos[n].t2.votos, 0);
  const hora = new Date(bu.geradoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const v13 = soma('13');
  const v22 = soma('22');
  const pct = (v) => percentual(v13 + v22 > 0 ? (v / (v13 + v22)) * 100 : 0);
  return `
    <p>Antes do resultado oficial (a partir das 17h), os países marcados com <span class="tag tag-bu">BU</span>
    mostram a soma dos <strong>boletins de urna</strong> que o TSE já publicou, seção por seção.
    Esses números <strong>não são oficiais</strong>: o "% apurado" é o percentual de seções com boletim publicado.</p>
    <p class="resumo-bu-num">${numero(bu.secoesRecebidas)} de ${numero(bu.secoesTotais)} seções do exterior com boletim ·
    <span class="dot c13"></span> Lula ${numero(v13)} (${pct(v13)}) ·
    <span class="dot c22"></span> Flávio Bolsonaro ${numero(v22)} (${pct(v22)}) · coletado às ${hora}</p>`;
}
