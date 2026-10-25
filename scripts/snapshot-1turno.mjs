// Gera data/turno1.json com o resultado final do 1º turno (eleição 6257).
// Uso: npm run snapshot
import { writeFileSync } from 'node:fs';
import { urlResultado, buscarJson, emLotes } from '../src/tse-api.js';
import { UFS } from '../src/locais.js';
import { CIDADES_EXTERIOR, agregarPorPais } from '../src/paises.js';
import { parseResultado } from '../src/tse.js';

const brasil = parseResultado(await buscarJson(urlResultado('t1', 'br')));

const lerUf = async (uf) => parseResultado(await buscarJson(urlResultado('t1', uf), { tentativas: 3 }));
const { ok: ufsOk, falhas } = await emLotes(Object.keys(UFS), 8, lerUf);
if (falhas.length) throw new Error(`Falha ao baixar UFs: ${falhas.join(', ')}`);
const ufs = Object.fromEntries(ufsOk);

const lerCidade = async (cd) => parseResultado(await buscarJson(urlResultado('t1', `zz${cd}`), { tentativas: 3 }));
const cidades = await emLotes(CIDADES_EXTERIOR, 8, lerCidade);
if (cidades.falhas.length) throw new Error(`Falha ao baixar cidades: ${cidades.falhas.join(', ')}`);
const paises = agregarPorPais([...cidades.ok.values()]);

// Conferência: a soma dos países tem de bater com o total do exterior publicado pelo TSE.
const exterior = parseResultado(await buscarJson(urlResultado('t1', 'zz')));
const somaPaises = Object.values(paises).reduce((s, p) => s + p.validos, 0);
if (somaPaises !== exterior.validos) throw new Error(`Países somam ${somaPaises} válidos; exterior tem ${exterior.validos}`);

const snapshot = { geradoEm: new Date().toISOString(), brasil, ufs, paises };
writeFileSync(new URL('../data/turno1.json', import.meta.url), JSON.stringify(snapshot));
console.log('data/turno1.json gerado:', brasil.atualizadoEm);
