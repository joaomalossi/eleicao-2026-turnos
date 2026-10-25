// Gera data/turno1.json com o resultado final do 1º turno (eleição 6257).
// Uso: npm run snapshot
import { writeFileSync } from 'node:fs';
import { urlResultado, buscarJson } from '../src/tse-api.js';
import { parseResultado } from '../src/tse.js';

const brasil = parseResultado(await buscarJson(urlResultado('t1', 'br')));

const snapshot = { geradoEm: new Date().toISOString(), brasil };
writeFileSync(new URL('../data/turno1.json', import.meta.url), JSON.stringify(snapshot));
console.log('data/turno1.json gerado:', brasil.atualizadoEm);
