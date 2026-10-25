import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paisDaCidade, agregarPorPais, somarResultados } from '../src/paises.js';

const cidades = JSON.parse(readFileSync(new URL('./fixtures/cidades-exterior.json', import.meta.url)));

test('toda cidade do exterior nos dois turnos tem país', () => {
  for (const turno of ['6257', '6258']) {
    const semPais = cidades[turno].filter((c) => !paisDaCidade(c.cd)).map((c) => `${c.cd} ${c.nm}`);
    assert.deepEqual(semPais, [], `turno ${turno}`);
  }
});

test('cidades conhecidas caem no país certo', () => {
  assert.equal(paisDaCidade('30228'), 'Estados Unidos'); // Nova York
  assert.equal(paisDaCidade('29416'), 'Estados Unidos'); // Boston
  assert.equal(paisDaCidade('29955'), 'Portugal');       // Lisboa
  assert.equal(paisDaCidade('30430'), 'Uruguai');        // Rio Branco (UY)
});

const cidade = (cd, v13, v22, totais, totalizadas) => ({
  local: cd, secoesTotais: totais, secoesTotalizadas: totalizadas, eleitorado: totais * 10,
  validos: v13 + v22, brancos: 1, nulos: 2,
  candidatos: { 13: { nome: 'LULA', votos: v13 }, 22: { nome: 'FLAVIO BOLSONARO', votos: v22 } },
  atualizadoEm: '25/10/2026 18:00:00',
});

test('soma as cidades de cada país', () => {
  const paises = agregarPorPais([
    cidade('30228', 100, 50, 10, 10), // Nova York
    cidade('29416', 30, 70, 4, 2),    // Boston
    cidade('29955', 10, 5, 3, 3),     // Lisboa
  ]);
  const eua = paises['Estados Unidos'];
  assert.equal(eua.local, 'Estados Unidos');
  assert.equal(eua.secoesTotais, 14);
  assert.equal(eua.secoesTotalizadas, 12);
  assert.equal(eua.eleitorado, 140);
  assert.equal(eua.validos, 250);
  assert.equal(eua.brancos, 2);
  assert.equal(eua.nulos, 4);
  assert.equal(eua.candidatos['13'].votos, 130);
  assert.equal(eua.candidatos['22'].votos, 120);
  assert.equal(paises['Portugal'].candidatos['13'].votos, 10);
});

test('soma resultados de países diferentes num total do exterior', () => {
  const total = somarResultados('Exterior', [cidade('30228', 100, 50, 10, 10), cidade('29955', 10, 5, 3, 1)]);
  assert.equal(total.local, 'Exterior');
  assert.equal(total.secoesTotais, 13);
  assert.equal(total.secoesTotalizadas, 11);
  assert.equal(total.validos, 165);
  assert.equal(total.candidatos['13'].votos, 110);
  assert.equal(total.candidatos['22'].votos, 55);
});
