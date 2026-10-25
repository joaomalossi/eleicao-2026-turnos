import { parseResultado } from './tse.js';
import { comparar, escolherFonte } from './comparar.js';
import { urlResultado, buscarJson, emLotes } from './tse-api.js';
import { renderPlacar, renderTabela, renderResumoBu, renderTotalExterior } from './view.js';
import { UFS } from './locais.js';
import { CIDADES_EXTERIOR, agregarPorPais, somarResultados } from './paises.js';

const INTERVALO_MS = 10 * 60 * 1000;
const NOVA_TENTATIVA_MS = 2 * 60 * 1000;

const $ = (id) => document.getElementById(id);
const estado = { turno1: null, brasil: null, ufs: {}, cidades: {}, bu: null, tseEm: null, paginaEm: null, proxima: null };

async function carregarTurno1() {
  const resp = await fetch('data/turno1.json', { cache: 'no-cache' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} em data/turno1.json`);
  return resp.json();
}

// Busca o 2º turno. Cada arquivo que falhar mantém o último valor bom.
// Devolve quantos arquivos falharam nesta rodada.
async function atualizar() {
  estado.turno1 ??= await carregarTurno1();
  let falhas = 0;

  try {
    estado.brasil = parseResultado(await buscarJson(urlResultado('t2', 'br')));
    estado.tseEm = estado.brasil.atualizadoEm;
  } catch {
    falhas++;
  }

  const lerUf = async (uf) => parseResultado(await buscarJson(urlResultado('t2', uf)));
  const ufs = await emLotes(Object.keys(UFS), 8, lerUf);
  for (const [uf, r] of ufs.ok) estado.ufs[uf] = r;

  const lerCidade = async (cd) => parseResultado(await buscarJson(urlResultado('t2', `zz${cd}`)));
  const cidades = await emLotes(CIDADES_EXTERIOR, 8, lerCidade);
  for (const [cd, r] of cidades.ok) estado.cidades[cd] = r;

  try {
    // Boletins de urna do exterior, coletados a cada 10 min pelo GitHub Actions.
    const resp = await fetch(`data/exterior-bu.json?t=${Date.now()}`, { cache: 'no-store' });
    if (resp.ok) estado.bu = await resp.json();
  } catch {
    // Opcional: sem boletins, a tabela usa só o resultado oficial.
  }

  falhas += ufs.falhas.length + cidades.falhas.length;
  const total = 1 + Object.keys(UFS).length + CIDADES_EXTERIOR.length;
  if (falhas < total) estado.paginaEm = new Date();
  render();
  mostrarAviso(falhas, total);
  return falhas;
}

function mostrarAviso(falhas, total) {
  const hora = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let msg = '';
  if (falhas === 0 && estado.brasil && estado.brasil.secoesTotalizadas === 0) {
    msg = 'A apuração do 2º turno ainda não começou. O TSE só divulga resultados depois das 17h (horário de Brasília), quando fecham as urnas. Até lá os números oficiais do 2º turno ficam zerados. No exterior, onde a votação já terminou em vários países, a tabela de países mostra a soma não oficial dos boletins de urna já publicados.';
  } else if (falhas === total && !estado.paginaEm) {
    msg = 'O TSE não respondeu até agora. Por enquanto aparece só o resultado do 1º turno. Uma nova tentativa sai em 2 minutos, ou clique em "Atualizar agora".';
  } else if (falhas === total) {
    msg = `O TSE não respondeu nesta rodada. Os números são da última atualização bem-sucedida (${hora(estado.paginaEm)}). Nova tentativa em 2 minutos.`;
  } else if (falhas > 0) {
    msg = `${falhas} de ${total} arquivos do TSE não responderam nesta rodada. Esses locais mostram o último valor recebido. Nova tentativa em 2 minutos.`;
  }
  $('aviso').hidden = !msg;
  $('aviso').innerHTML = msg ? `<div role="status"></div>` : '';
  if (msg) $('aviso').firstChild.textContent = msg;
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

  const paises2 = agregarPorPais(Object.values(estado.cidades));
  const linhasPais = Object.keys(t1.paises)
    .sort((a, b) => t1.paises[b].eleitorado - t1.paises[a].eleitorado)
    .map((pais) => {
      const { resultado, fonte } = escolherFonte(paises2[pais], estado.bu?.paises?.[pais]);
      return { nome: pais, fonte, resultado, c: comparar(t1.paises[pais], resultado) };
    });
  // Só os países que já têm votos no 2º turno (oficial ou boletim de urna).
  const comDados = linhasPais.filter((l) => l.c.candidatos['13'].ganhoVotos !== null);
  const semDados = linhasPais.length - comDados.length;
  // Total do exterior: 2º turno somado de todos os países (oficial ou BU) contra o 1º turno inteiro.
  const totalT1 = somarResultados('Exterior', Object.values(t1.paises));
  const totalT2 = somarResultados('Exterior', linhasPais.map((l) => l.resultado).filter(Boolean));
  $('total-exterior').innerHTML = comDados.length
    ? renderTotalExterior(comparar(totalT1, totalT2), comDados.length, comDados.some((l) => l.fonte === 'bu'))
    : '';
  $('total-exterior').hidden = comDados.length === 0;
  $('tabela-paises').innerHTML = renderTabela(comDados, 'País');
  $('tabela-paises').parentElement.hidden = comDados.length === 0;
  $('paises-sem-dados').textContent = semDados === 0 ? ''
    : comDados.length === 0 ? `Nenhum dos ${linhasPais.length} países tem votos do 2º turno ainda.`
    : `${semDados} de ${linhasPais.length} países ainda sem votos do 2º turno (ocultos).`;
  $('resumo-bu').innerHTML = estado.bu ? renderResumoBu(estado.bu, linhasPais) : '';
  $('secao-paises').hidden = false;
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
  $('atualizar').disabled = true;
  let espera = INTERVALO_MS;
  try {
    if (await atualizar()) espera = NOVA_TENTATIVA_MS;
  } catch {
    // Sem o snapshot do 1º turno não há o que mostrar.
    $('aviso').hidden = false;
    $('aviso').innerHTML = '<div role="status">Não foi possível carregar os dados. Nova tentativa em 2 minutos.</div>';
    espera = NOVA_TENTATIVA_MS;
  } finally {
    $('atualizar').disabled = false;
    estado.proxima = Date.now() + espera;
    estado.timer = setTimeout(ciclo, espera);
    mostrarStatus();
  }
}

setInterval(mostrarStatus, 30 * 1000);
ciclo();
