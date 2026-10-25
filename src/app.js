import { parseResultado } from './tse.js';
import { comparar } from './comparar.js';
import { urlResultado, buscarJson, emLotes } from './tse-api.js';
import { renderPlacar, renderTabela } from './view.js';
import { UFS } from './locais.js';

const INTERVALO_MS = 10 * 60 * 1000;

const $ = (id) => document.getElementById(id);
const estado = { turno1: null, brasil: null, ufs: {}, tseEm: null, paginaEm: null, proxima: null };

async function carregarTurno1() {
  const resp = await fetch('data/turno1.json', { cache: 'no-cache' });
  return resp.json();
}

async function atualizar() {
  $('atualizar').disabled = true;
  try {
    estado.turno1 ??= await carregarTurno1();
    const brasil = parseResultado(await buscarJson(urlResultado('t2', 'br')));
    estado.brasil = brasil;
    const lerUf = async (uf) => parseResultado(await buscarJson(urlResultado('t2', uf)));
    const { ok } = await emLotes(Object.keys(UFS), 8, lerUf);
    for (const [uf, r] of ok) estado.ufs[uf] = r;
    estado.tseEm = brasil.atualizadoEm;
    estado.paginaEm = new Date();
    render();
  } finally {
    $('atualizar').disabled = false;
    estado.proxima = Date.now() + INTERVALO_MS;
    mostrarStatus();
  }
}

function render() {
  const c = comparar(estado.turno1.brasil, estado.brasil);
  $('placar').innerHTML = renderPlacar(c, 'Brasil + exterior');

  const t1 = estado.turno1;
  const linhasUf = Object.keys(UFS)
    .sort((a, b) => t1.ufs[b].eleitorado - t1.ufs[a].eleitorado)
    .map((uf) => ({ nome: UFS[uf], c: comparar(t1.ufs[uf], estado.ufs[uf]) }));
  $('tabela-ufs').innerHTML = renderTabela(linhasUf, 'UF');
  $('secao-ufs').hidden = false;
}

function mostrarStatus() {
  const partes = [];
  if (estado.paginaEm) partes.push(`Página: ${estado.paginaEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  if (estado.tseEm) partes.push(`TSE: ${estado.tseEm}`);
  if (estado.proxima) {
    const min = Math.max(0, Math.ceil((estado.proxima - Date.now()) / 60000));
    partes.push(`próxima em ${min} min`);
  }
  $('status-texto').textContent = partes.join(' · ') || 'Carregando…';
}

$('atualizar').addEventListener('click', () => {
  clearTimeout(estado.timer);
  ciclo();
});

async function ciclo() {
  try {
    await atualizar();
  } finally {
    estado.timer = setTimeout(ciclo, INTERVALO_MS);
  }
}

setInterval(mostrarStatus, 30 * 1000);
ciclo();
