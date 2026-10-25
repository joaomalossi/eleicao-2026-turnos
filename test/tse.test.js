import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseResultado } from '../src/tse.js';

const fixture = (nome) => JSON.parse(readFileSync(new URL(`./fixtures/${nome}`, import.meta.url)));

test('lê totais e votos dos candidatos do 1º turno final', () => {
  const r = parseResultado(fixture('br-t1.json'));
  assert.equal(r.local, 'br');
  assert.equal(r.secoesTotalizadas, r.secoesTotais);
  assert.equal(r.eleitorado, 158745502);
  assert.equal(r.validos, 119300788);
  assert.equal(r.brancos, 2300798);
  assert.equal(r.nulos, 3674249);
  assert.deepEqual(r.candidatos['13'], { nome: 'LULA', votos: 53879538 });
  assert.deepEqual(r.candidatos['22'], { nome: 'FLAVIO BOLSONARO', votos: 56104503 });
  assert.equal(r.atualizadoEm, '05/10/2026 12:51:47');
});
