// Coleta os boletins de urna (BU) já publicados das seções do exterior no 2º turno,
// soma por país e grava data/exterior-bu.json. Boletins lidos ficam em data/boletins-cache.json.
// Uso: node scripts/boletins-exterior.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buscarJson, emLotes, urlSecoesExterior, urlAuxSecao, urlArquivoUrna } from '../src/tse-api.js';
import { lerBoletim, resultadosPorCidade } from '../src/boletim.js';
import { agregarPorPais } from '../src/paises.js';

const ELEICAO_T2 = 6258;
const arquivo = (nome) => new URL(`../data/${nome}`, import.meta.url);
const chave = (s) => `${s.cidade}-${s.zona}-${s.secao}`;

const config = await buscarJson(urlSecoesExterior(), { tentativas: 3 }).catch((e) => {
  console.log(`Config de seções indisponível (${e.message}); tenta na próxima rodada.`);
  process.exit(0);
});
// Seções com "nsp" estão agregadas a uma seção principal, cujo boletim já traz os votos delas.
const secoes = config.abr[0].mu.flatMap((mu) =>
  mu.zon.flatMap((z) => z.sec.filter((s) => !s.nsp).map((s) => ({ cidade: mu.cd, zona: Number(z.cd), secao: Number(s.ns) }))));

const cache = existsSync(arquivo('boletins-cache.json')) ? JSON.parse(readFileSync(arquivo('boletins-cache.json'))) : {};
const principais = new Set(secoes.map(chave));
for (const k of Object.keys(cache)) if (!principais.has(k)) delete cache[k];
const pendentes = secoes.filter((s) => !cache[chave(s)]);

// O TSE responde 429 quando há requisições demais (acontece a partir do GitHub Actions).
// Ao primeiro 429 a rodada para; as seções que faltarem ficam para a próxima.
let limitado = false;

async function baixarBoletim(s) {
  if (limitado) return undefined;
  const resp0 = await fetch(urlAuxSecao(s), { cache: 'no-store' });
  if (resp0.status === 429) { limitado = true; return undefined; }
  if (resp0.status === 404 || resp0.status === 403) return null; // seção ainda não publicada
  if (!resp0.ok) throw new Error(`HTTP ${resp0.status}`);
  const aux = await resp0.json();
  for (const h of [...(aux.hashes ?? [])].reverse()) {
    const bu = h.arq?.find((a) => a.tp === 'bu');
    if (!bu) continue;
    const resp = await fetch(urlArquivoUrna(s, h.hash, bu.nm));
    if (!resp.ok) continue;
    return lerBoletim(new Uint8Array(await resp.arrayBuffer()), { eleicao: ELEICAO_T2 });
  }
  return null; // seção ainda não recebida
}

// Começa num ponto aleatório para que, se a rodada for interrompida, as próximas cubram as outras seções.
const inicio = Math.floor(Math.random() * pendentes.length);
const fila = [...pendentes.slice(inicio), ...pendentes.slice(0, inicio)];
const { ok, falhas } = await emLotes(fila, 4, baixarBoletim);
let novos = 0;
for (const [s, b] of ok) if (b) { cache[chave(s)] = b; novos++; }

const boletins = Object.values(cache);
const paises = agregarPorPais(Object.values(resultadosPorCidade(secoes, boletins)));
const saida = {
  geradoEm: new Date().toISOString(),
  secoesTotais: secoes.length,
  secoesRecebidas: boletins.length,
  paises,
};
writeFileSync(arquivo('boletins-cache.json'), JSON.stringify(cache));
writeFileSync(arquivo('exterior-bu.json'), JSON.stringify(saida));
const puladas = [...ok.values()].filter((b) => b === undefined).length;
console.log(`seções: ${secoes.length} · com BU: ${boletins.length} (+${novos}) · sem resposta: ${falhas.length}`
  + (limitado ? ` · TSE limitou (429), ${puladas} seções ficam para a próxima rodada` : ''));
