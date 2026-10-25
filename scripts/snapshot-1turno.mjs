// Gera data/turno1.json com o resultado final do 1º turno (eleição 6257).
// Uso: npm run snapshot
import { writeFileSync } from 'node:fs';
import { urlResultado, buscarJson, emLotes } from '../src/tse-api.js';
import { UFS } from '../src/locais.js';
import { parseResultado } from '../src/tse.js';

const brasil = parseResultado(await buscarJson(urlResultado('t1', 'br')));

const lerUf = async (uf) => parseResultado(await buscarJson(urlResultado('t1', uf), { tentativas: 3 }));
const { ok: ufsOk, falhas } = await emLotes(Object.keys(UFS), 8, lerUf);
if (falhas.length) throw new Error(`Falha ao baixar UFs: ${falhas.join(', ')}`);
const ufs = Object.fromEntries(ufsOk);

const snapshot = { geradoEm: new Date().toISOString(), brasil, ufs };
writeFileSync(new URL('../data/turno1.json', import.meta.url), JSON.stringify(snapshot));
console.log('data/turno1.json gerado:', brasil.atualizadoEm);
